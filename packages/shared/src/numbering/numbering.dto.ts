export type ResetFrequency = 'YEARLY' | 'MONTHLY' | 'NEVER';

export interface NumberingResponse {
  id: string;
  tenantId: string;
  organizationId: string | null;
  series: string;
  description: string | null;
  prefix: string;
  suffix: string;
  padding: number;
  nextNumber: number;
  nextFormatted: string;
  resetFrequency: ResetFrequency | null;
  format: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NumberingCreateDto {
  series: string;
  description?: string;
  prefix?: string;
  suffix?: string;
  padding?: number;
  nextNumber?: number;
  resetFrequency?: ResetFrequency;
  format?: string;
}

export interface NumberingUpdateDto {
  description?: string;
  prefix?: string;
  suffix?: string;
  padding?: number;
  nextNumber?: number;
  resetFrequency?: ResetFrequency;
  format?: string;
}

export interface NumberingResult {
  series: string;
  number: string;
  sequence: number;
}
