#!/usr/bin/env node
/**
 * Decimal-arithmetic ratchet.
 *
 * Money is stored as `Decimal(19,4)` — the schema lint (check-schema-lints.mjs)
 * enforces that. But storage being exact is worthless if the arithmetic is not:
 * `entries.reduce((s, e) => s + Number(e.amount), 0)` pulls a Decimal column
 * into a JS binary float, sums it there, and writes the drifted result back to
 * a Decimal column. The value is exact at rest and wrong after every
 * recalculation.
 *
 * This gate counts those sites and fails if the count rises above the committed
 * baseline. Like the suppression ratchet, the baseline may only ever fall: fix
 * sites and lower it, never raise it.
 *
 * A site is counted when BOTH hold:
 *   1. the expression has the shape `<acc> + Number(<obj>.<field>)`, and
 *   2. `<field>` is declared `Decimal` somewhere in the Prisma schema.
 *
 * Condition 2 is what keeps this honest — summing a genuine Float metric
 * (a rate, a score, a sensor reading) through Number() is fine and is not
 * counted. Field names alone are not evidence; the schema is.
 *
 * Usage:
 *   node scripts/ci/check-decimal-arithmetic.mjs           # check against baseline
 *   node scripts/ci/check-decimal-arithmetic.mjs --list    # print every site
 *   node scripts/ci/check-decimal-arithmetic.mjs --write   # lower the baseline
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);
const BASELINE = path.join(
  ROOT,
  "scripts",
  "ci",
  "decimal-arithmetic-baseline.json",
);
// The schema moved to the published @unerp/database in the § 14 Phase 3 split,
// so the gate reads the installed artifact — the copy the running code is
// actually typed against. It fell over with ENOENT the moment packages/ was
// deleted, which is the right way for a gate to notice its target has moved:
// loudly, rather than by scanning an empty set and reporting zero violations.
const SCHEMA_DIR = path.join(
  ROOT,
  "node_modules",
  "@unerp",
  "database",
  "prisma",
  "schema",
);
const SCAN_ROOTS = [path.join(ROOT, "apps"), path.join(ROOT, "packages")];

function decimalFieldNames() {
  const names = new Set();
  for (const file of readdirSync(SCHEMA_DIR)) {
    if (!file.endsWith(".prisma")) continue;
    const src = readFileSync(path.join(SCHEMA_DIR, file), "utf8");
    for (const m of src.matchAll(/^\s*(\w+)\s+Decimal/gm)) names.add(m[1]);
  }
  return names;
}

function sourceFiles(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const entry of entries) {
    const p = path.join(dir, entry);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry === "dist" || entry === ".next")
        continue;
      sourceFiles(p, out);
    } else if (/\.tsx?$/.test(entry) && !/\.(spec|test)\.tsx?$/.test(entry)) {
      out.push(p);
    }
  }
  return out;
}

// `<acc> + Number(<obj>.<field>` — the float-accumulation shape.
const PATTERN = /\w+\s*\+\s*Number\(\s*\w+(?:\?)?\.(\w+)/g;

const decimals = decimalFieldNames();
const sites = [];

for (const root of SCAN_ROOTS) {
  for (const file of sourceFiles(root)) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    let inBlockComment = false;
    lines.forEach((line, i) => {
      // Comments must not be counted. Explaining the bad pattern in a code
      // comment (as the fixed sites do) would otherwise register as a fresh
      // violation and inflate the baseline — the gate would punish documenting
      // the very thing it asks you to fix.
      const trimmed = line.trim();
      if (inBlockComment) {
        if (trimmed.includes("*/")) inBlockComment = false;
        return;
      }
      if (trimmed.startsWith("/*")) {
        if (!trimmed.includes("*/")) inBlockComment = true;
        return;
      }
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      if (!line.includes("Number(")) return;
      for (const m of line.matchAll(PATTERN)) {
        if (!decimals.has(m[1])) continue;
        sites.push({
          file: path.relative(ROOT, file).replace(/\\/g, "/"),
          line: i + 1,
          field: m[1],
        });
      }
    });
  }
}

if (process.argv.includes("--list")) {
  for (const s of sites) console.log(`${s.file}:${s.line}  ${s.field}`);
  console.log(`\n${sites.length} site(s)`);
  process.exit(0);
}

if (process.argv.includes("--write")) {
  writeFileSync(
    BASELINE,
    JSON.stringify({ maxSites: sites.length }, null, 2) + "\n",
    "utf8",
  );
  console.log(`Decimal-arithmetic baseline written: ${sites.length}`);
  process.exit(0);
}

let baseline;
try {
  baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
} catch {
  console.error(
    `Decimal-arithmetic ratchet: missing baseline at ${path.relative(ROOT, BASELINE)}.\n` +
      "Create it with: node scripts/ci/check-decimal-arithmetic.mjs --write",
  );
  process.exit(1);
}

const max = baseline.maxSites;

if (sites.length > max) {
  console.error(
    `Decimal-arithmetic ratchet FAILED: ${sites.length} site(s) sum a Decimal column in floating point, baseline is ${max}.`,
  );
  console.error(
    "\nMoney is Decimal(19,4) precisely so it does not drift. Summing it with\n" +
      "`sum + Number(x.field)` puts it back into binary float and writes the\n" +
      "drifted total to a Decimal column. Use Decimal arithmetic instead:\n" +
      "  rows.reduce((s, r) => s.add(r.amount ?? 0), new Prisma.Decimal(0))\n" +
      "\nRun with --list to see every site.",
  );
  process.exit(1);
}

if (sites.length < max) {
  console.log(
    `Decimal-arithmetic ratchet: ${sites.length} site(s), below the baseline of ${max}.\n` +
      "Lower it with: node scripts/ci/check-decimal-arithmetic.mjs --write",
  );
  process.exit(0);
}

console.log(
  `Decimal-arithmetic ratchet: ${sites.length} site(s), at the baseline.`,
);
