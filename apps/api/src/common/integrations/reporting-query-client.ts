export interface ReportingSemanticField {
  name: string;
  label: string;
  type: string;
  aggregatable: boolean;
}

export interface ReportingSemanticEntity {
  name: string;
  label: string;
  table: string;
  fields: ReportingSemanticField[];
}

export interface ReportingQueryOptions {
  filters?: Record<string, unknown>;
  groupBy?: string[];
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  aggregations?: Array<{ field: string; fn: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' }>;
}

export interface ReportingQueryResult {
  data: Record<string, unknown>[];
  entity?: string;
  grouped?: boolean;
  count?: number;
  total?: number;
  error?: string;
}

/** Read-only reporting capability consumed outside the Reporting module. */
export abstract class ReportingQueryClient {
  abstract getSemanticLayer(): ReportingSemanticEntity[];

  abstract executeQuery(
    tenantId: string,
    entity: string,
    options?: ReportingQueryOptions,
  ): Promise<ReportingQueryResult>;
}
