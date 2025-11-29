/**
 * Script per configurare gli utenti admin
 * - Crea super admin info@simplevdr.com
 * - Associa admin@dataroom.com al tenant BeatData
 * 
 * Eseguire con: npx tsx scripts/setup-admin-users.ts
 */

// Carica le variabili d'ambiente
import * as dotenv from "dotenv";
dotenv.config();

import { prisma } from "../lib/db/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🔧 Configurazione utenti admin...\n");

  // 1. Crea o aggiorna super admin info@simplevdr.com
  const superAdminPassword = await bcrypt.hash("S1mpl3VDR!!", 12);
  
  const superAdmin = await prisma.user.upsert({
    where: { email: "info@simplevdr.com" },
    update: {
      isSuperAdmin: true,
      password: superAdminPassword,
      isActive: true,
    },
    create: {
      email: "info@simplevdr.com",
      name: "SimpleVDR Admin",
      password: superAdminPassword,
      isSuperAdmin: true,
      isActive: true,
    },
  });
  console.log(`✅ Super Admin creato/aggiornato: ${superAdmin.email}`);
  console.log(`   - isSuperAdmin: ${superAdmin.isSuperAdmin}`);
  console.log(`   - Password: S1mpl3VDR!!\n`);

  // 2. Trova o crea il tenant BeatData
  let beatDataTenant = await prisma.tenant.findFirst({
    where: { 
      OR: [
        { name: "BeatData" },
        { slug: "beatdata" }
      ]
    },
  });

  if (!beatDataTenant) {
    // Prendi il primo piano disponibile
    const defaultPlan = await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { priceMonthly: "asc" },
    });

    beatDataTenant = await prisma.tenant.create({
      data: {
        name: "BeatData",
        slug: "beatdata",
        description: "BeatData Organization",
        status: "ACTIVE",
        planId: defaultPlan?.id || null,
      },
    });
    console.log(`✅ Tenant BeatData creato: ${beatDataTenant.id}`);
  } else {
    console.log(`✅ Tenant BeatData trovato: ${beatDataTenant.id}`);
  }

  // 3. Trova l'utente admin@dataroom.com
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@dataroom.com" },
  });

  if (!adminUser) {
    console.log(`⚠️  Utente admin@dataroom.com non trovato. Creazione in corso...`);
    
    const adminPassword = await bcrypt.hash("Admin123!", 12);
    const newAdminUser = await prisma.user.create({
      data: {
        email: "admin@dataroom.com",
        name: "Admin User",
        password: adminPassword,
        isActive: true,
      },
    });
    
    // Associa al tenant come TENANT_ADMIN
    await prisma.tenantUser.upsert({
      where: {
        tenantId_userId: {
          tenantId: beatDataTenant.id,
          userId: newAdminUser.id,
        },
      },
      update: {
        role: "TENANT_ADMIN",
        status: "ACTIVE",
      },
      create: {
        tenantId: beatDataTenant.id,
        userId: newAdminUser.id,
        role: "TENANT_ADMIN",
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });
    
    console.log(`✅ Utente admin@dataroom.com creato e associato a BeatData come TENANT_ADMIN\n`);
  } else {
    // Associa al tenant come TENANT_ADMIN
    await prisma.tenantUser.upsert({
      where: {
        tenantId_userId: {
          tenantId: beatDataTenant.id,
          userId: adminUser.id,
        },
      },
      update: {
        role: "TENANT_ADMIN",
        status: "ACTIVE",
      },
      create: {
        tenantId: beatDataTenant.id,
        userId: adminUser.id,
        role: "TENANT_ADMIN",
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });
    
    console.log(`✅ Utente admin@dataroom.com associato a BeatData come TENANT_ADMIN\n`);
  }

  console.log("🎉 Configurazione completata!");
  console.log("\n📝 Credenziali Super Admin:");
  console.log("   Email: info@simplevdr.com");
  console.log("   Password: S1mpl3VDR!!");
}

main()
  .catch((e) => {
    console.error("❌ Errore:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
