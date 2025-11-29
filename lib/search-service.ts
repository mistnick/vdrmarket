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
    dataRoomId: string | null,
    userId: string
): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    // Find all data rooms where the user is a member
    const userMemberships = await prisma.groupMember.findMany({
        where: { userId },
        select: {
            group: {
                select: { dataRoomId: true },
            },
        },
    });

    let dataRoomIds = userMemberships.map((m) => m.group.dataRoomId);

    // If specific dataRoomId provided, filter to only that one
    if (dataRoomId) {
        if (!dataRoomIds.includes(dataRoomId)) {
            return []; // User doesn't have access to this data room
        }
        dataRoomIds = [dataRoomId];
    }

    if (dataRoomIds.length === 0) return [];

    const [documents, folders, dataRooms] = await Promise.all([
        // Search Documents
        prisma.document.findMany({
            where: {
                dataRoomId: { in: dataRoomIds },
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
                dataRoomId: { in: dataRoomIds },
                name: { contains: query, mode: "insensitive" },
            },
            take: 5,
            orderBy: { updatedAt: "desc" },
        }),

        // Search DataRooms
        prisma.dataRoom.findMany({
            where: {
                id: { in: dataRoomIds },
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
