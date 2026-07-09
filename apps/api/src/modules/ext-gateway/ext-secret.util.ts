/**
 * Per-service signing secrets (#2). Each app may have its own secret provisioned
 * in both core and that service's deployment as `<SLUG>_EXT_SECRET` (slug
 * uppercased, `-`→`_`). Falls back to the shared EXT_SERVICE_JWT_SECRET so a
 * single-secret dev setup keeps working. A compromised service can then only
 * mint/verify tokens for its own app.
 */
export function secretForApp(appSlug: string): string {
  const perApp = process.env[`${appSlug.replace(/-/g, '_').toUpperCase()}_EXT_SECRET`];
  const secret = perApp || process.env.EXT_SERVICE_JWT_SECRET;
  if (!secret) throw new Error(`No signing secret configured for app "${appSlug}" (set <SLUG>_EXT_SECRET or EXT_SERVICE_JWT_SECRET)`);
  return secret;
}
