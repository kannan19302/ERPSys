#!/usr/bin/env node
/**
 * feedback-scan.mjs — Reality-feedback generator for the autonomous dev cycle.
 *
 * Regenerates .ai/FEEDBACK.md from real signals so AUTOPILOT.md P1 (unfinished/
 * broken shipped work) is driven by observed failures, not just repo archaeology:
 *
 *   1. Unresolved runtime errors from the `error_logs` table (grouped by
 *      source+message, with counts and last-seen) — captured by the Admin
 *      error-reporting module from the global exception filter + client
 *      error boundaries.
 *   2. Open admin alerts (`admin_alerts`, unacknowledged).
 *   3. TODO/FIXME/HACK markers in source (top offenders by file).
 *
 * Usage: node scripts/feedback-scan.mjs   (needs DATABASE_URL or dev default)
 * DB signals degrade gracefully if the database is unreachable.
 */
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require_ = createRequire(
  path.join(root, 'packages', 'database', 'package.json'),
);

// Resolve DATABASE_URL: env var > repo .env > docker-compose dev default.
if (!process.env.DATABASE_URL) {
  try {
    const { readFileSync } = await import('node:fs');
    const env = readFileSync(path.join(root, '.env'), 'utf8');
    const m = env.match(/^DATABASE_URL\s*=\s*"?([^"\r\n]+)"?/m);
    if (m) process.env.DATABASE_URL = m[1];
  } catch {
    /* no .env — fall through */
  }
}
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://unerp:unerp_password@localhost:5432/unerp_dev?schema=public';

const lines = [
  '# FEEDBACK.md — Reality signals for the autonomous cycle',
  '',
  '> **Generated file** — `node scripts/feedback-scan.mjs`. Do not edit by hand.',
  `> Last generated: ${new Date().toISOString()}`,
  '>',
  '> Consumed by `.ai/AUTOPILOT.md` Step 1 (P1): unresolved runtime errors and open',
  '> alerts below outrank backlog features. Fix, then mark resolved via the Admin',
  '> error-reports API so they drop out of this file on the next scan.',
  '',
];

let dbOk = false;
try {
  const { PrismaClient } = require_('@prisma/client');
  const prisma = new PrismaClient();

  const errors = await prisma.errorLog.groupBy({
    by: ['source', 'message', 'level'],
    where: { resolved: false },
    _count: { _all: true },
    _max: { createdAt: true },
    orderBy: { _count: { id: 'desc' } },
    take: 25,
  });
  lines.push('## 1. Unresolved runtime errors (error_logs, top 25 by frequency)', '');
  if (errors.length === 0) {
    lines.push('_None — no unresolved runtime errors. ✅_', '');
  } else {
    lines.push('| Count | Level | Source | Message | Last seen |', '|:--|:--|:--|:--|:--|');
    for (const e of errors) {
      const msg = e.message.replace(/\|/g, '\\|').replace(/\s+/g, ' ').slice(0, 140);
      lines.push(
        `| ${e._count._all} | ${e.level} | ${e.source} | ${msg} | ${e._max.createdAt?.toISOString().slice(0, 16) ?? ''} |`,
      );
    }
    lines.push('');
  }

  try {
    const alerts = await prisma.adminAlert.findMany({
      where: { isDismissed: false, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
    lines.push('## 2. Open admin alerts (unread, undismissed)', '');
    if (alerts.length === 0) lines.push('_None. ✅_', '');
    else {
      for (const a of alerts) {
        lines.push(
          `- **${a.severity}/${a.type}** ${a.title.slice(0, 100)} — ${a.message.replace(/\s+/g, ' ').slice(0, 140)} _(${a.createdAt.toISOString().slice(0, 16)})_`,
        );
      }
      lines.push('');
    }
  } catch {
    lines.push('## 2. Open admin alerts', '', '_admin_alerts not queryable with current client — skipped._', '');
  }

  await prisma.$disconnect();
  dbOk = true;
} catch (err) {
  lines.push(
    '## 1–2. Database signals',
    '',
    `_Database unreachable (${String(err.message).trim().split('\n')[0].slice(0, 120)}) — start the dev stack (\`.\\scripts\\docker-start.ps1\`) and re-run for runtime-error signals._`,
    '',
  );
}

// 3. TODO/FIXME/HACK scan
lines.push('## 3. TODO / FIXME / HACK markers in source', '');
try {
  const out = execSync(
    `git grep -nE "\\b(TODO|FIXME|HACK)\\b" -- "apps/*/src" "apps/web/app" "packages/*/src" | head -200`,
    { cwd: root, encoding: 'utf8', shell: 'bash' },
  ).trim();
  if (!out) {
    lines.push('_None. ✅_', '');
  } else {
    const byFile = new Map();
    for (const l of out.split('\n')) {
      const file = l.split(':')[0];
      byFile.set(file, (byFile.get(file) || 0) + 1);
    }
    const total = out.split('\n').length;
    lines.push(`Total markers: **${total}** (top files below — pick the worst file as a P1 candidate)`, '');
    [...byFile.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([f, n]) => lines.push(`- \`${f}\` — ${n}`));
    lines.push('');
  }
} catch {
  lines.push('_None found (or git grep unavailable). ✅_', '');
}

lines.push(
  '---',
  '',
  `_DB signals: ${dbOk ? 'live ✅' : 'unavailable ⚠️ (sections 1–2 stale/empty)'}. Regenerate every AUTOPILOT cycle (Step 0)._`,
  '',
);

const outPath = path.join(root, '.ai', 'FEEDBACK.md');
writeFileSync(outPath, lines.join('\n'));
console.log(`Wrote ${outPath} (db=${dbOk ? 'ok' : 'unavailable'})`);
