import { z } from 'zod';
export declare const cuidSchema: z.ZodString;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort?: string | undefined;
    search?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort?: string | undefined;
    search?: string | undefined;
}>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export declare const paginatedResponseSchema: <T extends z.ZodTypeAny>(itemSchema: T) => z.ZodObject<{
    data: z.ZodArray<T, "many">;
    meta: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }, {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    }>;
}, "strip", z.ZodTypeAny, {
    data: T["_output"][];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}, {
    data: T["_input"][];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}>;
export declare const dateRangeSchema: z.ZodEffects<z.ZodObject<{
    from: z.ZodOptional<z.ZodString>;
    to: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    to?: string | undefined;
    from?: string | undefined;
}, {
    to?: string | undefined;
    from?: string | undefined;
}>, {
    to?: string | undefined;
    from?: string | undefined;
}, {
    to?: string | undefined;
    from?: string | undefined;
}>;
export type DateRangeInput = z.infer<typeof dateRangeSchema>;
export declare const addressSchema: z.ZodObject<{
    street: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zip: z.ZodString;
    country: z.ZodString;
}, "strip", z.ZodTypeAny, {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}, {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}>;
export declare const bulkActionSchema: z.ZodObject<{
    action: z.ZodEnum<["delete", "update-status", "send", "void", "archive"]>;
    ids: z.ZodArray<z.ZodString, "many">;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    action: "delete" | "void" | "update-status" | "send" | "archive";
    ids: string[];
    data?: Record<string, unknown> | undefined;
}, {
    action: "delete" | "void" | "update-status" | "send" | "archive";
    ids: string[];
    data?: Record<string, unknown> | undefined;
}>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export declare const bulkActionResultSchema: z.ZodObject<{
    total: z.ZodNumber;
    succeeded: z.ZodNumber;
    failed: z.ZodNumber;
    results: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        status: z.ZodEnum<["success", "error"]>;
        error: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "success" | "error";
        id: string;
        error?: string | undefined;
    }, {
        status: "success" | "error";
        id: string;
        error?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    total: number;
    succeeded: number;
    failed: number;
    results: {
        status: "success" | "error";
        id: string;
        error?: string | undefined;
    }[];
}, {
    total: number;
    succeeded: number;
    failed: number;
    results: {
        status: "success" | "error";
        id: string;
        error?: string | undefined;
    }[];
}>;
export type BulkActionResult = z.infer<typeof bulkActionResultSchema>;
export declare const exportSchema: z.ZodObject<{
    format: z.ZodDefault<z.ZodEnum<["csv", "xlsx", "pdf"]>>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    columns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    format: "csv" | "xlsx" | "pdf";
    filters?: Record<string, unknown> | undefined;
    columns?: string[] | undefined;
}, {
    format?: "csv" | "xlsx" | "pdf" | undefined;
    filters?: Record<string, unknown> | undefined;
    columns?: string[] | undefined;
}>;
export type ExportInput = z.infer<typeof exportSchema>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export declare const resetPasswordSchema: z.ZodEffects<z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>, {
    password: string;
    token: string;
    confirmPassword: string;
}, {
    password: string;
    token: string;
    confirmPassword: string;
}>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export declare const registerSchema: z.ZodEffects<z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    confirmPassword: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    organizationName: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    organizationName: string;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    organizationName: string;
}>, {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    organizationName: string;
}, {
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    organizationName: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export declare const createOrganizationSchema: z.ZodObject<{
    name: z.ZodString;
    legalName: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    fiscalYearStart: z.ZodDefault<z.ZodNumber>;
    address: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    name: string;
    fiscalYearStart: number;
    email?: string | undefined;
    legalName?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    address?: any;
}, {
    name: string;
    email?: string | undefined;
    legalName?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    fiscalYearStart?: number | undefined;
    address?: any;
}>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export declare const updateOrganizationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    legalName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fiscalYearStart: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    name?: string | undefined;
    legalName?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    fiscalYearStart?: number | undefined;
    address?: any;
}, {
    email?: string | undefined;
    name?: string | undefined;
    legalName?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    fiscalYearStart?: number | undefined;
    address?: any;
}>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export declare const createCustomerSchema: z.ZodObject<{
    type: z.ZodDefault<z.ZodEnum<["COMPANY", "INDIVIDUAL"]>>;
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    billingAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>;
    shippingAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>;
    creditLimit: z.ZodOptional<z.ZodNumber>;
    paymentTerms: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    customerType: z.ZodDefault<z.ZodEnum<["ONE_TIME", "RECURRING", "GUEST", "PARTNER"]>>;
    creditHold: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    creditHoldReason: z.ZodOptional<z.ZodString>;
    riskRating: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>;
}, "strip", z.ZodTypeAny, {
    type: "COMPANY" | "INDIVIDUAL";
    name: string;
    paymentTerms: number;
    customerType: "ONE_TIME" | "RECURRING" | "GUEST" | "PARTNER";
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    billingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    creditLimit?: number | undefined;
    notes?: string | undefined;
    creditHold?: boolean | undefined;
    creditHoldReason?: string | undefined;
    riskRating?: "LOW" | "MEDIUM" | "HIGH" | undefined;
}, {
    name: string;
    type?: "COMPANY" | "INDIVIDUAL" | undefined;
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    billingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    creditLimit?: number | undefined;
    paymentTerms?: number | undefined;
    notes?: string | undefined;
    customerType?: "ONE_TIME" | "RECURRING" | "GUEST" | "PARTNER" | undefined;
    creditHold?: boolean | undefined;
    creditHoldReason?: string | undefined;
    riskRating?: "LOW" | "MEDIUM" | "HIGH" | undefined;
}>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export declare const updateCustomerSchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["COMPANY", "INDIVIDUAL"]>>>;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    billingAddress: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>>;
    shippingAddress: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>>;
    creditLimit: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    paymentTerms: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    customerType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["ONE_TIME", "RECURRING", "GUEST", "PARTNER"]>>>;
    creditHold: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    creditHoldReason: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    riskRating: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH"]>>>>;
}, "strip", z.ZodTypeAny, {
    type?: "COMPANY" | "INDIVIDUAL" | undefined;
    email?: string | undefined;
    name?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    billingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    creditLimit?: number | undefined;
    paymentTerms?: number | undefined;
    notes?: string | undefined;
    customerType?: "ONE_TIME" | "RECURRING" | "GUEST" | "PARTNER" | undefined;
    creditHold?: boolean | undefined;
    creditHoldReason?: string | undefined;
    riskRating?: "LOW" | "MEDIUM" | "HIGH" | undefined;
}, {
    type?: "COMPANY" | "INDIVIDUAL" | undefined;
    email?: string | undefined;
    name?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    billingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    creditLimit?: number | undefined;
    paymentTerms?: number | undefined;
    notes?: string | undefined;
    customerType?: "ONE_TIME" | "RECURRING" | "GUEST" | "PARTNER" | undefined;
    creditHold?: boolean | undefined;
    creditHoldReason?: string | undefined;
    riskRating?: "LOW" | "MEDIUM" | "HIGH" | undefined;
}>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export declare const createProductSchema: z.ZodObject<{
    sku: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["GOODS", "SERVICE", "DIGITAL", "SUBSCRIPTION"]>>;
    category: z.ZodOptional<z.ZodString>;
    unit: z.ZodDefault<z.ZodString>;
    costPrice: z.ZodNumber;
    sellPrice: z.ZodNumber;
    taxCategory: z.ZodOptional<z.ZodString>;
    requiresApproval: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "GOODS" | "SERVICE" | "DIGITAL" | "SUBSCRIPTION";
    name: string;
    sku: string;
    unit: string;
    costPrice: number;
    sellPrice: number;
    requiresApproval: boolean;
    description?: string | undefined;
    category?: string | undefined;
    taxCategory?: string | undefined;
}, {
    name: string;
    sku: string;
    costPrice: number;
    sellPrice: number;
    type?: "GOODS" | "SERVICE" | "DIGITAL" | "SUBSCRIPTION" | undefined;
    description?: string | undefined;
    category?: string | undefined;
    unit?: string | undefined;
    taxCategory?: string | undefined;
    requiresApproval?: boolean | undefined;
}>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export declare const updateProductSchema: z.ZodObject<Omit<{
    sku: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["GOODS", "SERVICE", "DIGITAL", "SUBSCRIPTION"]>>>;
    category: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    unit: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    costPrice: z.ZodOptional<z.ZodNumber>;
    sellPrice: z.ZodOptional<z.ZodNumber>;
    taxCategory: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    requiresApproval: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "sku">, "strip", z.ZodTypeAny, {
    type?: "GOODS" | "SERVICE" | "DIGITAL" | "SUBSCRIPTION" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    unit?: string | undefined;
    costPrice?: number | undefined;
    sellPrice?: number | undefined;
    taxCategory?: string | undefined;
    requiresApproval?: boolean | undefined;
}, {
    type?: "GOODS" | "SERVICE" | "DIGITAL" | "SUBSCRIPTION" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
    unit?: string | undefined;
    costPrice?: number | undefined;
    sellPrice?: number | undefined;
    taxCategory?: string | undefined;
    requiresApproval?: boolean | undefined;
}>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export declare const createWarehouseSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    address: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    isActive: boolean;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
}, {
    code: string;
    name: string;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    isActive?: boolean | undefined;
}>;
export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export declare const updateWarehouseSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    isActive?: boolean | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    address?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    isActive?: boolean | undefined;
}>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>;
export declare const createDepartmentSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    managerId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    parentId?: string | undefined;
    managerId?: string | undefined;
}, {
    code: string;
    name: string;
    parentId?: string | undefined;
    managerId?: string | undefined;
}>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export declare const updateDepartmentSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    managerId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    parentId?: string | undefined;
    managerId?: string | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    parentId?: string | undefined;
    managerId?: string | undefined;
}>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    roleIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    email: string;
    firstName: string;
    lastName: string;
    roleIds: string[];
}, {
    email: string;
    firstName: string;
    lastName: string;
    roleIds: string[];
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export declare const updateUserSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "LOCKED"]>>;
    roleIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "INACTIVE" | "LOCKED" | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    roleIds?: string[] | undefined;
}, {
    status?: "ACTIVE" | "INACTIVE" | "LOCKED" | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    roleIds?: string[] | undefined;
}>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export declare const updateProfileSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    currentPassword: z.ZodOptional<z.ZodString>;
    newPassword: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    avatarUrl?: string | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
    preferences?: any;
}, {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    avatarUrl?: string | undefined;
    currentPassword?: string | undefined;
    newPassword?: string | undefined;
    preferences?: any;
}>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export declare const createRoleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissions: string[];
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    permissions?: string[] | undefined;
}>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export declare const updateRoleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    permissions: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
}>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export declare const createEmployeeSchema: z.ZodObject<{
    employeeCode: z.ZodString;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    designation: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    dateOfJoining: z.ZodOptional<z.ZodString>;
    employmentType: z.ZodDefault<z.ZodEnum<["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]>>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "INVITED", "TERMINATED", "LEAVE"]>>;
}, "strip", z.ZodTypeAny, {
    status: "ACTIVE" | "INVITED" | "TERMINATED" | "LEAVE";
    email: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    employmentType: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";
    phone?: string | undefined;
    designation?: string | undefined;
    departmentId?: string | undefined;
    dateOfJoining?: string | undefined;
}, {
    email: string;
    firstName: string;
    lastName: string;
    employeeCode: string;
    status?: "ACTIVE" | "INVITED" | "TERMINATED" | "LEAVE" | undefined;
    phone?: string | undefined;
    designation?: string | undefined;
    departmentId?: string | undefined;
    dateOfJoining?: string | undefined;
    employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | undefined;
}>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export declare const updateEmployeeSchema: z.ZodObject<Omit<{
    employeeCode: z.ZodOptional<z.ZodString>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    designation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    dateOfJoining: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    employmentType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["ACTIVE", "INVITED", "TERMINATED", "LEAVE"]>>>;
}, "employeeCode">, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "INVITED" | "TERMINATED" | "LEAVE" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    designation?: string | undefined;
    departmentId?: string | undefined;
    dateOfJoining?: string | undefined;
    employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | undefined;
}, {
    status?: "ACTIVE" | "INVITED" | "TERMINATED" | "LEAVE" | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    designation?: string | undefined;
    departmentId?: string | undefined;
    dateOfJoining?: string | undefined;
    employmentType?: "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN" | undefined;
}>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export declare const createVendorSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    taxId: z.ZodOptional<z.ZodString>;
    paymentTerms: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodAny>;
    onboardingStatus: z.ZodOptional<z.ZodDefault<z.ZodEnum<["PENDING", "IN_PROGRESS", "QUALIFIED"]>>>;
    checklistTaxVerified: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    checklistBankVerified: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    checklistNdaSigned: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    averageLeadTimeDays: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    qualityScore: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    paymentTerms: number;
    type?: string | undefined;
    status?: string | undefined;
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: any;
    notes?: string | undefined;
    onboardingStatus?: "PENDING" | "IN_PROGRESS" | "QUALIFIED" | undefined;
    checklistTaxVerified?: boolean | undefined;
    checklistBankVerified?: boolean | undefined;
    checklistNdaSigned?: boolean | undefined;
    averageLeadTimeDays?: number | undefined;
    qualityScore?: number | undefined;
}, {
    name: string;
    type?: string | undefined;
    status?: string | undefined;
    email?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: any;
    paymentTerms?: number | undefined;
    notes?: string | undefined;
    onboardingStatus?: "PENDING" | "IN_PROGRESS" | "QUALIFIED" | undefined;
    checklistTaxVerified?: boolean | undefined;
    checklistBankVerified?: boolean | undefined;
    checklistNdaSigned?: boolean | undefined;
    averageLeadTimeDays?: number | undefined;
    qualityScore?: number | undefined;
}>;
export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export declare const updateVendorSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    taxId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    paymentTerms: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
    onboardingStatus: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["PENDING", "IN_PROGRESS", "QUALIFIED"]>>>>;
    checklistTaxVerified: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    checklistBankVerified: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    checklistNdaSigned: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodBoolean>>>;
    averageLeadTimeDays: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodNumber>>>;
    qualityScore: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodNumber>>>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    status?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: any;
    paymentTerms?: number | undefined;
    notes?: string | undefined;
    onboardingStatus?: "PENDING" | "IN_PROGRESS" | "QUALIFIED" | undefined;
    checklistTaxVerified?: boolean | undefined;
    checklistBankVerified?: boolean | undefined;
    checklistNdaSigned?: boolean | undefined;
    averageLeadTimeDays?: number | undefined;
    qualityScore?: number | undefined;
}, {
    type?: string | undefined;
    status?: string | undefined;
    email?: string | undefined;
    name?: string | undefined;
    taxId?: string | undefined;
    phone?: string | undefined;
    address?: any;
    paymentTerms?: number | undefined;
    notes?: string | undefined;
    onboardingStatus?: "PENDING" | "IN_PROGRESS" | "QUALIFIED" | undefined;
    checklistTaxVerified?: boolean | undefined;
    checklistBankVerified?: boolean | undefined;
    checklistNdaSigned?: boolean | undefined;
    averageLeadTimeDays?: number | undefined;
    qualityScore?: number | undefined;
}>;
export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
export declare const createInvoiceLineSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    taxRate: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    productId?: string | undefined;
}, {
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string | undefined;
    taxRate?: number | undefined;
}>;
export declare const createInvoiceSchema: z.ZodObject<{
    customerId: z.ZodString;
    invoiceNumber: z.ZodString;
    dueDate: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    invoiceNumber: string;
    dueDate: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }[];
    notes?: string | undefined;
}, {
    customerId: string;
    invoiceNumber: string;
    dueDate: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }[];
    notes?: string | undefined;
}>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export declare const updateInvoiceSchema: z.ZodObject<{
    dueDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    dueDate?: string | undefined;
    lineItems?: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }[] | undefined;
}, {
    notes?: string | undefined;
    dueDate?: string | undefined;
    lineItems?: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }[] | undefined;
}>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export declare const createPaymentSchema: z.ZodObject<{
    invoiceId: z.ZodString;
    amount: z.ZodNumber;
    method: z.ZodDefault<z.ZodEnum<["CASH", "CARD", "BANK_TRANSFER", "CHEQUE"]>>;
    reference: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    invoiceId: string;
    amount: number;
    method: "CASH" | "CARD" | "BANK_TRANSFER" | "CHEQUE";
    notes?: string | undefined;
    reference?: string | undefined;
}, {
    invoiceId: string;
    amount: number;
    notes?: string | undefined;
    method?: "CASH" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | undefined;
    reference?: string | undefined;
}>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export declare const createPurchaseOrderLineSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    taxRate: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    productId?: string | undefined;
}, {
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string | undefined;
    taxRate?: number | undefined;
}>;
export declare const createPurchaseOrderSchema: z.ZodObject<{
    vendorId: z.ZodString;
    poNumber: z.ZodString;
    expectedDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    shippingAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }[];
    vendorId: string;
    poNumber: string;
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    notes?: string | undefined;
    expectedDate?: string | undefined;
}, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }[];
    vendorId: string;
    poNumber: string;
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    notes?: string | undefined;
    expectedDate?: string | undefined;
}>;
export type CreatePurchaseOrderInput = z.infer<typeof createPurchaseOrderSchema>;
export declare const updatePurchaseOrderSchema: z.ZodObject<{
    expectedDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    lineItems?: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }[] | undefined;
    expectedDate?: string | undefined;
}, {
    notes?: string | undefined;
    lineItems?: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }[] | undefined;
    expectedDate?: string | undefined;
}>;
export type UpdatePurchaseOrderInput = z.infer<typeof updatePurchaseOrderSchema>;
export declare const createRFQSchema: z.ZodObject<{
    rfqNumber: z.ZodString;
    expectedDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        productId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        quantity: number;
        productId?: string | undefined;
    }[];
    rfqNumber: string;
    notes?: string | undefined;
    expectedDate?: string | undefined;
}, {
    lineItems: {
        description: string;
        quantity: number;
        productId?: string | undefined;
    }[];
    rfqNumber: string;
    notes?: string | undefined;
    expectedDate?: string | undefined;
}>;
export type CreateRFQInput = z.infer<typeof createRFQSchema>;
export declare const createSupplierQuotationSchema: z.ZodObject<{
    rfqId: z.ZodOptional<z.ZodString>;
    vendorId: z.ZodString;
    quotationNumber: z.ZodString;
    validUntil: z.ZodString;
    currency: z.ZodDefault<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }[];
    vendorId: string;
    quotationNumber: string;
    validUntil: string;
    currency: string;
    notes?: string | undefined;
    rfqId?: string | undefined;
}, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }[];
    vendorId: string;
    quotationNumber: string;
    validUntil: string;
    notes?: string | undefined;
    rfqId?: string | undefined;
    currency?: string | undefined;
}>;
export type CreateSupplierQuotationInput = z.infer<typeof createSupplierQuotationSchema>;
export declare const createPurchaseReceiptSchema: z.ZodObject<{
    purchaseOrderId: z.ZodString;
    receiptNumber: z.ZodString;
    warehouseId: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        receivedQty: z.ZodNumber;
        acceptedQty: z.ZodNumber;
        rejectedQty: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        receivedQty: number;
        acceptedQty: number;
        rejectedQty: number;
        productId?: string | undefined;
    }, {
        description: string;
        receivedQty: number;
        acceptedQty: number;
        productId?: string | undefined;
        rejectedQty?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        receivedQty: number;
        acceptedQty: number;
        rejectedQty: number;
        productId?: string | undefined;
    }[];
    purchaseOrderId: string;
    receiptNumber: string;
    notes?: string | undefined;
    warehouseId?: string | undefined;
}, {
    lineItems: {
        description: string;
        receivedQty: number;
        acceptedQty: number;
        productId?: string | undefined;
        rejectedQty?: number | undefined;
    }[];
    purchaseOrderId: string;
    receiptNumber: string;
    notes?: string | undefined;
    warehouseId?: string | undefined;
}>;
export type CreatePurchaseReceiptInput = z.infer<typeof createPurchaseReceiptSchema>;
export declare const createPurchaseReturnSchema: z.ZodObject<{
    purchaseOrderId: z.ZodString;
    returnNumber: z.ZodString;
    purchaseReceiptId: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodDefault<z.ZodNumber>;
        taxRate: z.ZodDefault<z.ZodNumber>;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
        reason?: string | undefined;
    }, {
        description: string;
        quantity: number;
        productId?: string | undefined;
        unitPrice?: number | undefined;
        taxRate?: number | undefined;
        reason?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
        reason?: string | undefined;
    }[];
    purchaseOrderId: string;
    returnNumber: string;
    notes?: string | undefined;
    purchaseReceiptId?: string | undefined;
    reason?: string | undefined;
}, {
    lineItems: {
        description: string;
        quantity: number;
        productId?: string | undefined;
        unitPrice?: number | undefined;
        taxRate?: number | undefined;
        reason?: string | undefined;
    }[];
    purchaseOrderId: string;
    returnNumber: string;
    notes?: string | undefined;
    purchaseReceiptId?: string | undefined;
    reason?: string | undefined;
}>;
export type CreatePurchaseReturnInput = z.infer<typeof createPurchaseReturnSchema>;
export declare const updatePurchaseReturnSchema: z.ZodObject<Omit<{
    purchaseOrderId: z.ZodOptional<z.ZodString>;
    returnNumber: z.ZodOptional<z.ZodString>;
    purchaseReceiptId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    reason: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    lineItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodDefault<z.ZodNumber>;
        taxRate: z.ZodDefault<z.ZodNumber>;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
        reason?: string | undefined;
    }, {
        description: string;
        quantity: number;
        productId?: string | undefined;
        unitPrice?: number | undefined;
        taxRate?: number | undefined;
        reason?: string | undefined;
    }>, "many">>;
}, "returnNumber">, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    lineItems?: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
        reason?: string | undefined;
    }[] | undefined;
    purchaseOrderId?: string | undefined;
    purchaseReceiptId?: string | undefined;
    reason?: string | undefined;
}, {
    notes?: string | undefined;
    lineItems?: {
        description: string;
        quantity: number;
        productId?: string | undefined;
        unitPrice?: number | undefined;
        taxRate?: number | undefined;
        reason?: string | undefined;
    }[] | undefined;
    purchaseOrderId?: string | undefined;
    purchaseReceiptId?: string | undefined;
    reason?: string | undefined;
}>;
export type UpdatePurchaseReturnInput = z.infer<typeof updatePurchaseReturnSchema>;
export declare const createPurchaseRequisitionSchema: z.ZodObject<{
    requisitionNumber: z.ZodString;
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodOptional<z.ZodString>;
    requiredDate: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        estimatedPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        estimatedPrice: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        estimatedPrice: number;
        productId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        quantity: number;
        estimatedPrice: number;
        productId?: string | undefined;
    }[];
    requisitionNumber: string;
    title: string;
    notes?: string | undefined;
    description?: string | undefined;
    departmentId?: string | undefined;
    requiredDate?: string | undefined;
}, {
    lineItems: {
        description: string;
        quantity: number;
        estimatedPrice: number;
        productId?: string | undefined;
    }[];
    requisitionNumber: string;
    title: string;
    notes?: string | undefined;
    description?: string | undefined;
    departmentId?: string | undefined;
    requiredDate?: string | undefined;
}>;
export type CreatePurchaseRequisitionInput = z.infer<typeof createPurchaseRequisitionSchema>;
export declare const createBlanketPurchaseAgreementSchema: z.ZodObject<{
    agreementNumber: z.ZodString;
    vendorId: z.ZodString;
    title: z.ZodString;
    startDate: z.ZodString;
    endDate: z.ZodString;
    agreementLimit: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
    }[];
    vendorId: string;
    currency: string;
    title: string;
    agreementNumber: string;
    startDate: string;
    endDate: string;
    agreementLimit: number;
    notes?: string | undefined;
}, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
    }[];
    vendorId: string;
    title: string;
    agreementNumber: string;
    startDate: string;
    endDate: string;
    agreementLimit: number;
    notes?: string | undefined;
    currency?: string | undefined;
}>;
export type CreateBlanketPurchaseAgreementInput = z.infer<typeof createBlanketPurchaseAgreementSchema>;
export declare const submitPublicBidSchema: z.ZodObject<{
    vendorId: z.ZodString;
    quotationNumber: z.ZodString;
    validUntil: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }[];
    vendorId: string;
    quotationNumber: string;
    validUntil: string;
    notes?: string | undefined;
}, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }[];
    vendorId: string;
    quotationNumber: string;
    validUntil: string;
    notes?: string | undefined;
}>;
export type SubmitPublicBidInput = z.infer<typeof submitPublicBidSchema>;
export declare const createQuotationLineSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    taxRate: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    productId?: string | undefined;
}, {
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string | undefined;
    taxRate?: number | undefined;
}>;
export declare const createQuotationSchema: z.ZodObject<{
    customerId: z.ZodString;
    quotationNumber: z.ZodString;
    validUntil: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    termsConditions: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }[];
    quotationNumber: string;
    validUntil: string;
    notes?: string | undefined;
    termsConditions?: string | undefined;
}, {
    customerId: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }[];
    quotationNumber: string;
    validUntil: string;
    notes?: string | undefined;
    termsConditions?: string | undefined;
}>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export declare const createSalesOrderSchema: z.ZodObject<{
    customerId: z.ZodString;
    orderNumber: z.ZodString;
    quotationId: z.ZodOptional<z.ZodString>;
    deliveryDate: z.ZodOptional<z.ZodString>;
    salesChannel: z.ZodDefault<z.ZodEnum<["B2B", "B2C", "D2C"]>>;
    paymentMethod: z.ZodOptional<z.ZodEnum<["BANK_TRANSFER", "CASH", "CARD", "CHEQUE"]>>;
    paymentStatus: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    shippingAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        taxRate: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    customerId: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
    }[];
    orderNumber: string;
    salesChannel: "B2B" | "B2C" | "D2C";
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    notes?: string | undefined;
    quotationId?: string | undefined;
    deliveryDate?: string | undefined;
    paymentMethod?: "CASH" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | undefined;
    paymentStatus?: string | undefined;
}, {
    customerId: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        productId?: string | undefined;
        taxRate?: number | undefined;
    }[];
    orderNumber: string;
    shippingAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    notes?: string | undefined;
    quotationId?: string | undefined;
    deliveryDate?: string | undefined;
    salesChannel?: "B2B" | "B2C" | "D2C" | undefined;
    paymentMethod?: "CASH" | "CARD" | "BANK_TRANSFER" | "CHEQUE" | undefined;
    paymentStatus?: string | undefined;
}>;
export type CreateSalesOrderInput = z.infer<typeof createSalesOrderSchema>;
export declare const updateSalesOrderStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["DRAFT", "CONFIRMED", "PROCESSING", "PARTIALLY_DELIVERED", "DELIVERED", "CANCELLED"]>;
}, "strip", z.ZodTypeAny, {
    status: "CANCELLED" | "DRAFT" | "CONFIRMED" | "PROCESSING" | "DELIVERED" | "PARTIALLY_DELIVERED";
}, {
    status: "CANCELLED" | "DRAFT" | "CONFIRMED" | "PROCESSING" | "DELIVERED" | "PARTIALLY_DELIVERED";
}>;
export type UpdateSalesOrderStatusInput = z.infer<typeof updateSalesOrderStatusSchema>;
export declare const createDeliveryNoteSchema: z.ZodObject<{
    salesOrderId: z.ZodString;
    deliveryNumber: z.ZodString;
    warehouseId: z.ZodOptional<z.ZodString>;
    carrierName: z.ZodOptional<z.ZodString>;
    trackingNumber: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        deliveredQty: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        deliveredQty: number;
        productId?: string | undefined;
    }, {
        description: string;
        deliveredQty: number;
        productId?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        deliveredQty: number;
        productId?: string | undefined;
    }[];
    salesOrderId: string;
    deliveryNumber: string;
    notes?: string | undefined;
    warehouseId?: string | undefined;
    carrierName?: string | undefined;
    trackingNumber?: string | undefined;
}, {
    lineItems: {
        description: string;
        deliveredQty: number;
        productId?: string | undefined;
    }[];
    salesOrderId: string;
    deliveryNumber: string;
    notes?: string | undefined;
    warehouseId?: string | undefined;
    carrierName?: string | undefined;
    trackingNumber?: string | undefined;
}>;
export type CreateDeliveryNoteInput = z.infer<typeof createDeliveryNoteSchema>;
export declare const createSalesReturnSchema: z.ZodObject<{
    salesOrderId: z.ZodString;
    returnNumber: z.ZodString;
    deliveryNoteId: z.ZodOptional<z.ZodString>;
    reason: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodArray<z.ZodObject<{
        productId: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        taxRate: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        reason: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
        reason?: string | undefined;
    }, {
        description: string;
        quantity: number;
        productId?: string | undefined;
        unitPrice?: number | undefined;
        taxRate?: number | undefined;
        reason?: string | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        productId?: string | undefined;
        reason?: string | undefined;
    }[];
    returnNumber: string;
    salesOrderId: string;
    notes?: string | undefined;
    reason?: string | undefined;
    deliveryNoteId?: string | undefined;
}, {
    lineItems: {
        description: string;
        quantity: number;
        productId?: string | undefined;
        unitPrice?: number | undefined;
        taxRate?: number | undefined;
        reason?: string | undefined;
    }[];
    returnNumber: string;
    salesOrderId: string;
    notes?: string | undefined;
    reason?: string | undefined;
    deliveryNoteId?: string | undefined;
}>;
export type CreateSalesReturnInput = z.infer<typeof createSalesReturnSchema>;
export declare const createLeadSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    salutation: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    mobile: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    sourceId: z.ZodOptional<z.ZodString>;
    campaignId: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    employeeCount: z.ZodOptional<z.ZodNumber>;
    annualRevenue: z.ZodOptional<z.ZodNumber>;
    country: z.ZodOptional<z.ZodString>;
    region: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    country?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    notes?: string | undefined;
    title?: string | undefined;
    salutation?: string | undefined;
    company?: string | undefined;
    mobile?: string | undefined;
    sourceId?: string | undefined;
    campaignId?: string | undefined;
    industry?: string | undefined;
    employeeCount?: number | undefined;
    annualRevenue?: number | undefined;
    region?: string | undefined;
    assignedToId?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    country?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    notes?: string | undefined;
    title?: string | undefined;
    salutation?: string | undefined;
    company?: string | undefined;
    mobile?: string | undefined;
    sourceId?: string | undefined;
    campaignId?: string | undefined;
    industry?: string | undefined;
    employeeCount?: number | undefined;
    annualRevenue?: number | undefined;
    region?: string | undefined;
    assignedToId?: string | undefined;
}>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export declare const updateLeadSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    salutation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    company: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    mobile: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    website: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sourceId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    campaignId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    industry: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    employeeCount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    annualRevenue: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    country: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    region: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    country?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    notes?: string | undefined;
    title?: string | undefined;
    salutation?: string | undefined;
    company?: string | undefined;
    mobile?: string | undefined;
    sourceId?: string | undefined;
    campaignId?: string | undefined;
    industry?: string | undefined;
    employeeCount?: number | undefined;
    annualRevenue?: number | undefined;
    region?: string | undefined;
    assignedToId?: string | undefined;
}, {
    country?: string | undefined;
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    website?: string | undefined;
    notes?: string | undefined;
    title?: string | undefined;
    salutation?: string | undefined;
    company?: string | undefined;
    mobile?: string | undefined;
    sourceId?: string | undefined;
    campaignId?: string | undefined;
    industry?: string | undefined;
    employeeCount?: number | undefined;
    annualRevenue?: number | undefined;
    region?: string | undefined;
    assignedToId?: string | undefined;
}>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export declare const updateLeadStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["NEW", "CONTACTED", "QUALIFIED", "DISQUALIFIED", "CONVERTED"]>;
}, "strip", z.ZodTypeAny, {
    status: "QUALIFIED" | "NEW" | "CONTACTED" | "DISQUALIFIED" | "CONVERTED";
}, {
    status: "QUALIFIED" | "NEW" | "CONTACTED" | "DISQUALIFIED" | "CONVERTED";
}>;
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>;
export declare const convertLeadSchema: z.ZodObject<{
    customerName: z.ZodString;
    opportunityName: z.ZodString;
    opportunityAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    customerName: string;
    opportunityName: string;
    opportunityAmount?: number | undefined;
}, {
    customerName: string;
    opportunityName: string;
    opportunityAmount?: number | undefined;
}>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
export declare const createOpportunitySchema: z.ZodObject<{
    name: z.ZodString;
    customerId: z.ZodOptional<z.ZodString>;
    leadId: z.ZodOptional<z.ZodString>;
    pipelineId: z.ZodOptional<z.ZodString>;
    stage: z.ZodDefault<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    probability: z.ZodDefault<z.ZodNumber>;
    expectedCloseDate: z.ZodOptional<z.ZodString>;
    competitor: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    stage: string;
    probability: number;
    notes?: string | undefined;
    customerId?: string | undefined;
    amount?: number | undefined;
    assignedToId?: string | undefined;
    leadId?: string | undefined;
    pipelineId?: string | undefined;
    expectedCloseDate?: string | undefined;
    competitor?: string | undefined;
}, {
    name: string;
    notes?: string | undefined;
    customerId?: string | undefined;
    amount?: number | undefined;
    assignedToId?: string | undefined;
    leadId?: string | undefined;
    pipelineId?: string | undefined;
    stage?: string | undefined;
    probability?: number | undefined;
    expectedCloseDate?: string | undefined;
    competitor?: string | undefined;
}>;
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>;
export declare const updateOpportunitySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    leadId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pipelineId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    stage: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    amount: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    probability: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    expectedCloseDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    competitor: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    amount?: number | undefined;
    assignedToId?: string | undefined;
    leadId?: string | undefined;
    pipelineId?: string | undefined;
    stage?: string | undefined;
    probability?: number | undefined;
    expectedCloseDate?: string | undefined;
    competitor?: string | undefined;
}, {
    name?: string | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    amount?: number | undefined;
    assignedToId?: string | undefined;
    leadId?: string | undefined;
    pipelineId?: string | undefined;
    stage?: string | undefined;
    probability?: number | undefined;
    expectedCloseDate?: string | undefined;
    competitor?: string | undefined;
}>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export declare const updateOpportunityStageSchema: z.ZodObject<{
    stage: z.ZodString;
}, "strip", z.ZodTypeAny, {
    stage: string;
}, {
    stage: string;
}>;
export type UpdateOpportunityStageInput = z.infer<typeof updateOpportunityStageSchema>;
export declare const createActivitySchema: z.ZodObject<{
    type: z.ZodEnum<["CALL", "EMAIL", "MEETING", "NOTE", "TASK"]>;
    subject: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    leadId: z.ZodOptional<z.ZodString>;
    opportunityId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
    contactId: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK";
    subject: string;
    description?: string | undefined;
    customerId?: string | undefined;
    dueDate?: string | undefined;
    assignedToId?: string | undefined;
    leadId?: string | undefined;
    opportunityId?: string | undefined;
    contactId?: string | undefined;
}, {
    type: "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK";
    subject: string;
    description?: string | undefined;
    customerId?: string | undefined;
    dueDate?: string | undefined;
    assignedToId?: string | undefined;
    leadId?: string | undefined;
    opportunityId?: string | undefined;
    contactId?: string | undefined;
}>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export declare const createEmailTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    category: z.ZodDefault<z.ZodEnum<["GENERAL", "QUOTATION", "INVOICE", "FOLLOWUP"]>>;
    subject: z.ZodString;
    body: z.ZodString;
    variables: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    category: "GENERAL" | "QUOTATION" | "INVOICE" | "FOLLOWUP";
    subject: string;
    body: string;
    variables: string[];
}, {
    name: string;
    subject: string;
    body: string;
    category?: "GENERAL" | "QUOTATION" | "INVOICE" | "FOLLOWUP" | undefined;
    variables?: string[] | undefined;
}>;
export type CreateEmailTemplateInput = z.infer<typeof createEmailTemplateSchema>;
export declare const updateEmailTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodDefault<z.ZodEnum<["GENERAL", "QUOTATION", "INVOICE", "FOLLOWUP"]>>>;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    variables: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    category?: "GENERAL" | "QUOTATION" | "INVOICE" | "FOLLOWUP" | undefined;
    subject?: string | undefined;
    body?: string | undefined;
    variables?: string[] | undefined;
}, {
    name?: string | undefined;
    category?: "GENERAL" | "QUOTATION" | "INVOICE" | "FOLLOWUP" | undefined;
    subject?: string | undefined;
    body?: string | undefined;
    variables?: string[] | undefined;
}>;
export type UpdateEmailTemplateInput = z.infer<typeof updateEmailTemplateSchema>;
export declare const createSalesPipelineSchema: z.ZodObject<{
    name: z.ZodString;
    stages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    stages: string[];
    isDefault?: boolean | undefined;
}, {
    name: string;
    isActive?: boolean | undefined;
    stages?: string[] | undefined;
    isDefault?: boolean | undefined;
}>;
export type CreateSalesPipelineInput = z.infer<typeof createSalesPipelineSchema>;
export declare const createCampaignSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["EMAIL", "SOCIAL", "EVENT", "WEBINAR", "OTHER"]>>;
    status: z.ZodDefault<z.ZodEnum<["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    budget: z.ZodOptional<z.ZodNumber>;
    actualCost: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "EMAIL" | "SOCIAL" | "EVENT" | "WEBINAR" | "OTHER";
    status: "ACTIVE" | "CANCELLED" | "PLANNED" | "COMPLETED";
    name: string;
    notes?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    budget?: number | undefined;
    actualCost?: number | undefined;
}, {
    name: string;
    type?: "EMAIL" | "SOCIAL" | "EVENT" | "WEBINAR" | "OTHER" | undefined;
    status?: "ACTIVE" | "CANCELLED" | "PLANNED" | "COMPLETED" | undefined;
    notes?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    budget?: number | undefined;
    actualCost?: number | undefined;
}>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export declare const updateAdminSettingsSchema: z.ZodObject<{
    theme: z.ZodOptional<z.ZodString>;
    companyName: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    primaryColor: z.ZodOptional<z.ZodString>;
    modules: z.ZodOptional<z.ZodAny>;
    taxId: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    taxId?: string | undefined;
    address?: any;
    currency?: string | undefined;
    theme?: string | undefined;
    companyName?: string | undefined;
    language?: string | undefined;
    primaryColor?: string | undefined;
    modules?: any;
    timezone?: string | undefined;
}, {
    taxId?: string | undefined;
    address?: any;
    currency?: string | undefined;
    theme?: string | undefined;
    companyName?: string | undefined;
    language?: string | undefined;
    primaryColor?: string | undefined;
    modules?: any;
    timezone?: string | undefined;
}>;
export type UpdateAdminSettingsInput = z.infer<typeof updateAdminSettingsSchema>;
export declare const createContactSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodString>;
    salutation: z.ZodOptional<z.ZodString>;
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    mobile: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    department: z.ZodOptional<z.ZodString>;
    isPrimary: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
    secondaryEmail: z.ZodOptional<z.ZodString>;
    preferredContactMethod: z.ZodOptional<z.ZodString>;
    engagementScore: z.ZodOptional<z.ZodNumber>;
    socialProfiles: z.ZodOptional<z.ZodAny>;
    lifecycleStatus: z.ZodOptional<z.ZodString>;
    buyingRole: z.ZodOptional<z.ZodDefault<z.ZodEnum<["BUYER", "DECISION_MAKER", "INFLUENCER", "GATEKEEPER", "TECHNICAL", "BILLING"]>>>;
    lastContactedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    interactionVelocity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    isPrimary: boolean;
    email?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    title?: string | undefined;
    salutation?: string | undefined;
    mobile?: string | undefined;
    department?: string | undefined;
    secondaryEmail?: string | undefined;
    preferredContactMethod?: string | undefined;
    engagementScore?: number | undefined;
    socialProfiles?: any;
    lifecycleStatus?: string | undefined;
    buyingRole?: "BUYER" | "DECISION_MAKER" | "INFLUENCER" | "GATEKEEPER" | "TECHNICAL" | "BILLING" | undefined;
    lastContactedAt?: string | null | undefined;
    interactionVelocity?: number | undefined;
}, {
    firstName: string;
    lastName: string;
    email?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    title?: string | undefined;
    salutation?: string | undefined;
    mobile?: string | undefined;
    department?: string | undefined;
    isPrimary?: boolean | undefined;
    secondaryEmail?: string | undefined;
    preferredContactMethod?: string | undefined;
    engagementScore?: number | undefined;
    socialProfiles?: any;
    lifecycleStatus?: string | undefined;
    buyingRole?: "BUYER" | "DECISION_MAKER" | "INFLUENCER" | "GATEKEEPER" | "TECHNICAL" | "BILLING" | undefined;
    lastContactedAt?: string | null | undefined;
    interactionVelocity?: number | undefined;
}>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export declare const updateContactSchema: z.ZodObject<{
    customerId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    salutation: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    phone: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    mobile: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    department: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isPrimary: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    notes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    secondaryEmail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    preferredContactMethod: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    engagementScore: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    socialProfiles: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
    lifecycleStatus: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    buyingRole: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["BUYER", "DECISION_MAKER", "INFLUENCER", "GATEKEEPER", "TECHNICAL", "BILLING"]>>>>;
    lastContactedAt: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    interactionVelocity: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodNumber>>>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    title?: string | undefined;
    salutation?: string | undefined;
    mobile?: string | undefined;
    department?: string | undefined;
    isPrimary?: boolean | undefined;
    secondaryEmail?: string | undefined;
    preferredContactMethod?: string | undefined;
    engagementScore?: number | undefined;
    socialProfiles?: any;
    lifecycleStatus?: string | undefined;
    buyingRole?: "BUYER" | "DECISION_MAKER" | "INFLUENCER" | "GATEKEEPER" | "TECHNICAL" | "BILLING" | undefined;
    lastContactedAt?: string | null | undefined;
    interactionVelocity?: number | undefined;
}, {
    email?: string | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | undefined;
    notes?: string | undefined;
    customerId?: string | undefined;
    title?: string | undefined;
    salutation?: string | undefined;
    mobile?: string | undefined;
    department?: string | undefined;
    isPrimary?: boolean | undefined;
    secondaryEmail?: string | undefined;
    preferredContactMethod?: string | undefined;
    engagementScore?: number | undefined;
    socialProfiles?: any;
    lifecycleStatus?: string | undefined;
    buyingRole?: "BUYER" | "DECISION_MAKER" | "INFLUENCER" | "GATEKEEPER" | "TECHNICAL" | "BILLING" | undefined;
    lastContactedAt?: string | null | undefined;
    interactionVelocity?: number | undefined;
}>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export declare const createProjectSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    budget: z.ZodOptional<z.ZodNumber>;
    portfolioId: z.ZodOptional<z.ZodString>;
    customerId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    description?: string | undefined;
    customerId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    budget?: number | undefined;
    portfolioId?: string | undefined;
}, {
    code: string;
    name: string;
    description?: string | undefined;
    customerId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    budget?: number | undefined;
    portfolioId?: string | undefined;
}>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export declare const updateProjectSchema: z.ZodObject<Omit<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    budget: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    portfolioId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    customerId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "code">, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    customerId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    budget?: number | undefined;
    portfolioId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    customerId?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    budget?: number | undefined;
    portfolioId?: string | undefined;
}>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export declare const createTaskSchema: z.ZodObject<{
    projectId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]>>;
    priority: z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>;
    dueDate: z.ZodOptional<z.ZodString>;
    assignedToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "IN_PROGRESS" | "BACKLOG" | "TODO" | "IN_REVIEW" | "DONE";
    name: string;
    projectId: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    description?: string | undefined;
    dueDate?: string | undefined;
    assignedToId?: string | undefined;
}, {
    name: string;
    projectId: string;
    status?: "IN_PROGRESS" | "BACKLOG" | "TODO" | "IN_REVIEW" | "DONE" | undefined;
    description?: string | undefined;
    dueDate?: string | undefined;
    assignedToId?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
}>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export declare const updateTaskSchema: z.ZodObject<Omit<{
    projectId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]>>>;
    priority: z.ZodOptional<z.ZodDefault<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "URGENT"]>>>;
    dueDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    assignedToId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "projectId">, "strip", z.ZodTypeAny, {
    status?: "IN_PROGRESS" | "BACKLOG" | "TODO" | "IN_REVIEW" | "DONE" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    dueDate?: string | undefined;
    assignedToId?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
}, {
    status?: "IN_PROGRESS" | "BACKLOG" | "TODO" | "IN_REVIEW" | "DONE" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    dueDate?: string | undefined;
    assignedToId?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | undefined;
}>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export declare const createBOMSchema: z.ZodObject<{
    productId: z.ZodString;
    name: z.ZodString;
    code: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
    }, {
        productId: string;
        quantity: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    productId: string;
    items: {
        productId: string;
        quantity: number;
    }[];
}, {
    code: string;
    name: string;
    productId: string;
    items: {
        productId: string;
        quantity: number;
    }[];
}>;
export type CreateBOMInput = z.infer<typeof createBOMSchema>;
export declare const createWorkOrderSchema: z.ZodObject<{
    bomId: z.ZodString;
    workOrderNumber: z.ZodString;
    quantity: z.ZodNumber;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    bomId: string;
    workOrderNumber: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    quantity: number;
    bomId: string;
    workOrderNumber: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export declare const updateShipmentStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "RETURNED", "CANCELLED"]>;
}, "strip", z.ZodTypeAny, {
    status: "CANCELLED" | "DELIVERED" | "RETURNED" | "PENDING" | "PICKED_UP" | "IN_TRANSIT";
}, {
    status: "CANCELLED" | "DELIVERED" | "RETURNED" | "PENDING" | "PICKED_UP" | "IN_TRANSIT";
}>;
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;
export declare const createShipmentSchema: z.ZodObject<{
    shipmentNumber: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["INBOUND", "OUTBOUND", "TRANSFER"]>>;
    carrierName: z.ZodOptional<z.ZodString>;
    trackingNumber: z.ZodOptional<z.ZodString>;
    originAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>;
    destAddress: z.ZodOptional<z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zip: z.ZodString;
        country: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }, {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    }>>;
    weight: z.ZodOptional<z.ZodNumber>;
    weightUnit: z.ZodDefault<z.ZodString>;
    shippingCost: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
    estimatedDelivery: z.ZodOptional<z.ZodString>;
    trackingUrl: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "INBOUND" | "OUTBOUND" | "TRANSFER";
    currency: string;
    shipmentNumber: string;
    weightUnit: string;
    notes?: string | undefined;
    carrierName?: string | undefined;
    trackingNumber?: string | undefined;
    originAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    destAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    weight?: number | undefined;
    shippingCost?: number | undefined;
    estimatedDelivery?: string | undefined;
    trackingUrl?: string | undefined;
}, {
    shipmentNumber: string;
    type?: "INBOUND" | "OUTBOUND" | "TRANSFER" | undefined;
    notes?: string | undefined;
    currency?: string | undefined;
    carrierName?: string | undefined;
    trackingNumber?: string | undefined;
    originAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    destAddress?: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    } | undefined;
    weight?: number | undefined;
    weightUnit?: string | undefined;
    shippingCost?: number | undefined;
    estimatedDelivery?: string | undefined;
    trackingUrl?: string | undefined;
}>;
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
export declare const statusUpdateSchema: <T extends [string, ...string[]]>(statuses: T) => z.ZodObject<{
    status: z.ZodEnum<z.Writeable<T>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    status: z.ZodEnum<z.Writeable<T>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    status: z.ZodEnum<z.Writeable<T>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const invoiceStatusSchema: z.ZodEnum<["DRAFT", "SENT", "PAID", "PARTIALLY_PAID", "OVERDUE", "CANCELLED", "VOID"]>;
export type InvoiceStatusZod = z.infer<typeof invoiceStatusSchema>;
export declare const purchaseOrderStatusSchema: z.ZodEnum<["DRAFT", "SUBMITTED", "APPROVED", "PARTIALLY_RECEIVED", "RECEIVED", "CANCELLED"]>;
export type PurchaseOrderStatusZod = z.infer<typeof purchaseOrderStatusSchema>;
export declare const salesOrderStatusSchema: z.ZodEnum<["DRAFT", "CONFIRMED", "PROCESSING", "PARTIALLY_DELIVERED", "DELIVERED", "CANCELLED"]>;
export type SalesOrderStatusZod = z.infer<typeof salesOrderStatusSchema>;
export declare const projectStatusSchema: z.ZodEnum<["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]>;
export type ProjectStatusZod = z.infer<typeof projectStatusSchema>;
export declare const employeeStatusSchema: z.ZodEnum<["ACTIVE", "INVITED", "TERMINATED", "LEAVE"]>;
export type EmployeeStatusZod = z.infer<typeof employeeStatusSchema>;
export declare const builderFieldSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    type: z.ZodString;
    options: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">, z.ZodNull]>>;
    required: z.ZodOptional<z.ZodBoolean>;
    readOnly: z.ZodOptional<z.ZodBoolean>;
    defaultValue: z.ZodOptional<z.ZodUnknown>;
    inListView: z.ZodOptional<z.ZodBoolean>;
    readRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    writeRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    formula: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    placeholder: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    columnSpan: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    weight: z.ZodOptional<z.ZodNumber>;
    dataSource: z.ZodOptional<z.ZodString>;
    dataFilter: z.ZodOptional<z.ZodString>;
    visibilityRule: z.ZodOptional<z.ZodString>;
    minLength: z.ZodOptional<z.ZodNumber>;
    maxLength: z.ZodOptional<z.ZodNumber>;
    regexPattern: z.ZodOptional<z.ZodString>;
    cssClass: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    options?: string | unknown[] | null | undefined;
    id?: string | undefined;
    description?: string | undefined;
    weight?: number | undefined;
    label?: string | undefined;
    required?: boolean | undefined;
    readOnly?: boolean | undefined;
    defaultValue?: unknown;
    inListView?: boolean | undefined;
    readRoles?: string | null | undefined;
    writeRoles?: string | null | undefined;
    formula?: string | null | undefined;
    placeholder?: string | undefined;
    columnSpan?: number | undefined;
    height?: number | undefined;
    dataSource?: string | undefined;
    dataFilter?: string | undefined;
    visibilityRule?: string | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    regexPattern?: string | undefined;
    cssClass?: string | undefined;
}, {
    type: string;
    name: string;
    options?: string | unknown[] | null | undefined;
    id?: string | undefined;
    description?: string | undefined;
    weight?: number | undefined;
    label?: string | undefined;
    required?: boolean | undefined;
    readOnly?: boolean | undefined;
    defaultValue?: unknown;
    inListView?: boolean | undefined;
    readRoles?: string | null | undefined;
    writeRoles?: string | null | undefined;
    formula?: string | null | undefined;
    placeholder?: string | undefined;
    columnSpan?: number | undefined;
    height?: number | undefined;
    dataSource?: string | undefined;
    dataFilter?: string | undefined;
    visibilityRule?: string | undefined;
    minLength?: number | undefined;
    maxLength?: number | undefined;
    regexPattern?: string | undefined;
    cssClass?: string | undefined;
}>;
export type BuilderFieldInput = z.infer<typeof builderFieldSchema>;
export declare const createBuilderFormSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    module: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        options: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">, z.ZodNull]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        readOnly: z.ZodOptional<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodUnknown>;
        inListView: z.ZodOptional<z.ZodBoolean>;
        readRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        writeRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        formula: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        placeholder: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        columnSpan: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        weight: z.ZodOptional<z.ZodNumber>;
        dataSource: z.ZodOptional<z.ZodString>;
        dataFilter: z.ZodOptional<z.ZodString>;
        visibilityRule: z.ZodOptional<z.ZodString>;
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        regexPattern: z.ZodOptional<z.ZodString>;
        cssClass: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }>, "many">>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    description?: string | undefined;
    icon?: string | undefined;
    module?: string | undefined;
    fields?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
}, {
    name: string;
    slug: string;
    description?: string | undefined;
    icon?: string | undefined;
    module?: string | undefined;
    fields?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
}>;
export type CreateBuilderFormInput = z.infer<typeof createBuilderFormSchema>;
export declare const updateBuilderFormSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    module: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fields: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        options: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">, z.ZodNull]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        readOnly: z.ZodOptional<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodUnknown>;
        inListView: z.ZodOptional<z.ZodBoolean>;
        readRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        writeRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        formula: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        placeholder: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        columnSpan: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        weight: z.ZodOptional<z.ZodNumber>;
        dataSource: z.ZodOptional<z.ZodString>;
        dataFilter: z.ZodOptional<z.ZodString>;
        visibilityRule: z.ZodOptional<z.ZodString>;
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        regexPattern: z.ZodOptional<z.ZodString>;
        cssClass: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }>, "many">>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "ARCHIVED" | "DRAFT" | "PUBLISHED" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | undefined;
    module?: string | undefined;
    fields?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
}, {
    status?: "ARCHIVED" | "DRAFT" | "PUBLISHED" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | undefined;
    module?: string | undefined;
    fields?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
}>;
export type UpdateBuilderFormInput = z.infer<typeof updateBuilderFormSchema>;
export declare const createSchemaRegistrySchema: z.ZodObject<{
    module: z.ZodString;
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        options: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">, z.ZodNull]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        readOnly: z.ZodOptional<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodUnknown>;
        inListView: z.ZodOptional<z.ZodBoolean>;
        readRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        writeRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        formula: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        placeholder: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        columnSpan: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        weight: z.ZodOptional<z.ZodNumber>;
        dataSource: z.ZodOptional<z.ZodString>;
        dataFilter: z.ZodOptional<z.ZodString>;
        visibilityRule: z.ZodOptional<z.ZodString>;
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        regexPattern: z.ZodOptional<z.ZodString>;
        cssClass: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }>, "many">>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    module: string;
    description?: string | undefined;
    fields?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
}, {
    name: string;
    slug: string;
    module: string;
    description?: string | undefined;
    fields?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
}>;
export type CreateSchemaRegistryInput = z.infer<typeof createSchemaRegistrySchema>;
export declare const updateSchemaRegistrySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fields: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        options: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">, z.ZodNull]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        readOnly: z.ZodOptional<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodUnknown>;
        inListView: z.ZodOptional<z.ZodBoolean>;
        readRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        writeRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        formula: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        placeholder: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        columnSpan: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        weight: z.ZodOptional<z.ZodNumber>;
        dataSource: z.ZodOptional<z.ZodString>;
        dataFilter: z.ZodOptional<z.ZodString>;
        visibilityRule: z.ZodOptional<z.ZodString>;
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        regexPattern: z.ZodOptional<z.ZodString>;
        cssClass: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }>, "many">>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    fields?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
}, {
    status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    fields?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
}>;
export type UpdateSchemaRegistryInput = z.infer<typeof updateSchemaRegistrySchema>;
export declare const createPageRegistrySchema: z.ZodObject<{
    schemaId: z.ZodOptional<z.ZodString>;
    module: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["FORM", "LIST", "DASHBOARD", "REPORT"]>>>;
    layout: z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        options: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">, z.ZodNull]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        readOnly: z.ZodOptional<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodUnknown>;
        inListView: z.ZodOptional<z.ZodBoolean>;
        readRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        writeRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        formula: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        placeholder: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        columnSpan: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        weight: z.ZodOptional<z.ZodNumber>;
        dataSource: z.ZodOptional<z.ZodString>;
        dataFilter: z.ZodOptional<z.ZodString>;
        visibilityRule: z.ZodOptional<z.ZodString>;
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        regexPattern: z.ZodOptional<z.ZodString>;
        cssClass: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }>, "many">, z.ZodObject<{
        fields: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodString;
            label: z.ZodOptional<z.ZodString>;
            type: z.ZodString;
            options: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">, z.ZodNull]>>;
            required: z.ZodOptional<z.ZodBoolean>;
            readOnly: z.ZodOptional<z.ZodBoolean>;
            defaultValue: z.ZodOptional<z.ZodUnknown>;
            inListView: z.ZodOptional<z.ZodBoolean>;
            readRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            writeRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            formula: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            placeholder: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            columnSpan: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            weight: z.ZodOptional<z.ZodNumber>;
            dataSource: z.ZodOptional<z.ZodString>;
            dataFilter: z.ZodOptional<z.ZodString>;
            visibilityRule: z.ZodOptional<z.ZodString>;
            minLength: z.ZodOptional<z.ZodNumber>;
            maxLength: z.ZodOptional<z.ZodNumber>;
            regexPattern: z.ZodOptional<z.ZodString>;
            cssClass: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }, {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }>, "many">;
        settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        fields: {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }[];
        settings?: Record<string, unknown> | undefined;
    }, {
        fields: {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }[];
        settings?: Record<string, unknown> | undefined;
    }>]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    slug: string;
    module: string;
    type?: "FORM" | "LIST" | "DASHBOARD" | "REPORT" | undefined;
    schemaId?: string | undefined;
    layout?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | {
        fields: {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }[];
        settings?: Record<string, unknown> | undefined;
    } | undefined;
}, {
    title: string;
    slug: string;
    module: string;
    type?: "FORM" | "LIST" | "DASHBOARD" | "REPORT" | undefined;
    schemaId?: string | undefined;
    layout?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | {
        fields: {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }[];
        settings?: Record<string, unknown> | undefined;
    } | undefined;
}>;
export type CreatePageRegistryInput = z.infer<typeof createPageRegistrySchema>;
export declare const updatePageRegistrySchema: z.ZodObject<{
    schemaId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    module: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodOptional<z.ZodDefault<z.ZodEnum<["FORM", "LIST", "DASHBOARD", "REPORT"]>>>>;
    layout: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        label: z.ZodOptional<z.ZodString>;
        type: z.ZodString;
        options: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">, z.ZodNull]>>;
        required: z.ZodOptional<z.ZodBoolean>;
        readOnly: z.ZodOptional<z.ZodBoolean>;
        defaultValue: z.ZodOptional<z.ZodUnknown>;
        inListView: z.ZodOptional<z.ZodBoolean>;
        readRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        writeRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        formula: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        placeholder: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        columnSpan: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        weight: z.ZodOptional<z.ZodNumber>;
        dataSource: z.ZodOptional<z.ZodString>;
        dataFilter: z.ZodOptional<z.ZodString>;
        visibilityRule: z.ZodOptional<z.ZodString>;
        minLength: z.ZodOptional<z.ZodNumber>;
        maxLength: z.ZodOptional<z.ZodNumber>;
        regexPattern: z.ZodOptional<z.ZodString>;
        cssClass: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }, {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }>, "many">, z.ZodObject<{
        fields: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            name: z.ZodString;
            label: z.ZodOptional<z.ZodString>;
            type: z.ZodString;
            options: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnknown, "many">, z.ZodNull]>>;
            required: z.ZodOptional<z.ZodBoolean>;
            readOnly: z.ZodOptional<z.ZodBoolean>;
            defaultValue: z.ZodOptional<z.ZodUnknown>;
            inListView: z.ZodOptional<z.ZodBoolean>;
            readRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            writeRoles: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            formula: z.ZodNullable<z.ZodOptional<z.ZodString>>;
            placeholder: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            columnSpan: z.ZodOptional<z.ZodNumber>;
            height: z.ZodOptional<z.ZodNumber>;
            weight: z.ZodOptional<z.ZodNumber>;
            dataSource: z.ZodOptional<z.ZodString>;
            dataFilter: z.ZodOptional<z.ZodString>;
            visibilityRule: z.ZodOptional<z.ZodString>;
            minLength: z.ZodOptional<z.ZodNumber>;
            maxLength: z.ZodOptional<z.ZodNumber>;
            regexPattern: z.ZodOptional<z.ZodString>;
            cssClass: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }, {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }>, "many">;
        settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        fields: {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }[];
        settings?: Record<string, unknown> | undefined;
    }, {
        fields: {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }[];
        settings?: Record<string, unknown> | undefined;
    }>]>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    type?: "FORM" | "LIST" | "DASHBOARD" | "REPORT" | undefined;
    status?: "ARCHIVED" | "DRAFT" | "PUBLISHED" | undefined;
    title?: string | undefined;
    slug?: string | undefined;
    module?: string | undefined;
    schemaId?: string | undefined;
    layout?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | {
        fields: {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }[];
        settings?: Record<string, unknown> | undefined;
    } | undefined;
}, {
    type?: "FORM" | "LIST" | "DASHBOARD" | "REPORT" | undefined;
    status?: "ARCHIVED" | "DRAFT" | "PUBLISHED" | undefined;
    title?: string | undefined;
    slug?: string | undefined;
    module?: string | undefined;
    schemaId?: string | undefined;
    layout?: {
        type: string;
        name: string;
        options?: string | unknown[] | null | undefined;
        id?: string | undefined;
        description?: string | undefined;
        weight?: number | undefined;
        label?: string | undefined;
        required?: boolean | undefined;
        readOnly?: boolean | undefined;
        defaultValue?: unknown;
        inListView?: boolean | undefined;
        readRoles?: string | null | undefined;
        writeRoles?: string | null | undefined;
        formula?: string | null | undefined;
        placeholder?: string | undefined;
        columnSpan?: number | undefined;
        height?: number | undefined;
        dataSource?: string | undefined;
        dataFilter?: string | undefined;
        visibilityRule?: string | undefined;
        minLength?: number | undefined;
        maxLength?: number | undefined;
        regexPattern?: string | undefined;
        cssClass?: string | undefined;
    }[] | {
        fields: {
            type: string;
            name: string;
            options?: string | unknown[] | null | undefined;
            id?: string | undefined;
            description?: string | undefined;
            weight?: number | undefined;
            label?: string | undefined;
            required?: boolean | undefined;
            readOnly?: boolean | undefined;
            defaultValue?: unknown;
            inListView?: boolean | undefined;
            readRoles?: string | null | undefined;
            writeRoles?: string | null | undefined;
            formula?: string | null | undefined;
            placeholder?: string | undefined;
            columnSpan?: number | undefined;
            height?: number | undefined;
            dataSource?: string | undefined;
            dataFilter?: string | undefined;
            visibilityRule?: string | undefined;
            minLength?: number | undefined;
            maxLength?: number | undefined;
            regexPattern?: string | undefined;
            cssClass?: string | undefined;
        }[];
        settings?: Record<string, unknown> | undefined;
    } | undefined;
}>;
export type UpdatePageRegistryInput = z.infer<typeof updatePageRegistrySchema>;
export declare const restorePageRegistryHistorySchema: z.ZodObject<{
    historyIndex: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    historyIndex: number;
}, {
    historyIndex: number;
}>;
export type RestorePageRegistryHistoryInput = z.infer<typeof restorePageRegistryHistorySchema>;
export declare const customRecordDataSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
export type CustomRecordDataInput = z.infer<typeof customRecordDataSchema>;
export declare const createDataImportSchema: z.ZodObject<{
    name: z.ZodString;
    targetModel: z.ZodEnum<["customer", "vendor", "product", "employee", "warehouse"]>;
    fileName: z.ZodString;
    fileSize: z.ZodNumber;
    totalRows: z.ZodNumber;
    columnMapping: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    targetModel: "customer" | "vendor" | "product" | "employee" | "warehouse";
    fileName: string;
    fileSize: number;
    totalRows: number;
    columnMapping?: Record<string, string> | undefined;
}, {
    name: string;
    targetModel: "customer" | "vendor" | "product" | "employee" | "warehouse";
    fileName: string;
    fileSize: number;
    totalRows: number;
    columnMapping?: Record<string, string> | undefined;
}>;
export type CreateDataImportInput = z.infer<typeof createDataImportSchema>;
export declare const executeDataImportSchema: z.ZodObject<{
    rows: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodUnknown>, "many">;
}, "strip", z.ZodTypeAny, {
    rows: Record<string, unknown>[];
}, {
    rows: Record<string, unknown>[];
}>;
export type ExecuteDataImportInput = z.infer<typeof executeDataImportSchema>;
export declare const builderAnalyticsEventSchema: z.ZodObject<{
    event: z.ZodString;
    entityType: z.ZodOptional<z.ZodString>;
    entityId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    event: string;
    entityType?: string | undefined;
    entityId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    event: string;
    entityType?: string | undefined;
    entityId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export type BuilderAnalyticsEventInput = z.infer<typeof builderAnalyticsEventSchema>;
export declare const builderAiGenerateSchema: z.ZodObject<{
    prompt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    prompt: string;
}, {
    prompt: string;
}>;
export type BuilderAiGenerateInput = z.infer<typeof builderAiGenerateSchema>;
export declare const createBuilderWorkflowSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    docType: z.ZodOptional<z.ZodString>;
    trigger: z.ZodOptional<z.ZodString>;
    nodes: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    edges: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    docType?: string | undefined;
    trigger?: string | undefined;
    nodes?: any[] | undefined;
    edges?: any[] | undefined;
}, {
    name: string;
    description?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    docType?: string | undefined;
    trigger?: string | undefined;
    nodes?: any[] | undefined;
    edges?: any[] | undefined;
}>;
export declare const updateBuilderWorkflowSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    docType: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    trigger: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    nodes: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    edges: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
} & {
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    docType?: string | undefined;
    trigger?: string | undefined;
    nodes?: any[] | undefined;
    edges?: any[] | undefined;
}, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    docType?: string | undefined;
    trigger?: string | undefined;
    nodes?: any[] | undefined;
    edges?: any[] | undefined;
}>;
export declare const createBuilderDashboardSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    widgets: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    layout: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    refreshRate: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    layout?: Record<string, unknown> | undefined;
    widgets?: any[] | undefined;
    refreshRate?: number | undefined;
}, {
    name: string;
    description?: string | undefined;
    icon?: string | undefined;
    layout?: Record<string, unknown> | undefined;
    widgets?: any[] | undefined;
    refreshRate?: number | undefined;
}>;
export declare const updateBuilderDashboardSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    widgets: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    layout: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    refreshRate: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
} & {
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | undefined;
    layout?: Record<string, unknown> | undefined;
    widgets?: any[] | undefined;
    refreshRate?: number | undefined;
}, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | undefined;
    layout?: Record<string, unknown> | undefined;
    widgets?: any[] | undefined;
    refreshRate?: number | undefined;
}>;
export declare const createBuilderModuleSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
    version: z.ZodOptional<z.ZodString>;
    entities: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    relationships: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    permissions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    pages: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    components: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    dataModels: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    testResults: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    description?: string | undefined;
    permissions?: Record<string, unknown> | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    scope?: string | undefined;
    version?: string | undefined;
    entities?: any[] | undefined;
    relationships?: any[] | undefined;
    pages?: any[] | undefined;
    components?: any[] | undefined;
    dataModels?: any[] | undefined;
    testResults?: Record<string, unknown> | undefined;
}, {
    name: string;
    slug: string;
    description?: string | undefined;
    permissions?: Record<string, unknown> | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    scope?: string | undefined;
    version?: string | undefined;
    entities?: any[] | undefined;
    relationships?: any[] | undefined;
    pages?: any[] | undefined;
    components?: any[] | undefined;
    dataModels?: any[] | undefined;
    testResults?: Record<string, unknown> | undefined;
}>;
export declare const updateBuilderModuleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    permissions: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    color: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    version: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    entities: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    relationships: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    pages: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    components: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    dataModels: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    testResults: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
} & {
    status: z.ZodOptional<z.ZodString>;
    scope: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    permissions?: Record<string, unknown> | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    scope?: string | undefined;
    version?: string | undefined;
    entities?: any[] | undefined;
    relationships?: any[] | undefined;
    pages?: any[] | undefined;
    components?: any[] | undefined;
    dataModels?: any[] | undefined;
    testResults?: Record<string, unknown> | undefined;
}, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    permissions?: Record<string, unknown> | undefined;
    icon?: string | undefined;
    color?: string | undefined;
    scope?: string | undefined;
    version?: string | undefined;
    entities?: any[] | undefined;
    relationships?: any[] | undefined;
    pages?: any[] | undefined;
    components?: any[] | undefined;
    dataModels?: any[] | undefined;
    testResults?: Record<string, unknown> | undefined;
}>;
export declare const addAppComponentSchema: z.ZodObject<{
    type: z.ZodEnum<["form", "workflow", "dashboard", "automation"]>;
    refId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "form" | "workflow" | "dashboard" | "automation";
    name: string;
    refId: string;
}, {
    type: "form" | "workflow" | "dashboard" | "automation";
    name: string;
    refId: string;
}>;
export type AddAppComponentInput = z.infer<typeof addAppComponentSchema>;
export declare const addAppPageSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    type: z.ZodEnum<["form", "list", "dashboard", "custom"]>;
    formId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dashboardId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    layout: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "custom" | "form" | "dashboard" | "list";
    name: string;
    slug: string;
    layout?: any[] | undefined;
    formId?: string | null | undefined;
    dashboardId?: string | null | undefined;
}, {
    type: "custom" | "form" | "dashboard" | "list";
    name: string;
    slug: string;
    layout?: any[] | undefined;
    formId?: string | null | undefined;
    dashboardId?: string | null | undefined;
}>;
export type AddAppPageInput = z.infer<typeof addAppPageSchema>;
export declare const updateAppPageSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["form", "list", "dashboard", "custom"]>>;
    formId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    dashboardId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    layout: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "custom" | "form" | "dashboard" | "list" | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    layout?: any[] | undefined;
    formId?: string | null | undefined;
    dashboardId?: string | null | undefined;
}, {
    type?: "custom" | "form" | "dashboard" | "list" | undefined;
    name?: string | undefined;
    slug?: string | undefined;
    layout?: any[] | undefined;
    formId?: string | null | undefined;
    dashboardId?: string | null | undefined;
}>;
export type UpdateAppPageInput = z.infer<typeof updateAppPageSchema>;
export declare const addAppDataModelSchema: z.ZodObject<{
    name: z.ZodString;
    fields: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        required: z.ZodOptional<z.ZodBoolean>;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        name: string;
        label?: string | undefined;
        required?: boolean | undefined;
    }, {
        type: string;
        name: string;
        label?: string | undefined;
        required?: boolean | undefined;
    }>, "many">;
    relationships: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    fields: {
        type: string;
        name: string;
        label?: string | undefined;
        required?: boolean | undefined;
    }[];
    relationships?: any[] | undefined;
}, {
    name: string;
    fields: {
        type: string;
        name: string;
        label?: string | undefined;
        required?: boolean | undefined;
    }[];
    relationships?: any[] | undefined;
}>;
export type AddAppDataModelInput = z.infer<typeof addAppDataModelSchema>;
export declare const publishModuleSchema: z.ZodObject<{
    scope: z.ZodEnum<["ORGANIZATION", "GLOBAL"]>;
    version: z.ZodOptional<z.ZodString>;
    bump: z.ZodOptional<z.ZodEnum<["major", "minor", "patch"]>>;
    changelog: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    longDescription: z.ZodOptional<z.ZodString>;
    publisher: z.ZodOptional<z.ZodString>;
    screenshots: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    scope: "ORGANIZATION" | "GLOBAL";
    category?: string | undefined;
    version?: string | undefined;
    bump?: "major" | "minor" | "patch" | undefined;
    changelog?: string | undefined;
    longDescription?: string | undefined;
    publisher?: string | undefined;
    screenshots?: string[] | undefined;
}, {
    scope: "ORGANIZATION" | "GLOBAL";
    category?: string | undefined;
    version?: string | undefined;
    bump?: "major" | "minor" | "patch" | undefined;
    changelog?: string | undefined;
    longDescription?: string | undefined;
    publisher?: string | undefined;
    screenshots?: string[] | undefined;
}>;
export type PublishModuleInput = z.infer<typeof publishModuleSchema>;
export declare const rollbackModuleSchema: z.ZodObject<{
    releaseId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    releaseId: string;
}, {
    releaseId: string;
}>;
export type RollbackModuleInput = z.infer<typeof rollbackModuleSchema>;
export declare const installBuilderAppSchema: z.ZodObject<{
    moduleId: z.ZodString;
    releaseId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    moduleId: string;
    releaseId?: string | undefined;
}, {
    moduleId: string;
    releaseId?: string | undefined;
}>;
export type InstallBuilderAppInput = z.infer<typeof installBuilderAppSchema>;
export declare const createAutomationRuleSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    trigger: z.ZodString;
    triggerConfig: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    conditions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    actions: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    trigger: string;
    description?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    triggerConfig?: Record<string, unknown> | undefined;
    conditions?: any[] | undefined;
    actions?: any[] | undefined;
}, {
    name: string;
    trigger: string;
    description?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    triggerConfig?: Record<string, unknown> | undefined;
    conditions?: any[] | undefined;
    actions?: any[] | undefined;
}>;
export declare const updateAutomationRuleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    trigger: z.ZodOptional<z.ZodString>;
    triggerConfig: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    conditions: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    actions: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
} & {
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    trigger?: string | undefined;
    triggerConfig?: Record<string, unknown> | undefined;
    conditions?: any[] | undefined;
    actions?: any[] | undefined;
}, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    trigger?: string | undefined;
    triggerConfig?: Record<string, unknown> | undefined;
    conditions?: any[] | undefined;
    actions?: any[] | undefined;
}>;
export declare const createWebPageSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    sections: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    metaTitle: z.ZodOptional<z.ZodString>;
    metaDesc: z.ZodOptional<z.ZodString>;
    ogImage: z.ZodOptional<z.ZodString>;
    visibility: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    sections?: any[] | undefined;
    metaTitle?: string | undefined;
    metaDesc?: string | undefined;
    ogImage?: string | undefined;
    visibility?: string | undefined;
}, {
    name: string;
    slug: string;
    sections?: any[] | undefined;
    metaTitle?: string | undefined;
    metaDesc?: string | undefined;
    ogImage?: string | undefined;
    visibility?: string | undefined;
}>;
export declare const updateWebPageSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    sections: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    metaTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    metaDesc: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    ogImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    visibility: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    name?: string | undefined;
    sections?: any[] | undefined;
    metaTitle?: string | undefined;
    metaDesc?: string | undefined;
    ogImage?: string | undefined;
    visibility?: string | undefined;
    sortOrder?: number | undefined;
}, {
    status?: string | undefined;
    name?: string | undefined;
    sections?: any[] | undefined;
    metaTitle?: string | undefined;
    metaDesc?: string | undefined;
    ogImage?: string | undefined;
    visibility?: string | undefined;
    sortOrder?: number | undefined;
}>;
export declare const createBlogPostSchema: z.ZodObject<{
    title: z.ZodString;
    slug: z.ZodString;
    content: z.ZodOptional<z.ZodString>;
    excerpt: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    author: z.ZodOptional<z.ZodString>;
    featuredImage: z.ZodOptional<z.ZodString>;
    metaTitle: z.ZodOptional<z.ZodString>;
    metaDesc: z.ZodOptional<z.ZodString>;
    readTime: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    slug: string;
    category?: string | undefined;
    metaTitle?: string | undefined;
    metaDesc?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    tags?: string[] | undefined;
    author?: string | undefined;
    featuredImage?: string | undefined;
    readTime?: string | undefined;
}, {
    title: string;
    slug: string;
    category?: string | undefined;
    metaTitle?: string | undefined;
    metaDesc?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    tags?: string[] | undefined;
    author?: string | undefined;
    featuredImage?: string | undefined;
    readTime?: string | undefined;
}>;
export declare const updateBlogPostSchema: z.ZodObject<{
    category: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    title: z.ZodOptional<z.ZodString>;
    metaTitle: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    metaDesc: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    content: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    excerpt: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    author: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    featuredImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    readTime: z.ZodOptional<z.ZodOptional<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    category?: string | undefined;
    title?: string | undefined;
    metaTitle?: string | undefined;
    metaDesc?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    tags?: string[] | undefined;
    author?: string | undefined;
    featuredImage?: string | undefined;
    readTime?: string | undefined;
}, {
    status?: string | undefined;
    category?: string | undefined;
    title?: string | undefined;
    metaTitle?: string | undefined;
    metaDesc?: string | undefined;
    content?: string | undefined;
    excerpt?: string | undefined;
    tags?: string[] | undefined;
    author?: string | undefined;
    featuredImage?: string | undefined;
    readTime?: string | undefined;
}>;
export declare const createWebAssetSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    url: z.ZodString;
    size: z.ZodOptional<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    url: string;
    metadata?: Record<string, unknown> | undefined;
    size?: number | undefined;
}, {
    type: string;
    name: string;
    url: string;
    metadata?: Record<string, unknown> | undefined;
    size?: number | undefined;
}>;
export declare const updateWebAssetSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    size: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    metadata: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    name?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    url?: string | undefined;
    size?: number | undefined;
}, {
    type?: string | undefined;
    name?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
    url?: string | undefined;
    size?: number | undefined;
}>;
export declare const createWebTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    content: z.ZodString;
    styles: z.ZodOptional<z.ZodString>;
    scripts: z.ZodOptional<z.ZodString>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: string;
    name: string;
    content: string;
    settings?: Record<string, unknown> | undefined;
    styles?: string | undefined;
    scripts?: string | undefined;
}, {
    type: string;
    name: string;
    content: string;
    settings?: Record<string, unknown> | undefined;
    styles?: string | undefined;
    scripts?: string | undefined;
}>;
export declare const updateWebTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    content: z.ZodOptional<z.ZodString>;
    styles: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    scripts: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
} & {
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type?: string | undefined;
    status?: string | undefined;
    name?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    content?: string | undefined;
    styles?: string | undefined;
    scripts?: string | undefined;
}, {
    type?: string | undefined;
    status?: string | undefined;
    name?: string | undefined;
    settings?: Record<string, unknown> | undefined;
    content?: string | undefined;
    styles?: string | undefined;
    scripts?: string | undefined;
}>;
export declare const createWebMenuSchema: z.ZodObject<{
    name: z.ZodString;
    location: z.ZodString;
    items: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    location: string;
    items?: any[] | undefined;
    settings?: Record<string, unknown> | undefined;
}, {
    name: string;
    location: string;
    items?: any[] | undefined;
    settings?: Record<string, unknown> | undefined;
}>;
export declare const updateWebMenuSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
} & {
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    name?: string | undefined;
    items?: any[] | undefined;
    settings?: Record<string, unknown> | undefined;
    location?: string | undefined;
}, {
    status?: string | undefined;
    name?: string | undefined;
    items?: any[] | undefined;
    settings?: Record<string, unknown> | undefined;
    location?: string | undefined;
}>;
export declare const createWebSeoSchema: z.ZodObject<{
    path: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    keywords: z.ZodOptional<z.ZodString>;
    ogImage: z.ZodOptional<z.ZodString>;
    twitterCard: z.ZodOptional<z.ZodString>;
    canonicalUrl: z.ZodOptional<z.ZodString>;
    schemaJson: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    description?: string | undefined;
    title?: string | undefined;
    ogImage?: string | undefined;
    keywords?: string | undefined;
    twitterCard?: string | undefined;
    canonicalUrl?: string | undefined;
    schemaJson?: string | undefined;
}, {
    path: string;
    description?: string | undefined;
    title?: string | undefined;
    ogImage?: string | undefined;
    keywords?: string | undefined;
    twitterCard?: string | undefined;
    canonicalUrl?: string | undefined;
    schemaJson?: string | undefined;
}>;
export declare const updateWebSeoSchema: z.ZodObject<{
    path: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    keywords: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    ogImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    twitterCard: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    canonicalUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    schemaJson: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    path?: string | undefined;
    description?: string | undefined;
    title?: string | undefined;
    ogImage?: string | undefined;
    keywords?: string | undefined;
    twitterCard?: string | undefined;
    canonicalUrl?: string | undefined;
    schemaJson?: string | undefined;
}, {
    path?: string | undefined;
    description?: string | undefined;
    title?: string | undefined;
    ogImage?: string | undefined;
    keywords?: string | undefined;
    twitterCard?: string | undefined;
    canonicalUrl?: string | undefined;
    schemaJson?: string | undefined;
}>;
export declare const webCollectionFieldSchema: z.ZodObject<{
    name: z.ZodString;
    label: z.ZodString;
    type: z.ZodEnum<["Text", "RichText", "Number", "Price", "Boolean", "Date", "Image", "Gallery", "Select", "Color", "URL", "Email", "Reference", "Tags", "Textarea"]>;
    required: z.ZodOptional<z.ZodBoolean>;
    options: z.ZodOptional<z.ZodString>;
    referenceCollection: z.ZodOptional<z.ZodString>;
    helpText: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
    name: string;
    label: string;
    options?: string | undefined;
    required?: boolean | undefined;
    referenceCollection?: string | undefined;
    helpText?: string | undefined;
}, {
    type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
    name: string;
    label: string;
    options?: string | undefined;
    required?: boolean | undefined;
    referenceCollection?: string | undefined;
    helpText?: string | undefined;
}>;
export type WebCollectionFieldInput = z.infer<typeof webCollectionFieldSchema>;
export declare const createWebCollectionSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    singular: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    kind: z.ZodOptional<z.ZodEnum<["GENERIC", "PRODUCT", "POST", "PORTFOLIO", "TEAM", "TESTIMONIAL"]>>;
    fields: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["Text", "RichText", "Number", "Price", "Boolean", "Date", "Image", "Gallery", "Select", "Color", "URL", "Email", "Reference", "Tags", "Textarea"]>;
        required: z.ZodOptional<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodString>;
        referenceCollection: z.ZodOptional<z.ZodString>;
        helpText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
        name: string;
        label: string;
        options?: string | undefined;
        required?: boolean | undefined;
        referenceCollection?: string | undefined;
        helpText?: string | undefined;
    }, {
        type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
        name: string;
        label: string;
        options?: string | undefined;
        required?: boolean | undefined;
        referenceCollection?: string | undefined;
        helpText?: string | undefined;
    }>, "many">>;
    settings: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    description?: string | undefined;
    icon?: string | undefined;
    fields?: {
        type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
        name: string;
        label: string;
        options?: string | undefined;
        required?: boolean | undefined;
        referenceCollection?: string | undefined;
        helpText?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
    color?: string | undefined;
    singular?: string | undefined;
    kind?: "GENERIC" | "PRODUCT" | "POST" | "PORTFOLIO" | "TEAM" | "TESTIMONIAL" | undefined;
}, {
    name: string;
    slug: string;
    description?: string | undefined;
    icon?: string | undefined;
    fields?: {
        type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
        name: string;
        label: string;
        options?: string | undefined;
        required?: boolean | undefined;
        referenceCollection?: string | undefined;
        helpText?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
    color?: string | undefined;
    singular?: string | undefined;
    kind?: "GENERIC" | "PRODUCT" | "POST" | "PORTFOLIO" | "TEAM" | "TESTIMONIAL" | undefined;
}>;
export type CreateWebCollectionInput = z.infer<typeof createWebCollectionSchema>;
export declare const updateWebCollectionSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    icon: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fields: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["Text", "RichText", "Number", "Price", "Boolean", "Date", "Image", "Gallery", "Select", "Color", "URL", "Email", "Reference", "Tags", "Textarea"]>;
        required: z.ZodOptional<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodString>;
        referenceCollection: z.ZodOptional<z.ZodString>;
        helpText: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
        name: string;
        label: string;
        options?: string | undefined;
        required?: boolean | undefined;
        referenceCollection?: string | undefined;
        helpText?: string | undefined;
    }, {
        type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
        name: string;
        label: string;
        options?: string | undefined;
        required?: boolean | undefined;
        referenceCollection?: string | undefined;
        helpText?: string | undefined;
    }>, "many">>>;
    settings: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    color: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    singular: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    kind: z.ZodOptional<z.ZodOptional<z.ZodEnum<["GENERIC", "PRODUCT", "POST", "PORTFOLIO", "TEAM", "TESTIMONIAL"]>>>;
} & {
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | undefined;
    fields?: {
        type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
        name: string;
        label: string;
        options?: string | undefined;
        required?: boolean | undefined;
        referenceCollection?: string | undefined;
        helpText?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
    color?: string | undefined;
    singular?: string | undefined;
    kind?: "GENERIC" | "PRODUCT" | "POST" | "PORTFOLIO" | "TEAM" | "TESTIMONIAL" | undefined;
}, {
    status?: string | undefined;
    name?: string | undefined;
    description?: string | undefined;
    icon?: string | undefined;
    fields?: {
        type: "Text" | "RichText" | "Number" | "Price" | "Boolean" | "Date" | "Image" | "Gallery" | "Select" | "Color" | "URL" | "Email" | "Reference" | "Tags" | "Textarea";
        name: string;
        label: string;
        options?: string | undefined;
        required?: boolean | undefined;
        referenceCollection?: string | undefined;
        helpText?: string | undefined;
    }[] | undefined;
    settings?: Record<string, unknown> | undefined;
    color?: string | undefined;
    singular?: string | undefined;
    kind?: "GENERIC" | "PRODUCT" | "POST" | "PORTFOLIO" | "TEAM" | "TESTIMONIAL" | undefined;
}>;
export type UpdateWebCollectionInput = z.infer<typeof updateWebCollectionSchema>;
export declare const createWebCollectionItemSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodString>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>>;
    featured: z.ZodOptional<z.ZodBoolean>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, unknown>;
    status?: "ARCHIVED" | "DRAFT" | "PUBLISHED" | undefined;
    slug?: string | undefined;
    sortOrder?: number | undefined;
    featured?: boolean | undefined;
}, {
    data: Record<string, unknown>;
    status?: "ARCHIVED" | "DRAFT" | "PUBLISHED" | undefined;
    slug?: string | undefined;
    sortOrder?: number | undefined;
    featured?: boolean | undefined;
}>;
export type CreateWebCollectionItemInput = z.infer<typeof createWebCollectionItemSchema>;
export declare const updateWebCollectionItemSchema: z.ZodObject<{
    slug: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "ARCHIVED"]>>>;
    featured: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    sortOrder: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    status?: "ARCHIVED" | "DRAFT" | "PUBLISHED" | undefined;
    data?: Record<string, unknown> | undefined;
    slug?: string | undefined;
    sortOrder?: number | undefined;
    featured?: boolean | undefined;
}, {
    status?: "ARCHIVED" | "DRAFT" | "PUBLISHED" | undefined;
    data?: Record<string, unknown> | undefined;
    slug?: string | undefined;
    sortOrder?: number | undefined;
    featured?: boolean | undefined;
}>;
export type UpdateWebCollectionItemInput = z.infer<typeof updateWebCollectionItemSchema>;
export declare const seedWebCollectionSchema: z.ZodObject<{
    preset: z.ZodEnum<["products", "projects", "team", "testimonials", "blog", "services", "events"]>;
}, "strip", z.ZodTypeAny, {
    preset: "projects" | "products" | "team" | "testimonials" | "blog" | "services" | "events";
}, {
    preset: "projects" | "products" | "team" | "testimonials" | "blog" | "services" | "events";
}>;
export type SeedWebCollectionInput = z.infer<typeof seedWebCollectionSchema>;
export declare const createWebFormSubmissionSchema: z.ZodObject<{
    formName: z.ZodString;
    pageSlug: z.ZodOptional<z.ZodString>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    meta: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, unknown>;
    formName: string;
    pageSlug?: string | undefined;
    meta?: Record<string, unknown> | undefined;
}, {
    data: Record<string, unknown>;
    formName: string;
    pageSlug?: string | undefined;
    meta?: Record<string, unknown> | undefined;
}>;
export type CreateWebFormSubmissionInput = z.infer<typeof createWebFormSubmissionSchema>;
export declare const webCheckoutSchema: z.ZodObject<{
    customer: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodOptional<z.ZodString>;
        address: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        email: string;
        name: string;
        phone?: string | undefined;
        address?: string | undefined;
    }, {
        email: string;
        name: string;
        phone?: string | undefined;
        address?: string | undefined;
    }>;
    items: z.ZodArray<z.ZodObject<{
        productSlug: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        price: z.ZodNumber;
        qty: z.ZodNumber;
        image: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
        qty: number;
        productSlug?: string | undefined;
        image?: string | undefined;
    }, {
        name: string;
        price: number;
        qty: number;
        productSlug?: string | undefined;
        image?: string | undefined;
    }>, "many">;
    notes: z.ZodOptional<z.ZodString>;
    currency: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    items: {
        name: string;
        price: number;
        qty: number;
        productSlug?: string | undefined;
        image?: string | undefined;
    }[];
    customer: {
        email: string;
        name: string;
        phone?: string | undefined;
        address?: string | undefined;
    };
    notes?: string | undefined;
    currency?: string | undefined;
}, {
    items: {
        name: string;
        price: number;
        qty: number;
        productSlug?: string | undefined;
        image?: string | undefined;
    }[];
    customer: {
        email: string;
        name: string;
        phone?: string | undefined;
        address?: string | undefined;
    };
    notes?: string | undefined;
    currency?: string | undefined;
}>;
export type WebCheckoutInput = z.infer<typeof webCheckoutSchema>;
export declare const updateWebOrderSchema: z.ZodObject<{
    status: z.ZodEnum<["PENDING", "PAID", "FULFILLED", "CANCELLED"]>;
}, "strip", z.ZodTypeAny, {
    status: "CANCELLED" | "PAID" | "PENDING" | "FULFILLED";
}, {
    status: "CANCELLED" | "PAID" | "PENDING" | "FULFILLED";
}>;
export type UpdateWebOrderInput = z.infer<typeof updateWebOrderSchema>;
export declare const createOpportunityLineItemSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    discount: z.ZodDefault<z.ZodNumber>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string;
    quantity: number;
    unitPrice: number;
    sortOrder: number;
    discount: number;
    productId?: string | undefined;
}, {
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string | undefined;
    sortOrder?: number | undefined;
    discount?: number | undefined;
}>;
export type CreateOpportunityLineItemInput = z.infer<typeof createOpportunityLineItemSchema>;
export declare const updateOpportunityLineItemSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    description: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    unitPrice: z.ZodOptional<z.ZodNumber>;
    discount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    productId?: string | undefined;
    quantity?: number | undefined;
    unitPrice?: number | undefined;
    sortOrder?: number | undefined;
    discount?: number | undefined;
}, {
    description?: string | undefined;
    productId?: string | undefined;
    quantity?: number | undefined;
    unitPrice?: number | undefined;
    sortOrder?: number | undefined;
    discount?: number | undefined;
}>;
export type UpdateOpportunityLineItemInput = z.infer<typeof updateOpportunityLineItemSchema>;
export declare const createPriceBookSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    isDefault: z.ZodDefault<z.ZodBoolean>;
    validFrom: z.ZodOptional<z.ZodString>;
    validTo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    currency: string;
    isDefault: boolean;
    description?: string | undefined;
    validFrom?: string | undefined;
    validTo?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    currency?: string | undefined;
    isDefault?: boolean | undefined;
    validFrom?: string | undefined;
    validTo?: string | undefined;
}>;
export type CreatePriceBookInput = z.infer<typeof createPriceBookSchema>;
export declare const updatePriceBookSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    isDefault: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    validFrom: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    validTo: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    currency?: string | undefined;
    isDefault?: boolean | undefined;
    validFrom?: string | undefined;
    validTo?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    currency?: string | undefined;
    isDefault?: boolean | undefined;
    validFrom?: string | undefined;
    validTo?: string | undefined;
}>;
export type UpdatePriceBookInput = z.infer<typeof updatePriceBookSchema>;
export declare const createPriceBookEntrySchema: z.ZodObject<{
    productId: z.ZodString;
    listPrice: z.ZodNumber;
    minQuantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    listPrice: number;
    minQuantity: number;
}, {
    productId: string;
    listPrice: number;
    minQuantity?: number | undefined;
}>;
export type CreatePriceBookEntryInput = z.infer<typeof createPriceBookEntrySchema>;
export declare const createContactTagSchema: z.ZodObject<{
    name: z.ZodString;
    color: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    color: string;
}, {
    name: string;
    color?: string | undefined;
}>;
export type CreateContactTagInput = z.infer<typeof createContactTagSchema>;
export declare const mergeContactsSchema: z.ZodObject<{
    primaryContactId: z.ZodString;
    secondaryContactId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    primaryContactId: string;
    secondaryContactId: string;
}, {
    primaryContactId: string;
    secondaryContactId: string;
}>;
export type MergeContactsInput = z.infer<typeof mergeContactsSchema>;
export declare const createCustomerTagSchema: z.ZodObject<{
    name: z.ZodString;
    color: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    color: string;
}, {
    name: string;
    color?: string | undefined;
}>;
export type CreateCustomerTagInput = z.infer<typeof createCustomerTagSchema>;
export declare const createSalesTargetSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    period: z.ZodString;
    targetType: z.ZodDefault<z.ZodEnum<["REVENUE", "DEALS", "UNITS"]>>;
    target: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    period: string;
    targetType: "REVENUE" | "DEALS" | "UNITS";
    target: number;
    userId?: string | undefined;
}, {
    period: string;
    target: number;
    userId?: string | undefined;
    targetType?: "REVENUE" | "DEALS" | "UNITS" | undefined;
}>;
export type CreateSalesTargetInput = z.infer<typeof createSalesTargetSchema>;
export declare const updateSalesTargetSchema: z.ZodObject<{
    userId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    period: z.ZodOptional<z.ZodString>;
    targetType: z.ZodOptional<z.ZodDefault<z.ZodEnum<["REVENUE", "DEALS", "UNITS"]>>>;
    target: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId?: string | undefined;
    period?: string | undefined;
    targetType?: "REVENUE" | "DEALS" | "UNITS" | undefined;
    target?: number | undefined;
}, {
    userId?: string | undefined;
    period?: string | undefined;
    targetType?: "REVENUE" | "DEALS" | "UNITS" | undefined;
    target?: number | undefined;
}>;
export type UpdateSalesTargetInput = z.infer<typeof updateSalesTargetSchema>;
export declare const createSavedReportSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["PIPELINE", "LEADS", "ACTIVITIES", "REVENUE", "CONVERSION"]>;
    filters: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    columns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    chartType: z.ZodOptional<z.ZodEnum<["BAR", "LINE", "PIE", "FUNNEL"]>>;
    isShared: z.ZodDefault<z.ZodBoolean>;
    schedule: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "REVENUE" | "PIPELINE" | "LEADS" | "ACTIVITIES" | "CONVERSION";
    filters: Record<string, any>;
    columns: string[];
    name: string;
    isShared: boolean;
    chartType?: "BAR" | "LINE" | "PIE" | "FUNNEL" | undefined;
    schedule?: string | undefined;
}, {
    type: "REVENUE" | "PIPELINE" | "LEADS" | "ACTIVITIES" | "CONVERSION";
    name: string;
    filters?: Record<string, any> | undefined;
    columns?: string[] | undefined;
    chartType?: "BAR" | "LINE" | "PIE" | "FUNNEL" | undefined;
    isShared?: boolean | undefined;
    schedule?: string | undefined;
}>;
export type CreateSavedReportInput = z.infer<typeof createSavedReportSchema>;
export declare const createCrmWorkflowRuleSchema: z.ZodObject<{
    name: z.ZodString;
    entity: z.ZodEnum<["LEAD", "OPPORTUNITY", "ACTIVITY", "CONTACT"]>;
    trigger: z.ZodEnum<["ON_CREATE", "ON_UPDATE", "ON_STAGE_CHANGE", "ON_STATUS_CHANGE", "SCHEDULED"]>;
    conditions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "CONTAINS", "GT", "LT", "GTE", "LTE", "IN", "NOT_IN"]>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GT" | "LT" | "GTE" | "LTE" | "IN" | "NOT_IN";
        value?: any;
    }, {
        field: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GT" | "LT" | "GTE" | "LTE" | "IN" | "NOT_IN";
        value?: any;
    }>, "many">>;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["ASSIGN", "CREATE_ACTIVITY", "SEND_EMAIL", "UPDATE_FIELD", "NOTIFY"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "ASSIGN" | "CREATE_ACTIVITY" | "SEND_EMAIL" | "UPDATE_FIELD" | "NOTIFY";
        config: Record<string, any>;
    }, {
        type: "ASSIGN" | "CREATE_ACTIVITY" | "SEND_EMAIL" | "UPDATE_FIELD" | "NOTIFY";
        config: Record<string, any>;
    }>, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    trigger: "ON_CREATE" | "ON_UPDATE" | "ON_STAGE_CHANGE" | "ON_STATUS_CHANGE" | "SCHEDULED";
    conditions: {
        field: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GT" | "LT" | "GTE" | "LTE" | "IN" | "NOT_IN";
        value?: any;
    }[];
    actions: {
        type: "ASSIGN" | "CREATE_ACTIVITY" | "SEND_EMAIL" | "UPDATE_FIELD" | "NOTIFY";
        config: Record<string, any>;
    }[];
    entity: "LEAD" | "OPPORTUNITY" | "ACTIVITY" | "CONTACT";
}, {
    name: string;
    trigger: "ON_CREATE" | "ON_UPDATE" | "ON_STAGE_CHANGE" | "ON_STATUS_CHANGE" | "SCHEDULED";
    actions: {
        type: "ASSIGN" | "CREATE_ACTIVITY" | "SEND_EMAIL" | "UPDATE_FIELD" | "NOTIFY";
        config: Record<string, any>;
    }[];
    entity: "LEAD" | "OPPORTUNITY" | "ACTIVITY" | "CONTACT";
    isActive?: boolean | undefined;
    conditions?: {
        field: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GT" | "LT" | "GTE" | "LTE" | "IN" | "NOT_IN";
        value?: any;
    }[] | undefined;
}>;
export type CreateCrmWorkflowRuleInput = z.infer<typeof createCrmWorkflowRuleSchema>;
export declare const updateCrmWorkflowRuleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    entity: z.ZodOptional<z.ZodEnum<["LEAD", "OPPORTUNITY", "ACTIVITY", "CONTACT"]>>;
    trigger: z.ZodOptional<z.ZodEnum<["ON_CREATE", "ON_UPDATE", "ON_STAGE_CHANGE", "ON_STATUS_CHANGE", "SCHEDULED"]>>;
    conditions: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "CONTAINS", "GT", "LT", "GTE", "LTE", "IN", "NOT_IN"]>;
        value: z.ZodAny;
    }, "strip", z.ZodTypeAny, {
        field: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GT" | "LT" | "GTE" | "LTE" | "IN" | "NOT_IN";
        value?: any;
    }, {
        field: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GT" | "LT" | "GTE" | "LTE" | "IN" | "NOT_IN";
        value?: any;
    }>, "many">>>;
    actions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["ASSIGN", "CREATE_ACTIVITY", "SEND_EMAIL", "UPDATE_FIELD", "NOTIFY"]>;
        config: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type: "ASSIGN" | "CREATE_ACTIVITY" | "SEND_EMAIL" | "UPDATE_FIELD" | "NOTIFY";
        config: Record<string, any>;
    }, {
        type: "ASSIGN" | "CREATE_ACTIVITY" | "SEND_EMAIL" | "UPDATE_FIELD" | "NOTIFY";
        config: Record<string, any>;
    }>, "many">>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    trigger?: "ON_CREATE" | "ON_UPDATE" | "ON_STAGE_CHANGE" | "ON_STATUS_CHANGE" | "SCHEDULED" | undefined;
    conditions?: {
        field: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GT" | "LT" | "GTE" | "LTE" | "IN" | "NOT_IN";
        value?: any;
    }[] | undefined;
    actions?: {
        type: "ASSIGN" | "CREATE_ACTIVITY" | "SEND_EMAIL" | "UPDATE_FIELD" | "NOTIFY";
        config: Record<string, any>;
    }[] | undefined;
    entity?: "LEAD" | "OPPORTUNITY" | "ACTIVITY" | "CONTACT" | undefined;
}, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    trigger?: "ON_CREATE" | "ON_UPDATE" | "ON_STAGE_CHANGE" | "ON_STATUS_CHANGE" | "SCHEDULED" | undefined;
    conditions?: {
        field: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "GT" | "LT" | "GTE" | "LTE" | "IN" | "NOT_IN";
        value?: any;
    }[] | undefined;
    actions?: {
        type: "ASSIGN" | "CREATE_ACTIVITY" | "SEND_EMAIL" | "UPDATE_FIELD" | "NOTIFY";
        config: Record<string, any>;
    }[] | undefined;
    entity?: "LEAD" | "OPPORTUNITY" | "ACTIVITY" | "CONTACT" | undefined;
}>;
export type UpdateCrmWorkflowRuleInput = z.infer<typeof updateCrmWorkflowRuleSchema>;
export declare const createEmailSequenceSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    steps: z.ZodArray<z.ZodObject<{
        templateId: z.ZodString;
        delayDays: z.ZodDefault<z.ZodNumber>;
        sortOrder: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        sortOrder: number;
        templateId: string;
        delayDays: number;
    }, {
        templateId: string;
        sortOrder?: number | undefined;
        delayDays?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    steps: {
        sortOrder: number;
        templateId: string;
        delayDays: number;
    }[];
    description?: string | undefined;
}, {
    name: string;
    steps: {
        templateId: string;
        sortOrder?: number | undefined;
        delayDays?: number | undefined;
    }[];
    description?: string | undefined;
}>;
export type CreateEmailSequenceInput = z.infer<typeof createEmailSequenceSchema>;
export declare const enrollSequenceSchema: z.ZodObject<{
    contactId: z.ZodOptional<z.ZodString>;
    leadId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    leadId?: string | undefined;
    contactId?: string | undefined;
}, {
    leadId?: string | undefined;
    contactId?: string | undefined;
}>;
export type EnrollSequenceInput = z.infer<typeof enrollSequenceSchema>;
export declare const createSalesTerritorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    criteria: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    parentId: z.ZodOptional<z.ZodString>;
    managerId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    criteria: Record<string, any>;
    description?: string | undefined;
    parentId?: string | undefined;
    managerId?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    parentId?: string | undefined;
    managerId?: string | undefined;
    criteria?: Record<string, any> | undefined;
}>;
export type CreateSalesTerritoryInput = z.infer<typeof createSalesTerritorySchema>;
export declare const updateSalesTerritorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    criteria: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>>;
    parentId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    managerId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    parentId?: string | undefined;
    managerId?: string | undefined;
    criteria?: Record<string, any> | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    parentId?: string | undefined;
    managerId?: string | undefined;
    criteria?: Record<string, any> | undefined;
}>;
export type UpdateSalesTerritoryInput = z.infer<typeof updateSalesTerritorySchema>;
export declare const addTeamMemberSchema: z.ZodObject<{
    userId: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<["REP", "MANAGER", "DIRECTOR"]>>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    role: "REP" | "MANAGER" | "DIRECTOR";
}, {
    userId: string;
    role?: "REP" | "MANAGER" | "DIRECTOR" | undefined;
}>;
export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;
export declare const createCommissionRuleSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["PERCENTAGE", "FLAT", "TIERED"]>>;
    rate: z.ZodNumber;
    tiers: z.ZodDefault<z.ZodArray<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        rate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        rate: number;
        min: number;
        max: number;
    }, {
        rate: number;
        min: number;
        max: number;
    }>, "many">>;
    appliesToAll: z.ZodDefault<z.ZodBoolean>;
    productIds: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type: "PERCENTAGE" | "FLAT" | "TIERED";
    name: string;
    rate: number;
    tiers: {
        rate: number;
        min: number;
        max: number;
    }[];
    appliesToAll: boolean;
    productIds: string[];
}, {
    name: string;
    rate: number;
    type?: "PERCENTAGE" | "FLAT" | "TIERED" | undefined;
    tiers?: {
        rate: number;
        min: number;
        max: number;
    }[] | undefined;
    appliesToAll?: boolean | undefined;
    productIds?: string[] | undefined;
}>;
export type CreateCommissionRuleInput = z.infer<typeof createCommissionRuleSchema>;
export declare const updateCommissionRuleSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["PERCENTAGE", "FLAT", "TIERED"]>>>;
    rate: z.ZodOptional<z.ZodNumber>;
    tiers: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        min: z.ZodNumber;
        max: z.ZodNumber;
        rate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        rate: number;
        min: number;
        max: number;
    }, {
        rate: number;
        min: number;
        max: number;
    }>, "many">>>;
    appliesToAll: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    productIds: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    type?: "PERCENTAGE" | "FLAT" | "TIERED" | undefined;
    name?: string | undefined;
    rate?: number | undefined;
    tiers?: {
        rate: number;
        min: number;
        max: number;
    }[] | undefined;
    appliesToAll?: boolean | undefined;
    productIds?: string[] | undefined;
}, {
    type?: "PERCENTAGE" | "FLAT" | "TIERED" | undefined;
    name?: string | undefined;
    rate?: number | undefined;
    tiers?: {
        rate: number;
        min: number;
        max: number;
    }[] | undefined;
    appliesToAll?: boolean | undefined;
    productIds?: string[] | undefined;
}>;
export type UpdateCommissionRuleInput = z.infer<typeof updateCommissionRuleSchema>;
export declare const calculateCommissionsSchema: z.ZodObject<{
    periodStart: z.ZodString;
    periodEnd: z.ZodString;
}, "strip", z.ZodTypeAny, {
    periodStart: string;
    periodEnd: string;
}, {
    periodStart: string;
    periodEnd: string;
}>;
export type CalculateCommissionsInput = z.infer<typeof calculateCommissionsSchema>;
export declare const createWebToLeadFormSchema: z.ZodObject<{
    name: z.ZodString;
    fields: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["TEXT", "EMAIL", "PHONE", "SELECT", "TEXTAREA", "NUMBER"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "EMAIL" | "TEXT" | "PHONE" | "SELECT" | "TEXTAREA" | "NUMBER";
        name: string;
        label: string;
        required: boolean;
        options?: string[] | undefined;
    }, {
        type: "EMAIL" | "TEXT" | "PHONE" | "SELECT" | "TEXTAREA" | "NUMBER";
        name: string;
        label: string;
        options?: string[] | undefined;
        required?: boolean | undefined;
    }>, "many">;
    settings: z.ZodDefault<z.ZodObject<{
        redirectUrl: z.ZodOptional<z.ZodString>;
        notifyEmail: z.ZodOptional<z.ZodString>;
        assignToId: z.ZodOptional<z.ZodString>;
        sourceId: z.ZodOptional<z.ZodString>;
        campaignId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        sourceId?: string | undefined;
        campaignId?: string | undefined;
        redirectUrl?: string | undefined;
        notifyEmail?: string | undefined;
        assignToId?: string | undefined;
    }, {
        sourceId?: string | undefined;
        campaignId?: string | undefined;
        redirectUrl?: string | undefined;
        notifyEmail?: string | undefined;
        assignToId?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    fields: {
        type: "EMAIL" | "TEXT" | "PHONE" | "SELECT" | "TEXTAREA" | "NUMBER";
        name: string;
        label: string;
        required: boolean;
        options?: string[] | undefined;
    }[];
    settings: {
        sourceId?: string | undefined;
        campaignId?: string | undefined;
        redirectUrl?: string | undefined;
        notifyEmail?: string | undefined;
        assignToId?: string | undefined;
    };
}, {
    name: string;
    fields: {
        type: "EMAIL" | "TEXT" | "PHONE" | "SELECT" | "TEXTAREA" | "NUMBER";
        name: string;
        label: string;
        options?: string[] | undefined;
        required?: boolean | undefined;
    }[];
    settings?: {
        sourceId?: string | undefined;
        campaignId?: string | undefined;
        redirectUrl?: string | undefined;
        notifyEmail?: string | undefined;
        assignToId?: string | undefined;
    } | undefined;
}>;
export type CreateWebToLeadFormInput = z.infer<typeof createWebToLeadFormSchema>;
export declare const updateWebToLeadFormSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    fields: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        label: z.ZodString;
        type: z.ZodEnum<["TEXT", "EMAIL", "PHONE", "SELECT", "TEXTAREA", "NUMBER"]>;
        required: z.ZodDefault<z.ZodBoolean>;
        options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        type: "EMAIL" | "TEXT" | "PHONE" | "SELECT" | "TEXTAREA" | "NUMBER";
        name: string;
        label: string;
        required: boolean;
        options?: string[] | undefined;
    }, {
        type: "EMAIL" | "TEXT" | "PHONE" | "SELECT" | "TEXTAREA" | "NUMBER";
        name: string;
        label: string;
        options?: string[] | undefined;
        required?: boolean | undefined;
    }>, "many">>;
    settings: z.ZodOptional<z.ZodDefault<z.ZodObject<{
        redirectUrl: z.ZodOptional<z.ZodString>;
        notifyEmail: z.ZodOptional<z.ZodString>;
        assignToId: z.ZodOptional<z.ZodString>;
        sourceId: z.ZodOptional<z.ZodString>;
        campaignId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        sourceId?: string | undefined;
        campaignId?: string | undefined;
        redirectUrl?: string | undefined;
        notifyEmail?: string | undefined;
        assignToId?: string | undefined;
    }, {
        sourceId?: string | undefined;
        campaignId?: string | undefined;
        redirectUrl?: string | undefined;
        notifyEmail?: string | undefined;
        assignToId?: string | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    fields?: {
        type: "EMAIL" | "TEXT" | "PHONE" | "SELECT" | "TEXTAREA" | "NUMBER";
        name: string;
        label: string;
        required: boolean;
        options?: string[] | undefined;
    }[] | undefined;
    settings?: {
        sourceId?: string | undefined;
        campaignId?: string | undefined;
        redirectUrl?: string | undefined;
        notifyEmail?: string | undefined;
        assignToId?: string | undefined;
    } | undefined;
}, {
    name?: string | undefined;
    fields?: {
        type: "EMAIL" | "TEXT" | "PHONE" | "SELECT" | "TEXTAREA" | "NUMBER";
        name: string;
        label: string;
        options?: string[] | undefined;
        required?: boolean | undefined;
    }[] | undefined;
    settings?: {
        sourceId?: string | undefined;
        campaignId?: string | undefined;
        redirectUrl?: string | undefined;
        notifyEmail?: string | undefined;
        assignToId?: string | undefined;
    } | undefined;
}>;
export type UpdateWebToLeadFormInput = z.infer<typeof updateWebToLeadFormSchema>;
export declare const submitWebFormSchema: z.ZodObject<{
    data: z.ZodRecord<z.ZodString, z.ZodString>;
}, "strip", z.ZodTypeAny, {
    data: Record<string, string>;
}, {
    data: Record<string, string>;
}>;
export type SubmitWebFormInput = z.infer<typeof submitWebFormSchema>;
export declare const createCrmDocumentSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodEnum<["PROPOSAL", "CONTRACT", "ATTACHMENT", "OTHER"]>;
    fileUrl: z.ZodString;
    fileSize: z.ZodOptional<z.ZodNumber>;
    mimeType: z.ZodOptional<z.ZodString>;
    entityType: z.ZodEnum<["LEAD", "OPPORTUNITY", "CUSTOMER", "CONTACT", "QUOTATION"]>;
    entityId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type: "CONTRACT" | "PROPOSAL" | "OTHER" | "ATTACHMENT";
    name: string;
    entityType: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER";
    entityId: string;
    fileUrl: string;
    fileSize?: number | undefined;
    mimeType?: string | undefined;
}, {
    type: "CONTRACT" | "PROPOSAL" | "OTHER" | "ATTACHMENT";
    name: string;
    entityType: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER";
    entityId: string;
    fileUrl: string;
    fileSize?: number | undefined;
    mimeType?: string | undefined;
}>;
export type CreateCrmDocumentInput = z.infer<typeof createCrmDocumentSchema>;
export declare const createCustomFieldSchema: z.ZodObject<{
    entity: z.ZodEnum<["CUSTOMER", "CONTACT", "LEAD", "OPPORTUNITY", "QUOTATION", "VENDOR"]>;
    fieldName: z.ZodString;
    label: z.ZodString;
    fieldType: z.ZodEnum<["TEXT", "NUMBER", "DECIMAL", "DATE", "DATETIME", "BOOLEAN", "PICKLIST", "MULTI_PICKLIST", "URL", "EMAIL", "PHONE", "TEXTAREA", "LOOKUP", "FORMULA"]>;
    description: z.ZodOptional<z.ZodString>;
    isRequired: z.ZodOptional<z.ZodBoolean>;
    defaultValue: z.ZodOptional<z.ZodString>;
    options: z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
        color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        label: string;
        color?: string | undefined;
    }, {
        value: string;
        label: string;
        color?: string | undefined;
    }>, "many">>;
    validation: z.ZodOptional<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        regex: z.ZodOptional<z.ZodString>;
        maxLength: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        regex?: string | undefined;
    }, {
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        regex?: string | undefined;
    }>>;
    lookupEntity: z.ZodOptional<z.ZodString>;
    formulaExpr: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
    section: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    label: string;
    entity: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER" | "VENDOR";
    fieldName: string;
    fieldType: "EMAIL" | "URL" | "TEXT" | "PHONE" | "TEXTAREA" | "NUMBER" | "DECIMAL" | "DATE" | "DATETIME" | "BOOLEAN" | "PICKLIST" | "MULTI_PICKLIST" | "LOOKUP" | "FORMULA";
    options?: {
        value: string;
        label: string;
        color?: string | undefined;
    }[] | undefined;
    validation?: {
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        regex?: string | undefined;
    } | undefined;
    description?: string | undefined;
    defaultValue?: string | undefined;
    sortOrder?: number | undefined;
    isRequired?: boolean | undefined;
    lookupEntity?: string | undefined;
    formulaExpr?: string | undefined;
    section?: string | undefined;
}, {
    label: string;
    entity: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER" | "VENDOR";
    fieldName: string;
    fieldType: "EMAIL" | "URL" | "TEXT" | "PHONE" | "TEXTAREA" | "NUMBER" | "DECIMAL" | "DATE" | "DATETIME" | "BOOLEAN" | "PICKLIST" | "MULTI_PICKLIST" | "LOOKUP" | "FORMULA";
    options?: {
        value: string;
        label: string;
        color?: string | undefined;
    }[] | undefined;
    validation?: {
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        regex?: string | undefined;
    } | undefined;
    description?: string | undefined;
    defaultValue?: string | undefined;
    sortOrder?: number | undefined;
    isRequired?: boolean | undefined;
    lookupEntity?: string | undefined;
    formulaExpr?: string | undefined;
    section?: string | undefined;
}>;
export type CreateCustomFieldInput = z.infer<typeof createCustomFieldSchema>;
export declare const updateCustomFieldSchema: z.ZodObject<{
    entity: z.ZodOptional<z.ZodEnum<["CUSTOMER", "CONTACT", "LEAD", "OPPORTUNITY", "QUOTATION", "VENDOR"]>>;
    fieldName: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
    fieldType: z.ZodOptional<z.ZodEnum<["TEXT", "NUMBER", "DECIMAL", "DATE", "DATETIME", "BOOLEAN", "PICKLIST", "MULTI_PICKLIST", "URL", "EMAIL", "PHONE", "TEXTAREA", "LOOKUP", "FORMULA"]>>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isRequired: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    defaultValue: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    options: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        value: z.ZodString;
        label: z.ZodString;
        color: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        label: string;
        color?: string | undefined;
    }, {
        value: string;
        label: string;
        color?: string | undefined;
    }>, "many">>>;
    validation: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        min: z.ZodOptional<z.ZodNumber>;
        max: z.ZodOptional<z.ZodNumber>;
        regex: z.ZodOptional<z.ZodString>;
        maxLength: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        regex?: string | undefined;
    }, {
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        regex?: string | undefined;
    }>>>;
    lookupEntity: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    formulaExpr: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    section: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    options?: {
        value: string;
        label: string;
        color?: string | undefined;
    }[] | undefined;
    validation?: {
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        regex?: string | undefined;
    } | undefined;
    description?: string | undefined;
    label?: string | undefined;
    defaultValue?: string | undefined;
    sortOrder?: number | undefined;
    entity?: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER" | "VENDOR" | undefined;
    fieldName?: string | undefined;
    fieldType?: "EMAIL" | "URL" | "TEXT" | "PHONE" | "TEXTAREA" | "NUMBER" | "DECIMAL" | "DATE" | "DATETIME" | "BOOLEAN" | "PICKLIST" | "MULTI_PICKLIST" | "LOOKUP" | "FORMULA" | undefined;
    isRequired?: boolean | undefined;
    lookupEntity?: string | undefined;
    formulaExpr?: string | undefined;
    section?: string | undefined;
}, {
    options?: {
        value: string;
        label: string;
        color?: string | undefined;
    }[] | undefined;
    validation?: {
        maxLength?: number | undefined;
        min?: number | undefined;
        max?: number | undefined;
        regex?: string | undefined;
    } | undefined;
    description?: string | undefined;
    label?: string | undefined;
    defaultValue?: string | undefined;
    sortOrder?: number | undefined;
    entity?: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER" | "VENDOR" | undefined;
    fieldName?: string | undefined;
    fieldType?: "EMAIL" | "URL" | "TEXT" | "PHONE" | "TEXTAREA" | "NUMBER" | "DECIMAL" | "DATE" | "DATETIME" | "BOOLEAN" | "PICKLIST" | "MULTI_PICKLIST" | "LOOKUP" | "FORMULA" | undefined;
    isRequired?: boolean | undefined;
    lookupEntity?: string | undefined;
    formulaExpr?: string | undefined;
    section?: string | undefined;
}>;
export type UpdateCustomFieldInput = z.infer<typeof updateCustomFieldSchema>;
export declare const upsertCustomFieldValuesSchema: z.ZodObject<{
    values: z.ZodArray<z.ZodObject<{
        fieldId: z.ZodString;
        value: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string | null;
        fieldId: string;
    }, {
        value: string | null;
        fieldId: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    values: {
        value: string | null;
        fieldId: string;
    }[];
}, {
    values: {
        value: string | null;
        fieldId: string;
    }[];
}>;
export type UpsertCustomFieldValuesInput = z.infer<typeof upsertCustomFieldValuesSchema>;
export declare const createRecordTypeSchema: z.ZodObject<{
    entity: z.ZodEnum<["CUSTOMER", "CONTACT", "LEAD", "OPPORTUNITY", "QUOTATION", "VENDOR"]>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    fieldLayout: z.ZodOptional<z.ZodArray<z.ZodObject<{
        section: z.ZodString;
        fields: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        fields: string[];
        section: string;
    }, {
        fields: string[];
        section: string;
    }>, "many">>;
    pipelineId: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    entity: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER" | "VENDOR";
    description?: string | undefined;
    pipelineId?: string | undefined;
    isDefault?: boolean | undefined;
    fieldLayout?: {
        fields: string[];
        section: string;
    }[] | undefined;
}, {
    name: string;
    entity: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER" | "VENDOR";
    description?: string | undefined;
    pipelineId?: string | undefined;
    isDefault?: boolean | undefined;
    fieldLayout?: {
        fields: string[];
        section: string;
    }[] | undefined;
}>;
export type CreateRecordTypeInput = z.infer<typeof createRecordTypeSchema>;
export declare const updateRecordTypeSchema: z.ZodObject<{
    entity: z.ZodOptional<z.ZodEnum<["CUSTOMER", "CONTACT", "LEAD", "OPPORTUNITY", "QUOTATION", "VENDOR"]>>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    fieldLayout: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        section: z.ZodString;
        fields: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        fields: string[];
        section: string;
    }, {
        fields: string[];
        section: string;
    }>, "many">>>;
    pipelineId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isDefault: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    pipelineId?: string | undefined;
    isDefault?: boolean | undefined;
    entity?: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER" | "VENDOR" | undefined;
    fieldLayout?: {
        fields: string[];
        section: string;
    }[] | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    pipelineId?: string | undefined;
    isDefault?: boolean | undefined;
    entity?: "QUOTATION" | "LEAD" | "OPPORTUNITY" | "CONTACT" | "CUSTOMER" | "VENDOR" | undefined;
    fieldLayout?: {
        fields: string[];
        section: string;
    }[] | undefined;
}>;
export type UpdateRecordTypeInput = z.infer<typeof updateRecordTypeSchema>;
export declare const createApprovalProcessSchema: z.ZodObject<{
    name: z.ZodString;
    entity: z.ZodEnum<["QUOTATION", "OPPORTUNITY", "DISCOUNT", "SALES_ORDER"]>;
    triggerConditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "IN"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        field: string;
        value: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "IN" | "GREATER_THAN" | "LESS_THAN";
    }, {
        field: string;
        value: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "IN" | "GREATER_THAN" | "LESS_THAN";
    }>, "many">;
    steps: z.ZodArray<z.ZodObject<{
        order: z.ZodNumber;
        approverType: z.ZodEnum<["USER", "ROLE", "MANAGER"]>;
        approverId: z.ZodOptional<z.ZodString>;
        autoApproveAfterHours: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        order: number;
        approverType: "MANAGER" | "USER" | "ROLE";
        approverId?: string | undefined;
        autoApproveAfterHours?: number | undefined;
    }, {
        order: number;
        approverType: "MANAGER" | "USER" | "ROLE";
        approverId?: string | undefined;
        autoApproveAfterHours?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    entity: "QUOTATION" | "OPPORTUNITY" | "DISCOUNT" | "SALES_ORDER";
    steps: {
        order: number;
        approverType: "MANAGER" | "USER" | "ROLE";
        approverId?: string | undefined;
        autoApproveAfterHours?: number | undefined;
    }[];
    triggerConditions: {
        field: string;
        value: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "IN" | "GREATER_THAN" | "LESS_THAN";
    }[];
}, {
    name: string;
    entity: "QUOTATION" | "OPPORTUNITY" | "DISCOUNT" | "SALES_ORDER";
    steps: {
        order: number;
        approverType: "MANAGER" | "USER" | "ROLE";
        approverId?: string | undefined;
        autoApproveAfterHours?: number | undefined;
    }[];
    triggerConditions: {
        field: string;
        value: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "IN" | "GREATER_THAN" | "LESS_THAN";
    }[];
}>;
export type CreateApprovalProcessInput = z.infer<typeof createApprovalProcessSchema>;
export declare const updateApprovalProcessSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    entity: z.ZodOptional<z.ZodEnum<["QUOTATION", "OPPORTUNITY", "DISCOUNT", "SALES_ORDER"]>>;
    triggerConditions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["EQUALS", "NOT_EQUALS", "GREATER_THAN", "LESS_THAN", "CONTAINS", "IN"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        field: string;
        value: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "IN" | "GREATER_THAN" | "LESS_THAN";
    }, {
        field: string;
        value: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "IN" | "GREATER_THAN" | "LESS_THAN";
    }>, "many">>;
    steps: z.ZodOptional<z.ZodArray<z.ZodObject<{
        order: z.ZodNumber;
        approverType: z.ZodEnum<["USER", "ROLE", "MANAGER"]>;
        approverId: z.ZodOptional<z.ZodString>;
        autoApproveAfterHours: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        order: number;
        approverType: "MANAGER" | "USER" | "ROLE";
        approverId?: string | undefined;
        autoApproveAfterHours?: number | undefined;
    }, {
        order: number;
        approverType: "MANAGER" | "USER" | "ROLE";
        approverId?: string | undefined;
        autoApproveAfterHours?: number | undefined;
    }>, "many">>;
} & {
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    entity?: "QUOTATION" | "OPPORTUNITY" | "DISCOUNT" | "SALES_ORDER" | undefined;
    steps?: {
        order: number;
        approverType: "MANAGER" | "USER" | "ROLE";
        approverId?: string | undefined;
        autoApproveAfterHours?: number | undefined;
    }[] | undefined;
    triggerConditions?: {
        field: string;
        value: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "IN" | "GREATER_THAN" | "LESS_THAN";
    }[] | undefined;
}, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    entity?: "QUOTATION" | "OPPORTUNITY" | "DISCOUNT" | "SALES_ORDER" | undefined;
    steps?: {
        order: number;
        approverType: "MANAGER" | "USER" | "ROLE";
        approverId?: string | undefined;
        autoApproveAfterHours?: number | undefined;
    }[] | undefined;
    triggerConditions?: {
        field: string;
        value: string;
        operator: "EQUALS" | "NOT_EQUALS" | "CONTAINS" | "IN" | "GREATER_THAN" | "LESS_THAN";
    }[] | undefined;
}>;
export type UpdateApprovalProcessInput = z.infer<typeof updateApprovalProcessSchema>;
export declare const submitApprovalSchema: z.ZodObject<{
    entityType: z.ZodString;
    entityId: z.ZodString;
    processId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    entityType: string;
    entityId: string;
    processId?: string | undefined;
}, {
    entityType: string;
    entityId: string;
    processId?: string | undefined;
}>;
export type SubmitApprovalInput = z.infer<typeof submitApprovalSchema>;
export declare const approvalActionSchema: z.ZodObject<{
    comments: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    comments?: string | undefined;
}, {
    comments?: string | undefined;
}>;
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
export declare const createQuotationTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    headerHtml: z.ZodOptional<z.ZodString>;
    footerHtml: z.ZodOptional<z.ZodString>;
    termsTemplate: z.ZodOptional<z.ZodString>;
    logoUrl: z.ZodOptional<z.ZodString>;
    colorScheme: z.ZodOptional<z.ZodObject<{
        primary: z.ZodOptional<z.ZodString>;
        accent: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        primary?: string | undefined;
        accent?: string | undefined;
    }, {
        primary?: string | undefined;
        accent?: string | undefined;
    }>>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    isDefault?: boolean | undefined;
    headerHtml?: string | undefined;
    footerHtml?: string | undefined;
    termsTemplate?: string | undefined;
    logoUrl?: string | undefined;
    colorScheme?: {
        primary?: string | undefined;
        accent?: string | undefined;
    } | undefined;
}, {
    name: string;
    description?: string | undefined;
    isDefault?: boolean | undefined;
    headerHtml?: string | undefined;
    footerHtml?: string | undefined;
    termsTemplate?: string | undefined;
    logoUrl?: string | undefined;
    colorScheme?: {
        primary?: string | undefined;
        accent?: string | undefined;
    } | undefined;
}>;
export type CreateQuotationTemplateInput = z.infer<typeof createQuotationTemplateSchema>;
export declare const updateQuotationTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    headerHtml: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    footerHtml: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    termsTemplate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    logoUrl: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    colorScheme: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        primary: z.ZodOptional<z.ZodString>;
        accent: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        primary?: string | undefined;
        accent?: string | undefined;
    }, {
        primary?: string | undefined;
        accent?: string | undefined;
    }>>>;
    isDefault: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    isDefault?: boolean | undefined;
    headerHtml?: string | undefined;
    footerHtml?: string | undefined;
    termsTemplate?: string | undefined;
    logoUrl?: string | undefined;
    colorScheme?: {
        primary?: string | undefined;
        accent?: string | undefined;
    } | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    isDefault?: boolean | undefined;
    headerHtml?: string | undefined;
    footerHtml?: string | undefined;
    termsTemplate?: string | undefined;
    logoUrl?: string | undefined;
    colorScheme?: {
        primary?: string | undefined;
        accent?: string | undefined;
    } | undefined;
}>;
export type UpdateQuotationTemplateInput = z.infer<typeof updateQuotationTemplateSchema>;
export declare const sendForSignatureSchema: z.ZodObject<{
    signerName: z.ZodString;
    signerEmail: z.ZodString;
}, "strip", z.ZodTypeAny, {
    signerName: string;
    signerEmail: string;
}, {
    signerName: string;
    signerEmail: string;
}>;
export type SendForSignatureInput = z.infer<typeof sendForSignatureSchema>;
export declare const submitSignatureSchema: z.ZodObject<{
    signatureData: z.ZodString;
}, "strip", z.ZodTypeAny, {
    signatureData: string;
}, {
    signatureData: string;
}>;
export type SubmitSignatureInput = z.infer<typeof submitSignatureSchema>;
export declare const createQuotationVersionSchema: z.ZodObject<{
    changeNote: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    changeNote?: string | undefined;
}, {
    changeNote?: string | undefined;
}>;
export type CreateQuotationVersionInput = z.infer<typeof createQuotationVersionSchema>;
export declare const createCrmCommentSchema: z.ZodObject<{
    body: z.ZodString;
    parentId: z.ZodOptional<z.ZodString>;
    mentions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    body: string;
    parentId?: string | undefined;
    mentions?: string[] | undefined;
}, {
    body: string;
    parentId?: string | undefined;
    mentions?: string[] | undefined;
}>;
export type CreateCrmCommentInput = z.infer<typeof createCrmCommentSchema>;
export declare const updateCrmCommentSchema: z.ZodObject<{
    body: z.ZodString;
}, "strip", z.ZodTypeAny, {
    body: string;
}, {
    body: string;
}>;
export type UpdateCrmCommentInput = z.infer<typeof updateCrmCommentSchema>;
export declare const createCrmNoteSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    noteType: z.ZodOptional<z.ZodEnum<["GENERAL", "MEETING_NOTES", "COMPETITIVE_INTEL", "OBJECTION", "NEXT_STEPS"]>>;
}, "strip", z.ZodTypeAny, {
    body: string;
    title?: string | undefined;
    noteType?: "GENERAL" | "MEETING_NOTES" | "COMPETITIVE_INTEL" | "OBJECTION" | "NEXT_STEPS" | undefined;
}, {
    body: string;
    title?: string | undefined;
    noteType?: "GENERAL" | "MEETING_NOTES" | "COMPETITIVE_INTEL" | "OBJECTION" | "NEXT_STEPS" | undefined;
}>;
export type CreateCrmNoteInput = z.infer<typeof createCrmNoteSchema>;
export declare const updateCrmNoteSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    body: z.ZodOptional<z.ZodString>;
    noteType: z.ZodOptional<z.ZodOptional<z.ZodEnum<["GENERAL", "MEETING_NOTES", "COMPETITIVE_INTEL", "OBJECTION", "NEXT_STEPS"]>>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    body?: string | undefined;
    noteType?: "GENERAL" | "MEETING_NOTES" | "COMPETITIVE_INTEL" | "OBJECTION" | "NEXT_STEPS" | undefined;
}, {
    title?: string | undefined;
    body?: string | undefined;
    noteType?: "GENERAL" | "MEETING_NOTES" | "COMPETITIVE_INTEL" | "OBJECTION" | "NEXT_STEPS" | undefined;
}>;
export type UpdateCrmNoteInput = z.infer<typeof updateCrmNoteSchema>;
export declare const createPlaybookSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    pipelineId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    pipelineId?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    pipelineId?: string | undefined;
}>;
export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>;
export declare const updatePlaybookSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    pipelineId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    pipelineId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    pipelineId?: string | undefined;
}>;
export type UpdatePlaybookInput = z.infer<typeof updatePlaybookSchema>;
export declare const playbookStageSchema: z.ZodObject<{
    stageName: z.ZodString;
    guidanceNotes: z.ZodOptional<z.ZodString>;
    checklist: z.ZodOptional<z.ZodArray<z.ZodObject<{
        item: z.ZodString;
        isRequired: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        isRequired: boolean;
        item: string;
    }, {
        item: string;
        isRequired?: boolean | undefined;
    }>, "many">>;
    requiredFields: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    talkingPoints: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    exitCriteria: z.ZodOptional<z.ZodArray<z.ZodObject<{
        criterion: z.ZodString;
        isRequired: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        isRequired: boolean;
        criterion: string;
    }, {
        criterion: string;
        isRequired?: boolean | undefined;
    }>, "many">>;
    sortOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    stageName: string;
    sortOrder?: number | undefined;
    guidanceNotes?: string | undefined;
    checklist?: {
        isRequired: boolean;
        item: string;
    }[] | undefined;
    requiredFields?: string[] | undefined;
    talkingPoints?: string[] | undefined;
    exitCriteria?: {
        isRequired: boolean;
        criterion: string;
    }[] | undefined;
}, {
    stageName: string;
    sortOrder?: number | undefined;
    guidanceNotes?: string | undefined;
    checklist?: {
        item: string;
        isRequired?: boolean | undefined;
    }[] | undefined;
    requiredFields?: string[] | undefined;
    talkingPoints?: string[] | undefined;
    exitCriteria?: {
        criterion: string;
        isRequired?: boolean | undefined;
    }[] | undefined;
}>;
export type PlaybookStageInput = z.infer<typeof playbookStageSchema>;
export declare const createBattlecardSchema: z.ZodObject<{
    competitor: z.ZodString;
    playbookId: z.ZodOptional<z.ZodString>;
    strengths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    weaknesses: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    objections: z.ZodOptional<z.ZodArray<z.ZodObject<{
        objection: z.ZodString;
        response: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        objection: string;
        response: string;
    }, {
        objection: string;
        response: string;
    }>, "many">>;
    winStrategy: z.ZodOptional<z.ZodString>;
    loseReasons: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    competitor: string;
    playbookId?: string | undefined;
    strengths?: string[] | undefined;
    weaknesses?: string[] | undefined;
    objections?: {
        objection: string;
        response: string;
    }[] | undefined;
    winStrategy?: string | undefined;
    loseReasons?: string[] | undefined;
}, {
    competitor: string;
    playbookId?: string | undefined;
    strengths?: string[] | undefined;
    weaknesses?: string[] | undefined;
    objections?: {
        objection: string;
        response: string;
    }[] | undefined;
    winStrategy?: string | undefined;
    loseReasons?: string[] | undefined;
}>;
export type CreateBattlecardInput = z.infer<typeof createBattlecardSchema>;
export declare const updateBattlecardSchema: z.ZodObject<{
    competitor: z.ZodOptional<z.ZodString>;
    playbookId: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    strengths: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    weaknesses: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    objections: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodObject<{
        objection: z.ZodString;
        response: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        objection: string;
        response: string;
    }, {
        objection: string;
        response: string;
    }>, "many">>>;
    winStrategy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    loseReasons: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    competitor?: string | undefined;
    playbookId?: string | undefined;
    strengths?: string[] | undefined;
    weaknesses?: string[] | undefined;
    objections?: {
        objection: string;
        response: string;
    }[] | undefined;
    winStrategy?: string | undefined;
    loseReasons?: string[] | undefined;
}, {
    competitor?: string | undefined;
    playbookId?: string | undefined;
    strengths?: string[] | undefined;
    weaknesses?: string[] | undefined;
    objections?: {
        objection: string;
        response: string;
    }[] | undefined;
    winStrategy?: string | undefined;
    loseReasons?: string[] | undefined;
}>;
export type UpdateBattlecardInput = z.infer<typeof updateBattlecardSchema>;
export declare const createCrmDashboardSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    isShared: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    isShared?: boolean | undefined;
}, {
    name: string;
    description?: string | undefined;
    isShared?: boolean | undefined;
}>;
export type CreateCrmDashboardInput = z.infer<typeof createCrmDashboardSchema>;
export declare const updateCrmDashboardSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    isShared: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    isShared?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    isShared?: boolean | undefined;
}>;
export type UpdateCrmDashboardInput = z.infer<typeof updateCrmDashboardSchema>;
export declare const createDashboardWidgetSchema: z.ZodObject<{
    widgetType: z.ZodEnum<["KPI_CARD", "BAR_CHART", "LINE_CHART", "PIE_CHART", "FUNNEL", "TABLE", "LEADERBOARD", "GAUGE"]>;
    title: z.ZodString;
    dataSource: z.ZodEnum<["PIPELINE", "LEADS", "ACTIVITIES", "REVENUE", "TARGETS", "CONVERSIONS", "COMMISSIONS"]>;
    config: z.ZodObject<{
        metric: z.ZodString;
        groupBy: z.ZodOptional<z.ZodString>;
        dateRange: z.ZodOptional<z.ZodEnum<["TODAY", "THIS_WEEK", "THIS_MONTH", "THIS_QUARTER", "THIS_YEAR", "LAST_7_DAYS", "LAST_30_DAYS", "LAST_90_DAYS", "LAST_YEAR", "CUSTOM"]>>;
        filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        colorScheme: z.ZodOptional<z.ZodString>;
        threshold: z.ZodOptional<z.ZodObject<{
            warning: z.ZodNumber;
            danger: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            warning: number;
            danger: number;
        }, {
            warning: number;
            danger: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        metric: string;
        filters?: Record<string, string> | undefined;
        colorScheme?: string | undefined;
        groupBy?: string | undefined;
        dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "LAST_YEAR" | "CUSTOM" | undefined;
        threshold?: {
            warning: number;
            danger: number;
        } | undefined;
    }, {
        metric: string;
        filters?: Record<string, string> | undefined;
        colorScheme?: string | undefined;
        groupBy?: string | undefined;
        dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "LAST_YEAR" | "CUSTOM" | undefined;
        threshold?: {
            warning: number;
            danger: number;
        } | undefined;
    }>;
    refreshInterval: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    dataSource: "REVENUE" | "PIPELINE" | "LEADS" | "ACTIVITIES" | "TARGETS" | "CONVERSIONS" | "COMMISSIONS";
    config: {
        metric: string;
        filters?: Record<string, string> | undefined;
        colorScheme?: string | undefined;
        groupBy?: string | undefined;
        dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "LAST_YEAR" | "CUSTOM" | undefined;
        threshold?: {
            warning: number;
            danger: number;
        } | undefined;
    };
    widgetType: "FUNNEL" | "KPI_CARD" | "BAR_CHART" | "LINE_CHART" | "PIE_CHART" | "TABLE" | "LEADERBOARD" | "GAUGE";
    refreshInterval?: number | undefined;
}, {
    title: string;
    dataSource: "REVENUE" | "PIPELINE" | "LEADS" | "ACTIVITIES" | "TARGETS" | "CONVERSIONS" | "COMMISSIONS";
    config: {
        metric: string;
        filters?: Record<string, string> | undefined;
        colorScheme?: string | undefined;
        groupBy?: string | undefined;
        dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "LAST_YEAR" | "CUSTOM" | undefined;
        threshold?: {
            warning: number;
            danger: number;
        } | undefined;
    };
    widgetType: "FUNNEL" | "KPI_CARD" | "BAR_CHART" | "LINE_CHART" | "PIE_CHART" | "TABLE" | "LEADERBOARD" | "GAUGE";
    refreshInterval?: number | undefined;
}>;
export type CreateDashboardWidgetInput = z.infer<typeof createDashboardWidgetSchema>;
export declare const updateDashboardWidgetSchema: z.ZodObject<{
    widgetType: z.ZodOptional<z.ZodEnum<["KPI_CARD", "BAR_CHART", "LINE_CHART", "PIE_CHART", "FUNNEL", "TABLE", "LEADERBOARD", "GAUGE"]>>;
    title: z.ZodOptional<z.ZodString>;
    dataSource: z.ZodOptional<z.ZodEnum<["PIPELINE", "LEADS", "ACTIVITIES", "REVENUE", "TARGETS", "CONVERSIONS", "COMMISSIONS"]>>;
    config: z.ZodOptional<z.ZodObject<{
        metric: z.ZodString;
        groupBy: z.ZodOptional<z.ZodString>;
        dateRange: z.ZodOptional<z.ZodEnum<["TODAY", "THIS_WEEK", "THIS_MONTH", "THIS_QUARTER", "THIS_YEAR", "LAST_7_DAYS", "LAST_30_DAYS", "LAST_90_DAYS", "LAST_YEAR", "CUSTOM"]>>;
        filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        colorScheme: z.ZodOptional<z.ZodString>;
        threshold: z.ZodOptional<z.ZodObject<{
            warning: z.ZodNumber;
            danger: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            warning: number;
            danger: number;
        }, {
            warning: number;
            danger: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        metric: string;
        filters?: Record<string, string> | undefined;
        colorScheme?: string | undefined;
        groupBy?: string | undefined;
        dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "LAST_YEAR" | "CUSTOM" | undefined;
        threshold?: {
            warning: number;
            danger: number;
        } | undefined;
    }, {
        metric: string;
        filters?: Record<string, string> | undefined;
        colorScheme?: string | undefined;
        groupBy?: string | undefined;
        dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "LAST_YEAR" | "CUSTOM" | undefined;
        threshold?: {
            warning: number;
            danger: number;
        } | undefined;
    }>>;
    refreshInterval: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    dataSource?: "REVENUE" | "PIPELINE" | "LEADS" | "ACTIVITIES" | "TARGETS" | "CONVERSIONS" | "COMMISSIONS" | undefined;
    config?: {
        metric: string;
        filters?: Record<string, string> | undefined;
        colorScheme?: string | undefined;
        groupBy?: string | undefined;
        dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "LAST_YEAR" | "CUSTOM" | undefined;
        threshold?: {
            warning: number;
            danger: number;
        } | undefined;
    } | undefined;
    widgetType?: "FUNNEL" | "KPI_CARD" | "BAR_CHART" | "LINE_CHART" | "PIE_CHART" | "TABLE" | "LEADERBOARD" | "GAUGE" | undefined;
    refreshInterval?: number | undefined;
}, {
    title?: string | undefined;
    dataSource?: "REVENUE" | "PIPELINE" | "LEADS" | "ACTIVITIES" | "TARGETS" | "CONVERSIONS" | "COMMISSIONS" | undefined;
    config?: {
        metric: string;
        filters?: Record<string, string> | undefined;
        colorScheme?: string | undefined;
        groupBy?: string | undefined;
        dateRange?: "TODAY" | "THIS_WEEK" | "THIS_MONTH" | "THIS_QUARTER" | "THIS_YEAR" | "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS" | "LAST_YEAR" | "CUSTOM" | undefined;
        threshold?: {
            warning: number;
            danger: number;
        } | undefined;
    } | undefined;
    widgetType?: "FUNNEL" | "KPI_CARD" | "BAR_CHART" | "LINE_CHART" | "PIE_CHART" | "TABLE" | "LEADERBOARD" | "GAUGE" | undefined;
    refreshInterval?: number | undefined;
}>;
export type UpdateDashboardWidgetInput = z.infer<typeof updateDashboardWidgetSchema>;
export declare const updateDashboardLayoutSchema: z.ZodObject<{
    layout: z.ZodArray<z.ZodObject<{
        widgetId: z.ZodString;
        x: z.ZodNumber;
        y: z.ZodNumber;
        w: z.ZodNumber;
        h: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        widgetId: string;
        x: number;
        y: number;
        w: number;
        h: number;
    }, {
        widgetId: string;
        x: number;
        y: number;
        w: number;
        h: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    layout: {
        widgetId: string;
        x: number;
        y: number;
        w: number;
        h: number;
    }[];
}, {
    layout: {
        widgetId: string;
        x: number;
        y: number;
        w: number;
        h: number;
    }[];
}>;
export type UpdateDashboardLayoutInput = z.infer<typeof updateDashboardLayoutSchema>;
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    slug: string;
    sortOrder: number;
    description?: string | null | undefined;
    parentId?: string | null | undefined;
    imageUrl?: string | null | undefined;
}, {
    name: string;
    slug: string;
    description?: string | null | undefined;
    isActive?: boolean | undefined;
    parentId?: string | null | undefined;
    sortOrder?: number | undefined;
    imageUrl?: string | null | undefined;
}>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    slug: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    imageUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    sortOrder: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | null | undefined;
    isActive?: boolean | undefined;
    parentId?: string | null | undefined;
    slug?: string | undefined;
    sortOrder?: number | undefined;
    imageUrl?: string | null | undefined;
}, {
    name?: string | undefined;
    description?: string | null | undefined;
    isActive?: boolean | undefined;
    parentId?: string | null | undefined;
    slug?: string | undefined;
    sortOrder?: number | undefined;
    imageUrl?: string | null | undefined;
}>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export declare const createVariantSchema: z.ZodObject<{
    parentSkuId: z.ZodString;
    sku: z.ZodString;
    name: z.ZodString;
    attributes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    costPrice: z.ZodNumber;
    sellPrice: z.ZodNumber;
    barcode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    sku: string;
    costPrice: number;
    sellPrice: number;
    isActive: boolean;
    parentSkuId: string;
    attributes: Record<string, unknown>;
    barcode?: string | null | undefined;
}, {
    name: string;
    sku: string;
    costPrice: number;
    sellPrice: number;
    parentSkuId: string;
    isActive?: boolean | undefined;
    attributes?: Record<string, unknown> | undefined;
    barcode?: string | null | undefined;
}>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export declare const createBinLocationSchema: z.ZodObject<{
    warehouseId: z.ZodString;
    zone: z.ZodDefault<z.ZodString>;
    aisle: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    rack: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    bin: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    code: z.ZodString;
    name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    isActive: boolean;
    warehouseId: string;
    zone: string;
    name?: string | null | undefined;
    description?: string | null | undefined;
    aisle?: string | null | undefined;
    rack?: string | null | undefined;
    bin?: string | null | undefined;
    capacity?: number | null | undefined;
}, {
    code: string;
    warehouseId: string;
    name?: string | null | undefined;
    description?: string | null | undefined;
    isActive?: boolean | undefined;
    zone?: string | undefined;
    aisle?: string | null | undefined;
    rack?: string | null | undefined;
    bin?: string | null | undefined;
    capacity?: number | null | undefined;
}>;
export type CreateBinLocationInput = z.infer<typeof createBinLocationSchema>;
export declare const createSerialNumberSchema: z.ZodObject<{
    productId: z.ZodString;
    warehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    serialNo: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["AVAILABLE", "RESERVED", "SOLD", "IN_REPAIR", "SCRAPPED", "RETURNED"]>>;
    purchaseDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    warrantyExpiry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    purchaseOrderId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    salesOrderId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    status: "RETURNED" | "AVAILABLE" | "RESERVED" | "SOLD" | "IN_REPAIR" | "SCRAPPED";
    productId: string;
    serialNo: string;
    customFields: Record<string, unknown>;
    notes?: string | null | undefined;
    purchaseOrderId?: string | null | undefined;
    warehouseId?: string | null | undefined;
    salesOrderId?: string | null | undefined;
    purchaseDate?: string | null | undefined;
    warrantyExpiry?: string | null | undefined;
}, {
    productId: string;
    serialNo: string;
    status?: "RETURNED" | "AVAILABLE" | "RESERVED" | "SOLD" | "IN_REPAIR" | "SCRAPPED" | undefined;
    notes?: string | null | undefined;
    purchaseOrderId?: string | null | undefined;
    warehouseId?: string | null | undefined;
    salesOrderId?: string | null | undefined;
    purchaseDate?: string | null | undefined;
    warrantyExpiry?: string | null | undefined;
    customFields?: Record<string, unknown> | undefined;
}>;
export type CreateSerialNumberInput = z.infer<typeof createSerialNumberSchema>;
export declare const updateSerialNumberSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    warehouseId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    serialNo: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["AVAILABLE", "RESERVED", "SOLD", "IN_REPAIR", "SCRAPPED", "RETURNED"]>>>;
    purchaseDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    warrantyExpiry: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    purchaseOrderId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    salesOrderId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    customFields: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    status?: "RETURNED" | "AVAILABLE" | "RESERVED" | "SOLD" | "IN_REPAIR" | "SCRAPPED" | undefined;
    notes?: string | null | undefined;
    productId?: string | undefined;
    purchaseOrderId?: string | null | undefined;
    warehouseId?: string | null | undefined;
    salesOrderId?: string | null | undefined;
    serialNo?: string | undefined;
    purchaseDate?: string | null | undefined;
    warrantyExpiry?: string | null | undefined;
    customFields?: Record<string, unknown> | undefined;
}, {
    status?: "RETURNED" | "AVAILABLE" | "RESERVED" | "SOLD" | "IN_REPAIR" | "SCRAPPED" | undefined;
    notes?: string | null | undefined;
    productId?: string | undefined;
    purchaseOrderId?: string | null | undefined;
    warehouseId?: string | null | undefined;
    salesOrderId?: string | null | undefined;
    serialNo?: string | undefined;
    purchaseDate?: string | null | undefined;
    warrantyExpiry?: string | null | undefined;
    customFields?: Record<string, unknown> | undefined;
}>;
export type UpdateSerialNumberInput = z.infer<typeof updateSerialNumberSchema>;
export declare const createBatchSchema: z.ZodObject<{
    productId: z.ZodString;
    batchNo: z.ZodString;
    lotNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quantity: z.ZodDefault<z.ZodNumber>;
    manufactureDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expiryDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    supplierBatchNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    costPrice: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "PARTIALLY_USED", "EXHAUSTED", "EXPIRED", "QUARANTINE"]>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "ACTIVE" | "PARTIALLY_USED" | "EXHAUSTED" | "EXPIRED" | "QUARANTINE";
    productId: string;
    quantity: number;
    batchNo: string;
    notes?: string | null | undefined;
    costPrice?: number | null | undefined;
    lotNo?: string | null | undefined;
    manufactureDate?: string | null | undefined;
    expiryDate?: string | null | undefined;
    supplierBatchNo?: string | null | undefined;
}, {
    productId: string;
    batchNo: string;
    status?: "ACTIVE" | "PARTIALLY_USED" | "EXHAUSTED" | "EXPIRED" | "QUARANTINE" | undefined;
    notes?: string | null | undefined;
    costPrice?: number | null | undefined;
    quantity?: number | undefined;
    lotNo?: string | null | undefined;
    manufactureDate?: string | null | undefined;
    expiryDate?: string | null | undefined;
    supplierBatchNo?: string | null | undefined;
}>;
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export declare const updateBatchSchema: z.ZodObject<{
    productId: z.ZodOptional<z.ZodString>;
    batchNo: z.ZodOptional<z.ZodString>;
    lotNo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    quantity: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    manufactureDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    expiryDate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    supplierBatchNo: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    costPrice: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    status: z.ZodOptional<z.ZodDefault<z.ZodEnum<["ACTIVE", "PARTIALLY_USED", "EXHAUSTED", "EXPIRED", "QUARANTINE"]>>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "PARTIALLY_USED" | "EXHAUSTED" | "EXPIRED" | "QUARANTINE" | undefined;
    notes?: string | null | undefined;
    costPrice?: number | null | undefined;
    productId?: string | undefined;
    quantity?: number | undefined;
    batchNo?: string | undefined;
    lotNo?: string | null | undefined;
    manufactureDate?: string | null | undefined;
    expiryDate?: string | null | undefined;
    supplierBatchNo?: string | null | undefined;
}, {
    status?: "ACTIVE" | "PARTIALLY_USED" | "EXHAUSTED" | "EXPIRED" | "QUARANTINE" | undefined;
    notes?: string | null | undefined;
    costPrice?: number | null | undefined;
    productId?: string | undefined;
    quantity?: number | undefined;
    batchNo?: string | undefined;
    lotNo?: string | null | undefined;
    manufactureDate?: string | null | undefined;
    expiryDate?: string | null | undefined;
    supplierBatchNo?: string | null | undefined;
}>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;
export declare const createCycleCountItemSchema: z.ZodObject<{
    productId: z.ZodString;
    binLocationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expectedQty: z.ZodNumber;
    countedQty: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    expectedQty: number;
    binLocationId?: string | null | undefined;
    countedQty?: number | null | undefined;
    remarks?: string | null | undefined;
}, {
    productId: string;
    expectedQty: number;
    binLocationId?: string | null | undefined;
    countedQty?: number | null | undefined;
    remarks?: string | null | undefined;
}>;
export declare const createCycleCountSchema: z.ZodObject<{
    warehouseId: z.ZodString;
    countedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        binLocationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        expectedQty: z.ZodNumber;
        countedQty: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
        remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        expectedQty: number;
        binLocationId?: string | null | undefined;
        countedQty?: number | null | undefined;
        remarks?: string | null | undefined;
    }, {
        productId: string;
        expectedQty: number;
        binLocationId?: string | null | undefined;
        countedQty?: number | null | undefined;
        remarks?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    warehouseId: string;
    items: {
        productId: string;
        expectedQty: number;
        binLocationId?: string | null | undefined;
        countedQty?: number | null | undefined;
        remarks?: string | null | undefined;
    }[];
    notes?: string | null | undefined;
    countedBy?: string | null | undefined;
}, {
    warehouseId: string;
    items: {
        productId: string;
        expectedQty: number;
        binLocationId?: string | null | undefined;
        countedQty?: number | null | undefined;
        remarks?: string | null | undefined;
    }[];
    notes?: string | null | undefined;
    countedBy?: string | null | undefined;
}>;
export type CreateCycleCountInput = z.infer<typeof createCycleCountSchema>;
export declare const submitCycleCountSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        countedQty: z.ZodNumber;
        remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        countedQty: number;
        remarks?: string | null | undefined;
    }, {
        id: string;
        countedQty: number;
        remarks?: string | null | undefined;
    }>, "many">;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    items: {
        id: string;
        countedQty: number;
        remarks?: string | null | undefined;
    }[];
    remarks?: string | null | undefined;
}, {
    items: {
        id: string;
        countedQty: number;
        remarks?: string | null | undefined;
    }[];
    remarks?: string | null | undefined;
}>;
export type SubmitCycleCountInput = z.infer<typeof submitCycleCountSchema>;
export declare const createCycleCountScheduleSchema: z.ZodObject<{
    warehouseId: z.ZodString;
    zone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    binScope: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    frequency: z.ZodDefault<z.ZodEnum<["WEEKLY", "MONTHLY", "QUARTERLY"]>>;
    blindCount: z.ZodDefault<z.ZodBoolean>;
    nextDueDate: z.ZodString;
    active: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    warehouseId: string;
    frequency: "WEEKLY" | "MONTHLY" | "QUARTERLY";
    blindCount: boolean;
    nextDueDate: string;
    active: boolean;
    zone?: string | null | undefined;
    binScope?: string | null | undefined;
}, {
    warehouseId: string;
    nextDueDate: string;
    zone?: string | null | undefined;
    binScope?: string | null | undefined;
    frequency?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | undefined;
    blindCount?: boolean | undefined;
    active?: boolean | undefined;
}>;
export type CreateCycleCountScheduleInput = z.infer<typeof createCycleCountScheduleSchema>;
export declare const updateCycleCountScheduleSchema: z.ZodObject<{
    warehouseId: z.ZodOptional<z.ZodString>;
    zone: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    binScope: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    frequency: z.ZodOptional<z.ZodDefault<z.ZodEnum<["WEEKLY", "MONTHLY", "QUARTERLY"]>>>;
    blindCount: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    nextDueDate: z.ZodOptional<z.ZodString>;
    active: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    warehouseId?: string | undefined;
    zone?: string | null | undefined;
    binScope?: string | null | undefined;
    frequency?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | undefined;
    blindCount?: boolean | undefined;
    nextDueDate?: string | undefined;
    active?: boolean | undefined;
}, {
    warehouseId?: string | undefined;
    zone?: string | null | undefined;
    binScope?: string | null | undefined;
    frequency?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | undefined;
    blindCount?: boolean | undefined;
    nextDueDate?: string | undefined;
    active?: boolean | undefined;
}>;
export type UpdateCycleCountScheduleInput = z.infer<typeof updateCycleCountScheduleSchema>;
export declare const createLicensePlateSchema: z.ZodObject<{
    code: z.ZodString;
    warehouseId: z.ZodString;
    binId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    warehouseId: string;
    binId?: string | null | undefined;
}, {
    code: string;
    warehouseId: string;
    binId?: string | null | undefined;
}>;
export type CreateLicensePlateInput = z.infer<typeof createLicensePlateSchema>;
export declare const addLicensePlateItemSchema: z.ZodObject<{
    inventoryItemId: z.ZodString;
    quantity: z.ZodNumber;
    lotBatchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    serialNumberId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    inventoryItemId: string;
    lotBatchId?: string | null | undefined;
    serialNumberId?: string | null | undefined;
}, {
    quantity: number;
    inventoryItemId: string;
    lotBatchId?: string | null | undefined;
    serialNumberId?: string | null | undefined;
}>;
export type AddLicensePlateItemInput = z.infer<typeof addLicensePlateItemSchema>;
export declare const moveLicensePlateSchema: z.ZodObject<{
    binId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    binId: string;
}, {
    binId: string;
}>;
export type MoveLicensePlateInput = z.infer<typeof moveLicensePlateSchema>;
export declare const createPutawayTaskSchema: z.ZodObject<{
    stockEntryId: z.ZodString;
    inventoryItemId: z.ZodString;
    quantity: z.ZodNumber;
    suggestedBinId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    inventoryItemId: string;
    stockEntryId: string;
    suggestedBinId?: string | null | undefined;
}, {
    quantity: number;
    inventoryItemId: string;
    stockEntryId: string;
    suggestedBinId?: string | null | undefined;
}>;
export type CreatePutawayTaskInput = z.infer<typeof createPutawayTaskSchema>;
export declare const completePutawayTaskSchema: z.ZodObject<{
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    notes?: string | null | undefined;
}, {
    notes?: string | null | undefined;
}>;
export type CompletePutawayTaskInput = z.infer<typeof completePutawayTaskSchema>;
export declare const quarantineBatchSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type QuarantineBatchInput = z.infer<typeof quarantineBatchSchema>;
export declare const releaseBatchQuarantineSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export type ReleaseBatchQuarantineInput = z.infer<typeof releaseBatchQuarantineSchema>;
export declare const createStockReservationSchema: z.ZodObject<{
    productId: z.ZodString;
    warehouseId: z.ZodString;
    quantity: z.ZodNumber;
    sourceType: z.ZodDefault<z.ZodEnum<["SALES_ORDER", "TRANSFER", "MANUAL"]>>;
    sourceId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    warehouseId: string;
    sourceType: "TRANSFER" | "SALES_ORDER" | "MANUAL";
    notes?: string | null | undefined;
    sourceId?: string | null | undefined;
}, {
    productId: string;
    quantity: number;
    warehouseId: string;
    notes?: string | null | undefined;
    sourceId?: string | null | undefined;
    sourceType?: "TRANSFER" | "SALES_ORDER" | "MANUAL" | undefined;
}>;
export type CreateStockReservationInput = z.infer<typeof createStockReservationSchema>;
export declare const assembleKitSchema: z.ZodObject<{
    warehouseId: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    warehouseId: string;
}, {
    quantity: number;
    warehouseId: string;
}>;
export type AssembleKitInput = z.infer<typeof assembleKitSchema>;
export declare const disassembleKitSchema: z.ZodObject<{
    warehouseId: z.ZodString;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    warehouseId: string;
}, {
    quantity: number;
    warehouseId: string;
}>;
export type DisassembleKitInput = z.infer<typeof disassembleKitSchema>;
export declare const createTransferApprovalRuleSchema: z.ZodObject<{
    warehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    thresholdValue: z.ZodNumber;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
    thresholdValue: number;
    warehouseId?: string | null | undefined;
}, {
    thresholdValue: number;
    isActive?: boolean | undefined;
    warehouseId?: string | null | undefined;
}>;
export type CreateTransferApprovalRuleInput = z.infer<typeof createTransferApprovalRuleSchema>;
export declare const updateTransferApprovalRuleSchema: z.ZodObject<{
    warehouseId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    thresholdValue: z.ZodOptional<z.ZodNumber>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    isActive?: boolean | undefined;
    warehouseId?: string | null | undefined;
    thresholdValue?: number | undefined;
}, {
    isActive?: boolean | undefined;
    warehouseId?: string | null | undefined;
    thresholdValue?: number | undefined;
}>;
export type UpdateTransferApprovalRuleInput = z.infer<typeof updateTransferApprovalRuleSchema>;
export declare const rejectTransferSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export type RejectTransferInput = z.infer<typeof rejectTransferSchema>;
export declare const createPickWaveSchema: z.ZodObject<{
    warehouseId: z.ZodString;
    salesOrderIds: z.ZodArray<z.ZodString, "many">;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    warehouseId: string;
    salesOrderIds: string[];
    notes?: string | null | undefined;
}, {
    warehouseId: string;
    salesOrderIds: string[];
    notes?: string | null | undefined;
}>;
export type CreatePickWaveInput = z.infer<typeof createPickWaveSchema>;
export declare const recordPickSchema: z.ZodObject<{
    pickedQty: z.ZodNumber;
    scannedSerials: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    pickedQty: number;
    scannedSerials: string[];
}, {
    pickedQty: number;
    scannedSerials?: string[] | undefined;
}>;
export type RecordPickInput = z.infer<typeof recordPickSchema>;
export declare const createConsignmentStockSchema: z.ZodObject<{
    supplierName: z.ZodString;
    productId: z.ZodString;
    warehouseId: z.ZodString;
    quantityOnHand: z.ZodDefault<z.ZodNumber>;
    unitCost: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    productId: string;
    warehouseId: string;
    supplierName: string;
    quantityOnHand: number;
    unitCost: number;
}, {
    productId: string;
    warehouseId: string;
    supplierName: string;
    unitCost: number;
    quantityOnHand?: number | undefined;
}>;
export type CreateConsignmentStockInput = z.infer<typeof createConsignmentStockSchema>;
export declare const recordConsignmentConsumptionSchema: z.ZodObject<{
    quantity: z.ZodNumber;
    reference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    reference?: string | null | undefined;
}, {
    quantity: number;
    reference?: string | null | undefined;
}>;
export type RecordConsignmentConsumptionInput = z.infer<typeof recordConsignmentConsumptionSchema>;
export declare const receiveWithTraceabilitySchema: z.ZodObject<{
    productId: z.ZodString;
    warehouseId: z.ZodString;
    quantity: z.ZodNumber;
    valuationRate: z.ZodDefault<z.ZodNumber>;
    serialNumbers: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    batchNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    lotNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expiryDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    warehouseId: string;
    valuationRate: number;
    serialNumbers: string[];
    batchNo?: string | null | undefined;
    lotNo?: string | null | undefined;
    expiryDate?: string | null | undefined;
}, {
    productId: string;
    quantity: number;
    warehouseId: string;
    batchNo?: string | null | undefined;
    lotNo?: string | null | undefined;
    expiryDate?: string | null | undefined;
    valuationRate?: number | undefined;
    serialNumbers?: string[] | undefined;
}>;
export type ReceiveWithTraceabilityInput = z.infer<typeof receiveWithTraceabilitySchema>;
export declare const createDockAppointmentSchema: z.ZodObject<{
    warehouseId: z.ZodString;
    dockDoor: z.ZodString;
    type: z.ZodEnum<["INBOUND", "OUTBOUND"]>;
    carrierName: z.ZodString;
    referenceType: z.ZodNullable<z.ZodOptional<z.ZodEnum<["STOCK_ENTRY", "PICK_WAVE"]>>>;
    referenceId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    scheduledAt: z.ZodString;
    durationMinutes: z.ZodDefault<z.ZodNumber>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: "INBOUND" | "OUTBOUND";
    warehouseId: string;
    carrierName: string;
    dockDoor: string;
    scheduledAt: string;
    durationMinutes: number;
    notes?: string | null | undefined;
    referenceType?: "STOCK_ENTRY" | "PICK_WAVE" | null | undefined;
    referenceId?: string | null | undefined;
}, {
    type: "INBOUND" | "OUTBOUND";
    warehouseId: string;
    carrierName: string;
    dockDoor: string;
    scheduledAt: string;
    notes?: string | null | undefined;
    referenceType?: "STOCK_ENTRY" | "PICK_WAVE" | null | undefined;
    referenceId?: string | null | undefined;
    durationMinutes?: number | undefined;
}>;
export type CreateDockAppointmentInput = z.infer<typeof createDockAppointmentSchema>;
export declare const updateDockAppointmentSchema: z.ZodObject<{
    warehouseId: z.ZodOptional<z.ZodString>;
    dockDoor: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["INBOUND", "OUTBOUND"]>>;
    carrierName: z.ZodOptional<z.ZodString>;
    referenceType: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodEnum<["STOCK_ENTRY", "PICK_WAVE"]>>>>;
    referenceId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    scheduledAt: z.ZodOptional<z.ZodString>;
    durationMinutes: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    type?: "INBOUND" | "OUTBOUND" | undefined;
    notes?: string | null | undefined;
    warehouseId?: string | undefined;
    carrierName?: string | undefined;
    dockDoor?: string | undefined;
    referenceType?: "STOCK_ENTRY" | "PICK_WAVE" | null | undefined;
    referenceId?: string | null | undefined;
    scheduledAt?: string | undefined;
    durationMinutes?: number | undefined;
}, {
    type?: "INBOUND" | "OUTBOUND" | undefined;
    notes?: string | null | undefined;
    warehouseId?: string | undefined;
    carrierName?: string | undefined;
    dockDoor?: string | undefined;
    referenceType?: "STOCK_ENTRY" | "PICK_WAVE" | null | undefined;
    referenceId?: string | null | undefined;
    scheduledAt?: string | undefined;
    durationMinutes?: number | undefined;
}>;
export type UpdateDockAppointmentInput = z.infer<typeof updateDockAppointmentSchema>;
export declare const createQAInspectionTemplateSchema: z.ZodObject<{
    name: z.ZodString;
    productId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    checklist: z.ZodDefault<z.ZodArray<z.ZodObject<{
        parameter: z.ZodString;
        criteria: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        criteria: string;
        parameter: string;
    }, {
        criteria: string;
        parameter: string;
    }>, "many">>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    checklist: {
        criteria: string;
        parameter: string;
    }[];
    productId?: string | null | undefined;
}, {
    name: string;
    isActive?: boolean | undefined;
    productId?: string | null | undefined;
    checklist?: {
        criteria: string;
        parameter: string;
    }[] | undefined;
}>;
export type CreateQAInspectionTemplateInput = z.infer<typeof createQAInspectionTemplateSchema>;
export declare const updateQAInspectionTemplateSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    productId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    checklist: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodObject<{
        parameter: z.ZodString;
        criteria: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        criteria: string;
        parameter: string;
    }, {
        criteria: string;
        parameter: string;
    }>, "many">>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    productId?: string | null | undefined;
    checklist?: {
        criteria: string;
        parameter: string;
    }[] | undefined;
}, {
    name?: string | undefined;
    isActive?: boolean | undefined;
    productId?: string | null | undefined;
    checklist?: {
        criteria: string;
        parameter: string;
    }[] | undefined;
}>;
export type UpdateQAInspectionTemplateInput = z.infer<typeof updateQAInspectionTemplateSchema>;
export declare const createRequisitionFromReorderRuleSchema: z.ZodObject<{
    requiredDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    requiredDate?: string | null | undefined;
}, {
    requiredDate?: string | null | undefined;
}>;
export type CreateRequisitionFromReorderRuleInput = z.infer<typeof createRequisitionFromReorderRuleSchema>;
export declare const createKitVersionSchema: z.ZodObject<{
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    notes?: string | null | undefined;
}, {
    notes?: string | null | undefined;
}>;
export type CreateKitVersionInput = z.infer<typeof createKitVersionSchema>;
export declare const createQACheckpointSchema: z.ZodObject<{
    parameter: z.ZodString;
    criteria: z.ZodString;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    sortOrder: number;
    criteria: string;
    parameter: string;
}, {
    criteria: string;
    parameter: string;
    sortOrder?: number | undefined;
}>;
export declare const createQAInspectionSchema: z.ZodObject<{
    referenceType: z.ZodEnum<["PURCHASE_RECEIPT", "STOCK_ENTRY", "PRODUCTION"]>;
    referenceId: z.ZodString;
    productId: z.ZodString;
    warehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    inspectedQty: z.ZodNumber;
    inspectedBy: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    checkpoints: z.ZodArray<z.ZodObject<{
        parameter: z.ZodString;
        criteria: z.ZodString;
        sortOrder: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        sortOrder: number;
        criteria: string;
        parameter: string;
    }, {
        criteria: string;
        parameter: string;
        sortOrder?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    productId: string;
    referenceType: "STOCK_ENTRY" | "PURCHASE_RECEIPT" | "PRODUCTION";
    referenceId: string;
    inspectedQty: number;
    checkpoints: {
        sortOrder: number;
        criteria: string;
        parameter: string;
    }[];
    warehouseId?: string | null | undefined;
    remarks?: string | null | undefined;
    inspectedBy?: string | null | undefined;
}, {
    productId: string;
    referenceType: "STOCK_ENTRY" | "PURCHASE_RECEIPT" | "PRODUCTION";
    referenceId: string;
    inspectedQty: number;
    checkpoints: {
        criteria: string;
        parameter: string;
        sortOrder?: number | undefined;
    }[];
    warehouseId?: string | null | undefined;
    remarks?: string | null | undefined;
    inspectedBy?: string | null | undefined;
}>;
export type CreateQAInspectionInput = z.infer<typeof createQAInspectionSchema>;
export declare const submitQAInspectionSchema: z.ZodObject<{
    status: z.ZodEnum<["PASS", "FAIL", "PARTIAL", "CANCELLED"]>;
    disposition: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    acceptedQty: z.ZodNumber;
    rejectedQty: z.ZodNumber;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    checkpoints: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        result: z.ZodEnum<["PASS", "FAIL", "NA"]>;
        observedValue: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        result: "PASS" | "FAIL" | "NA";
        remarks?: string | null | undefined;
        observedValue?: string | null | undefined;
    }, {
        id: string;
        result: "PASS" | "FAIL" | "NA";
        remarks?: string | null | undefined;
        observedValue?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    status: "CANCELLED" | "PASS" | "FAIL" | "PARTIAL";
    acceptedQty: number;
    rejectedQty: number;
    checkpoints: {
        id: string;
        result: "PASS" | "FAIL" | "NA";
        remarks?: string | null | undefined;
        observedValue?: string | null | undefined;
    }[];
    remarks?: string | null | undefined;
    disposition?: string | null | undefined;
}, {
    status: "CANCELLED" | "PASS" | "FAIL" | "PARTIAL";
    acceptedQty: number;
    rejectedQty: number;
    checkpoints: {
        id: string;
        result: "PASS" | "FAIL" | "NA";
        remarks?: string | null | undefined;
        observedValue?: string | null | undefined;
    }[];
    remarks?: string | null | undefined;
    disposition?: string | null | undefined;
}>;
export type SubmitQAInspectionInput = z.infer<typeof submitQAInspectionSchema>;
export declare const createReorderRuleSchema: z.ZodObject<{
    productId: z.ZodString;
    warehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    minQty: z.ZodNumber;
    maxQty: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    reorderQty: z.ZodNumber;
    leadTimeDays: z.ZodDefault<z.ZodNumber>;
    preferredVendorId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    autoCreatePO: z.ZodDefault<z.ZodBoolean>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    isActive: boolean;
    productId: string;
    minQty: number;
    reorderQty: number;
    leadTimeDays: number;
    autoCreatePO: boolean;
    warehouseId?: string | null | undefined;
    maxQty?: number | null | undefined;
    preferredVendorId?: string | null | undefined;
}, {
    productId: string;
    minQty: number;
    reorderQty: number;
    isActive?: boolean | undefined;
    warehouseId?: string | null | undefined;
    maxQty?: number | null | undefined;
    leadTimeDays?: number | undefined;
    preferredVendorId?: string | null | undefined;
    autoCreatePO?: boolean | undefined;
}>;
export type CreateReorderRuleInput = z.infer<typeof createReorderRuleSchema>;
export declare const createKitItemSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodNumber;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
    sortOrder: number;
}, {
    productId: string;
    quantity: number;
    sortOrder?: number | undefined;
}>;
export declare const createKitSchema: z.ZodObject<{
    productId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sellPrice: z.ZodNumber;
    discount: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    components: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
        sortOrder: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
        sortOrder: number;
    }, {
        productId: string;
        quantity: number;
        sortOrder?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    name: string;
    sellPrice: number;
    isActive: boolean;
    productId: string;
    components: {
        productId: string;
        quantity: number;
        sortOrder: number;
    }[];
    discount: number;
    description?: string | null | undefined;
}, {
    name: string;
    sellPrice: number;
    productId: string;
    components: {
        productId: string;
        quantity: number;
        sortOrder?: number | undefined;
    }[];
    description?: string | null | undefined;
    isActive?: boolean | undefined;
    discount?: number | undefined;
}>;
export type CreateKitInput = z.infer<typeof createKitSchema>;
export declare const createStockEntryItemSchema: z.ZodObject<{
    productId: z.ZodString;
    fromWarehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    toWarehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    fromBinId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    toBinId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    uomId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    qty: z.ZodNumber;
    valuationRate: z.ZodOptional<z.ZodNumber>;
    batchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    batchNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    serialNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    serialNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sortOrder: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    sortOrder: number;
    qty: number;
    serialNo?: string | null | undefined;
    valuationRate?: number | undefined;
    fromWarehouseId?: string | null | undefined;
    toWarehouseId?: string | null | undefined;
    fromBinId?: string | null | undefined;
    toBinId?: string | null | undefined;
    uomId?: string | null | undefined;
    batchId?: string | null | undefined;
    batchNumber?: string | null | undefined;
    serialNumber?: string | null | undefined;
}, {
    productId: string;
    qty: number;
    sortOrder?: number | undefined;
    serialNo?: string | null | undefined;
    valuationRate?: number | undefined;
    fromWarehouseId?: string | null | undefined;
    toWarehouseId?: string | null | undefined;
    fromBinId?: string | null | undefined;
    toBinId?: string | null | undefined;
    uomId?: string | null | undefined;
    batchId?: string | null | undefined;
    batchNumber?: string | null | undefined;
    serialNumber?: string | null | undefined;
}>;
export declare const createStockEntrySchema: z.ZodObject<{
    type: z.ZodEnum<["MATERIAL_RECEIPT", "MATERIAL_ISSUE", "MATERIAL_TRANSFER", "STOCK_ADJUSTMENT", "OPENING_STOCK", "SCRAP"]>;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    fromWarehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    toWarehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    referenceDoc: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    referenceType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        fromWarehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        toWarehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        fromBinId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        toBinId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        uomId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        qty: z.ZodNumber;
        valuationRate: z.ZodOptional<z.ZodNumber>;
        batchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        batchNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        serialNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        serialNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sortOrder: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        sortOrder: number;
        qty: number;
        serialNo?: string | null | undefined;
        valuationRate?: number | undefined;
        fromWarehouseId?: string | null | undefined;
        toWarehouseId?: string | null | undefined;
        fromBinId?: string | null | undefined;
        toBinId?: string | null | undefined;
        uomId?: string | null | undefined;
        batchId?: string | null | undefined;
        batchNumber?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }, {
        productId: string;
        qty: number;
        sortOrder?: number | undefined;
        serialNo?: string | null | undefined;
        valuationRate?: number | undefined;
        fromWarehouseId?: string | null | undefined;
        toWarehouseId?: string | null | undefined;
        fromBinId?: string | null | undefined;
        toBinId?: string | null | undefined;
        uomId?: string | null | undefined;
        batchId?: string | null | undefined;
        batchNumber?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    type: "MATERIAL_RECEIPT" | "MATERIAL_ISSUE" | "MATERIAL_TRANSFER" | "STOCK_ADJUSTMENT" | "OPENING_STOCK" | "SCRAP";
    items: {
        productId: string;
        sortOrder: number;
        qty: number;
        serialNo?: string | null | undefined;
        valuationRate?: number | undefined;
        fromWarehouseId?: string | null | undefined;
        toWarehouseId?: string | null | undefined;
        fromBinId?: string | null | undefined;
        toBinId?: string | null | undefined;
        uomId?: string | null | undefined;
        batchId?: string | null | undefined;
        batchNumber?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }[];
    remarks?: string | null | undefined;
    referenceType?: string | null | undefined;
    fromWarehouseId?: string | null | undefined;
    toWarehouseId?: string | null | undefined;
    purpose?: string | null | undefined;
    referenceDoc?: string | null | undefined;
}, {
    type: "MATERIAL_RECEIPT" | "MATERIAL_ISSUE" | "MATERIAL_TRANSFER" | "STOCK_ADJUSTMENT" | "OPENING_STOCK" | "SCRAP";
    items: {
        productId: string;
        qty: number;
        sortOrder?: number | undefined;
        serialNo?: string | null | undefined;
        valuationRate?: number | undefined;
        fromWarehouseId?: string | null | undefined;
        toWarehouseId?: string | null | undefined;
        fromBinId?: string | null | undefined;
        toBinId?: string | null | undefined;
        uomId?: string | null | undefined;
        batchId?: string | null | undefined;
        batchNumber?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }[];
    remarks?: string | null | undefined;
    referenceType?: string | null | undefined;
    fromWarehouseId?: string | null | undefined;
    toWarehouseId?: string | null | undefined;
    purpose?: string | null | undefined;
    referenceDoc?: string | null | undefined;
}>;
export type CreateStockEntryInput = z.infer<typeof createStockEntrySchema>;
export declare const updateStockEntrySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["MATERIAL_RECEIPT", "MATERIAL_ISSUE", "MATERIAL_TRANSFER", "STOCK_ADJUSTMENT", "OPENING_STOCK", "SCRAP"]>>;
    purpose: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    fromWarehouseId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    toWarehouseId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    referenceDoc: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    referenceType: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        fromWarehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        toWarehouseId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        fromBinId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        toBinId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        uomId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        qty: z.ZodNumber;
        valuationRate: z.ZodOptional<z.ZodNumber>;
        batchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        batchNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        serialNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        serialNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sortOrder: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        sortOrder: number;
        qty: number;
        serialNo?: string | null | undefined;
        valuationRate?: number | undefined;
        fromWarehouseId?: string | null | undefined;
        toWarehouseId?: string | null | undefined;
        fromBinId?: string | null | undefined;
        toBinId?: string | null | undefined;
        uomId?: string | null | undefined;
        batchId?: string | null | undefined;
        batchNumber?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }, {
        productId: string;
        qty: number;
        sortOrder?: number | undefined;
        serialNo?: string | null | undefined;
        valuationRate?: number | undefined;
        fromWarehouseId?: string | null | undefined;
        toWarehouseId?: string | null | undefined;
        fromBinId?: string | null | undefined;
        toBinId?: string | null | undefined;
        uomId?: string | null | undefined;
        batchId?: string | null | undefined;
        batchNumber?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "MATERIAL_RECEIPT" | "MATERIAL_ISSUE" | "MATERIAL_TRANSFER" | "STOCK_ADJUSTMENT" | "OPENING_STOCK" | "SCRAP" | undefined;
    items?: {
        productId: string;
        sortOrder: number;
        qty: number;
        serialNo?: string | null | undefined;
        valuationRate?: number | undefined;
        fromWarehouseId?: string | null | undefined;
        toWarehouseId?: string | null | undefined;
        fromBinId?: string | null | undefined;
        toBinId?: string | null | undefined;
        uomId?: string | null | undefined;
        batchId?: string | null | undefined;
        batchNumber?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }[] | undefined;
    remarks?: string | null | undefined;
    referenceType?: string | null | undefined;
    fromWarehouseId?: string | null | undefined;
    toWarehouseId?: string | null | undefined;
    purpose?: string | null | undefined;
    referenceDoc?: string | null | undefined;
}, {
    type?: "MATERIAL_RECEIPT" | "MATERIAL_ISSUE" | "MATERIAL_TRANSFER" | "STOCK_ADJUSTMENT" | "OPENING_STOCK" | "SCRAP" | undefined;
    items?: {
        productId: string;
        qty: number;
        sortOrder?: number | undefined;
        serialNo?: string | null | undefined;
        valuationRate?: number | undefined;
        fromWarehouseId?: string | null | undefined;
        toWarehouseId?: string | null | undefined;
        fromBinId?: string | null | undefined;
        toBinId?: string | null | undefined;
        uomId?: string | null | undefined;
        batchId?: string | null | undefined;
        batchNumber?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }[] | undefined;
    remarks?: string | null | undefined;
    referenceType?: string | null | undefined;
    fromWarehouseId?: string | null | undefined;
    toWarehouseId?: string | null | undefined;
    purpose?: string | null | undefined;
    referenceDoc?: string | null | undefined;
}>;
export type UpdateStockEntryInput = z.infer<typeof updateStockEntrySchema>;
export declare const transferStockSchema: z.ZodObject<{
    fromWarehouseId: z.ZodString;
    toWarehouseId: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        qty: z.ZodNumber;
        batchId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        serialNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        qty: number;
        serialNo?: string | null | undefined;
        batchId?: string | null | undefined;
    }, {
        productId: string;
        qty: number;
        serialNo?: string | null | undefined;
        batchId?: string | null | undefined;
    }>, "many">;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    items: {
        productId: string;
        qty: number;
        serialNo?: string | null | undefined;
        batchId?: string | null | undefined;
    }[];
    fromWarehouseId: string;
    toWarehouseId: string;
    remarks?: string | null | undefined;
}, {
    items: {
        productId: string;
        qty: number;
        serialNo?: string | null | undefined;
        batchId?: string | null | undefined;
    }[];
    fromWarehouseId: string;
    toWarehouseId: string;
    remarks?: string | null | undefined;
}>;
export type TransferStockInput = z.infer<typeof transferStockSchema>;
export declare const changeHistoryQuerySchema: z.ZodObject<{
    entityType: z.ZodString;
    entityId: z.ZodString;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    entityType: string;
    entityId: string;
}, {
    entityType: string;
    entityId: string;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export type ChangeHistoryQueryInput = z.infer<typeof changeHistoryQuerySchema>;
export declare const createAccessPackageSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    permissions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    fieldAccess: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodEnum<["hidden", "readonly", "editable"]>>>>;
    recordFilter: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    permissions: string[];
    fieldAccess: Record<string, Record<string, "hidden" | "readonly" | "editable">>;
    recordFilter: Record<string, Record<string, unknown>>;
    description?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    permissions?: string[] | undefined;
    fieldAccess?: Record<string, Record<string, "hidden" | "readonly" | "editable">> | undefined;
    recordFilter?: Record<string, Record<string, unknown>> | undefined;
}>;
export type CreateAccessPackageInput = z.infer<typeof createAccessPackageSchema>;
export declare const updateAccessPackageSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    permissions: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
    fieldAccess: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodEnum<["hidden", "readonly", "editable"]>>>>>;
    recordFilter: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>>>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
    fieldAccess?: Record<string, Record<string, "hidden" | "readonly" | "editable">> | undefined;
    recordFilter?: Record<string, Record<string, unknown>> | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    permissions?: string[] | undefined;
    fieldAccess?: Record<string, Record<string, "hidden" | "readonly" | "editable">> | undefined;
    recordFilter?: Record<string, Record<string, unknown>> | undefined;
}>;
export type UpdateAccessPackageInput = z.infer<typeof updateAccessPackageSchema>;
export declare const assignAccessPackageSchema: z.ZodObject<{
    roleId: z.ZodString;
    accessPackageId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    roleId: string;
    accessPackageId: string;
}, {
    roleId: string;
    accessPackageId: string;
}>;
export type AssignAccessPackageInput = z.infer<typeof assignAccessPackageSchema>;
export declare const loadDemoDataSchema: z.ZodObject<{
    modules: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    modules?: string[] | undefined;
}, {
    modules?: string[] | undefined;
}>;
export type LoadDemoDataInput = z.infer<typeof loadDemoDataSchema>;
export declare const removeDemoDataSchema: z.ZodObject<{
    module: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    module?: string | undefined;
}, {
    module?: string | undefined;
}>;
export type RemoveDemoDataInput = z.infer<typeof removeDemoDataSchema>;
export declare const createPatientSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    dateOfBirth: z.ZodString;
    gender: z.ZodString;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    medicalHistory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vitalsHistory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    allergies: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    medicalHistory?: string | null | undefined;
    vitalsHistory?: string | null | undefined;
    allergies?: string | null | undefined;
}, {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    email?: string | null | undefined;
    phone?: string | null | undefined;
    medicalHistory?: string | null | undefined;
    vitalsHistory?: string | null | undefined;
    allergies?: string | null | undefined;
}>;
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export declare const updatePatientSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    gender: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    medicalHistory: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    vitalsHistory: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    allergies: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    email?: string | null | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
    dateOfBirth?: string | undefined;
    gender?: string | undefined;
    medicalHistory?: string | null | undefined;
    vitalsHistory?: string | null | undefined;
    allergies?: string | null | undefined;
}, {
    email?: string | null | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
    dateOfBirth?: string | undefined;
    gender?: string | undefined;
    medicalHistory?: string | null | undefined;
    vitalsHistory?: string | null | undefined;
    allergies?: string | null | undefined;
}>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export declare const createPractitionerSchema: z.ZodObject<{
    employeeId: z.ZodString;
    specialty: z.ZodString;
    licenseNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    employeeId: string;
    specialty: string;
    licenseNumber: string;
}, {
    employeeId: string;
    specialty: string;
    licenseNumber: string;
}>;
export type CreatePractitionerInput = z.infer<typeof createPractitionerSchema>;
export declare const updatePractitionerSchema: z.ZodObject<{
    employeeId: z.ZodOptional<z.ZodString>;
    specialty: z.ZodOptional<z.ZodString>;
    licenseNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    employeeId?: string | undefined;
    specialty?: string | undefined;
    licenseNumber?: string | undefined;
}, {
    employeeId?: string | undefined;
    specialty?: string | undefined;
    licenseNumber?: string | undefined;
}>;
export type UpdatePractitionerInput = z.infer<typeof updatePractitionerSchema>;
export declare const createAppointmentSchema: z.ZodObject<{
    patientId: z.ZodString;
    practitionerId: z.ZodString;
    startTime: z.ZodString;
    endTime: z.ZodString;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    practitionerId: string;
    startTime: string;
    endTime: string;
    notes?: string | null | undefined;
}, {
    patientId: string;
    practitionerId: string;
    startTime: string;
    endTime: string;
    notes?: string | null | undefined;
}>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export declare const createPrescriptionSchema: z.ZodObject<{
    patientId: z.ZodString;
    practitionerId: z.ZodString;
    details: z.ZodString;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    practitionerId: string;
    details: string;
}, {
    patientId: string;
    practitionerId: string;
    details: string;
}>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export declare const logDrugRegisterSchema: z.ZodObject<{
    name: z.ZodString;
    batchNumber: z.ZodString;
    expiryDate: z.ZodString;
    isControlled: z.ZodDefault<z.ZodBoolean>;
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    name: string;
    quantity: number;
    expiryDate: string;
    batchNumber: string;
    isControlled: boolean;
}, {
    name: string;
    quantity: number;
    expiryDate: string;
    batchNumber: string;
    isControlled?: boolean | undefined;
}>;
export type LogDrugRegisterInput = z.infer<typeof logDrugRegisterSchema>;
export declare const createMedicalEncounterSchema: z.ZodObject<{
    patientId: z.ZodString;
    practitionerId: z.ZodString;
    diagnosis: z.ZodString;
    treatmentCode: z.ZodString;
    billingAmount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    patientId: string;
    practitionerId: string;
    diagnosis: string;
    treatmentCode: string;
    billingAmount: number;
}, {
    patientId: string;
    practitionerId: string;
    diagnosis: string;
    treatmentCode: string;
    billingAmount: number;
}>;
export type CreateMedicalEncounterInput = z.infer<typeof createMedicalEncounterSchema>;
export declare const errorReportSchema: z.ZodObject<{
    message: z.ZodString;
    stack: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    url: z.ZodString;
    userAgent: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    userEmail: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodString]>>>;
    userName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    requestId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    tenantId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    url: string;
    description?: string | null | undefined;
    stack?: string | null | undefined;
    userAgent?: string | null | undefined;
    userEmail?: string | null | undefined;
    userName?: string | null | undefined;
    requestId?: string | null | undefined;
    tenantId?: string | null | undefined;
}, {
    message: string;
    url: string;
    description?: string | null | undefined;
    stack?: string | null | undefined;
    userAgent?: string | null | undefined;
    userEmail?: string | null | undefined;
    userName?: string | null | undefined;
    requestId?: string | null | undefined;
    tenantId?: string | null | undefined;
}>;
export type ErrorReportInput = z.infer<typeof errorReportSchema>;
export declare const createFixedAssetCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    depreciationMethod: z.ZodEnum<["SLM", "WDV"]>;
    expectedLifeMonths: z.ZodNumber;
    depreciationRate: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    assetAccountId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    depreciationAccountId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expenseAccountId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    depreciationMethod: "SLM" | "WDV";
    expectedLifeMonths: number;
    description?: string | null | undefined;
    depreciationRate?: number | null | undefined;
    assetAccountId?: string | null | undefined;
    depreciationAccountId?: string | null | undefined;
    expenseAccountId?: string | null | undefined;
}, {
    name: string;
    depreciationMethod: "SLM" | "WDV";
    expectedLifeMonths: number;
    description?: string | null | undefined;
    depreciationRate?: number | null | undefined;
    assetAccountId?: string | null | undefined;
    depreciationAccountId?: string | null | undefined;
    expenseAccountId?: string | null | undefined;
}>;
export type CreateFixedAssetCategoryInput = z.infer<typeof createFixedAssetCategorySchema>;
export declare const createFixedAssetSchema: z.ZodObject<{
    assetCode: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    purchaseDate: z.ZodString;
    purchaseValue: z.ZodNumber;
    salvageValue: z.ZodNumber;
    usefulLifeYears: z.ZodNumber;
    depreciationMethod: z.ZodEnum<["SLM", "WDV"]>;
    depreciationRate: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    accountId: z.ZodString;
    accumDepAccountId: z.ZodString;
    locationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    custodianId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    purchaseDate: string;
    depreciationMethod: "SLM" | "WDV";
    assetCode: string;
    purchaseValue: number;
    salvageValue: number;
    usefulLifeYears: number;
    accountId: string;
    accumDepAccountId: string;
    description?: string | null | undefined;
    depreciationRate?: number | null | undefined;
    categoryId?: string | null | undefined;
    locationId?: string | null | undefined;
    custodianId?: string | null | undefined;
}, {
    name: string;
    purchaseDate: string;
    depreciationMethod: "SLM" | "WDV";
    assetCode: string;
    purchaseValue: number;
    salvageValue: number;
    usefulLifeYears: number;
    accountId: string;
    accumDepAccountId: string;
    description?: string | null | undefined;
    depreciationRate?: number | null | undefined;
    categoryId?: string | null | undefined;
    locationId?: string | null | undefined;
    custodianId?: string | null | undefined;
}>;
export type CreateFixedAssetInput = z.infer<typeof createFixedAssetSchema>;
export declare const updateFixedAssetSchema: z.ZodObject<{
    assetCode: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    purchaseDate: z.ZodOptional<z.ZodString>;
    purchaseValue: z.ZodOptional<z.ZodNumber>;
    salvageValue: z.ZodOptional<z.ZodNumber>;
    usefulLifeYears: z.ZodOptional<z.ZodNumber>;
    depreciationMethod: z.ZodOptional<z.ZodEnum<["SLM", "WDV"]>>;
    depreciationRate: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    accountId: z.ZodOptional<z.ZodString>;
    accumDepAccountId: z.ZodOptional<z.ZodString>;
    locationId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    custodianId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "DISPOSED", "UNDER_MAINTENANCE"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "ACTIVE" | "DISPOSED" | "UNDER_MAINTENANCE" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    purchaseDate?: string | undefined;
    depreciationMethod?: "SLM" | "WDV" | undefined;
    depreciationRate?: number | null | undefined;
    assetCode?: string | undefined;
    categoryId?: string | null | undefined;
    purchaseValue?: number | undefined;
    salvageValue?: number | undefined;
    usefulLifeYears?: number | undefined;
    accountId?: string | undefined;
    accumDepAccountId?: string | undefined;
    locationId?: string | null | undefined;
    custodianId?: string | null | undefined;
}, {
    status?: "ACTIVE" | "DISPOSED" | "UNDER_MAINTENANCE" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    purchaseDate?: string | undefined;
    depreciationMethod?: "SLM" | "WDV" | undefined;
    depreciationRate?: number | null | undefined;
    assetCode?: string | undefined;
    categoryId?: string | null | undefined;
    purchaseValue?: number | undefined;
    salvageValue?: number | undefined;
    usefulLifeYears?: number | undefined;
    accountId?: string | undefined;
    accumDepAccountId?: string | undefined;
    locationId?: string | null | undefined;
    custodianId?: string | null | undefined;
}>;
export type UpdateFixedAssetInput = z.infer<typeof updateFixedAssetSchema>;
export declare const transferFixedAssetSchema: z.ZodObject<{
    transferDate: z.ZodString;
    toLocationId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    toCustodianId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    transferDate: string;
    reason?: string | null | undefined;
    toLocationId?: string | null | undefined;
    toCustodianId?: string | null | undefined;
}, {
    transferDate: string;
    reason?: string | null | undefined;
    toLocationId?: string | null | undefined;
    toCustodianId?: string | null | undefined;
}>;
export type TransferFixedAssetInput = z.infer<typeof transferFixedAssetSchema>;
export declare const logFixedAssetMaintenanceSchema: z.ZodObject<{
    maintenanceDate: z.ZodString;
    type: z.ZodEnum<["PREVENTIVE", "CORRECTIVE", "CALIBRATION"]>;
    description: z.ZodString;
    cost: z.ZodNumber;
    performedBy: z.ZodString;
    nextMaintenanceDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: "PREVENTIVE" | "CORRECTIVE" | "CALIBRATION";
    description: string;
    maintenanceDate: string;
    cost: number;
    performedBy: string;
    nextMaintenanceDate?: string | null | undefined;
}, {
    type: "PREVENTIVE" | "CORRECTIVE" | "CALIBRATION";
    description: string;
    maintenanceDate: string;
    cost: number;
    performedBy: string;
    nextMaintenanceDate?: string | null | undefined;
}>;
export type LogFixedAssetMaintenanceInput = z.infer<typeof logFixedAssetMaintenanceSchema>;
export declare const customerNoteSchema: z.ZodObject<{
    content: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    type?: string | undefined;
}, {
    content: string;
    type?: string | undefined;
}>;
export type CustomerNoteInput = z.infer<typeof customerNoteSchema>;
export declare const vendorNoteSchema: z.ZodObject<{
    content: z.ZodString;
    type: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    type?: string | undefined;
}, {
    content: string;
    type?: string | undefined;
}>;
export type VendorNoteInput = z.infer<typeof vendorNoteSchema>;
export declare const customerBulkStatusSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    ids: string[];
}, {
    status: string;
    ids: string[];
}>;
export declare const vendorBulkStatusSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    ids: string[];
}, {
    status: string;
    ids: string[];
}>;
//# sourceMappingURL=index.d.ts.map