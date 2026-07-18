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

// Track E complete — blockchain is no longer quarantined. It is now an
// event-driven module consuming outbox events (see blockchain-outbox.handler.ts).
// The @unerp/blockchain package and modules/blockchain may be imported by any
// module that uses the outbox to trigger blockchain anchoring.

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
