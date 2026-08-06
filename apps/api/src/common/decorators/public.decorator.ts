import { SetMetadata } from "@nestjs/common";

export const IS_PUBLIC_KEY = "isPublic";
export const PUBLIC_REASON_KEY = "publicReason";

/**
 * Declares that a route is deliberately reachable without an authenticated
 * session, and records why.
 *
 * This is a **declaration, not an enforcement mechanism** — it does not open a
 * route that guards would otherwise close, and it does not close one. Its job
 * is to make "this endpoint is public on purpose" a fact in the source rather
 * than tribal knowledge, so that:
 *
 *   - `check-policy.mjs` can drive "controller route without @Permissions" to
 *     zero, which means the next genuinely unguarded route is visible the day
 *     it appears instead of hiding inside a population of known exceptions;
 *   - review sees the justification beside the route it applies to.
 *
 * The reason is required. An exemption whose rationale lives somewhere else is
 * an exemption nobody can re-evaluate later — which is how the 449
 * unauthenticated routes in the R12 sweep survived as long as they did.
 *
 * Every route carrying this decorator must be safe with no session at all:
 * either it exposes nothing tenant-scoped (health, metrics), it verifies a
 * signature itself (payment and extension webhooks), or it is a published
 * public surface whose data is public by definition (tenant websites, the RFQ
 * bid portal).
 */
export const Public =
  (reason: string) =>
  (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    const applyPublic = SetMetadata(IS_PUBLIC_KEY, true);
    const applyReason = SetMetadata(PUBLIC_REASON_KEY, reason);
    if (key !== undefined && descriptor !== undefined) {
      applyPublic(target, key, descriptor);
      applyReason(target, key, descriptor);
      return descriptor;
    }
    applyPublic(target as never);
    applyReason(target as never);
    return undefined;
  };
