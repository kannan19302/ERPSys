import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

/**
 * Control-plane provisioning — platform staff, not customers.
 *
 * The `system.*` / `platform.*` namespaces are reserved for the control plane,
 * and `hasPermission` deliberately refuses to satisfy them from a tenant grant:
 * not from `finance.*`, and not even from the global `*` that Super Admin
 * carries. That is what closes the confirmed escalation in
 * PLATFORM_ARCHITECTURE § 1.2, where any customer administrator could suspend,
 * export or offboard any other tenant.
 *
 * The consequence is that the control plane ships fail-closed: correct, but
 * unusable, because nothing grants those permissions. This script is the only
 * sanctioned way to grant them.
 *
 * Why a separate script and a reserved tenant:
 *
 *   - `Role.tenantId` is required, so a control-plane role has to live under
 *     some tenant. Putting it under a customer tenant is precisely the
 *     escalation we closed, so it lives under a reserved tenant that is not a
 *     customer: no plan, no trial, no billing, no demo data.
 *   - Keeping it out of `prisma/seed.ts` is enforced, not conventional. The
 *     `control-plane-seeded-to-tenant` policy gate fails the build if a
 *     `system.*`/`platform.*` grant ever appears in the tenant seed.
 *   - No default staff user is created. A well-known platform-staff login with
 *     a shared password would be a backdoor into every tenant's data at once —
 *     strictly worse than the escalation this whole mechanism exists to close.
 *     Staff are provisioned explicitly, by email, via PLATFORM_STAFF_EMAIL.
 *
 * Usage:
 *   pnpm --filter @unerp/database db:seed:platform
 *   PLATFORM_STAFF_EMAIL=you@example.com pnpm --filter @unerp/database db:seed:platform
 *
 * Without PLATFORM_STAFF_EMAIL the roles are created but assigned to nobody,
 * which leaves the control plane closed. That is the intended default.
 */

const prisma = new PrismaClient();

/** Reserved control-plane tenant. Never a customer; never billed or listed. */
export const PLATFORM_TENANT_ID = "platform";
export const PLATFORM_TENANT_SLUG = "platform-control-plane";

export const PLATFORM_ROLES = {
  PLATFORM_OWNER: {
    name: "Platform Owner",
    description:
      "Full control-plane authority: tenant lifecycle, platform configuration, staff management.",
    // Scoped to the control-plane namespaces only. This role deliberately
    // carries no tenant-business grants — reading a customer's ledger is a
    // separate, auditable act, not a side effect of being platform staff.
    permissions: ["system.*", "platform.*"],
  },
  PLATFORM_SUPPORT: {
    name: "Platform Support",
    description:
      "Read-only control-plane access for support triage. Cannot suspend, delete or offboard a tenant.",
    permissions: [
      "system.tenant.read",
      "system.health.read",
      "platform.audit.read",
    ],
  },
} as const;

async function main() {
  console.log("Provisioning the control plane…\n");

  const tenant = await prisma.tenant.upsert({
    where: { id: PLATFORM_TENANT_ID },
    update: {},
    create: {
      id: PLATFORM_TENANT_ID,
      name: "UniERP Platform (control plane)",
      slug: PLATFORM_TENANT_SLUG,
      // `status` is deliberately not ACTIVE: nothing that iterates customer
      // tenants (billing runs, trial expiry, usage metering, tenant listings)
      // should ever pick this row up as a customer.
      status: "SYSTEM",
      plan: "system",
      settings: { isControlPlane: true },
      onboardingComplete: true,
    },
  });
  console.log(`  reserved tenant: ${tenant.name} (${tenant.id})`);

  const roleIds: Record<string, string> = {};
  for (const [key, role] of Object.entries(PLATFORM_ROLES)) {
    const dbRole = await prisma.role.upsert({
      where: { tenantId_name: { tenantId: tenant.id, name: role.name } },
      update: { permissions: JSON.stringify(role.permissions) },
      create: {
        tenantId: tenant.id,
        name: role.name,
        description: role.description,
        isSystem: true,
        permissions: JSON.stringify(role.permissions),
      },
    });
    roleIds[key] = dbRole.id;
    console.log(`  role: ${role.name}  [${role.permissions.join(", ")}]`);
  }

  const staffEmail = process.env.PLATFORM_STAFF_EMAIL?.trim();
  if (!staffEmail) {
    console.log(
      "\n  No PLATFORM_STAFF_EMAIL set — roles exist but are assigned to nobody,\n" +
        "  so the control plane stays closed. Assign a real account with:\n" +
        "    PLATFORM_STAFF_EMAIL=you@example.com pnpm --filter @unerp/database db:seed:platform",
    );
    return;
  }

  // The account must already exist and must already belong to the reserved
  // tenant. This script grants authority; it does not mint identities, and it
  // will not quietly promote a customer's user into platform staff.
  const staff = await prisma.user.findFirst({
    where: { email: staffEmail, tenantId: tenant.id },
  });
  if (!staff) {
    throw new Error(
      `No user ${staffEmail} in the reserved tenant "${PLATFORM_TENANT_ID}".\n` +
        "Create the platform-staff account in the control-plane realm first, then re-run.\n" +
        "This script will not promote a user that belongs to a customer tenant.",
    );
  }

  await prisma.userRole.upsert({
    where: {
      userId_roleId: { userId: staff.id, roleId: roleIds.PLATFORM_OWNER! },
    },
    update: {},
    create: { userId: staff.id, roleId: roleIds.PLATFORM_OWNER! },
  });
  console.log(`\n  granted Platform Owner to ${staffEmail}`);
}

// Only provision when run as a script. Importing this module (to check the
// role definitions in a test, say) must not open a database connection or
// grant anything.
const isEntryPoint =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isEntryPoint) {
  main()
    .catch((e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
