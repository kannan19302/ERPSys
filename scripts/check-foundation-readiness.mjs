#!/usr/bin/env node
// Guards the documentation contract: the .ai knowledge base stays exactly four
// files, the two ADP flows exist, and every agent entry point carries the
// architecture-foundation policies. Run via `pnpm foundation:check`.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseReady = process.argv.includes('--release-ready');
const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!existsSync(absolutePath)) {
    failures.push(`Missing required file: ${relativePath}`);
    return '';
  }
  return readFileSync(absolutePath, 'utf8');
}

function requireText(relativePath, text) {
  if (!read(relativePath).includes(text)) {
    failures.push(`${relativePath} must reference ${text}`);
  }
}

// The foundation document keeps its remediation designs until the blockers close.
const foundation = read('docs/ARCHITECTURE_FOUNDATION.md');
for (const heading of [
  '## #17 transactional outbox design',
  '### #19 reconciliation plan and controlled exception',
  '## #21 transaction-scoped RLS design',
]) {
  if (!foundation.includes(heading)) failures.push(`Foundation document is missing ${heading}`);
}

// The .ai knowledge base is exactly four markdown files (+ locks/ runtime dir).
const allowedAiFiles = new Set(['AUTOPILOT.md', 'CHANGELOG.md', 'HANDBOOK.md', 'MODULE_REGISTRY.md', 'instructions.md', 'MARKET_BENCHMARK.md']);
const generatedAiFiles = new Set(['FEATURE_LEDGER.md']); // gitignored generator output
for (const entry of readdirSync(path.join(root, '.ai'), { withFileTypes: true })) {
  if (entry.isDirectory()) {
    if (entry.name !== 'locks') failures.push(`.ai/ contains unexpected directory: ${entry.name}`);
    continue;
  }
  if (!allowedAiFiles.has(entry.name) && !generatedAiFiles.has(entry.name)) {
    failures.push(`.ai/ contains unexpected file: ${entry.name} (the knowledge base is exactly ${[...allowedAiFiles].join(', ')})`);
  }
}
for (const file of allowedAiFiles) read(path.join('.ai', file));

// Exactly two ADP flows: start (DEV) and harden (QA).
const skillsDir = path.join(root, '.claude', 'skills');
const skills = readdirSync(skillsDir).sort();
if (skills.join(',') !== 'harden,start') {
  failures.push(`.claude/skills must contain exactly [harden, start], found [${skills.join(', ')}]`);
}
requireText('.claude/skills/start/SKILL.md', 'AUTOPILOT.md');
requireText('.claude/skills/harden/SKILL.md', 'AUTOPILOT.md');

// Every agent entry point must carry the architecture-foundation policy.
for (const relativePath of [
  'AGENTS.md',
  'CLAUDE.md',
  '.ai/AUTOPILOT.md',
  '.ai/HANDBOOK.md',
  '.github/copilot-instructions.md',
  '.claude/agents/README.md',
]) {
  requireText(relativePath, 'ARCHITECTURE_FOUNDATION');
}
for (const file of readdirSync(path.join(root, '.claude', 'agents'))) {
  if (!file.endsWith('.md') || file === 'README.md') continue;
  requireText(path.join('.claude', 'agents', file), 'ARCHITECTURE_FOUNDATION');
}

const packageJson = JSON.parse(read('package.json'));
for (const script of ['architecture:check', 'migration:discipline', 'migration:reconciliation:report']) {
  if (!packageJson.scripts?.[script]) failures.push(`package.json is missing ${script}`);
}

if (releaseReady && /#17.*transactional outbox[\s\S]*#19.*reconciliation[\s\S]*#21.*RLS/i.test(foundation)) {
  failures.push('Release readiness is blocked: architecture foundation issues #17/#19/#21 remain open.');
}

if (failures.length > 0) {
  console.error('Foundation readiness check failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Foundation readiness documentation and guard references are synchronized.');
