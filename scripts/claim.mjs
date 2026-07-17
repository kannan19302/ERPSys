#!/usr/bin/env node
/**
 * claim.mjs — Atomic work-claim locks for parallel agent sessions (ADP).
 *
 * Solves the "two sessions build the same feature" problem: the Collab Board
 * markdown is only visible after commit->push->pull, but sessions sharing one
 * checkout (or lagging on pulls) race past it. This registry uses one small
 * lock file per claimed sub-domain in .ai/locks/ — atomic O_EXCL creation makes
 * it race-proof for every session on the same machine instantly, and committing
 * the lock file makes it visible cross-machine.
 *
 * Usage:
 *   node scripts/claim.mjs acquire <slug> --agent <name> [--scope "<files/desc>"]
 *   node scripts/claim.mjs heartbeat <slug>        # refresh while working (each step)
 *   node scripts/claim.mjs release <slug>          # on cycle end (Step 8)
 *   node scripts/claim.mjs list                    # show all locks + staleness
 *
 * Rules (AUTOPILOT.md § Parallel Agents):
 *   - acquire BEFORE any code; commit+push .ai/locks/<slug>.lock immediately after.
 *   - a lock with heartbeat older than 2h is STALE and may be taken over
 *     (acquire prints the takeover; the previous holder lost the claim).
 *   - exit codes: 0 = ok, 1 = lock held by someone else (pick another sub-domain).
 */
import { mkdirSync, writeFileSync, readFileSync, unlinkSync, readdirSync, openSync, closeSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const locksDir = path.join(root, '.ai', 'locks');
mkdirSync(locksDir, { recursive: true });

const STALE_MS = 2 * 60 * 60 * 1000; // 2 hours without heartbeat = stale

const [, , cmd, slug] = process.argv;
const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};
const lockPath = (s) => path.join(locksDir, `${s.replace(/[^a-z0-9-]/gi, '-')}.lock`);
const readLock = (p) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
};
const age = (iso) => Date.now() - new Date(iso).getTime();
const fmtAge = (ms) => (ms < 3600e3 ? `${Math.round(ms / 60e3)}m` : `${(ms / 3600e3).toFixed(1)}h`);

if (cmd === 'acquire') {
  if (!slug || !arg('agent')) {
    console.error('usage: claim.mjs acquire <slug> --agent <name> [--scope "<desc>"]');
    process.exit(2);
  }
  const p = lockPath(slug);
  const payload = JSON.stringify(
    {
      slug,
      agent: arg('agent'),
      scope: arg('scope') || '',
      acquiredAt: new Date().toISOString(),
      heartbeatAt: new Date().toISOString(),
      pid: process.pid,
    },
    null,
    2,
  );
  try {
    // O_EXCL: atomic — fails if the file exists. This is the actual mutex.
    const fd = openSync(p, 'wx');
    writeFileSync(fd, payload);
    closeSync(fd);
    console.log(`ACQUIRED ${slug} — now commit+push ${path.relative(root, p)} before writing code.`);
    process.exit(0);
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    const cur = readLock(p);
    if (cur && age(cur.heartbeatAt) > STALE_MS) {
      writeFileSync(p, payload);
      console.log(
        `TAKEOVER ${slug} — previous holder "${cur.agent}" stale (${fmtAge(age(cur.heartbeatAt))} since heartbeat). Log it in Collab Board §4. Commit+push the lock.`,
      );
      process.exit(0);
    }
    console.error(
      `HELD ${slug} — by "${cur?.agent}" (${fmtAge(age(cur?.heartbeatAt ?? Date.now()))} ago), scope: ${cur?.scope || '?'}. Pick a different sub-domain.`,
    );
    process.exit(1);
  }
}

if (cmd === 'heartbeat') {
  const p = lockPath(slug || '');
  const cur = readLock(p);
  if (!cur) {
    console.error(`no lock for ${slug}`);
    process.exit(1);
  }
  cur.heartbeatAt = new Date().toISOString();
  writeFileSync(p, JSON.stringify(cur, null, 2));
  console.log(`heartbeat ${slug} ok`);
  process.exit(0);
}

if (cmd === 'release') {
  try {
    unlinkSync(lockPath(slug || ''));
    console.log(`RELEASED ${slug} — commit+push the deletion.`);
  } catch {
    console.log(`no lock for ${slug} (already released)`);
  }
  process.exit(0);
}

if (cmd === 'list') {
  const files = readdirSync(locksDir).filter((f) => f.endsWith('.lock'));
  if (!files.length) console.log('no active locks');
  for (const f of files) {
    const l = readLock(path.join(locksDir, f));
    if (!l) continue;
    const a = age(l.heartbeatAt);
    console.log(
      `${a > STALE_MS ? 'STALE ' : 'ACTIVE'} ${l.slug} — ${l.agent} (heartbeat ${fmtAge(a)} ago) ${l.scope}`,
    );
  }
  process.exit(0);
}

console.error('usage: claim.mjs <acquire|heartbeat|release|list> [slug] [--agent name] [--scope desc]');
process.exit(2);
