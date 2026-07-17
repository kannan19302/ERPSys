export declare const DEFAULT_PAGE_SIZE = 25;
export declare const MAX_PAGE_SIZE = 100;
export declare const ENTITY_STATUSES: readonly ["ACTIVE", "INACTIVE", "ARCHIVED"];
export declare const USER_STATUSES: readonly ["ACTIVE", "INACTIVE", "INVITED", "LOCKED"];
export declare const TENANT_STATUSES: readonly ["ACTIVE", "SUSPENDED", "CANCELLED"];
export declare const INVOICE_STATUSES: readonly ["DRAFT", "SENT", "VIEWED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED", "VOID"];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export declare const SALES_ORDER_STATUSES: readonly ["DRAFT", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];
export type SalesOrderStatus = (typeof SALES_ORDER_STATUSES)[number];
export declare const PURCHASE_ORDER_STATUSES: readonly ["DRAFT", "SUBMITTED", "APPROVED", "ORDERED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"];
export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number];
export declare const PRODUCT_TYPES: readonly ["GOODS", "SERVICE", "DIGITAL", "SUBSCRIPTION"];
export type ProductType = (typeof PRODUCT_TYPES)[number];
export declare const CUSTOMER_TYPES: readonly ["COMPANY", "INDIVIDUAL"];
export type CustomerType = (typeof CUSTOMER_TYPES)[number];
export declare const LEAVE_TYPES: readonly ["ANNUAL", "SICK", "PERSONAL", "MATERNITY", "PATERNITY", "UNPAID", "COMPENSATORY"];
export type LeaveType = (typeof LEAVE_TYPES)[number];
export declare const CURRENCIES: readonly [{
    readonly code: "USD";
    readonly name: "US Dollar";
    readonly symbol: "$";
}, {
    readonly code: "EUR";
    readonly name: "Euro";
    readonly symbol: "€";
}, {
    readonly code: "GBP";
    readonly name: "British Pound";
    readonly symbol: "£";
}, {
    readonly code: "INR";
    readonly name: "Indian Rupee";
    readonly symbol: "₹";
}, {
    readonly code: "JPY";
    readonly name: "Japanese Yen";
    readonly symbol: "¥";
}, {
    readonly code: "AUD";
    readonly name: "Australian Dollar";
    readonly symbol: "A$";
}, {
    readonly code: "CAD";
    readonly name: "Canadian Dollar";
    readonly symbol: "C$";
}, {
    readonly code: "SGD";
    readonly name: "Singapore Dollar";
    readonly symbol: "S$";
}, {
    readonly code: "AED";
    readonly name: "UAE Dirham";
    readonly symbol: "د.إ";
}, {
    readonly code: "SAR";
    readonly name: "Saudi Riyal";
    readonly symbol: "﷼";
}];
export declare const UNITS_OF_MEASURE: readonly [{
    readonly code: "EACH";
    readonly name: "Each";
}, {
    readonly code: "KG";
    readonly name: "Kilogram";
}, {
    readonly code: "LTR";
    readonly name: "Litre";
}, {
    readonly code: "MTR";
    readonly name: "Meter";
}, {
    readonly code: "SQM";
    readonly name: "Square Meter";
}, {
    readonly code: "HR";
    readonly name: "Hour";
}, {
    readonly code: "DAY";
    readonly name: "Day";
}, {
    readonly code: "BOX";
    readonly name: "Box";
}, {
    readonly code: "PACK";
    readonly name: "Pack";
}, {
    readonly code: "SET";
    readonly name: "Set";
}];
export declare const MODULES: readonly ["admin", "finance", "hr", "crm", "inventory", "procurement", "sales", "supply-chain", "projects", "analytics", "documents", "communication"];
export declare const ACTIONS: readonly ["create", "read", "update", "delete", "export", "approve"];
export declare const DATE_FORMAT = "yyyy-MM-dd";
export declare const DATETIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss'Z'";
export declare const DISPLAY_DATE_FORMAT = "MMM dd, yyyy";
export declare const DISPLAY_DATETIME_FORMAT = "MMM dd, yyyy HH:mm";
//# sourceMappingURL=index.d.ts.map