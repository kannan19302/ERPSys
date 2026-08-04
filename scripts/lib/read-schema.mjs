/**
 * Single source for reading the Prisma schema, now that it is a multi-file
 * folder (R2 / ARCHITECTURE_REVIEW § F4).
 *
 * Five scripts previously opened `prisma/schema.prisma` directly. When the
 * schema was split into `prisma/schema/*.prisma` every one of them started
 * throwing ENOENT — including `check-schema-lints.mjs`, which is a CI gate.
 * A gate that crashes is worse than a gate that fails: it reports an error
 * that looks like tooling breakage, so it gets ignored rather than fixed.
 *
 * `readSchema()` concatenates every `.prisma` file in the folder, in a stable
 * order, and falls back to the legacy single file so the scripts keep working
 * on older branches and on `v1.0.0`.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

/** Absolute path to the schema folder, or null when the legacy layout is in use. */
export function schemaDir(root) {
  const dir = join(root, "packages", "database", "prisma", "schema");
  return existsSync(dir) && statSync(dir).isDirectory() ? dir : null;
}

/** Every schema file path, newest layout first, legacy single file as fallback. */
export function schemaFiles(root) {
  const dir = schemaDir(root);
  if (dir) {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".prisma"))
      .sort()
      .map((f) => join(dir, f));
  }
  const legacy = join(root, "packages", "database", "prisma", "schema.prisma");
  return existsSync(legacy) ? [legacy] : [];
}

/**
 * The whole schema as one string.
 *
 * Callers that report `file:line` should use `schemaFiles()` and read each file
 * themselves — concatenated line numbers would point at nothing.
 */
export function readSchema(root) {
  const files = schemaFiles(root);
  if (files.length === 0) {
    throw new Error(
      "No Prisma schema found. Looked for packages/database/prisma/schema/*.prisma " +
        "and packages/database/prisma/schema.prisma.",
    );
  }
  return files.map((f) => readFileSync(f, "utf8")).join("\n");
}
