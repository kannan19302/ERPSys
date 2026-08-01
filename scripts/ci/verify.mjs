#!/usr/bin/env node
/**
 * The local gate — docs/ai/TRD.md § 8, Layer 2.
 *
 * Runs the SAME gate set as CI, so a green local run means a green pipeline. This is the
 * mechanism behind the deployment contract: "no code with a failing check reaches the remote
 * repository."
 *
 *   pnpm verify            # everything (what pre-push runs)
 *   pnpm verify --fast     # skip tests and builds — for a quick mid-work sanity check
 *   pnpm verify --fix      # auto-fix what is auto-fixable, then verify
 *
 * Gates run cheapest-first so you learn about a failure in seconds, not minutes.
 * A failure stops the run — fix it and re-run rather than wading through cascading noise.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const FAST = args.includes('--fast');
const FIX = args.includes('--fix');

const GATES = [
  {
    name: 'Branch policy',
    why: 'Work lands on main through the pipeline, never by a direct push.',
    run: () => {
      const branch = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
        cwd: ROOT, encoding: 'utf8',
      }).stdout?.trim();
      if (branch === 'main' && process.env.ALLOW_MAIN_PUSH !== '1') {
        return { ok: false, out: `On branch "main". Work on a branch and open a PR.` };
      }
      return { ok: true };
    },
  },
  {
    name: 'Secret scan',
    why: 'A credential in git must be rotated. Prevention is the only cure.',
    cmd: ['node', ['scripts/ci/check-secrets.mjs']],
  },
  {
    name: 'Suppression ratchet',
    why: 'No new @ts-nocheck / @ts-ignore / eslint-disable / any. ARCHITECTURE_REVIEW § R1.',
    cmd: ['node', ['scripts/ci/check-suppressions.mjs']],
  },
  {
    name: 'Policy gate',
    why: 'Raw SQL, Float money, gate bypasses, docs/ai file count, tokens, route guards.',
    cmd: ['node', ['scripts/ci/check-policy.mjs']],
  },
  {
    name: 'Architecture boundaries',
    why: 'No cross-module imports, no dependency cycles.',
    cmd: ['pnpm', ['architecture:check']],
  },
  {
    name: 'Migration discipline',
    why: 'No hand-edited migrations, no db:push, no schema drift.',
    cmd: ['pnpm', ['migration:discipline']],
  },
  {
    name: 'RLS verification',
    why: 'Every tenant table must carry a policy. BACKEND_SCHEMA § 4.4.',
    cmd: ['node', ['scripts/check-rls-verify.mjs']],
    optional: true, // needs a live database; CI runs it as a hard gate
  },
  {
    name: 'Lint',
    why: 'Style and correctness rules.',
    cmd: FIX ? ['pnpm', ['lint', '--fix']] : ['pnpm', ['lint']],
  },
  {
    name: 'Typecheck',
    why: 'The compiler is the cheapest test you will ever run.',
    cmd: ['pnpm', ['typecheck']],
  },
  {
    name: 'Unit tests',
    why: 'Business logic must be proven, not assumed.',
    cmd: ['pnpm', ['test']],
    skipInFast: true,
  },
  {
    name: 'Build',
    why: 'A change that does not build cannot deploy.',
    cmd: ['pnpm', ['build']],
    skipInFast: true,
  },
];

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', red: '\x1b[31m',
  green: '\x1b[32m', yellow: '\x1b[33m', bold: '\x1b[1m',
};

console.log(`\n${C.bold}UniERP verify${C.reset} ${C.dim}— the same gates CI runs${C.reset}`);
if (FAST) console.log(`${C.yellow}  --fast: skipping tests and builds${C.reset}`);
console.log('');

const started = Date.now();
const results = [];

for (const gate of GATES) {
  if (FAST && gate.skipInFast) {
    results.push({ name: gate.name, status: 'skipped' });
    console.log(`${C.dim}  ○ ${gate.name} (skipped)${C.reset}`);
    continue;
  }

  process.stdout.write(`  ⋯ ${gate.name}…`);
  const t0 = Date.now();

  let ok, out;
  if (gate.run) {
    const r = gate.run();
    ok = r.ok;
    out = r.out ?? '';
  } else {
    const [bin, cmdArgs] = gate.cmd;
    const r = spawnSync(bin, cmdArgs, {
      cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32',
    });
    ok = r.status === 0;
    out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  process.stdout.write('\r\x1b[K');

  if (ok) {
    console.log(`${C.green}  ✓${C.reset} ${gate.name} ${C.dim}(${secs}s)${C.reset}`);
    results.push({ name: gate.name, status: 'pass' });
  } else if (gate.optional) {
    console.log(`${C.yellow}  ⚠${C.reset} ${gate.name} ${C.dim}(skipped — ${secs}s)${C.reset}`);
    console.log(`${C.dim}      not runnable locally; CI enforces this as a hard gate${C.reset}`);
    results.push({ name: gate.name, status: 'skipped' });
  } else {
    console.log(`${C.red}  ✗ ${gate.name}${C.reset} ${C.dim}(${secs}s)${C.reset}`);
    console.log(`${C.dim}      ${gate.why}${C.reset}\n`);
    console.log(out.split('\n').slice(-60).join('\n'));
    console.log(`
${C.red}────────────────────────────────────────────────────────────────────${C.reset}
  ${C.bold}BLOCKED at: ${gate.name}${C.reset}

  Fix the cause. Do NOT:
    · add @ts-nocheck / @ts-ignore / eslint-disable
    · add continue-on-error or || true
    · push with --no-verify

  A failing check means the code is wrong, not the check.
  ${C.dim}docs/ai/IMPLEMENTATION_PLAN.md § 11${C.reset}
${C.red}────────────────────────────────────────────────────────────────────${C.reset}
`);
    process.exit(1);
  }
}

const total = ((Date.now() - started) / 1000).toFixed(1);
const passed = results.filter((r) => r.status === 'pass').length;
const skipped = results.filter((r) => r.status === 'skipped').length;

console.log(`
${C.green}${C.bold}  ✓ All gates green${C.reset} ${C.dim}— ${passed} passed, ${skipped} skipped, ${total}s${C.reset}
${C.dim}  Remember: one line in docs/ai/CHANGELOG.md before you commit.${C.reset}
`);
process.exit(0);
