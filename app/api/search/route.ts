import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

// GET /api/search - Full-text search documents
export async function GET(request: Request) {
    try {
        const session = await getSession();

        if (!session || !session?.email) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const type = searchParams.get("type");
        const limit = parseInt(searchParams.get("limit") || "20");

        if (!query || query.length < 2) {
            return NextResponse.json({ success: true, data: [] });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.email },
        });

        // Use PostgreSQL Full Text Search
        // We use raw query because Prisma doesn't fully support TSVECTOR/TSQUERY yet
        const searchResults = await prisma.$queryRaw`
      SELECT 
        d.id, 
        d.name, 
        d."mimeType", 
        d."fileSize", 
        d."createdAt", 
        d."updatedAt",
        d."dataRoomId",
        dr.name as "dataRoomName",
        ts_rank(d.search_vector, plainto_tsquery('english', ${query})) as rank
      FROM "documents" d
      JOIN "datarooms" dr ON d."dataRoomId" = dr.id
      JOIN "TeamMember" tm ON dr."teamId" = tm."teamId"
      WHERE 
        tm."userId" = ${user?.id} AND
        (
          d.search_vector @@ plainto_tsquery('english', ${query}) OR
          d.name ILIKE ${`%${query}%`}
        )
        ${type ? `AND d."mimeType" ILIKE ${`%${type}%`}` : ''}
      ORDER BY rank DESC, d."updatedAt" DESC
      LIMIT ${limit};
    `;

        return NextResponse.json({
            success: true,
            data: searchResults,
        });
    } catch (error) {
        console.error("Error searching documents:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
