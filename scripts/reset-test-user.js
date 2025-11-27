/**
 * Script to reset or create a test user
 * Run with: npx ts-node scripts/reset-test-user.ts
 * Or: node -r ts-node/register scripts/reset-test-user.ts
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@dataroom.com';
    const password = 'Admin123!';
    const name = 'Admin User';

    console.log(`\n🔧 Resetting test user: ${email}\n`);

    try {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`📝 Generated hash: ${hashedPassword.substring(0, 20)}...`);

        if (existingUser) {
            // Update existing user
            console.log('📌 User exists, updating password...');
            await prisma.user.update({
                where: { email },
                data: { 
                    password: hashedPassword,
                    emailVerified: new Date(),
                },
            });
            console.log('✅ Password updated successfully!');
        } else {
            // Create new user
            console.log('📌 User does not exist, creating...');
            const user = await prisma.user.create({
                data: {
                    email,
                    name,
                    password: hashedPassword,
                    emailVerified: new Date(),
                },
            });

            // Create default team
            await prisma.team.create({
                data: {
                    name: `${name}'s Team`,
                    slug: 'admin-team',
                    plan: 'enterprise',
                    members: {
                        create: {
                            userId: user.id,
                            role: 'owner',
                        },
                    },
                },
            });

            console.log('✅ User and team created successfully!');
        }

        // Verify the password works
        const verifyUser = await prisma.user.findUnique({
            where: { email },
        });

        if (verifyUser && verifyUser.password) {
            const passwordMatch = await bcrypt.compare(password, verifyUser.password);
            console.log(`\n🔐 Password verification: ${passwordMatch ? '✅ Success' : '❌ Failed'}`);
        }

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 LOGIN CREDENTIALS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
