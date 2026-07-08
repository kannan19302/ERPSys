#!/usr/bin/env node
/**
 * sprint-tracker.mjs — Generates .ai/SPRINT_TRACKER.md: the daily sprint tracker.
 *
 * Mines git history to report, per day:
 *   - commits, lines of code added/deleted/net (code files only)
 *   - functionality delivered (new API endpoints added to *.controller.ts,
 *     same definition as .ai/FEATURE_LEDGER.md)
 *   - modules touched
 *
 * Usage: node scripts/sprint-tracker.mjs [days]   (default 30)
 * Regenerate every cycle (AUTOPILOT.md Step 7).
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const days = Number(process.argv[2]) || 30;
const CODE_RE = /\.(ts|tsx|js|jsx|prisma|css|scss|mjs)$/;
const EXCLUDE_RE = /(node_modules|\/dist\/|\.next\/|pnpm-lock)/;
const EP_RE = /^\+.*@(Get|Post|Put|Patch|Delete)\(/;

const git = (cmd) =>
  execSync(cmd, { cwd: root, encoding: 'utf8', maxBuffer: 1024 * 1024 * 512 });

// ---- LOC + commits + modules per day (numstat) ----
const numstat = git(
  `git log --since="${days} days ago" --date=short --format=@%ad --numstat`,
);
const byDay = new Map();
const day = (d) => {
  if (!byDay.has(d))
    byDay.set(d, { commits: 0, add: 0, del: 0, endpoints: 0, modules: new Set() });
  return byDay.get(d);
};
let cur = null;
for (const line of numstat.split('\n')) {
  if (line.startsWith('@')) {
    cur = line.slice(1).trim();
    day(cur).commits++;
    continue;
  }
  const m = line.match(/^(\d+)\t(\d+)\t(.+)$/);
  if (!m || !cur) continue;
  const [, a, d, file] = m;
  if (!CODE_RE.test(file) || EXCLUDE_RE.test(file)) continue;
  const rec = day(cur);
  rec.add += Number(a);
  rec.del += Number(d);
  const mod = file.match(/apps\/api\/src\/modules\/([^/]+)\//);
  if (mod) rec.modules.add(mod[1]);
}

// ---- New endpoints (functionality) per day from controller diffs ----
const patch = git(
  `git log --since="${days} days ago" --date=short --format=@%ad -p -- "*.controller.ts"`,
);
cur = null;
for (const line of patch.split('\n')) {
  if (line.startsWith('@2')) {
    // our @%ad marker (dates start with 2…)
    cur = line.slice(1).trim();
    continue;
  }
  if (cur && EP_RE.test(line)) day(cur).endpoints++;
}

// ---- Render ----
const dates = [...byDay.keys()].sort().reverse();
const totals = { commits: 0, add: 0, del: 0, endpoints: 0 };
const rows = dates.map((d) => {
  const r = byDay.get(d);
  totals.commits += r.commits;
  totals.add += r.add;
  totals.del += r.del;
  totals.endpoints += r.endpoints;
  const mods = [...r.modules].slice(0, 6).join(', ') + (r.modules.size > 6 ? ', …' : '');
  return `| ${d} | ${r.commits} | +${r.add.toLocaleString()} | −${r.del.toLocaleString()} | ${(r.add - r.del).toLocaleString()} | ${r.endpoints} | ${mods || '—'} |`;
});

const out = [
  '# SPRINT_TRACKER.md — Daily Delivery Tracker',
  '',
  '> **Generated file** — `node scripts/sprint-tracker.mjs [days]`. Do not edit by hand.',
  `> Last generated: ${new Date().toISOString()} (window: last ${days} days)`,
  '>',
  '> LOC counts code files only (ts/tsx/js/jsx/prisma/css/scss/mjs, excl. lockfiles/dist).',
  '> "Features" = new API endpoints added to controllers that day (same definition as',
  '> `FEATURE_LEDGER.md`). Regenerated every AUTOPILOT cycle (Step 7).',
  '',
  `## Last ${days} days: **${totals.endpoints} features**, **+${totals.add.toLocaleString()} / −${totals.del.toLocaleString()} LOC** (net ${(totals.add - totals.del).toLocaleString()}) across ${totals.commits} commits`,
  '',
  '| Date | Commits | LOC + | LOC − | Net | Features | Modules touched |',
  '|:--|--:|--:|--:|--:|--:|:--|',
  ...rows,
  '',
];

const outPath = path.join(root, '.ai', 'SPRINT_TRACKER.md');
writeFileSync(outPath, out.join('\n'));
console.log(
  `Wrote ${outPath}: ${dates.length} days, ${totals.endpoints} features, net ${(totals.add - totals.del).toLocaleString()} LOC`,
);
