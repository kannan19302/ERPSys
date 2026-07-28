import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD_HASH = '$2a$10$QNgJRZXhmjzcu16TQaaR4.EfRNWCFvCxE0Jvqvy/IKIgwq.BgSMJG';

async function withTenantContext<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}

async function main() {
  console.log("🌱 Starting Demo Tenant seeding...");

  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "demo" },
    update: {},
    create: {
      name: "Global Industries (Demo)",
      slug: "demo",
      plan: "enterprise",
      status: "ACTIVE",
      settings: {
        currency: "USD",
        timezone: "America/New_York",
      },
    },
  });

  console.log(`Demo Tenant created: ${demoTenant.name} (${demoTenant.id})`);

  // Create roles
  const dbRole = await withTenantContext(demoTenant.id, (tx) => 
    tx.role.upsert({
      where: { tenantId_name: { tenantId: demoTenant.id, name: "Admin" } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        name: "Admin",
        description: "Full access",
        isSystem: true,
        permissions: JSON.stringify(["*"]),
      },
    })
  );

  // Create users
  const adminUser = await withTenantContext(demoTenant.id, (tx) =>
    tx.user.upsert({
      where: { tenantId_email: { tenantId: demoTenant.id, email: "admin@demo.unerp.dev" } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        email: "admin@demo.unerp.dev",
        passwordHash: DEFAULT_PASSWORD_HASH,
        firstName: "Demo",
        lastName: "Admin",
        status: "ACTIVE",
      },
    })
  );

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: dbRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: dbRole.id },
  });

  const salesUser = await withTenantContext(demoTenant.id, (tx) =>
    tx.user.upsert({
      where: { tenantId_email: { tenantId: demoTenant.id, email: "sales@demo.unerp.dev" } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        email: "sales@demo.unerp.dev",
        passwordHash: DEFAULT_PASSWORD_HASH,
        firstName: "Sarah",
        lastName: "Sales",
        status: "ACTIVE",
      },
    })
  );

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: salesUser.id, roleId: dbRole.id } },
    update: {},
    create: { userId: salesUser.id, roleId: dbRole.id },
  });

  console.log(`Demo users verified: ${adminUser.email}, ${salesUser.email}`);
  console.log("🚀 Demo seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error during demo seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
