import { prisma, idpPrisma } from "@unerp/database";

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
 */
export const idpClient = {
  // ── Identity: owned by the IdP schema ────────────────────────────────
  user: idpPrisma.user,
  userProfile: idpPrisma.userProfile,
  userIdentity: idpPrisma.userIdentity,
  role: idpPrisma.role,
  userRole: idpPrisma.userRole,
  userGroup: idpPrisma.userGroup,
  userGroupMember: idpPrisma.userGroupMember,
  userSession: idpPrisma.userSession,
  apiKey: idpPrisma.apiKey,
  authApiToken: idpPrisma.authApiToken,
  pushSubscription: idpPrisma.pushSubscription,
  passwordResetToken: idpPrisma.passwordResetToken,
  emailVerificationToken: idpPrisma.emailVerificationToken,
  mfaPushChallenge: idpPrisma.mfaPushChallenge,

  // ── Presence: owned by the main schema (core.prisma) ─────────────────
  userPresence: prisma.userPresence,
  userStatusSchedule: prisma.userStatusSchedule,
} as const;

export type IdpClient = typeof idpClient;
