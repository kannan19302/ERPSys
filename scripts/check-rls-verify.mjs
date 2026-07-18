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

  await prisma.$disconnect();
  const exitCode = noRls.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

check().catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
