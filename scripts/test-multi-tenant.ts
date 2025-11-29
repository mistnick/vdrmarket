/**
 * Test Multi-Tenant Setup
 * Creates default plans, a super admin, and test tenant
 */

import { prisma } from "../lib/db/prisma";

async function main() {
  console.log("🔍 Checking database state...\n");

  // Check users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, isSuperAdmin: true },
  });
  console.log("Users:", users.length);
  users.forEach((u) => console.log(`  - ${u.email} (superAdmin: ${u.isSuperAdmin})`));

  // Check plans
  const plans = await prisma.plan.findMany();
  console.log("\nPlans:", plans.length);
  plans.forEach((p) => console.log(`  - ${p.name}: ${p.maxVdr} VDRs, ${p.maxStorageMb}MB`));

  // Create default plans if none exist
  if (plans.length === 0) {
    console.log("\n📦 Creating default plans...");
    
    const starterPlan = await prisma.plan.create({
      data: {
        name: "Starter",
        description: "Per piccoli team e startup",
        maxVdr: 3,
        maxAdminUsers: 2,
        maxStorageMb: 1024, // 1GB
        durationDays: 365,
        priceMonthly: 29.99,
        priceYearly: 299.99,
        features: ["3 Data Rooms", "2 Admin Users", "1GB Storage", "Email Support"],
        isActive: true,
      },
    });
    console.log(`  ✅ Created: ${starterPlan.name}`);

    const proPlan = await prisma.plan.create({
      data: {
        name: "Professional",
        description: "Per aziende in crescita",
        maxVdr: 10,
        maxAdminUsers: 5,
        maxStorageMb: 10240, // 10GB
        durationDays: 365,
        priceMonthly: 99.99,
        priceYearly: 999.99,
        features: ["10 Data Rooms", "5 Admin Users", "10GB Storage", "Priority Support", "API Access"],
        isActive: true,
      },
    });
    console.log(`  ✅ Created: ${proPlan.name}`);

    const enterprisePlan = await prisma.plan.create({
      data: {
        name: "Enterprise",
        description: "Per grandi organizzazioni",
        maxVdr: -1, // Unlimited
        maxAdminUsers: -1,
        maxStorageMb: 102400, // 100GB
        durationDays: null, // Unlimited
        priceMonthly: 299.99,
        priceYearly: 2999.99,
        features: ["Unlimited Data Rooms", "Unlimited Admin Users", "100GB Storage", "24/7 Support", "Custom Integrations", "SLA"],
        isActive: true,
      },
    });
    console.log(`  ✅ Created: ${enterprisePlan.name}`);
  }

  // Check tenants
  const tenants = await prisma.tenant.findMany({
    include: { plan: true, tenantUsers: { include: { user: true } } },
  });
  console.log("\nTenants:", tenants.length);
  tenants.forEach((t) => {
    console.log(`  - ${t.name} (${t.slug}) - Plan: ${t.plan?.name || "None"}`);
    t.tenantUsers.forEach((tu) => console.log(`    • ${tu.user.email} (${tu.role})`));
  });

  // Create super admin if no users exist
  if (users.length === 0) {
    console.log("\n👤 No users found. Please create a user first via signup.");
  } else {
    // Make first user a super admin if none exists
    const superAdmin = users.find((u) => u.isSuperAdmin);
    if (!superAdmin && users.length > 0) {
      console.log("\n👑 Setting first user as Super Admin...");
      await prisma.user.update({
        where: { id: users[0].id },
        data: { isSuperAdmin: true },
      });
      console.log(`  ✅ ${users[0].email} is now Super Admin`);
    }
  }

  // Create test tenant if none exist
  if (tenants.length === 0 && users.length > 0) {
    console.log("\n🏢 Creating test tenant...");
    
    const starterPlan = await prisma.plan.findFirst({ where: { name: "Starter" } });
    
    const tenant = await prisma.tenant.create({
      data: {
        name: "Test Organization",
        slug: "test-org",
        description: "Tenant di test per sviluppo",
        status: "ACTIVE",
        planId: starterPlan?.id,
        tenantUsers: {
          create: {
            userId: users[0].id,
            role: "TENANT_ADMIN",
            status: "ACTIVE",
          },
        },
      },
      include: { plan: true },
    });
    console.log(`  ✅ Created tenant: ${tenant.name} (${tenant.slug})`);
    console.log(`  📋 Plan: ${tenant.plan?.name || "None"}`);
  }

  console.log("\n✅ Multi-tenant setup complete!");
  console.log("\n📝 Next steps:");
  console.log("1. Start the dev server: npm run dev");
  console.log("2. Login with your user account");
  console.log("3. Visit /dashboard to access your organization");
  console.log("4. Visit /dashboard to see your data rooms");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
