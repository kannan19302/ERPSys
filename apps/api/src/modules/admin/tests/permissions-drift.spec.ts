import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { PERMISSION_REGISTRY } from '@unerp/shared';

/**
 * Project-wide RBAC permission drift check & stacked decorators guard.
 *
 * This test guards against:
 * 1. Double stacked `@Permissions(...)` decorators on the same handler method.
 * 2. `@Permissions(...)` codes used in controllers that are missing from `PERMISSION_REGISTRY`.
 *
 * It parses controller source text directly (not runtime decorator metadata),
 * which is simple and robust for static verification.
 */

const MODULES_DIR = join(__dirname, '..', '..');

function getControllerFilesRecursively(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    const filePath = join(dir, file);
    if (statSync(filePath).isDirectory()) {
      if (file !== 'tests' && file !== 'node_modules') {
        getControllerFilesRecursively(filePath, fileList);
      }
    } else if (file.endsWith('.controller.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function getControllerFiles(): string[] {
  return getControllerFilesRecursively(MODULES_DIR);
}

interface PermissionCallSite {
  file: string;
  line: number;
  codes: string[];
}

/**
 * Extracts every `@Permissions(...)` call site from a controller source file,
 * along with the permission code(s) passed to it and the line number.
 */
function extractPermissionCallSites(filePath: string): PermissionCallSite[] {
  const source = readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');
  const sites: PermissionCallSite[] = [];

  const callRegex = /@Permissions\(([^)]*)\)/g;
  const stringLiteralRegex = /'([^']*)'/g;

  lines.forEach((line, idx) => {
    let match: RegExpExecArray | null;
    callRegex.lastIndex = 0;
    while ((match = callRegex.exec(line)) !== null) {
      const argsText = match[1];
      const codes: string[] = [];
      let strMatch: RegExpExecArray | null;
      stringLiteralRegex.lastIndex = 0;
      while ((strMatch = stringLiteralRegex.exec(argsText)) !== null) {
        codes.push(strMatch[1]);
      }
      if (codes.length > 0) {
        sites.push({ file: filePath, line: idx + 1, codes });
      }
    }
  });

  return sites;
}

/**
 * Detects stacked `@Permissions(...)` decorators on the same handler.
 * We find this by scanning for a `@Permissions(...)` line, followed only by
 * other decorator lines (no method body / blank-then-code boundary), followed
 * by another `@Permissions(...)` line.
 */
function findStackedPermissionPairs(filePath: string): number[] {
  const source = readFileSync(filePath, 'utf-8');
  const lines = source.split('\n');
  const offendingLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!/@Permissions\(/.test(lines[i])) continue;

    // Look ahead through consecutive decorator lines (lines starting with `@`
    // after trimming) for a second @Permissions(...) before any non-decorator
    // line (method signature, comment, blank line acting as a boundary, etc.)
    for (let j = i + 1; j < lines.length; j++) {
      const trimmed = lines[j].trim();
      if (trimmed === '') break;
      if (!trimmed.startsWith('@')) break; // hit the method signature — stop
      if (/@Permissions\(/.test(lines[j])) {
        offendingLines.push(i + 1);
        break;
      }
    }
  }

  return offendingLines;
}

describe('Project-Wide RBAC permission drift check', () => {
  const controllerFiles = getControllerFiles();

  it('finds controller files to check (sanity check)', () => {
    expect(controllerFiles.length).toBeGreaterThan(40);
  });

  it('never stacks two @Permissions(...) decorators on the same handler', () => {
    const violations: string[] = [];

    for (const file of controllerFiles) {
      const offendingLines = findStackedPermissionPairs(file);
      for (const line of offendingLines) {
        violations.push(`${file}:${line}`);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Found stacked @Permissions(...) decorators (only the first is ever enforced ` +
          `by RbacGuard's getAllAndOverride — the second is silently dead code). ` +
          `Use a single @Permissions('a', 'b') call instead. Offending locations:\n` +
          violations.join('\n'),
      );
    }
  });

  it('registers every @Permissions(...) code used in controllers in PERMISSION_REGISTRY', () => {
    const registryCodes = new Set(PERMISSION_REGISTRY.map((p) => p.code));
    const missing: string[] = [];

    for (const file of controllerFiles) {
      const sites = extractPermissionCallSites(file);
      for (const site of sites) {
        for (const code of site.codes) {
          if (!registryCodes.has(code)) {
            missing.push(`${site.file}:${site.line} -> '${code}'`);
          }
        }
      }
    }

    if (missing.length > 0) {
      throw new Error(
        `Found @Permissions(...) codes used in controllers with no matching entry in ` +
          `PERMISSION_REGISTRY (packages/shared/src/permissions/registry.ts). Register them ` +
          `with the exact same code string. Missing:\n${missing.join('\n')}`,
      );
    }
  });

  it('reports (diagnostic only) registry entries with no controller call site', () => {
    const usedCodes = new Set<string>();
    for (const file of controllerFiles) {
      for (const site of extractPermissionCallSites(file)) {
        for (const code of site.codes) usedCodes.add(code);
      }
    }

    const orphaned = PERMISSION_REGISTRY.filter(
      (p) => p.level === 'endpoint' && !usedCodes.has(p.code),
    ).map((p) => p.code);

    if (orphaned.length > 0) {
      // Diagnostic only — must NOT fail the test.
      console.warn(
        `[permissions-drift] ${orphaned.length} registry entries have no ` +
          `@Permissions(...) call site in any controller: ${orphaned.join(', ')}`,
      );
    }

    expect(true).toBe(true);
  });
});
