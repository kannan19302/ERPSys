import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rootPackage = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'));
// The database package is the published @unerp/database after the § 14 Phase 3
// split. This gate asserts that migrations are applied through recorded history
// (`prisma migrate deploy`) and never `db push`, so it must read the manifest of
// the package whose scripts actually run.
//
// That package moves during the § 14 Phase 3 migration: a workspace member at
// packages/database until consumers have switched, the installed
// @unerp/database afterwards. Resolve whichever is present — pinning one made
// this gate throw ENOENT and block every push the day the package moved, which
// is a gate failing loudly for the wrong reason.
const DB_PACKAGE_CANDIDATES = [
  'packages/database/package.json',
  'node_modules/@unerp/database/package.json',
];
const databaseManifestPath = DB_PACKAGE_CANDIDATES.map((candidate) =>
  resolve(repositoryRoot, candidate),
).find((candidate) => existsSync(candidate));
if (!databaseManifestPath) {
  console.error(
    'The database package manifest is in neither the workspace nor node_modules:',
  );
  for (const candidate of DB_PACKAGE_CANDIDATES) console.error(`  ${candidate}`);
  process.exit(1);
}
const databasePackage = JSON.parse(readFileSync(databaseManifestPath, 'utf8'));
const entrypoint = readFileSync(resolve(repositoryRoot, 'scripts/docker-entrypoint.sh'), 'utf8');
const ciWorkflow = readFileSync(resolve(repositoryRoot, '.github/workflows/ci.yml'), 'utf8');

const failures = [];

if (rootPackage.scripts?.['db:deploy'] !== 'pnpm --filter @unerp/database db:deploy') {
  failures.push('root package must expose `db:deploy` through @unerp/database');
}

// Check the invariant, not a literal. The platform split gave the database
// package two schemas (main + IdP), so db:deploy is now a chain:
//   prisma migrate deploy --schema prisma/schema && prisma migrate deploy --schema prisma/idp-schema.prisma
// What must hold is that every step applies RECORDED history via `migrate
// deploy`, and that `db push` never appears. An exact-string gate failed the
// moment a second schema was added, which teaches people to edit the gate.
const dbDeploy = databasePackage.scripts?.['db:deploy'] ?? '';
const deploySteps = dbDeploy.split('&&').map((s) => s.trim()).filter(Boolean);
if (
  deploySteps.length === 0 ||
  !deploySteps.every((step) => /^prisma\s+migrate\s+deploy\b/.test(step)) ||
  /\bdb\s+push\b/.test(dbDeploy)
) {
  failures.push(
    'database package must apply recorded migration history with `prisma migrate deploy` ' +
      `(every && step must start with it, and no \`db push\`); got: ${dbDeploy || '(unset)'}`,
  );
}

if (rootPackage.scripts?.['db:push'] !== 'node scripts/forbid-db-push.mjs') {
  failures.push('root db:push must fail closed through scripts/forbid-db-push.mjs');
}

if (databasePackage.scripts?.['db:push'] !== 'node ../../scripts/forbid-db-push.mjs') {
  failures.push('database db:push must fail closed through scripts/forbid-db-push.mjs');
}

if (entrypoint.includes('pnpm db:push') || !entrypoint.includes('pnpm db:deploy')) {
  failures.push('Docker development startup must use db:deploy and must not use db:push');
}

if (!ciWorkflow.includes('pnpm migration:discipline')) {
  failures.push('CI must run the migration-discipline gate');
}

if (failures.length > 0) {
  console.error('Migration discipline check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Migration discipline check passed. Recorded migrations are the only supported schema transition path.');
