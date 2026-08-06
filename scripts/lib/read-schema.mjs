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
  const dir = join(root, PKG, "prisma", "schema");
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
  const legacy = join(root, PKG, "prisma", "schema.prisma");
  return existsSync(legacy) ? [legacy] : [];
}

/**
 * The IdP schema, which lives outside the main schema folder.
 *
 * The platform split moved User, UserProfile, UserIdentity, Role, UserRole,
 * UserSession and the token models into their own schema. Any control that
 * reasons about the data model as a whole — the PII registry above all, since
 * those are the most PII-dense models in the system — has to read it too, or it
 * silently stops covering identity.
 */
export function idpSchemaFile(root) {
  const candidates = [
    join(root, PKG, "prisma", "idp-schema.prisma"),
    join(root, PKG, "src", "idp-client", "schema.prisma"),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

/**
 * The whole schema as one string.
 *
 * `options.includeIdp` also folds in the IdP schema. Off by default because the
 * Float/money and migration checks are about the main datamodel; on for controls
 * that must see every model.
 *
 * Callers that report `file:line` should use `schemaFiles()` and read each file
 * themselves — concatenated line numbers would point at nothing.
 */
// Where the database package lives.
//
// It moves during the § 14 Phase 3 migration: a workspace member at
// `packages/database` until consumers have switched, the installed
// `@unerp/database` afterwards. Both are legitimate depending on where the
// migration has reached, so resolve whichever is actually present rather than
// pinning one and breaking every gate the day it moves.
//
// The workspace copy wins when both exist: it is the source being edited, and a
// gate should judge what is being changed rather than a published snapshot.
//
// Every schema-reading gate routes through this module, so this one resolution
// covers all of them instead of each carrying its own stale path. Overridable
// via UNERP_DB_PKG for a repository that vendors the package elsewhere — or for
// unierp-data itself, once these gates move there per § 4.6.
const PKG_CANDIDATES = ["packages/database", "node_modules/@unerp/database"];
const PKG =
  process.env.UNERP_DB_PKG ??
  PKG_CANDIDATES.find((candidate) =>
    existsSync(join(process.cwd(), candidate, "prisma")),
  ) ??
  PKG_CANDIDATES[PKG_CANDIDATES.length - 1];

export function readSchema(root, options = {}) {
  const files = schemaFiles(root);
  if (options.includeIdp) {
    const idp = idpSchemaFile(root);
    if (idp) files.push(idp);
  }
  if (files.length === 0) {
    throw new Error(
      `No Prisma schema found. Looked under ${PKG}/prisma/. ` +
        "Set UNERP_DB_PKG if the database package lives elsewhere.",
    );
  }
  return files.map((f) => readFileSync(f, "utf8")).join("\n");
}
