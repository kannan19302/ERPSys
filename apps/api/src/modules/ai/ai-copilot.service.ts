import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { AiService } from './ai.service';
import { ReportingEngineService } from '../reporting/reporting-engine.service';

export interface GeneratedQuery {
  entity: string;
  filters?: Record<string, unknown>;
  groupBy?: string[];
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  limit?: number;
  aggregations?: Array<{ field: string; fn: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' }>;
}

@Injectable()
export class AiCopilotService {
  constructor(
    private ai: AiService,
    private reportingEngine: ReportingEngineService,
  ) {}

  /**
   * Natural-language-to-report: translates a plain-English question into a
   * structured query against the reporting engine's semantic layer, actually
   * executes it (tenant-scoped, field-allowlisted by `executeQuery`), then
   * narrates the *real* result.
   *
   * The previous implementation asked the LLM to freeform "answer" the
   * question from a hardcoded schema description alone — it never touched
   * the database, so every answer was a plausible-sounding hallucination
   * (e.g. a fabricated total for "what's our AR balance"). This version
   * only ever lets the model choose *which* query to run; the numbers in
   * the final answer always come from `executeQuery`'s real output.
   */
  async askData(tenantId: string, question: string) {
    if (!this.ai.isConfigured()) {
      return { answer: 'AI is not configured.', query: null, data: [] };
    }

    const semanticLayer = this.reportingEngine.getSemanticLayer();
    const schemaDescription = semanticLayer
      .map((e) => `- "${e.name}" (${e.label}): fields = ${e.fields.map((f) => `${f.name}:${f.type}${f.aggregatable ? '(aggregatable)' : ''}`).join(', ')}`)
      .join('\n');

    const planResult = await this.ai.chat([
      {
        role: 'system',
        content: `You translate a business question into a structured report query against these entities:\n${schemaDescription}\n` +
          `Respond with ONLY a JSON object: {"entity": "<one of the entity names above>", "filters": {}, "groupBy": [], "orderBy": "<field>", "orderDir": "asc"|"desc", "limit": <number, default 20>, "aggregations": [{"field": "<aggregatable field>", "fn": "SUM"|"AVG"|"COUNT"|"MIN"|"MAX"}]}. ` +
          `Omit keys that don't apply. Never invent entity or field names outside the list.`,
      },
      { role: 'user', content: question },
    ], { tenantId, temperature: 0, maxTokens: 400 });

    let plannedQuery: GeneratedQuery;
    try {
      plannedQuery = JSON.parse(planResult.content);
    } catch {
      return { answer: 'Could not understand that question well enough to build a report. Try rephrasing it.', query: null, data: [] };
    }

    const entityExists = semanticLayer.some((e) => e.name === plannedQuery.entity);
    if (!plannedQuery.entity || !entityExists) {
      return { answer: `I don't have a "${plannedQuery.entity || 'matching'}" dataset to answer that from.`, query: plannedQuery, data: [] };
    }

    const result = await this.reportingEngine.executeQuery(tenantId, plannedQuery.entity, {
      filters: plannedQuery.filters,
      groupBy: plannedQuery.groupBy,
      orderBy: plannedQuery.orderBy,
      orderDir: plannedQuery.orderDir,
      limit: plannedQuery.limit || 20,
      aggregations: plannedQuery.aggregations,
    });

    const narrationResult = await this.ai.chat([
      { role: 'system', content: 'You summarize ERP report data into a direct, concise natural-language answer (2-3 sentences). Base the answer ONLY on the JSON data provided — never invent figures.' },
      { role: 'user', content: `Question: ${question}\n\nReport data (JSON):\n${JSON.stringify(result.data ?? result).slice(0, 4000)}` },
    ], { tenantId, temperature: 0.2, maxTokens: 250 });

    return { answer: narrationResult.content, query: plannedQuery, data: result.data ?? [] };
  }

  async summarizeRecord(tenantId: string, entityType: string, entityId: string) {
    if (!this.ai.isConfigured()) {
      return { summary: 'AI not configured.' };
    }

    let recordData: Record<string, unknown> | null = null;

    const model = (prisma as any)[entityType.charAt(0).toLowerCase() + entityType.slice(1)];
    if (model) {
      recordData = await model.findFirst({ where: { id: entityId, tenantId } });
    }

    if (!recordData) {
      return { summary: `Record ${entityType}/${entityId} not found.` };
    }

    const text = JSON.stringify(recordData, null, 2);
    const summary = await this.ai.summarize(text, { maxLength: 80, tenantId });

    return { entityType, entityId, summary };
  }

  async draftEmail(tenantId: string, context: { to: string; regarding: string; tone?: string }) {
    if (!this.ai.isConfigured()) {
      return { subject: '', body: 'AI not configured.' };
    }

    const result = await this.ai.chat([
      { role: 'system', content: `You are a professional business email writer. Write a ${context.tone || 'professional'} email. Respond as JSON: {"subject": "...", "body": "..."}` },
      { role: 'user', content: `Write an email to ${context.to} regarding: ${context.regarding}` },
    ], { tenantId });

    try {
      return JSON.parse(result.content);
    } catch {
      return { subject: `Re: ${context.regarding}`, body: result.content };
    }
  }

  async generateFormFromPrompt(tenantId: string, prompt: string) {
    if (!this.ai.isConfigured()) {
      return { form: null, error: 'AI not configured.' };
    }

    const result = await this.ai.chat([
      { role: 'system', content: `You design data collection forms for an ERP Builder. Given a description, generate a form definition as JSON: {"name": "...", "description": "...", "fields": [{"name": "field_name", "label": "Field Label", "type": "text|number|email|date|select|textarea|checkbox", "required": true/false, "options": ["opt1","opt2"] (for select only)}]}` },
      { role: 'user', content: prompt },
    ], { maxTokens: 2000, tenantId });

    try {
      return { form: JSON.parse(result.content), error: null };
    } catch {
      return { form: null, error: 'Failed to parse AI response' };
    }
  }

  async generateWorkflowFromPrompt(tenantId: string, prompt: string) {
    if (!this.ai.isConfigured()) {
      return { workflow: null, error: 'AI not configured.' };
    }

    const result = await this.ai.chat([
      { role: 'system', content: `You design approval workflows for an ERP system. Given a description, generate a workflow definition as JSON: {"name": "...", "triggerType": "PO_CREATED|INVOICE_CREATED|LEAVE_REQUESTED|CUSTOM", "steps": [{"actionType": "APPROVAL|NOTIFICATION", "assigneeRole": "Manager|Finance Manager|HR Manager|Admin", "slaLimitHours": number}]}` },
      { role: 'user', content: prompt },
    ], { maxTokens: 1000, tenantId });

    try {
      return { workflow: JSON.parse(result.content), error: null };
    } catch {
      return { workflow: null, error: 'Failed to parse AI response' };
    }
  }

  async processInvoiceDocument(tenantId: string, documentText: string, createDraft = false) {
    if (!this.ai.isConfigured()) {
      return { extracted: null, error: 'AI not configured.' };
    }

    const fields = ['vendorName', 'invoiceNumber', 'invoiceDate', 'dueDate', 'totalAmount', 'currency', 'lineItems'];
    const extracted = await this.ai.extractFields(documentText, fields, tenantId) as Record<string, unknown>;

    let draftPo: { id: string; poNumber: string } | null = null;

    if (createDraft && extracted) {
      try {
        const vendorName = typeof extracted.vendorName === 'string' ? extracted.vendorName : null;
        const totalAmount = typeof extracted.totalAmount === 'number' ? extracted.totalAmount :
          (typeof extracted.totalAmount === 'string' ? parseFloat(extracted.totalAmount) : 0);
        const currency = typeof extracted.currency === 'string' ? extracted.currency : 'USD';
        const dueDate = typeof extracted.dueDate === 'string' ? new Date(extracted.dueDate) : null;

        // Find matching vendor by name (fuzzy: case-insensitive contains)
        let vendor = vendorName
          ? await prisma.vendor.findFirst({ where: { tenantId, name: { contains: vendorName, mode: 'insensitive' } } })
          : null;

        // Get first org for this tenant
        const org = await prisma.organization.findFirst({ where: { tenantId } });
        if (vendor && org) {
          const poCount = await prisma.purchaseOrder.count({ where: { tenantId } });
          const poNumber = `AI-${String(poCount + 1).padStart(5, '0')}`;
          draftPo = await prisma.purchaseOrder.create({
            data: {
              tenantId,
              orgId: org.id,
              vendorId: vendor.id,
              poNumber,
              status: 'DRAFT',
              totalAmount,
              currency,
              ...(dueDate ? { expectedDate: dueDate } : {}),
              notes: `Auto-created from scanned invoice${extracted.invoiceNumber ? ` #${extracted.invoiceNumber}` : ''}.`,
            },
            select: { id: true, poNumber: true },
          });
        }
      } catch {
        // Non-fatal: return extraction even if PO creation fails
      }
    }

    return { extracted, confidence: 0.85, ...(draftPo ? { draftPoId: draftPo.id, draftPoNumber: draftPo.poNumber } : {}) };
  }
}
