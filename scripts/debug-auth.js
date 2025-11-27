const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Test credentials
    const testUsers = [
        { email: 'admin@dataroom.com', password: 'Admin123!' },
        { email: 'manager@dataroom.com', password: 'Manager123!' },
        { email: 'user@dataroom.com', password: 'User123!' },
    ];

    console.log('🔍 Checking database users...\n');

    // List all users
    const allUsers = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            password: true,
            emailVerified: true,
        }
    });

    console.log(`📊 Total users in database: ${allUsers.length}\n`);

    for (const user of allUsers) {
        console.log(`  - ${user.email} (${user.name || 'No name'})`);
        console.log(`    Password set: ${user.password ? 'Yes' : 'No'}`);
        console.log(`    Email verified: ${user.emailVerified ? 'Yes' : 'No'}`);
        console.log('');
    }

    console.log('\n🔐 Testing login credentials...\n');

    for (const { email, password } of testUsers) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log(`❌ ${email}: User not found`);
            continue;
        }

        if (!user.password) {
            console.log(`⚠️  ${email}: No password set`);
            continue;
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log(`${passwordMatch ? '✅' : '❌'} ${email}: ${passwordMatch ? 'Password correct' : 'Password incorrect'}`);
    }

    console.log('\n✨ Done!\n');
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
