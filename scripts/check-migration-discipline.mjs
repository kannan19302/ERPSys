import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const rootPackage = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8'));
const databasePackage = JSON.parse(readFileSync(resolve(repositoryRoot, 'packages/database/package.json'), 'utf8'));
const entrypoint = readFileSync(resolve(repositoryRoot, 'scripts/docker-entrypoint.sh'), 'utf8');
const ciWorkflow = readFileSync(resolve(repositoryRoot, '.github/workflows/ci.yml'), 'utf8');

const failures = [];

if (rootPackage.scripts?.['db:deploy'] !== 'pnpm --filter @unerp/database db:deploy') {
  failures.push('root package must expose `db:deploy` through @unerp/database');
}

if (databasePackage.scripts?.['db:deploy'] !== 'prisma migrate deploy') {
  failures.push('database package must apply recorded migration history with `prisma migrate deploy`');
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
