#!/usr/bin/env node
/**
 * feature-ledger.mjs — Generates .ai/FEATURE_LEDGER.md: the single-file inventory
 * of every functionality in the entire ERP system.
 *
 * Scans every NestJS controller under apps/api/src/modules/, extracting each
 * endpoint (method + path + @ApiOperation summary + permission). Because it reads
 * the code itself, it always reflects existing AND newly shipped functionality —
 * regenerate after every change (AUTOPILOT.md Step 7 mandates it):
 *
 *   node scripts/feature-ledger.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const modulesDir = path.join(root, 'apps', 'api', 'src', 'modules');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (name.endsWith('.controller.ts')) yield p;
  }
}

const HTTP = ['Get', 'Post', 'Put', 'Patch', 'Delete'];
const modules = {};

for (const moduleName of readdirSync(modulesDir).sort()) {
  const moduleDir = path.join(modulesDir, moduleName);
  if (!statSync(moduleDir).isDirectory()) continue;
  const features = [];

  for (const file of walk(moduleDir)) {
    const src = readFileSync(file, 'utf8');
    const baseMatch = src.match(/@Controller\(\s*['"`]([^'"`]*)['"`]/);
    const base = baseMatch ? baseMatch[1] : '';
    const lines = src.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(
        new RegExp(`@(${HTTP.join('|')})\\(\\s*(?:['"\`]([^'"\`]*)['"\`])?\\s*\\)`),
      );
      if (!m) continue;
      const method = m[1].toUpperCase();
      const sub = m[2] || '';
      // Look up to 6 lines back for @ApiOperation summary and @Permissions.
      let summary = '';
      let permission = '';
      for (let j = Math.max(0, i - 6); j <= Math.min(lines.length - 1, i + 6); j++) {
        const s = lines[j].match(/@ApiOperation\(\s*{\s*summary:\s*['"`]([^'"`]+)['"`]/);
        if (s && !summary && Math.abs(j - i) <= 6) summary = s[1];
        const p = lines[j].match(/@Permissions\(\s*['"`]([^'"`]+)['"`]/);
        if (p && !permission) permission = p[1];
        // stop scanning forward once we hit the method body
        if (j > i && /\)\s*{/.test(lines[j])) break;
      }
      const route = `/${[base, sub].filter(Boolean).join('/')}`.replace(/\/+/g, '/');
      features.push({ method, route, summary, permission });
    }
  }
  if (features.length) modules[moduleName] = features;
}

const now = new Date().toISOString();
const moduleNames = Object.keys(modules);
const total = moduleNames.reduce((s, m) => s + modules[m].length, 0);

const out = [
  '# FEATURE_LEDGER.md — Every Functionality in UniERP (single file, whole system)',
  '',
  '> **Generated file** — `node scripts/feature-ledger.mjs`. Do not edit by hand.',
  `> Last generated: ${now}`,
  '>',
  '> One row per API-backed functionality (method + route + summary + permission),',
  '> scanned directly from every controller — so it always reflects existing **and**',
  '> newly shipped features. `AUTOPILOT.md` Step 7 mandates regenerating this file in',
  '> every cycle that ships code; agents use it to answer "does X already exist?"',
  '> before building anything.',
  '',
  `## System total: **${total} features** across ${moduleNames.length} modules`,
  '',
  '| Module | Features |',
  '|:--|--:|',
  ...moduleNames.map((m) => `| [${m}](#${m.replace(/[^a-z0-9-]/g, '')}) | ${modules[m].length} |`),
  '',
];

for (const m of moduleNames) {
  out.push(`## ${m}`, '', `${modules[m].length} features`, '', '| Method | Route | Functionality | Permission |', '|:--|:--|:--|:--|');
  for (const f of modules[m]) {
    out.push(
      `| ${f.method} | \`${f.route}\` | ${(f.summary || '—').replace(/\|/g, '\\|')} | ${f.permission ? `\`${f.permission}\`` : '—'} |`,
    );
  }
  out.push('');
}

const outPath = path.join(root, '.ai', 'FEATURE_LEDGER.md');
writeFileSync(outPath, out.join('\n'));
console.log(`Wrote ${outPath}: ${total} features across ${moduleNames.length} modules`);
