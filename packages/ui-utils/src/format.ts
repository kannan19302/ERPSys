/** Locale-aware number formatting for UI display. */
export function formatNumber(value: number, locale = 'en-US', options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/** Formats a 0–1 ratio (or 0–100 when `isRatio` is false) as a percentage. */
export function formatPercent(value: number, fractionDigits = 1, isRatio = true): string {
  const pct = isRatio ? value * 100 : value;
  return `${pct.toFixed(fractionDigits)}%`;
}

/** Truncates a string with an ellipsis beyond `maxLength` characters. */
export function truncate(text: string, maxLength: number): string {
  return text.length <= maxLength ? text : `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}
