
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Testing simple connection...');
    try {
        const count = await prisma.user.count();
        console.log('User count:', count);
    } catch (e) {
        console.error('Simple query failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
