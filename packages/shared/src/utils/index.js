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
export function formatCurrency(amount, currency = 'USD', locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
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
export function generateDocumentNumber(prefix, sequence, year) {
    const yr = year ?? new Date().getFullYear();
    const seq = String(sequence).padStart(4, '0');
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
export function calculatePagination(total, page, limit) {
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
export function parsePermission(permission) {
    const parts = permission.split('.');
    if (parts.length !== 3) {
        throw new Error(`Invalid permission format: ${permission}. Expected "module.resource.action"`);
    }
    const [module, resource, action] = parts;
    return { module: module, resource: resource, action: action };
}
/**
 * Checks if a user has a specific permission based on their roles.
 *
 * @param userPermissions - Array of permission strings from user's roles
 * @param requiredPermission - The permission to check
 * @returns True if the user has the permission
 */
export function hasPermission(userPermissions, requiredPermission) {
    return userPermissions.some((p) => {
        // Exact match
        if (p === requiredPermission)
            return true;
        // Wildcard match: "finance.*" matches "finance.invoice.create", but must
        // respect the "." boundary — otherwise "finance.invoice.*" would also
        // match an unrelated permission like "finance.invoiceapproval.create"
        // just because the string happens to start with the same prefix.
        if (p.endsWith('.*')) {
            const prefix = p.slice(0, -2);
            return requiredPermission === prefix || requiredPermission.startsWith(`${prefix}.`);
        }
        // Super admin: "*" matches everything
        if (p === '*')
            return true;
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
export function safeJsonParse(json, defaultValue) {
    try {
        return JSON.parse(json);
    }
    catch {
        return defaultValue;
    }
}
/**
 * Creates a URL-friendly slug from a string.
 *
 * @param text - Input text
 * @returns Slugified string (e.g., "Acme Corp" → "acme-corp")
 */
export function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
/**
 * Truncates a string to a maximum length with ellipsis.
 *
 * @param text - Input text
 * @param maxLength - Maximum length (default: 100)
 * @returns Truncated string
 */
export function truncate(text, maxLength = 100) {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength - 3) + '...';
}
/**
 * Returns a user's full name from first and last name.
 */
export function getFullName(firstName, lastName) {
    return `${firstName} ${lastName}`.trim();
}
/**
 * Returns initials from a name (e.g., "John Doe" → "JD").
 */
export function getInitials(name) {
    return name
        .split(' ')
        .filter(Boolean)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('');
}
//# sourceMappingURL=index.js.map