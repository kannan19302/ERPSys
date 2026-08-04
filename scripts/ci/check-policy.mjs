#!/usr/bin/env node
/**
 * Policy gate — mechanically enforces the rules the master docs declare.
 *
 * Split into two tiers:
 *
 *   HARD    Always fails the build. Zero tolerance, no baseline, no grandfathering.
 *           These are correctness and security rules where an existing violation would
 *           itself be a P0 — so if any exist, we want the build red today.
 *
 *   RATCHET Counted against .quality-policy-baseline.json. Existing violations are
 *           grandfathered; any INCREASE fails. Used where the debt is large enough that
 *           a hard gate would block all work.
 *
 *   node scripts/ci/check-policy.mjs            # verify
 *   node scripts/ci/check-policy.mjs --update   # ratchet baselines DOWN
 *   node scripts/ci/check-policy.mjs --report   # list actual violations with file:line
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const BASELINE_PATH = join(ROOT, ".quality-policy-baseline.json");
const SKIP = new Set([
  "node_modules",
  "dist",
  ".next",
  ".turbo",
  "coverage",
  "build",
  ".git",
  "generated",
  "storybook-static",
  "migrations",
]);

function walk(dir, exts, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) walk(full, exts, out);
    else if (exts.some((x) => e.name.endsWith(x))) out.push(full);
  }
  return out;
}

const files = (dir, exts) =>
  existsSync(join(ROOT, dir)) ? walk(join(ROOT, dir), exts) : [];
const read = (f) => {
  try {
    return readFileSync(f, "utf8");
  } catch {
    return "";
  }
};

/* ── HARD rules ─────────────────────────────────────────────────────────── */

const HARD = [
  {
    id: "suppression-injector",
    label: "Committed tool that injects @ts-nocheck across the tree",
    why:
      "ARCHITECTURE_REVIEW F1 traces 3,241 suppressed files to exactly such a script. R5 " +
      "deleted the root copy; copies then reappeared under apps/api, apps/idp and apps/web " +
      "and re-suppressed four core services. A committed tool whose only purpose is to " +
      "defeat the type checker will be run again.",
    scan() {
      const hits = [];
      for (const f of [
        ...files("apps", [".js", ".mjs", ".cjs", ".ts"]),
        ...files("scripts", [".js", ".mjs", ".cjs"]),
      ]) {
        const rel = relative(ROOT, f);
        // The gate and its own documentation are allowed to name the pattern.
        if (
          rel.includes(`ci${"/"}check-policy`) ||
          rel.includes(`ci\\check-policy`)
        )
          continue;
        const src = read(f);
        // A file that WRITES `@ts-nocheck` into other files, rather than merely mentioning it.
        if (
          /writeFileSync\([^)]*@ts-nocheck|['"`]\/\/ @ts-nocheck\\n['"`]\s*\+/.test(
            src,
          )
        ) {
          hits.push(`${rel}  writes "@ts-nocheck" into source files`);
        }
      }
      return hits;
    },
  },
  {
    id: "control-plane-seeded-to-tenant",
    label: "Control-plane permission granted by a seeded tenant role",
    why:
      "Tenant roles must never carry system.*/platform.* grants. A tenant role that does " +
      "hands every customer administrator platform-global authority — this was a real, " +
      "confirmed escalation (PLATFORM_ARCHITECTURE § 1.2), not a hypothetical.",
    scan() {
      const hits = [];
      // The auth service moved to apps/idp in the platform split. This list
      // still named the old apps/api path, and `read()` returns null for a
      // missing file, so the gate silently stopped checking it — a control
      // that quietly covers less than it claims is worse than no control.
      // Missing targets are now reported rather than skipped.
      const targets = [
        join(ROOT, "packages/database/prisma/seed.ts"),
        join(ROOT, "apps/idp/src/modules/auth/auth.service.ts"),
      ];
      for (const f of targets) {
        const src = read(f);
        if (!src) {
          hits.push(
            `${relative(ROOT, f)}  MISSING — this gate cannot check a file that is not there; ` +
              "update the target list if the file moved.",
          );
          continue;
        }
        // Only look inside role-definition blocks: `permissions: [ ... ]`.
        for (const m of src.matchAll(/permissions:\s*\[([^\]]*)\]/g)) {
          for (const g of m[1].matchAll(/["'`]([^"'`]+)["'`]/g)) {
            const grant = g[1];
            if (/^(system|platform)(\.|$)/.test(grant)) {
              const line = src.slice(0, m.index + g.index).split("\n").length;
              hits.push(
                `${relative(ROOT, f)}:${line}  seeds "${grant}" into a tenant role`,
              );
            }
          }
        }
      }
      return hits;
    },
  },
  {
    id: "control-plane-grant-outside-reserved-tenant",
    label:
      "Control-plane grant provisioned outside the reserved platform tenant",
    why:
      "system.*/platform.* may only be granted by the control-plane provisioner, and only " +
      "under the reserved platform tenant. Any other file creating a role with those grants " +
      "is re-opening the § 1.2 escalation by another route.",
    scan() {
      const hits = [];
      const PROVISIONER = "packages/database/prisma/seed-platform.ts";
      for (const f of [
        ...files("packages/database/prisma", [".ts"]),
        ...files("apps/idp/src", [".ts"]),
        ...files("apps/api/src", [".ts"]),
      ]) {
        const rel = relative(ROOT, f).replace(/\\/g, "/");
        if (rel === PROVISIONER) continue;
        if (rel.includes(".spec.") || rel.includes("/tests/")) continue;
        const src = read(f);
        if (!src) continue;
        for (const m of src.matchAll(
          /permissions:\s*(?:JSON\.stringify\()?\s*\[([^\]]*)\]/g,
        )) {
          for (const g of m[1].matchAll(/["'`]([^"'`]+)["'`]/g)) {
            if (!/^(system|platform)(\.|$)/.test(g[1])) continue;
            const line = src.slice(0, m.index + g.index).split("\n").length;
            hits.push(
              `${rel}:${line}  grants "${g[1]}" outside ${PROVISIONER}`,
            );
          }
        }
      }
      return hits;
    },
  },
  {
    id: "cross-tenant-tenant-scoped-permission",
    label: "@SkipTenantScope() handler guarded by a tenant-scoped permission",
    why:
      "A cross-tenant handler authorised by a tenant-namespace code lets tenant authority " +
      "act platform-wide. This is exactly how any customer admin could suspend, export or " +
      "offboard any other tenant via TenantLifecycleController.",
    scan() {
      const hits = [];
      for (const f of files("apps/api/src", [".controller.ts"])) {
        const src = read(f);
        if (!src.includes("@SkipTenantScope()")) continue;
        const lines = src.split("\n");
        // Class-level @SkipTenantScope applies to every route in the file.
        const classLevel =
          /@Controller\([^)]*\)[\s\S]{0,400}?@SkipTenantScope\(\)/.test(src);
        lines.forEach((line, i) => {
          const m = line.match(/@Permissions\(\s*["']([^"']+)["']/);
          if (!m) return;
          const inScope =
            classLevel ||
            lines
              .slice(Math.max(0, i - 8), i + 8)
              .some((l) => l.includes("@SkipTenantScope()"));
          if (!inScope) return;
          if (!/^(system|platform)(\.|$)/.test(m[1])) {
            hits.push(
              `${relative(ROOT, f)}:${i + 1}  cross-tenant route guarded by "${m[1]}"`,
            );
          }
        });
      }
      return hits;
    },
  },
  {
    id: "ci-bypass",
    label:
      "Gate bypass in CI or git hooks (continue-on-error / --no-verify / || true)",
    why: "A gate that cannot fail is worse than no gate — it manufactures false confidence.",
    scan() {
      const hits = [];
      const targets = [
        ...files(".github/workflows", [".yml", ".yaml"]),
        ...files(".husky", ["", ".sh"]).filter(
          (f) => !f.includes(`.husky${"/"}_`),
        ),
      ];
      for (const f of targets) {
        read(f)
          .split("\n")
          .forEach((line, i) => {
            if (/^\s*#/.test(line)) return; // comments are allowed to mention it
            if (
              /continue-on-error:\s*true|--no-verify|\|\|\s*true\b/.test(line)
            ) {
              hits.push(`${relative(ROOT, f)}:${i + 1}  ${line.trim()}`);
            }
          });
      }
      return hits;
    },
  },
  {
    id: "committed-secret",
    label: "Credential-shaped literal committed to the repository",
    why: "A secret in git is a secret that must be rotated. Prevention is the only cure.",
    scan() {
      const hits = [];
      const patterns = [
        /['"](sk_live_|rk_live_|pk_live_)[A-Za-z0-9]{16,}['"]/,
        /['"]gh[pousr]_[A-Za-z0-9]{30,}['"]/,
        /['"]AKIA[0-9A-Z]{16}['"]/,
        /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/,
        /['"]eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}['"]/,
      ];
      const targets = [
        ...files("apps", [".ts", ".tsx", ".json", ".yml", ".yaml"]),
        ...files("packages", [".ts", ".tsx", ".json"]),
        ...files("scripts", [".mjs", ".js", ".ts", ".json"]),
        ...files(".github", [".yml", ".yaml"]),
      ];
      for (const f of targets) {
        const rel = relative(ROOT, f);
        if (/\.example$|fixtures?\//.test(rel)) continue;
        read(f)
          .split("\n")
          .forEach((line, i) => {
            if (patterns.some((p) => p.test(line)))
              hits.push(`${rel}:${i + 1}`);
          });
      }
      return hits;
    },
  },
  {
    id: "docs-ai-extra-files",
    label: "Unauthorised file in docs/ai/",
    why: "docs/ai/ holds exactly ten files. Sidecar documents fragment the source of truth. (README.md rule 1)",
    scan() {
      const allowed = new Set([
        "README.md",
        "PRD.md",
        "TRD.md",
        "APP_FLOW.md",
        "UI_UX_BRIEF.md",
        "BACKEND_SCHEMA.md",
        "IMPLEMENTATION_PLAN.md",
        "ARCHITECTURE_REVIEW.md",
        "CODE_STANDARDS.md",
        "CHANGELOG.md",
      ]);
      const dir = join(ROOT, "docs", "ai");
      if (!existsSync(dir)) return [];
      return readdirSync(dir)
        .filter((n) => !allowed.has(n))
        .map(
          (n) =>
            `docs/ai/${n}  ← delete it, or fold its content into one of the ten master files`,
        );
    },
  },
  {
    id: "auth-math-random",
    label: "Math.random() used in auth module",
    why: "Math.random() is not cryptographically secure and allows predictability of OTPs. Use node:crypto randomInt instead.",
    scan() {
      const hits = [];
      for (const f of files("apps/api/src/modules/auth", [".ts"])) {
        read(f)
          .split("\n")
          .forEach((line, i) => {
            if (/Math\.random\s*\(/.test(line))
              hits.push(`${relative(ROOT, f)}:${i + 1}`);
          });
      }
      return hits;
    },
  },
];

/* ── RATCHET rules ──────────────────────────────────────────────────────── */

const RATCHET = [
  {
    id: "rawSql",
    mustReachZero: true,
    label: "Unsafe raw SQL ($queryRawUnsafe / $executeRawUnsafe)",
    why: "SQL injection surface, and it bypasses the RLS-scoped transaction client — these queries may not be tenant-isolated at all. ARCHITECTURE_REVIEW § F12 / R12.",
    scan() {
      const hits = [];
      for (const f of files("apps/api/src", [".ts"])) {
        read(f)
          .split("\n")
          .forEach((line, i) => {
            if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // comment lines aren't call sites
            if (/\$(query|execute)RawUnsafe/.test(line)) {
              hits.push(`${relative(ROOT, f)}:${i + 1}`);
            }
          });
      }
      return hits;
    },
  },
  {
    id: "floatMoney",
    mustReachZero: true,
    label: "Float used for a monetary field in the Prisma schema",
    why: "Floating point silently corrupts financial totals. Use Decimal(19,4). ARCHITECTURE_REVIEW § F11 / R11.",
    scan() {
      const hits = [];
      for (const f of files("packages/database/prisma", [".prisma"])) {
        read(f)
          .split("\n")
          .forEach((line, i) => {
            const money =
              /(amount|price|cost|total|balance|salary|rate|subtotal|tax|discount|fee|value)/i;
            if (/\bFloat\b/.test(line) && money.test(line)) {
              hits.push(`${relative(ROOT, f)}:${i + 1}  ${line.trim()}`);
            }
          });
      }
      return hits;
    },
  },
  {
    id: "unguardedEndpoints",
    label: "Controller route without @Permissions",
    why: "An unguarded endpoint is a shipped security defect (BACKEND_SCHEMA § 6.3).",
    scan() {
      const hits = [];
      for (const f of files("apps/api/src", [".controller.ts"])) {
        const lines = read(f).split("\n");
        lines.forEach((line, i) => {
          if (!/^\s*@(Get|Post|Put|Patch|Delete)\s*\(/.test(line)) return;
          // The permission decorator may sit either side of the HTTP verb decorator, so
          // inspect the whole decorator block: back to the previous handler, forward to the
          // method signature.
          const before = lines.slice(Math.max(0, i - 8), i);
          const after = [];
          for (let j = i + 1; j < lines.length && j < i + 14; j++) {
            after.push(lines[j]);
            // Stop at the method signature — anything past it belongs to the body.
            if (/^\s{2}(async\s+)?[A-Za-z_$][\w$]*\s*\(/.test(lines[j])) break;
          }
          const window = [...before, line, ...after].join("\n");
          if (
            /@Permissions\s*\(|@Public\s*\(|@SkipAuth\s*\(|@AllowAnonymous\s*\(/.test(
              window,
            )
          )
            return;
          hits.push(`${relative(ROOT, f)}:${i + 1}  ${line.trim()}`);
        });
      }
      return hits;
    },
  },
  {
    id: "hardcodedColors",
    label: "Hardcoded hex colour in application code",
    why: "Breaks theming, dark mode, and high-contrast a11y for every user (UI_UX_BRIEF § 2).",
    scan() {
      const hits = [];
      const targets = [
        ...files("apps/web/app", [".tsx", ".ts", ".css"]),
        ...files("apps/web/src", [".tsx", ".ts", ".css"]),
      ];
      for (const f of targets) {
        read(f)
          .split("\n")
          .forEach((line, i) => {
            if (/^\s*(\/\/|\/\*|\*)/.test(line)) return;
            if (
              /#[0-9a-fA-F]{3,8}\b/.test(line) &&
              !/--[a-z-]+\s*:/.test(line)
            ) {
              hits.push(
                `${relative(ROOT, f)}:${i + 1}  ${line.trim().slice(0, 100)}`,
              );
            }
          });
      }
      return hits;
    },
  },
  {
    id: "hardcodedSpacing",
    label: "Hardcoded pixel value in application code",
    why: "Breaks the density system and the 4px grid (UI_UX_BRIEF § 5).",
    scan() {
      const hits = [];
      const targets = [
        ...files("apps/web/app", [".css"]),
        ...files("apps/web/src", [".css"]),
      ];
      for (const f of targets) {
        read(f)
          .split("\n")
          .forEach((line, i) => {
            if (/^\s*(\/\*|\*)/.test(line)) return;
            // 0px and 1px (hairlines) are permitted; everything else must be a token.
            if (
              /:\s*[^;]*\b([2-9]|[1-9]\d+)px\b/.test(line) &&
              !/--[a-z-]+\s*:/.test(line)
            ) {
              hits.push(
                `${relative(ROOT, f)}:${i + 1}  ${line.trim().slice(0, 100)}`,
              );
            }
          });
      }
      return hits;
    },
  },
];

/* ── run ────────────────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const report = args.includes("--report");
const update = args.includes("--update");

let exitCode = 0;
console.log("\nPolicy gate — docs/ai/IMPLEMENTATION_PLAN.md § 11\n");

// HARD
console.log("HARD rules (zero tolerance):");
for (const rule of HARD) {
  const hits = rule.scan();
  if (hits.length === 0) {
    console.log(`   ✅ ${rule.label}`);
  } else {
    exitCode = 1;
    console.log(`   ❌ ${rule.label} — ${hits.length} violation(s)`);
    console.log(`      ${rule.why}`);
    for (const h of hits.slice(0, report ? 200 : 10))
      console.log(`      · ${h}`);
    if (!report && hits.length > 10) {
      console.log(`      … ${hits.length - 10} more (run with --report)`);
    }
  }
}

// RATCHET
let baseline = {};
if (existsSync(BASELINE_PATH)) {
  try {
    baseline = JSON.parse(readFileSync(BASELINE_PATH, "utf8")).counts ?? {};
  } catch {
    baseline = {};
  }
}
const fresh = !existsSync(BASELINE_PATH);
const counts = {};

console.log("\nRATCHET rules (existing debt grandfathered; increases fail):");
for (const rule of RATCHET) {
  const hits = rule.scan();
  counts[rule.id] = hits.length;
  const was = baseline[rule.id];

  if (fresh || update) {
    console.log(`   ·  ${rule.label}: ${hits.length}`);
  } else if (was === undefined) {
    console.log(`   ·  ${rule.label}: ${hits.length} (new rule — baselining)`);
    baseline[rule.id] = hits.length;
  } else if (hits.length > was) {
    exitCode = 1;
    console.log(
      `   ❌ ${rule.label}: ${was} → ${hits.length} (+${hits.length - was})`,
    );
    console.log(`      ${rule.why}`);
    for (const h of hits.slice(0, report ? 200 : 5))
      console.log(`      · ${h}`);
  } else if (hits.length < was) {
    console.log(
      `   ✅ ${rule.label}: ${was} → ${hits.length} (${hits.length - was})`,
    );
  } else if (rule.mustReachZero && hits.length > 0) {
    // Grandfathered, but this is debt that must be repaid — not an accepted steady state.
    console.log(`   ⏳ ${rule.label}: ${hits.length}  ← MUST REACH ZERO`);
  } else {
    console.log(`   ·  ${rule.label}: ${hits.length}`);
  }

  if (report && hits.length) {
    console.log(`      ── all ${hits.length} ──`);
    for (const h of hits.slice(0, 200)) console.log(`      · ${h}`);
  }
}

if (fresh || update) {
  writeFileSync(
    BASELINE_PATH,
    JSON.stringify(
      {
        $comment:
          "Policy ratchet baseline. These numbers may only go DOWN. See docs/ai/ARCHITECTURE_REVIEW.md.",
        updatedAt: new Date().toISOString().slice(0, 10),
        counts,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `\n✅ Policy baseline written to .quality-policy-baseline.json — commit it.\n`,
  );
  process.exit(exitCode);
}

if (exitCode !== 0) {
  console.error(`
────────────────────────────────────────────────────────────────────────
  POLICY VIOLATION.

  Fix the code. Do not weaken this gate, and do not bump the baseline
  upward — an increase requires an ADR in docs/ai/TRD.md § 9.
────────────────────────────────────────────────────────────────────────
`);
} else {
  console.log("\n  ✅ Policy gate clean.\n");
}
process.exit(exitCode);
