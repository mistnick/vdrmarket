import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/dataroom?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting database seeding...');

    // Test users data
    const testUsers = [
        {
            email: 'admin@dataroom.com',
            password: 'Admin123!',
            name: 'Admin User',
            role: 'owner' as const,
            teamName: 'Admin Team',
            teamSlug: 'admin-team',
            plan: 'enterprise' as const,
        },
        {
            email: 'manager@dataroom.com',
            password: 'Manager123!',
            name: 'Manager User',
            role: 'admin' as const,
            teamName: 'Manager Team',
            teamSlug: 'manager-team',
            plan: 'professional' as const,
        },
        {
            email: 'user@dataroom.com',
            password: 'User123!',
            name: 'Regular User',
            role: 'member' as const,
            teamName: 'User Team',
            teamSlug: 'user-team',
            plan: 'free' as const,
        },
        {
            email: 'viewer@dataroom.com',
            password: 'Viewer123!',
            name: 'Viewer User',
            role: 'viewer' as const,
            teamName: 'Viewer Team',
            teamSlug: 'viewer-team',
            plan: 'free' as const,
        },
    ];

    try {
        console.log('\n📝 Creating test users and teams...\n');

        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: userData.email },
            });

            if (existingUser) {
                console.log(`🔄 User already exists: ${userData.email}. Updating password...`);
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                await prisma.user.update({
                    where: { email: userData.email },
                    data: { password: hashedPassword },
                });
                console.log(`✅ Updated password for: ${userData.email}`);
                continue;
            }

            // Hash the password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create user
            const user = await prisma.user.create({
                data: {
                    email: userData.email,
                    name: userData.name,
                    password: hashedPassword,
                    emailVerified: new Date(), // Auto-verify test users
                },
            });

            // Create team for user
            const team = await prisma.team.create({
                data: {
                    name: userData.teamName,
                    slug: userData.teamSlug,
                    plan: userData.plan,
                    members: {
                        create: {
                            userId: user.id,
                            role: userData.role,
                        },
                    },
                },
            });

            console.log(`✅ Created user: ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Password: ${userData.password}`);
            console.log(`   Team: ${team.name} (${team.plan})`);
            console.log(`   Role: ${userData.role}\n`);
        }

        console.log('🎉 Database seeding completed successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 TEST USER CREDENTIALS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        testUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name}`);
            console.log(`   Email:    ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Role:     ${user.role}`);
            console.log(`   Plan:     ${user.plan}\n`);
        });

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 Login URL: http://localhost:3000/auth/login');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        console.error('❌ Error during seeding:', error);
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
