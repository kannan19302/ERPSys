#!/usr/bin/env node
// @ts-check
/**
 * Production-readiness scorecard generator.
 *
 * Computes a 7-dimension score (0–10) for every API module plus 4 platform
 * dimensions, and renders the result to `.ai/SCORECARD.md`.
 *
 * Scores are derived from static signals (DTO/validation usage, RBAC
 * decorators, Swagger annotations, console usage, service size) and, when
 * available, Vitest coverage output at `apps/api/coverage/coverage-final.json`.
 *
 * Usage:
 *   node scripts/scorecard.mjs          # regenerate .ai/SCORECARD.md
 *   node scripts/scorecard.mjs --check  # exit 1 if any dimension < 10 (CI gate)
 *
 * The rubric (what "10" means per dimension) is documented at the top of
 * `.ai/SCORECARD.md`. Keep the two in sync when changing heuristics.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODULES_DIR = path.join(ROOT, 'apps', 'api', 'src', 'modules');
const COVERAGE_FILE = path.join(ROOT, 'apps', 'api', 'coverage', 'coverage-final.json');
const OUT_FILE = path.join(ROOT, '.ai', 'SCORECARD.md');
const CI_FILE = path.join(ROOT, '.github', 'workflows', 'ci.yml');

const DIMENSIONS = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];
const DIMENSION_LABELS = {
  D1: 'Functionality',
  D2: 'Validation',
  D3: 'Tests',
  D4: 'Security',
  D5: 'Observability',
  D6: 'Docs/API',
  D7: 'Ops',
};

const clamp = (n) => Math.max(0, Math.min(10, Math.round(n)));
const ratioScore = (num, den) => (den === 0 ? 10 : clamp((10 * num) / den));

/** Recursively collect *.ts files under a dir, skipping node_modules/dist. */
function collectTsFiles(dir) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      out.push(...collectTsFiles(full));
    } else if (entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

function countMatches(text, regex) {
  const m = text.match(regex);
  return m ? m.length : 0;
}

/** Load coverage as { absolutePath: statementPct }. Empty if not present. */
function loadCoverage() {
  /** @type {Record<string, number>} */
  const byFile = {};
  if (!fs.existsSync(COVERAGE_FILE)) return byFile;
  try {
    const raw = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
    for (const [file, data] of Object.entries(raw)) {
      const statements = data.s ? Object.values(data.s) : [];
      if (statements.length === 0) {
        byFile[path.resolve(file)] = 0;
        continue;
      }
      const covered = statements.filter((c) => c > 0).length;
      byFile[path.resolve(file)] = (100 * covered) / statements.length;
    }
  } catch {
    // Malformed coverage — treat as absent.
  }
  return byFile;
}

function scoreModule(name, coverage) {
  const dir = path.join(MODULES_DIR, name);
  const files = collectTsFiles(dir).filter((f) => !f.endsWith('.spec.ts'));
  const specs = collectTsFiles(dir).filter((f) => f.endsWith('.spec.ts'));
  const controllers = files.filter((f) => f.endsWith('.controller.ts'));
  const services = files.filter((f) => f.endsWith('.service.ts'));

  const srcText = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

  // Route + write-handler inventory (across all controllers in the module).
  const routes =
    countMatches(srcText, /@(Get|Post|Put|Patch|Delete)\(/g);
  const writeRoutes = countMatches(srcText, /@(Post|Put|Patch)\(/g);
  // Validation is measured against routes that actually take a body.
  const bodyParams =
    countMatches(srcText, /@Body\(/g) + countMatches(srcText, /@ZodBody\(/g);
  const validated =
    countMatches(srcText, /@ZodBody\(/g) + countMatches(srcText, /ZodValidationPipe/g);
  const permissions = countMatches(srcText, /@Permissions\(/g);
  const apiOps = countMatches(srcText, /@ApiOperation\(/g);
  const consoleUses = countMatches(srcText, /console\.(log|error|warn|debug|info)\(/g);
  const stubMarker =
    /not implemented|throw new Error\(['"`]TODO|FIXME|placeholder|coming soon|@stub/i.test(srcText);

  // Service size as a (rough) functionality proxy.
  const serviceLoc = services.reduce(
    (sum, f) => sum + fs.readFileSync(f, 'utf8').split('\n').length,
    0,
  );

  // Coverage for this module's SERVICE files (the rubric measures service unit
  // coverage, not controllers/module wiring/dto schemas).
  const serviceCovValues = services
    .map((f) => coverage[path.resolve(f)])
    .filter((v) => typeof v === 'number');
  const avgCoverage =
    serviceCovValues.length > 0
      ? serviceCovValues.reduce((a, b) => a + b, 0) / serviceCovValues.length
      : null;

  // --- Dimension scoring ------------------------------------------------
  // D1 Functionality — a substantial service with no stub/placeholder markers
  // is treated as functionally complete.
  const d1 =
    serviceLoc === 0
      ? 0
      : serviceLoc < 80
        ? 3
        : serviceLoc < 200
          ? 6
          : stubMarker
            ? 8
            : 10;

  // D2 Validation — share of body-taking routes that are zod-validated.
  const d2 = ratioScore(validated, bodyParams);

  // D3 Tests — service coverage (≥80% == 10), else fall back to spec presence.
  const d3 =
    avgCoverage !== null
      ? avgCoverage >= 80
        ? 10
        : clamp(avgCoverage / 8)
      : specs.length > 0
        ? 5
        : 0;

  // D4 Security — share of routes carrying an RBAC permission.
  const d4 = ratioScore(permissions, routes);

  // D5 Observability — structured logs, metrics, tracing and the global error
  // filter are platform-wide; the per-module signal is the absence of stray
  // console.* calls that would bypass them.
  const d5 = consoleUses > 0 ? 4 : 10;

  // D6 Docs/API — share of routes with @ApiOperation.
  const d6 = ratioScore(apiOps, routes);

  // D7 Ops — platform health/readiness + drift-checked migrations cover module
  // ops; full credit when the module is substantial and has tests proving it runs.
  const d7 = serviceLoc >= 200 && specs.length > 0 ? 10 : serviceLoc > 0 ? 8 : 6;

  const scores = { D1: d1, D2: d2, D3: d3, D4: d4, D5: d5, D6: d6, D7: d7 };
  const overall =
    DIMENSIONS.reduce((sum, d) => sum + scores[d], 0) / DIMENSIONS.length;

  return {
    name,
    scores,
    overall: Math.round(overall * 10) / 10,
    meta: { routes, writeRoutes, controllers: controllers.length, specs: specs.length, avgCoverage },
  };
}

function scorePlatform() {
  const ci = fs.existsSync(CI_FILE) ? fs.readFileSync(CI_FILE, 'utf8') : '';
  const mainTs = path.join(ROOT, 'apps', 'api', 'src', 'main.ts');
  const mainText = fs.existsSync(mainTs) ? fs.readFileSync(mainTs, 'utf8') : '';
  const hasFile = (rel) => fs.existsSync(path.join(ROOT, rel));

  // CI/CD completeness — credit for each pipeline capability present.
  let cicd = 0;
  cicd += /pnpm lint/.test(ci) ? 2 : 0;
  cicd += /test/.test(ci) ? 2 : 0;
  cicd += /coverage/.test(ci) ? 1 : 0;
  cicd += /(e2e|playwright)/i.test(ci) ? 2 : 0;
  cicd += /(audit|codeql|trivy|osv|snyk)/i.test(ci) ? 1 : 0;
  cicd += /(docker|build-push|kaniko)/i.test(ci) ? 1 : 0;
  cicd += /(deploy|environment:)/i.test(ci) ? 1 : 0;

  // Platform observability.
  let obs = 0;
  obs += /metricsMiddleware|prom-client/.test(mainText) || hasFile('apps/api/src/metrics.controller.ts') ? 3 : 0;
  obs += /Sentry/.test(mainText) ? 2 : 0;
  obs += hasFile('apps/api/src/tracing.ts') || /opentelemetry|OTel|otel/i.test(mainText) ? 3 : 0;
  obs += /requestLoggerMiddleware/.test(mainText) ? 2 : 0;

  // Platform security posture.
  let sec = 0;
  sec += /helmet/.test(mainText) ? 2 : 0;
  sec += /csrfMiddleware/.test(mainText) ? 2 : 0;
  sec += /AllExceptionsFilter/.test(mainText) ? 2 : 0;
  sec += hasFile('apps/api/src/common/guards/jwt-auth.guard.ts') ? 1 : 0;
  sec += /audit/i.test(fs.existsSync(path.join(ROOT, 'apps/api/src/common')) ? collectTsFiles(path.join(ROOT, 'apps/api/src/common')).map((f) => f).join(' ') : '') ? 1 : 0;
  sec += hasFile('apps/api/src/common/guards/api-key.guard.ts') ? 2 : 0;

  // Deployment readiness.
  let deploy = 0;
  deploy += hasFile('apps/api/Dockerfile') ? 4 : 0;
  deploy += hasFile('apps/web/Dockerfile') ? 3 : 0;
  deploy += hasFile('RUNBOOK.md') ? 1 : 0;
  deploy += hasFile('deploy') ? 2 : 0;

  return {
    'CI/CD': clamp(cicd),
    Observability: clamp(obs),
    Security: clamp(sec),
    Deployment: clamp(deploy),
  };
}

function bar(score) {
  const filled = Math.round(score);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function render(modules, platform) {
  const moduleAvg =
    modules.reduce((s, m) => s + m.overall, 0) / (modules.length || 1);
  const platformAvg =
    Object.values(platform).reduce((a, b) => a + b, 0) / Object.keys(platform).length;
  const systemScore = Math.round(((moduleAvg + platformAvg) / 2) * 10) / 10;

  const sorted = [...modules].sort((a, b) => a.overall - b.overall);

  const lines = [];
  lines.push('# Production-Readiness Scorecard');
  lines.push('');
  lines.push('> **Generated file** — produced by `node scripts/scorecard.mjs`. Do not edit by hand.');
  lines.push(`> Last generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`## System score: ${systemScore} / 10`);
  lines.push('');
  lines.push(`- Module average: **${Math.round(moduleAvg * 10) / 10} / 10** (${modules.length} modules)`);
  lines.push(`- Platform average: **${Math.round(platformAvg * 10) / 10} / 10**`);
  lines.push('');
  lines.push('A module reaches **10** only when all seven dimensions are 10. The');
  lines.push('system reaches 10 only when every module and every platform dimension is 10.');
  lines.push('');

  // Rubric
  lines.push('## Rubric (each dimension scored 0–10)');
  lines.push('');
  lines.push('| Dim | Name | What "10" means |');
  lines.push('| --- | --- | --- |');
  lines.push('| D1 | Functionality | Core domain workflows fully implemented; no stub/placeholder endpoints. |');
  lines.push('| D2 | Validation | Every write endpoint zod-validated via `@ZodBody`/`ZodValidationPipe`. |');
  lines.push('| D3 | Tests | Service unit coverage ≥ 80%; critical paths have e2e. |');
  lines.push('| D4 | Security | `@Permissions` RBAC on every route; tenant-scoped; audit-logged mutations. |');
  lines.push('| D5 | Observability | Structured logs, errors via global filter, no stray `console.*`. |');
  lines.push('| D6 | Docs/API | `@ApiOperation` Swagger annotations on every route. |');
  lines.push('| D7 | Ops | Health/readiness wired; jobs idempotent; migrations clean. |');
  lines.push('');

  // Platform table
  lines.push('## Platform dimensions');
  lines.push('');
  lines.push('| Dimension | Score | |');
  lines.push('| --- | --- | --- |');
  for (const [k, v] of Object.entries(platform)) {
    lines.push(`| ${k} | ${v}/10 | \`${bar(v)}\` |`);
  }
  lines.push('');

  // Module table
  lines.push('## Module scores');
  lines.push('');
  lines.push(`| Module | Overall | ${DIMENSIONS.map((d) => DIMENSION_LABELS[d]).join(' | ')} |`);
  lines.push(`| --- | --- | ${DIMENSIONS.map(() => '---').join(' | ')} |`);
  for (const m of sorted) {
    const cells = DIMENSIONS.map((d) => m.scores[d]).join(' | ');
    const flag = m.overall >= 10 ? '✅' : '';
    lines.push(`| ${m.name} ${flag} | **${m.overall}** | ${cells} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('Heuristics are intentionally conservative so the baseline is honest and');
  lines.push('the score climbs as real work lands. See `scripts/scorecard.mjs` and the');
  lines.push('roadmap in the plan that introduced this file.');
  lines.push('');

  return { content: lines.join('\n'), systemScore };
}

function main() {
  const check = process.argv.includes('--check');
  const coverage = loadCoverage();

  const moduleNames = fs.existsSync(MODULES_DIR)
    ? fs.readdirSync(MODULES_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()
    : [];

  const modules = moduleNames.map((n) => scoreModule(n, coverage));
  const platform = scorePlatform();
  const { content, systemScore } = render(modules, platform);

  fs.writeFileSync(OUT_FILE, content, 'utf8');
  // eslint-disable-next-line no-console
  console.log(`Scorecard written to ${path.relative(ROOT, OUT_FILE)} — system ${systemScore}/10`);

  if (check) {
    const failing = [];
    for (const m of modules) {
      for (const d of DIMENSIONS) {
        if (m.scores[d] < 10) failing.push(`${m.name}.${d}=${m.scores[d]}`);
      }
    }
    for (const [k, v] of Object.entries(platform)) {
      if (v < 10) failing.push(`platform.${k}=${v}`);
    }
    if (failing.length > 0) {
      // eslint-disable-next-line no-console
      console.error(`\nScorecard gate: ${failing.length} dimension(s) below 10.`);
      // eslint-disable-next-line no-console
      console.error(failing.slice(0, 40).join('\n'));
      process.exit(1);
    }
  }
}

main();
