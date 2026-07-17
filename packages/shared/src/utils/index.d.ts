/**
 * Formats a number as currency with proper symbol and decimal places.
 *
 * @param amount - The amount to format
 * @param currency - ISO 4217 currency code (default: USD)
 * @param locale - BCP 47 locale (default: en-US)
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export declare function formatCurrency(amount: number, currency?: string, locale?: string): string;
/**
 * Generates a human-readable document number with prefix, year, and sequence.
 *
 * @param prefix - Document type prefix (e.g., "INV", "PO", "SO")
 * @param sequence - Sequence number
 * @param year - Year (default: current year)
 * @returns Formatted document number (e.g., "INV-2026-0042")
 */
export declare function generateDocumentNumber(prefix: string, sequence: number, year?: number): string;
/**
 * Calculates pagination metadata from total count and current page.
 *
 * @param total - Total number of items
 * @param page - Current page (1-indexed)
 * @param limit - Items per page
 * @returns Pagination meta object
 */
export declare function calculatePagination(total: number, page: number, limit: number): {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};
/**
 * Converts a permission string to its component parts.
 *
 * @param permission - Permission string (e.g., "finance.invoice.create")
 * @returns Parsed permission object
 */
export declare function parsePermission(permission: string): {
    module: string;
    resource: string;
    action: string;
};
/**
 * Checks if a user has a specific permission based on their roles.
 *
 * @param userPermissions - Array of permission strings from user's roles
 * @param requiredPermission - The permission to check
 * @returns True if the user has the permission
 */
export declare function hasPermission(userPermissions: string[], requiredPermission: string): boolean;
/**
 * Safely parses a JSON string, returning a default value on failure.
 *
 * @param json - JSON string to parse
 * @param defaultValue - Default value if parsing fails
 * @returns Parsed value or default
 */
export declare function safeJsonParse<T>(json: string, defaultValue: T): T;
/**
 * Creates a URL-friendly slug from a string.
 *
 * @param text - Input text
 * @returns Slugified string (e.g., "Acme Corp" → "acme-corp")
 */
export declare function slugify(text: string): string;
/**
 * Truncates a string to a maximum length with ellipsis.
 *
 * @param text - Input text
 * @param maxLength - Maximum length (default: 100)
 * @returns Truncated string
 */
export declare function truncate(text: string, maxLength?: number): string;
/**
 * Returns a user's full name from first and last name.
 */
export declare function getFullName(firstName: string, lastName: string): string;
/**
 * Returns initials from a name (e.g., "John Doe" → "JD").
 */
export declare function getInitials(name: string): string;
//# sourceMappingURL=index.d.ts.map