const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@dataroom.com';
    const password = 'P4ssw0rd!';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log('User not found. Creating user...');
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                email,
                name: 'Admin User',
                password: hashedPassword,
                role: 'ADMIN',
            },
        });
        console.log('User created:', newUser);
    } else {
        console.log('User found:', user);
        console.log('Resetting password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });
        console.log('Password reset successfully.');
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
