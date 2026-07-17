import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const apiRoot = resolve(repositoryRoot, 'apps/api/src');
const modulesRoot = resolve(apiRoot, 'modules');
const baseline = new Set(JSON.parse(readFileSync(resolve(repositoryRoot, 'scripts/module-boundary-baseline.json'), 'utf8')));
const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;
const sourceExtensions = new Set(['.ts', '.tsx']);

function filesIn(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const file = resolve(directory, entry);
    const stats = statSync(file);
    if (stats.isDirectory()) return filesIn(file);
    return sourceExtensions.has(extname(file)) ? [file] : [];
  });
}

function moduleName(file) {
  const relative = normalize(file).slice(normalize(modulesRoot).length + 1);
  return relative.split(/[\\/]/)[0] || null;
}

function resolveImport(sourceFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const candidate = resolve(sourceFile, '..', specifier);
  const possibilities = [
    candidate,
    `${candidate}.ts`,
    `${candidate}.tsx`,
    resolve(candidate, 'index.ts'),
    resolve(candidate, 'index.tsx'),
  ];
  return possibilities.find(existsSync) ?? null;
}

// Track 0.2 (FOUNDATION_HARDENING_ROADMAP § 5): the blockchain island is
// quarantined until Track E re-platforms it on the outbox. No file outside
// modules/blockchain may import the @unerp/blockchain package or anything
// under modules/blockchain (anchor services included).
const blockchainRoot = resolve(modulesRoot, 'blockchain');
const quarantineViolations = [];
for (const file of filesIn(apiRoot)) {
  if (normalize(file).startsWith(normalize(blockchainRoot))) continue;
  if (/\.spec\.ts$/.test(file)) continue;
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (specifier === '@unerp/blockchain' || specifier.startsWith('@unerp/blockchain/')) {
      quarantineViolations.push(`${file.replace(process.cwd(), '.')} -> ${specifier}`);
      continue;
    }
    const target = resolveImport(file, specifier);
    if (target && normalize(target).startsWith(normalize(blockchainRoot))) {
      quarantineViolations.push(`${file.replace(process.cwd(), '.')} -> ${specifier}`);
    }
  }
}
if (quarantineViolations.length > 0) {
  console.error('Blockchain is quarantined (Track 0.2): no module may import @unerp/blockchain or modules/blockchain until Track E re-platforms it on the outbox.');
  console.error(quarantineViolations.join('\n'));
  process.exit(1);
}

const violations = [];
for (const file of filesIn(modulesRoot)) {
  if (file.includes(`${normalize('/tests/')}`) || /\.spec\.ts$/.test(file)) continue;
  const sourceModule = moduleName(file);
  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(importPattern)) {
    const target = resolveImport(file, match[1]);
    if (!target || !normalize(target).startsWith(normalize(modulesRoot))) continue;
    const targetModule = moduleName(target);
    if (sourceModule && targetModule && sourceModule !== targetModule) {
      violations.push(`${file.replace(process.cwd(), '.')} -> ${match[1]} (${sourceModule} -> ${targetModule})`);
    }
  }
}

const newViolations = violations.filter((violation) => !baseline.has(violation));
if (newViolations.length > 0) {
  console.error('Direct imports between ERP modules are forbidden. Use an event, shared contract, or common infrastructure instead.');
  console.error(newViolations.join('\n'));
  process.exit(1);
}

console.log(`Module boundary check passed. ${violations.length} tracked legacy violation(s) remain in #22.`);
