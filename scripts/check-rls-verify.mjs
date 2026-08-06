#!/usr/bin/env node
// Quick verification for Track C — checks RLS state post-migration
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const [role] = await prisma.$queryRawUnsafe(
    `SELECT rolname, rolbypassrls::int as bypass FROM pg_roles WHERE rolname = 'unerp_api'`
  );
  console.log('Role unerp_api:', role ? `${role.rolname} (bypass=${role.bypass})` : 'NOT FOUND');

  const [rlsCount] = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int as c FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true AND c.relname != '_prisma_migrations'`
  );
  console.log(`Tables with RLS enabled: ${rlsCount.c}`);

  const [tenantCols] = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int as c FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'tenant_id'`
  );
  console.log(`Tables with tenant_id column: ${tenantCols.c}`);

  const [rlsPolicies] = await prisma.$queryRawUnsafe(
    `SELECT count(*)::int as c FROM pg_policies WHERE schemaname = 'public' AND policyname LIKE 'tenant_isolation_%'`
  );
  console.log(`RLS tenant_isolation policies: ${rlsPolicies.c}`);

  const noRls = await prisma.$queryRawUnsafe(
    `SELECT c.relname::text FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname != '_prisma_migrations' AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = c.relname AND column_name = 'tenant_id') AND c.relrowsecurity = false`
  );
  if (noRls.length > 0) {
    console.log(`Tables WITH tenant_id but WITHOUT RLS: ${noRls.map(r => r.relname).join(', ')}`);
  } else {
    console.log('All tenant-scoped tables have RLS enabled — PASS');
  }

  // ── FORCE, not just ENABLE ────────────────────────────────────────────────
  // BACKEND_SCHEMA § 4.4 and PLATFORM_ARCHITECTURE § 5.1 require ENABLE *and*
  // FORCE. Without FORCE, the table owner — which is the role that runs
  // migrations and seeds — is exempt from every policy, so a table can report
  // "RLS enabled" and still return every tenant's rows to the owner. Checking
  // only relrowsecurity proves the weaker half of the guarantee.
  const notForced = await prisma.$queryRawUnsafe(
    `SELECT c.relname::text FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND c.relname != '_prisma_migrations'
        AND c.relrowsecurity = true
        AND c.relforcerowsecurity = false`
  );
  if (notForced.length > 0) {
    console.log(
      `Tables with RLS ENABLED but not FORCED: ${notForced.map(r => r.relname).join(', ')}`
    );
  } else {
    console.log('All RLS tables are FORCED — owner is not exempt — PASS');
  }

  // ── the app role must not be able to bypass ───────────────────────────────
  // This was reported and then ignored: a role with rolbypassrls defeats every
  // policy above it, so it is a failure, not a line of output.
  const roleBypasses = !role || role.bypass !== 0;
  if (!role) {
    console.log('Role unerp_api does not exist — the application connects as something else');
  } else if (role.bypass !== 0) {
    console.log('Role unerp_api has BYPASSRLS — every policy above is decorative');
  }

  await prisma.$disconnect();
  const exitCode = noRls.length > 0 || notForced.length > 0 || roleBypasses ? 1 : 0;
  process.exit(exitCode);
}

check().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
