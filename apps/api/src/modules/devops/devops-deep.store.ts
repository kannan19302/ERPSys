import { randomUUID } from "node:crypto";

export interface PipelineRecord {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  stages: unknown[];
  trigger: string;
  isActive: boolean;
  lastRunAt: Date | null;
  lastStatus: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigMapRecord {
  id: string;
  tenantId: string;
  name: string;
  data: unknown;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonitorDashboardRecord {
  id: string;
  tenantId: string;
  name: string;
  widgets: unknown[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertConfigRecord {
  id: string;
  tenantId: string;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  severity: string;
  channels: string[];
  isActive: boolean;
  lastTriggeredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogEntryRecord {
  id: string;
  tenantId: string;
  source: string | null;
  level: string | null;
  message: string;
  createdAt: Date;
}

export interface BackupJobRecord {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  status: string;
  startedAt: Date;
  createdBy: string;
  createdAt: Date;
}

export interface MigrationRecord {
  id: string;
  tenantId: string;
  name: string;
  direction: string;
  status: string;
  executedBy: string;
  executedAt: Date;
  createdAt: Date;
}

export interface HealthCheckRecord {
  id: string;
  tenantId: string;
  name: string;
  endpoint: string;
  method: string;
  intervalSec: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorRecord {
  id: string;
  tenantId: string;
  message: string;
  status: string;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface UptimeRecord {
  id: string;
  tenantId: string;
  checkId: string | null;
  status: string;
  checkedAt: Date;
}

export interface SlaContractRecord {
  id: string;
  tenantId: string;
  name: string;
  uptimePct: number;
  responseTimeMs: number;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentRecord {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  severity: string;
  source: string | null;
  status: string;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CapacityPlanRecord {
  id: string;
  tenantId: string;
  name: string;
  resourceType: string;
  currentValue: number;
  projectedValue: number | null;
  thresholdPct: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChangeRequestRecord {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  type: string;
  riskLevel: string;
  status: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CertificateRecord {
  id: string;
  tenantId: string;
  name: string;
  domain: string;
  issuer: string | null;
  notBefore: Date;
  notAfter: Date;
  fingerprint: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const pipelines: PipelineRecord[] = [];
export const configMaps: ConfigMapRecord[] = [];
export const monitorDashboards: MonitorDashboardRecord[] = [];
export const alertConfigs: AlertConfigRecord[] = [];
export const logEntries: LogEntryRecord[] = [];
export const backupJobs: BackupJobRecord[] = [];
export const migrations: MigrationRecord[] = [];
export const healthChecks: HealthCheckRecord[] = [];
export const errorRecords: ErrorRecord[] = [];
export const uptimeRecords: UptimeRecord[] = [];
export const slaContracts: SlaContractRecord[] = [];
export const incidents: IncidentRecord[] = [];
export const capacityPlans: CapacityPlanRecord[] = [];
export const changeRequests: ChangeRequestRecord[] = [];
export const certificates: CertificateRecord[] = [];

export function createRecordId(): string {
  return randomUUID();
}

export function findRecord<T extends { id: string; tenantId: string }>(
  records: T[],
  tenantId: string,
  id: string,
): T | undefined {
  return records.find((r) => r.id === id && r.tenantId === tenantId);
}

export function removeRecord<T extends { id: string; tenantId: string }>(
  records: T[],
  tenantId: string,
  id: string,
): T | undefined {
  const index = records.findIndex(
    (r) => r.id === id && r.tenantId === tenantId,
  );
  if (index === -1) return undefined;
  return records.splice(index, 1)[0];
}
