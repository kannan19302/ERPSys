// Pure soft-delete scoping logic for the Prisma query extension.
// Follows the same pattern as tenant-scope.ts — pure function, no side effects.

export const SOFT_DELETE_ENABLED_MODELS = new Set([
  "APMatchRule",
  "ApprovalProcess",
  "Battlecard",
  "BlanketPurchaseAgreement",
  "CadenceAutoEnrollRule",
  "Campaign",
  "CommissionPlan",
  "CommunicationChannel",
  "CommunicationTemplate",
  "Competitor",
  "Contact",
  "Contract",
  "ContractAmendment",
  "ContractClause",
  "ContractObligation",
  "ContractTemplate",
  "ContractTemplateCategory",
  "CreditNote",
  "CrmComment",
  "CrmCustomField",
  "CrmDashboard",
  "CrmDashboardTemplate",
  "CrmDocument",
  "CrmEnrichmentProvider",
  "CrmEnrichmentRule",
  "CrmEnrichmentSource",
  "CrmEnrichmentWorkflow",
  "CrmGuidedSellingPlaybook",
  "CrmLeadRoutingRule",
  "CrmNextBestActionConfig",
  "CrmNote",
  "CrmRecordType",
  "CrmSavedReport",
  "CrmWorkflowRule",
  "Customer",
  "CustomerPriceList",
  "CustomerStatement",
  "DebitNote",
  "DemandForecastRun",
  "Document",
  "DriveFile",
  "DriveFolder",
  "EmailSequence",
  "Employee",
  "Folder",
  "GamificationBadge",
  "Invoice",
  "KnowledgeBaseArticle",
  "KnowledgeBaseCategory",
  "Lead",
  "Message",
  "NamedAccount",
  "Opportunity",
  "PriceBook",
  "Product",
  "ProductBundle",
  "ProductVariant",
  "Project",
  "PurchaseOrder",
  "PurchaseRequisition",
  "Quotation",
  "QuotationTemplate",
  "RecurringInvoiceTemplate",
  "RecycleBinItem",
  "RFQ",
  "SalesOrder",
  "SalesPartner",
  "SalesPartnerDealRegistration",
  "SalesPartnerMdfFund",
  "SalesPlaybook",
  "SalesTerritory",
  "SavedReport",
  "SocialMediaPost",
  "StatementTemplate",
  "TerritoryAssignmentRule",
  "TerritoryPlan",
  "User",
  "Vendor",
  "VendorBill",
  "WebToLeadForm",
  "WinLossReason",
]);

const FILTER_OPS = new Set([
  "findFirst",
  "findMany",
  "findUnique",
  "findFirstOrThrow",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/**
 * Injects `deletedAt: null` into the `where` clause for soft-delete-enabled
 * models, so soft-deleted records are invisible to normal queries and protected
 * from mutations. Never mutates `args` — always returns a fresh object.
 *
 * Special case: if the caller explicitly passes `deletedAt` in the where clause
 * (e.g. `deletedAt: { not: null }` for trash views), the middleware preserves
 * that filter rather than overriding it.
 */
export function applySoftDeleteScope(
  model: string,
  operation: string,
  args: unknown,
): Record<string, unknown> {
  if (!SOFT_DELETE_ENABLED_MODELS.has(model)) {
    return { ...((args || {}) as Record<string, unknown>) };
  }

  if (!FILTER_OPS.has(operation)) {
    return { ...((args || {}) as Record<string, unknown>) };
  }

  const typedArgs: Record<string, unknown> = {
    ...((args || {}) as Record<string, unknown>),
  };

  const existingWhere = (typedArgs.where as Record<string, unknown>) || {};

  if (Object.prototype.hasOwnProperty.call(existingWhere, "deletedAt")) {
    return typedArgs;
  }

  typedArgs.where = { ...existingWhere, deletedAt: null };
  return typedArgs;
}
