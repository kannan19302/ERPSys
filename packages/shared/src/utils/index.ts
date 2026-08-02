// ─────────────────────────────────────────────────
// Shared Utilities — Universal ERP System
// ─────────────────────────────────────────────────

/**
 * Formats a number as currency with proper symbol and decimal places.
 *
 * @param amount - The amount to format
 * @param currency - ISO 4217 currency code (default: USD)
 * @param locale - BCP 47 locale (default: en-US)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Generates a human-readable document number with prefix, year, and sequence.
 *
 * @param prefix - Document type prefix (e.g., "INV", "PO", "SO")
 * @param sequence - Sequence number
 * @param year - Year (default: current year)
 * @returns Formatted document number (e.g., "INV-2026-0042")
 */
export function generateDocumentNumber(
  prefix: string,
  sequence: number,
  year?: number,
): string {
  const yr = year ?? new Date().getFullYear();
  const seq = String(sequence).padStart(4, "0");
  return `${prefix}-${yr}-${seq}`;
}

/**
 * Calculates pagination metadata from total count and current page.
 *
 * @param total - Total number of items
 * @param page - Current page (1-indexed)
 * @param limit - Items per page
 * @returns Pagination meta object
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number,
) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Converts a permission string to its component parts.
 *
 * @param permission - Permission string (e.g., "finance.invoice.create")
 * @returns Parsed permission object
 */
export function parsePermission(permission: string): {
  module: string;
  resource: string;
  action: string;
} {
  const parts = permission.split(".");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid permission format: ${permission}. Expected "module.resource.action"`,
    );
  }
  const [module, resource, action] = parts;
  return { module: module!, resource: resource!, action: action! };
}

/**
 * Permission namespaces that belong to the CONTROL PLANE — the SaaS provider's
 * own operations (tenant lifecycle, platform billing, licensing, cross-tenant
 * analytics). See docs/PLATFORM_ARCHITECTURE.md § 3.
 *
 * These may only ever be granted EXPLICITLY, by exact code or by a wildcard
 * that is itself inside the namespace (`system.*`, `platform.tenant.*`). A
 * tenant-scoped wildcard must never reach them.
 *
 * Why this exists: every tenant's first user is seeded with the `SUPER_ADMIN`
 * role carrying `permissions: ["*"]` (see the registration flow in
 * apps/api/src/modules/auth/auth.service.ts). Before this guard, that bare `*`
 * satisfied `system.tenant.read` — the permission protecting
 * `SuperAdminController`, which is `@SkipTenantScope()` and deliberately
 * aggregates across every tenant. Any customer's own administrator could
 * therefore enumerate and modify every tenant on the platform. `*` means
 * "everything in MY tenant", never "everything on the platform".
 */
export const CONTROL_PLANE_NAMESPACES = ["system", "platform"] as const;

function isControlPlanePermission(permission: string): boolean {
  return CONTROL_PLANE_NAMESPACES.some(
    (ns) => permission === ns || permission.startsWith(`${ns}.`),
  );
}

/**
 * Checks if a user has a specific permission based on their roles.
 *
 * Tenant-scoped grants never confer control-plane authority: a grant only
 * satisfies a control-plane permission when the grant is itself scoped to a
 * control-plane namespace.
 *
 * @param userPermissions - Array of permission strings from user's roles
 * @param requiredPermission - The permission to check
 * @returns True if the user has the permission
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string,
): boolean {
  const requiresControlPlane = isControlPlanePermission(requiredPermission);

  return userPermissions.some((p) => {
    // Exact match. Safe for control-plane codes too: an exact grant is explicit.
    if (p === requiredPermission) return true;

    // A control-plane permission can only be satisfied by a grant that is
    // itself inside a control-plane namespace. This is what stops a bare `*`
    // or a tenant wildcard from crossing the plane boundary.
    if (requiresControlPlane && !isControlPlanePermission(p)) return false;

    // Wildcard match: "finance.*" matches "finance.invoice.create", but must
    // respect the "." boundary — otherwise "finance.invoice.*" would also
    // match an unrelated permission like "finance.invoiceapproval.create"
    // just because the string happens to start with the same prefix.
    if (p.endsWith(".*")) {
      const prefix = p.slice(0, -2);
      return (
        requiredPermission === prefix ||
        requiredPermission.startsWith(`${prefix}.`)
      );
    }

    // Tenant super admin: "*" matches everything within the tenant. The
    // control-plane check above has already excluded platform scope.
    if (p === "*") return true;

    return false;
  });
}

/**
 * Safely parses a JSON string, returning a default value on failure.
 *
 * @param json - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed value or default
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Creates a URL-friendly slug from a string.
 *
 * @param text - Input text
 * @returns Slugified string (e.g., "Acme Corp" → "acme-corp")
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Truncates a string to a maximum length with ellipsis.
 *
 * @param text - Input text
 * @param maxLength - Maximum length (default: 100)
 * @returns Truncated string
 */
export function truncate(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Returns a user's full name from first and last name.
 */
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

/**
 * Returns initials from a name (e.g., "John Doe" → "JD").
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}
