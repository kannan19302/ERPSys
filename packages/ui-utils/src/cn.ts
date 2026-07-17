/** Joins truthy class names — the canonical class combiner for UniERP UI. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
