
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing database connection...');
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'admin@dataroom.com' },
            include: {
                groupMemberships: {
                    include: {
                        group: {
                            include: {
                                dataRoom: {
                                    include: {
                                        _count: {
                                            select: {
                                                documents: true,
                                                folders: true,
                                                groups: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        console.log('Query successful:', JSON.stringify(user, null, 2));
    } catch (e) {
        console.error('Query failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
