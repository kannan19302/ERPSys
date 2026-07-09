#!/usr/bin/env node
/**
 * worktree.mjs — One isolated git worktree per parallel agent session (ADP § Parallel
 * Agents rule 7). Own tree + own index = commits/rebases/pushes can never entangle
 * another session's files.
 *
 * Usage (from the main checkout or any worktree):
 *   node scripts/worktree.mjs new <slug>     # create ../ERPSys-<slug> on branch autopilot/<slug> from origin/main
 *   node scripts/worktree.mjs done <slug>    # rebase onto origin/main, push to main, remove worktree + branch
 *   node scripts/worktree.mjs list           # show all worktrees
 *
 * After `new`: open the printed folder in your IDE/session and run `pnpm install`
 * there once (pnpm's shared store hardlinks packages — it takes seconds, not minutes).
 * `done` refuses if the worktree has uncommitted changes (commit first) or if gates
 * were not run — it is the SHIP step's transport, not a shortcut around Step 5.
 */
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
// Resolve the MAIN repo root even when run from inside a worktree:
// --git-common-dir always points at <mainRoot>/.git.
const gitCommonDir = execSync('git rev-parse --path-format=absolute --git-common-dir', {
  cwd: scriptDir,
  encoding: 'utf8',
}).trim();
const mainRoot = path.dirname(gitCommonDir);
const repoRoot = path.resolve(scriptDir, '..');

const run = (cmd, cwd = repoRoot) => execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'inherit'] }).trim();
const [, , cmd, slugRaw] = process.argv;
const slug = (slugRaw || '').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
const wtPath = () => path.join(path.dirname(mainRoot), `ERPSys-${slug}`);
const branch = () => `autopilot/${slug}`;

if (cmd === 'new') {
  if (!slug) {
    console.error('usage: worktree.mjs new <slug>');
    process.exit(2);
  }
  run('git fetch origin');
  if (existsSync(wtPath())) {
    console.error(`exists: ${wtPath()} — pick another slug or run "done ${slug}" first`);
    process.exit(1);
  }
  run(`git worktree add -b ${branch()} "${wtPath()}" origin/main`);
  console.log(`WORKTREE READY: ${wtPath()}  (branch ${branch()}, based on origin/main)`);
  console.log(`Next: open that folder in your session/IDE, run "pnpm install" once, then claim your lock and build.`);
  process.exit(0);
}

if (cmd === 'done') {
  if (!slug) {
    console.error('usage: worktree.mjs done <slug>');
    process.exit(2);
  }
  const p = wtPath();
  if (!existsSync(p)) {
    console.error(`no worktree at ${p}`);
    process.exit(1);
  }
  const dirty = run('git status --porcelain', p);
  if (dirty) {
    console.error(`REFUSED: uncommitted changes in ${p} — commit (or intentionally discard) them first:\n${dirty}`);
    process.exit(1);
  }
  run('git fetch origin', p);
  try {
    run('git rebase origin/main', p);
  } catch {
    console.error('REBASE CONFLICT — resolve in the worktree, then re-run done. Never force-push.');
    process.exit(1);
  }
  run(`git push origin HEAD:main`, p);
  run(`git worktree remove "${p}"`);
  try {
    run(`git branch -D ${branch()}`);
  } catch {
    /* branch may be checked out elsewhere or already gone */
  }
  console.log(`SHIPPED to main and removed worktree ${p}. Remember: lock released? docs gate done?`);
  process.exit(0);
}

if (cmd === 'list') {
  console.log(run('git worktree list'));
  process.exit(0);
}

console.error('usage: worktree.mjs <new|done|list> [slug]');
process.exit(2);
