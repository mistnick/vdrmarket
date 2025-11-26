import { prisma } from "@/lib/db/prisma";

export interface SearchResult {
    id: string;
    type: "document" | "folder" | "dataroom";
    title: string;
    description?: string | null;
    url: string;
    metadata?: {
        fileType?: string;
        updatedAt: Date;
    };
}

export async function searchContent(
    query: string,
    teamId: string,
    userId: string
): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    // If no teamId provided, find all teams the user is a member of
    let teamIds: string[] = [];
    if (teamId) {
        teamIds = [teamId];
    } else {
        const userTeams = await prisma.teamMember.findMany({
            where: { userId },
            select: { teamId: true },
        });
        teamIds = userTeams.map((t) => t.teamId);
    }

    if (teamIds.length === 0) return [];

    const [documents, folders, dataRooms] = await Promise.all([
        // Search Documents
        prisma.document.findMany({
            where: {
                teamId: { in: teamIds },
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { updatedAt: "desc" },
        }),

        // Search Folders
        prisma.folder.findMany({
            where: {
                teamId: { in: teamIds },
                name: { contains: query, mode: "insensitive" },
            },
            take: 5,
            orderBy: { updatedAt: "desc" },
        }),

        // Search DataRooms
        prisma.dataRoom.findMany({
            where: {
                teamId: { in: teamIds },
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                ],
            },
            take: 5,
            orderBy: { updatedAt: "desc" },
        }),
    ]);

    const results: SearchResult[] = [
        ...documents.map((doc) => ({
            id: doc.id,
            type: "document" as const,
            title: doc.name,
            description: doc.description,
            url: `/dashboard/documents/${doc.id}`,
            metadata: {
                fileType: doc.fileType,
                updatedAt: doc.updatedAt,
            },
        })),
        ...folders.map((folder) => ({
            id: folder.id,
            type: "folder" as const,
            title: folder.name,
            url: `/dashboard/folders/${folder.id}`,
            metadata: {
                updatedAt: folder.updatedAt,
            },
        })),
        ...dataRooms.map((room) => ({
            id: room.id,
            type: "dataroom" as const,
            title: room.name,
            description: room.description,
            url: `/dashboard/datarooms/${room.id}`,
            metadata: {
                updatedAt: room.updatedAt,
            },
        })),
    ];

    return results;
}
