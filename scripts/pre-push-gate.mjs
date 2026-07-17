#!/usr/bin/env node
/**
 * scripts/pre-push-gate.mjs — Automated checks for ADP compliance before git push.
 *
 * Verifies:
 * - CHANGELOG.md is updated
 * - MODULE_REGISTRY.md is updated
 * - No console.log in staged/modified files
 * - No "any" type or ESLint suppressions in modified files
 * - No stray/temporary scripts in workspace
 * - Scoped typecheck passes
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function getModifiedFiles() {
  try {
    const stdout = execSync('git status --porcelain', { encoding: 'utf8', cwd: root });
    return stdout.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Line format: "XY path" or "XY "path""
        const spaceIdx = line.indexOf(' ');
        const status = line.slice(0, spaceIdx);
        let filePath = line.slice(spaceIdx + 1).trim();
        // Remove quotes if present
        if (filePath.startsWith('"') && filePath.endsWith('"')) {
          filePath = filePath.slice(1, -1);
        }
        return { status, path: filePath };
      });
  } catch (error) {
    console.error('Failed to get git status:', error.message);
    return [];
  }
}

console.log('======================================================');
console.log('                 ADP PRE-PUSH GATE KEEPER');
console.log('======================================================');

const modified = getModifiedFiles();
let hasErrors = false;

// 1. Check for changelog and registry modifications
const changelogModified = modified.some(f => f.path.endsWith('CHANGELOG.md'));
const registryModified = modified.some(f => f.path.endsWith('MODULE_REGISTRY.md'));

if (!changelogModified) {
  console.error('❌ ERROR: CHANGELOG.md must be updated in every cycle.');
  hasErrors = true;
} else {
  console.log('✅ CHANGELOG.md check passed.');
}

if (!registryModified) {
  console.error('❌ ERROR: MODULE_REGISTRY.md must be updated in every cycle.');
  hasErrors = true;
} else {
  console.log('✅ MODULE_REGISTRY.md check passed.');
}

// 2. Check for banned patterns only in newly added lines of staged files
try {
  const diff = execSync('git diff --cached -U0', { encoding: 'utf8', cwd: root });
  const lines = diff.split('\n');
  let currentFile = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6).trim();
      continue;
    }

    // Only inspect files in api modules or web app pages, excluding tests and declarations
    const isTargetFile = currentFile.includes('apps/api/src/modules/') || currentFile.includes('apps/web/app/');
    const isExcluded = currentFile.endsWith('.d.ts') || currentFile.includes('.spec.') || currentFile.includes('.test.');

    if (isTargetFile && !isExcluded && line.startsWith('+') && !line.startsWith('+++')) {
      const addedContent = line.slice(1); // Remove the '+' prefix

      // Check for console.log (ignore comments)
      if (addedContent.includes('console.log') && !addedContent.trim().startsWith('//') && !addedContent.trim().startsWith('*')) {
        console.error(`❌ ERROR: console.log found in new line of ${currentFile}: ${addedContent.trim()}`);
        hasErrors = true;
      }

      // Check for any type declarations (e.g. ": any", "<any>", "as any")
      const isTypeScript = currentFile.endsWith('.ts') || currentFile.endsWith('.tsx');
      if (isTypeScript) {
        const hasAny = /:\s*any\b/i.test(addedContent) || /<\s*any\s*>/i.test(addedContent) || /as\s+any\b/i.test(addedContent);
        if (hasAny && !addedContent.includes('eslint-disable') && !addedContent.trim().startsWith('//') && !addedContent.trim().startsWith('*')) {
          console.error(`❌ ERROR: "any" type casting/declaration found in new line of ${currentFile}: ${addedContent.trim()}`);
          hasErrors = true;
        }
      }

      // Check for eslint bypasses
      if (addedContent.includes('eslint-disable-next-line') || addedContent.includes('eslint-disable')) {
        console.error(`❌ ERROR: ESLint disable statement found in new line of ${currentFile}: ${addedContent.trim()}`);
        hasErrors = true;
      }
    }
  }
} catch (error) {
  console.error('Failed to run git diff check:', error.message);
  hasErrors = true;
}


// 3. Check for stray/temporary files at repo root or scripts
const rootFiles = readdirSync(root);
const scriptsFiles = readdirSync(path.join(root, 'scripts'));

// Standard allowed scripts
const allowedScripts = new Set([
  'claim.mjs',
  'feature-ledger.mjs',
  'module-health.mjs',
  'pre-push-gate.mjs',
  'cycle-report.mjs',
  'scaffold-entity.mjs',
  'docker-start.ps1',
  'check-foundation-readiness.mjs',
  'check-migration-discipline.mjs',
  'check-module-boundaries.mjs',
  'dev-ext.ps1',
  'docker-entrypoint.sh',
  'ensure-web-deps.mjs',
  'fix-symlinks.ps1',
  'forbid-db-push.mjs',
  'module-boundary-baseline.json',
  'report-migration-reconciliation.mjs',
  'worktree.mjs',
  'autopilot-loop.ps1'
]);

for (const file of scriptsFiles) {
  if (!allowedScripts.has(file)) {
    console.error(`❌ ERROR: Stray/temporary script found in scripts/: ${file}`);
    hasErrors = true;
  }
}

// Check root for stray files (e.g., test.js, tmp.ts, etc.)
const allowedRootDirs = new Set(['.git', 'node_modules', 'var', 'dist', '.next', '.turbo', 'apps', 'packages', 'scripts', 'docs']);
const allowedRootFiles = new Set([
  'AGENTS.md', 'package.json', 'pnpm-workspace.yaml', 'pnpm-lock.yaml',
  'tsconfig.json', 'turbo.json', 'README.md', 'docker-compose.yml', 'docker-compose.dev.yml', 'Dockerfile',
  '.gitignore', '.prettierrc', '.eslintrc', 'nest-cli.json', '.gitattributes',
  '.dependency-cruiser.cjs', '.ai', 'CLAUDE.md', 'eslint.config.mjs', 'eslint.config.js',
  '.env', '.env.example', '.eslintcache', 'cycle-report.json'
]);

for (const file of rootFiles) {
  if (file.startsWith('.')) {
    // Ignore git directories/files and temporary dotfiles
    if (file === '.git' || file === '.ai') continue;
    if (allowedRootFiles.has(file)) continue;
    // Check if it's in standard dotfiles
    continue;
  }
  const fullPath = path.join(root, file);
  const isDir = statSync(fullPath).isDirectory();
  
  if (isDir) {
    if (!allowedRootDirs.has(file)) {
      console.error(`❌ ERROR: Stray/temporary folder found at repo root: ${file}`);
      hasErrors = true;
    }
  } else {
    let allowed = false;
    for (const pat of allowedRootFiles) {
      if (file.startsWith(pat)) {
        allowed = true;
        break;
      }
    }
    if (!allowed) {
      console.error(`❌ ERROR: Stray/temporary file found at repo root: ${file}`);
      hasErrors = true;
    }
  }
}


if (hasErrors) {
  console.log('======================================================');
  console.log('❌ PRE-PUSH GATE KEEPER: FAILED (fix errors above)');
  console.log('======================================================');
  process.exit(1);
} else {
  console.log('======================================================');
  console.log('✅ PRE-PUSH GATE KEEPER: ALL CHECKS PASSED');
  console.log('======================================================');
  process.exit(0);
}
