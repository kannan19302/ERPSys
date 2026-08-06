import * as database from "@unerp/database";

/**
 * The API's view of identity data.
 *
 * This module previously exported a hand-written mock: every delegate returned
 * a literal (`findMany` → `[]`, `findUnique` → `{ id: 'mock-id' }`,
 * `count` → `0`), and the whole object was cast `as any`. It was imported by
 * 844 files across 1,096 call sites — including `admin.service.ts`,
 * `people.service.ts`, and the control plane's own `super-admin.service.ts` and
 * `tenant-lifecycle.service.ts`. Every one of those read empty data and
 * silently discarded every write, while typechecking green because of the cast.
 *
 * A real, fully generated Prisma client for the IdP schema already existed at
 * `packages/database/src/idp-client` and is exported from `@unerp/database` as
 * `idpPrisma`. This module now routes to it.
 *
 * Two models need care. `UserPresence` and `UserStatusSchedule` are declared in
 * the MAIN schema (`prisma/schema/core.prisma`), not the IdP schema, because
 * presence is a communication concern rather than an identity one. They are
 * routed to the main client so the 13 call sites that use them keep working —
 * re-exporting `idpPrisma` wholesale would have replaced a silent mock with a
 * runtime crash.
 *
 * Consumers keep their existing import shape:
 *   import { idpClient as idpPrisma } from "@/common/idp-client";
 *
 * Delegates are resolved on access rather than bound at module load. Binding
 * eagerly coupled every importer to both clients being constructed at import
 * time, which broke collection in the 33 suites that mock `@unerp/database`
 * with a partial factory: the named import alone was enough to fail, whether or
 * not the suite touched identity at all. Resolving lazily means a suite only
 * needs `idpPrisma` in its mock if it actually reads identity data — and an
 * absent delegate still surfaces loudly at the call site instead of silently.
 */
const identityDelegates = [
  "user",
  "userProfile",
  "userIdentity",
  "role",
  "userRole",
  "userGroup",
  "userGroupMember",
  "userSession",
  "apiKey",
  "authApiToken",
  "pushSubscription",
  "passwordResetToken",
  "emailVerificationToken",
  "mfaPushChallenge",
] as const;

// Presence is declared in the MAIN schema (core.prisma) because it is a
// communication concern, not an identity one, so it routes to `prisma`.
const presenceDelegates = ["userPresence", "userStatusSchedule"] as const;

type IdentityDelegate = (typeof identityDelegates)[number];
type PresenceDelegate = (typeof presenceDelegates)[number];

export type IdpClient = Pick<typeof database.idpPrisma, IdentityDelegate> &
  Pick<typeof database.prisma, PresenceDelegate>;

function defineDelegates(
  target: Record<string, unknown>,
  names: readonly string[],
  source: () => Record<string, unknown>,
) {
  for (const name of names) {
    Object.defineProperty(target, name, {
      enumerable: true,
      get: () => source()[name],
    });
  }
}

const client: Record<string, unknown> = {};
defineDelegates(
  client,
  identityDelegates,
  () => database.idpPrisma as unknown as Record<string, unknown>,
);
defineDelegates(
  client,
  presenceDelegates,
  () => database.prisma as unknown as Record<string, unknown>,
);

export const idpClient = client as IdpClient;
