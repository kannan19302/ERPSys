#!/usr/bin/env node

/**
 * M2 — Consumer-driven contracts (CDC) harness.
 * PLATFORM_ARCHITECTURE.md § 4.5 (M2) and § 14 Phase 2/3.
 *
 *   "Every consumer publishes a machine-readable expectation of what it uses
 *    from its providers. Each provider's CI replays the full corpus of its
 *    consumers' expectations on every PR."
 *
 * Why this exists
 * ───────────────
 * Today the TypeScript compiler sees across every package boundary in this
 * monorepo, so a removed export fails the consumer's build. After the Phase 3
 * split it does not: `unierp-web` compiles against a *published* `@unerp/ui`,
 * and a symbol deleted in the design system is discovered at runtime in
 * staging. M2 is what replaces the compiler, and § 14 forbids extracting any
 * repository before it demonstrably works.
 *
 * What it does
 * ────────────
 *   record   For each consumer, walk its source, collect every named import it
 *            takes from an `@unerp/*` provider, and write the result to
 *            <consumer>/cdc/expectations.json — the artifact the consumer
 *            "publishes" and the provider replays.
 *   verify   Recompute those expectations, fail if the committed file has
 *            drifted, then replay every recorded symbol against the provider's
 *            current exported surface. A symbol a consumer expects and a
 *            provider no longer exports is a CDC violation, named with both
 *            the consumer and the symbol — the information the compiler used
 *            to give for free.
 *
 * Honesty about what can be proven
 * ────────────────────────────────
 * A provider whose entrypoint re-exports from a package outside this workspace
 * (`export * from "@prisma/client"`) has a surface this harness cannot
 * enumerate. Absence cannot be proven there, so such a provider is reported as
 * an OPEN surface and its misses are warnings, never failures. Claiming
 * otherwise would make the gate lie in the direction that matters.
 *
 * Usage:  node scripts/ci/cdc-harness.mjs [--record] [--json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../');

const RECORD = process.argv.includes('--record');
const AS_JSON = process.argv.includes('--json');

/**
 * Providers: a published package whose exported surface other layers depend on.
 * `entry` is the source entrypoint; `subpaths` maps a subpath export to its own
 * entrypoint, because a consumer may import `@unerp/ui/charts` directly.
 */
const PROVIDERS = {
  '@unerp/contracts': { dir: 'packages/contracts', entry: 'src/index.ts' },
  '@unerp/kernel': { dir: 'packages/kernel', entry: 'src/index.ts' },
  '@unerp/sdk': { dir: 'packages/sdk', entry: 'src/index.ts' },
  '@unerp/extension-api': { dir: 'packages/extension-api', entry: 'src/index.ts' },
  '@unerp/sandbox': { dir: 'packages/sandbox', entry: 'src/index.ts' },
  '@unerp/framework': { dir: 'packages/framework', entry: 'src/index.ts' },
  '@unerp/database': { dir: 'packages/database', entry: 'src/index.ts' },
  '@unerp/shared': { dir: 'packages/shared', entry: 'src/index.ts' },
  '@unerp/auth': { dir: 'packages/auth', entry: 'src/index.ts' },
  '@unerp/ui': { dir: 'packages/ui', entry: 'src/index.ts', subpathRoot: 'src' },
};

/** Consumers: anything that compiles against a provider's published artifact. */
const CONSUMERS = [
  { name: '@unerp/web', dir: 'apps/web', roots: ['app', 'src'] },
  { name: '@unerp/console', dir: 'apps/console', roots: ['app', 'src'] },
  { name: '@unerp/developer', dir: 'apps/developer', roots: ['src'] },
  { name: '@unerp/api', dir: 'apps/api', roots: ['src'] },
  { name: '@unerp/idp', dir: 'apps/idp', roots: ['src'] },
  { name: '@unerp/framework', dir: 'packages/framework', roots: ['src'] },
  { name: '@unerp/sdk', dir: 'packages/sdk', roots: ['src'] },
  { name: '@unerp/kernel', dir: 'packages/kernel', roots: ['src'] },
  { name: '@unerp/ext-real-estate', dir: 'apps/extensions/real-estate', roots: ['src'] },
  { name: '@unerp/ext-education', dir: 'apps/extensions/education', roots: ['src'] },
  { name: '@unerp/ext-healthcare', dir: 'apps/extensions/healthcare', roots: ['src'] },
  { name: '@unerp/ext-field-service', dir: 'apps/extensions/field-service', roots: ['src'] },
];

// ── source helpers ───────────────────────────────────────────────────────────

const parse = (file) =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

function resolveRelative(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  // ESM source in this workspace imports with a .js extension that resolves to
  // the .ts file beside it (`./types/index.js` → `./types/index.ts`). Missing
  // this mapping silently reports a closed provider as an open one, which turns
  // a hard gate into a warning — so it is handled explicitly.
  const jsAsTs = base.replace(/\.jsx?$/, (m) => (m === '.jsx' ? '.tsx' : '.ts'));
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    jsAsTs,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ]) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function walkSources(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSources(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
}

// ── provider surface ─────────────────────────────────────────────────────────

/**
 * Collect the names a provider entrypoint actually exports, following relative
 * re-exports and re-exports of other in-workspace providers. Returns
 * { symbols:Set<string>, open:boolean } where `open` means the surface includes
 * a star re-export this harness could not resolve.
 */
function providerSurface(entryFile, seen = new Set()) {
  const symbols = new Set();
  let open = false;

  if (!entryFile || seen.has(entryFile)) return { symbols, open };
  seen.add(entryFile);

  const sf = parse(entryFile);

  for (const stmt of sf.statements) {
    // export * from "..."  /  export { a, b } from "..."  /  export { a }
    if (ts.isExportDeclaration(stmt)) {
      const spec = stmt.moduleSpecifier?.text;

      if (stmt.exportClause && ts.isNamedExports(stmt.exportClause)) {
        for (const el of stmt.exportClause.elements) symbols.add(el.name.text);
        continue;
      }

      // star re-export
      if (!spec) continue;
      if (spec.startsWith('.')) {
        const target = resolveRelative(entryFile, spec);
        if (!target) {
          open = true;
          continue;
        }
        const nested = providerSurface(target, seen);
        nested.symbols.forEach((s) => symbols.add(s));
        open = open || nested.open;
        continue;
      }

      const nestedProvider = PROVIDERS[spec];
      if (nestedProvider) {
        const nested = providerSurface(
          path.join(ROOT, nestedProvider.dir, nestedProvider.entry),
          seen,
        );
        nested.symbols.forEach((s) => symbols.add(s));
        open = open || nested.open;
        continue;
      }

      // re-export of a package outside this workspace: surface is not enumerable
      open = true;
      continue;
    }

    const exported = ts
      .getCombinedModifierFlags(stmt)
      // eslint-disable-next-line no-bitwise
      & ts.ModifierFlags.Export;
    if (!exported) continue;

    if (ts.isVariableStatement(stmt)) {
      for (const d of stmt.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) symbols.add(d.name.text);
      }
    } else if (
      (ts.isFunctionDeclaration(stmt) ||
        ts.isClassDeclaration(stmt) ||
        ts.isInterfaceDeclaration(stmt) ||
        ts.isTypeAliasDeclaration(stmt) ||
        ts.isEnumDeclaration(stmt) ||
        ts.isModuleDeclaration(stmt)) &&
      stmt.name &&
      ts.isIdentifier(stmt.name)
    ) {
      symbols.add(stmt.name.text);
    }
  }

  return { symbols, open };
}

/** Resolve an import specifier to a provider entry file, honouring subpaths. */
function providerEntryFor(spec) {
  if (PROVIDERS[spec]) {
    const p = PROVIDERS[spec];
    return { key: spec, file: path.join(ROOT, p.dir, p.entry) };
  }
  for (const [name, p] of Object.entries(PROVIDERS)) {
    if (!p.subpathRoot || !spec.startsWith(`${name}/`)) continue;
    const sub = spec.slice(name.length + 1);
    if (sub.endsWith('.css')) return null; // stylesheet, not a symbol surface
    const file = resolveRelative(path.join(ROOT, p.dir, p.subpathRoot, 'x'), `./${sub}`);
    return file ? { key: spec, file } : null;
  }
  return null;
}

const surfaceCache = new Map();
function surfaceOf(spec) {
  const entry = providerEntryFor(spec);
  if (!entry) return null;
  if (!surfaceCache.has(entry.file)) surfaceCache.set(entry.file, providerSurface(entry.file));
  return surfaceCache.get(entry.file);
}

// ── consumer expectations ────────────────────────────────────────────────────

function computeExpectations(consumer) {
  /** @type {Record<string, {symbols:Set<string>, namespaceImports:number, files:Set<string>}>} */
  const byProvider = {};

  for (const root of consumer.roots) {
    for (const file of walkSources(path.join(ROOT, consumer.dir, root))) {
      const sf = parse(file);
      for (const stmt of sf.statements) {
        if (!ts.isImportDeclaration(stmt) || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
        const spec = stmt.moduleSpecifier.text;
        if (!spec.startsWith('@unerp/')) continue;
        if (!providerEntryFor(spec)) continue;

        const rec = (byProvider[spec] ??= {
          symbols: new Set(),
          namespaceImports: 0,
          files: new Set(),
        });
        rec.files.add(path.relative(ROOT, file).split(path.sep).join('/'));

        const clause = stmt.importClause;
        if (!clause) continue;
        if (clause.name) rec.symbols.add('default');
        const b = clause.namedBindings;
        if (!b) continue;
        if (ts.isNamespaceImport(b)) rec.namespaceImports += 1;
        else for (const el of b.elements) rec.symbols.add((el.propertyName ?? el.name).text);
      }
    }
  }

  const providers = {};
  for (const [spec, rec] of Object.entries(byProvider).sort()) {
    providers[spec] = {
      symbols: [...rec.symbols].sort(),
      namespaceImports: rec.namespaceImports,
      consumingFiles: rec.files.size,
    };
  }

  return {
    $schema: 'https://unierp.io/schemas/cdc-expectations.json',
    description:
      'Consumer-driven contract. What this package expects its providers to export. ' +
      'Generated by scripts/ci/cdc-harness.mjs --record; replayed by providers in CI. ' +
      'PLATFORM_ARCHITECTURE.md § 4.5 (M2).',
    consumer: consumer.name,
    providers,
  };
}

const expectationsPath = (consumer) => path.join(ROOT, consumer.dir, 'cdc', 'expectations.json');
const stable = (obj) => `${JSON.stringify(obj, null, 2)}\n`;

// ── run ──────────────────────────────────────────────────────────────────────

const results = { recorded: [], drifted: [], violations: [], openProviders: [], warnings: [] };

for (const consumer of CONSUMERS) {
  if (!fs.existsSync(path.join(ROOT, consumer.dir))) continue;
  const expectations = computeExpectations(consumer);
  const file = expectationsPath(consumer);

  if (RECORD) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, stable(expectations));
    results.recorded.push(consumer.name);
    continue;
  }

  // 1. the published expectation must match what the consumer actually imports
  if (!fs.existsSync(file)) {
    results.drifted.push({ consumer: consumer.name, reason: 'no published expectation' });
  } else if (fs.readFileSync(file, 'utf8') !== stable(expectations)) {
    results.drifted.push({ consumer: consumer.name, reason: 'published expectation is stale' });
  }

  // 2. replay every expected symbol against the provider's current surface
  for (const [spec, exp] of Object.entries(expectations.providers)) {
    const surface = surfaceOf(spec);
    if (!surface) continue;
    if (surface.open) {
      if (!results.openProviders.includes(spec)) results.openProviders.push(spec);
      const missing = exp.symbols.filter((s) => s !== 'default' && !surface.symbols.has(s));
      if (missing.length) {
        results.warnings.push(
          `${consumer.name} → ${spec}: ${missing.length} symbol(s) not enumerable (open surface)`,
        );
      }
      continue;
    }
    for (const symbol of exp.symbols) {
      if (symbol === 'default') continue;
      if (!surface.symbols.has(symbol)) {
        results.violations.push({ consumer: consumer.name, provider: spec, symbol });
      }
    }
  }
}

if (AS_JSON) {
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.violations.length || results.drifted.length ? 1 : 0);
}

console.log('\nM2 — consumer-driven contracts  \x1b[2m(PLATFORM_ARCHITECTURE.md § 4.5)\x1b[0m\n');

if (RECORD) {
  for (const name of results.recorded) console.log(`  · recorded  ${name}`);
  console.log(`\n  ✅ Published ${results.recorded.length} consumer expectation(s).\n`);
  process.exit(0);
}

const consumersChecked = CONSUMERS.filter((c) => fs.existsSync(path.join(ROOT, c.dir))).length;
console.log(`  Replayed ${consumersChecked} consumer expectation corpora against their providers.`);
if (results.openProviders.length) {
  console.log(
    `  \x1b[2mOpen surfaces (absence not provable, misses are warnings): ${results.openProviders.join(', ')}\x1b[0m`,
  );
}
for (const w of results.warnings) console.log(`  \x1b[33m⚠\x1b[0m  ${w}`);

if (results.drifted.length) {
  console.log('\n  \x1b[31m✗ Published expectations are out of date:\x1b[0m');
  for (const d of results.drifted) console.log(`      · ${d.consumer} — ${d.reason}`);
  console.log('\n    Run: node scripts/ci/cdc-harness.mjs --record');
}

if (results.violations.length) {
  console.log('\n  \x1b[31m✗ CDC violations — a consumer expects a symbol its provider no longer exports:\x1b[0m');
  for (const v of results.violations) {
    console.log(`      · ${v.consumer} expects \x1b[1m${v.symbol}\x1b[0m from ${v.provider}`);
  }
}

if (results.drifted.length || results.violations.length) {
  console.log('\n  This is the break the compiler would have caught before the Phase 3 split,');
  console.log('  and will not catch after it. Fix the provider or update the consumer.\n');
  process.exit(1);
}

console.log('\n  \x1b[32m✅ Every consumer expectation is satisfied by its provider.\x1b[0m\n');
