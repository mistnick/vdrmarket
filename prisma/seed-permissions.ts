import { prisma } from "@/lib/db/prisma";
import { seedPermissions } from "@/lib/auth/permissions";

async function main() {
    console.log("Seeding permissions...");
    await seedPermissions();
    console.log("Permissions seeded successfully!");
}

main()
    .catch((e) => {
        console.error("Error seeding permissions:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
