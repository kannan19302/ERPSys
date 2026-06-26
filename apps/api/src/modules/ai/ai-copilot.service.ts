import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { AiService } from './ai.service';

@Injectable()
export class AiCopilotService {
  constructor(private ai: AiService) {}

  async askData(tenantId: string, question: string) {
    if (!this.ai.isConfigured()) {
      return { answer: 'AI is not configured. Set ANTHROPIC_API_KEY.', query: null };
    }

    const schema = `Tables: Invoice (invoiceNumber, totalAmount, status, issueDate, dueDate, currency),
SalesOrder (orderNumber, totalAmount, status, orderDate),
PurchaseOrder (poNumber, totalAmount, status, orderDate),
Employee (firstName, lastName, status, hireDate),
Lead (company, status, score, annualRevenue),
Product (name, sku, sellPrice, costPrice),
Customer (name, email, status), Vendor (name, email, status).
All tables have tenantId. Use Prisma-like pseudo-query syntax.`;

    const result = await this.ai.chat([
      { role: 'system', content: `You are a data analyst for an ERP system. Given this schema:\n${schema}\nAnswer the user's question with: 1) A natural language answer, 2) The pseudo-query you would run. Respond as JSON: {"answer": "...", "query": "..."}` },
      { role: 'user', content: question },
    ], { tenantId });

    try {
      return JSON.parse(result.content);
    } catch {
      return { answer: result.content, query: null };
    }
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

  async processInvoiceDocument(tenantId: string, documentText: string) {
    if (!this.ai.isConfigured()) {
      return { extracted: null, error: 'AI not configured.' };
    }

    const fields = ['vendorName', 'invoiceNumber', 'invoiceDate', 'dueDate', 'totalAmount', 'currency', 'lineItems'];
    const extracted = await this.ai.extractFields(documentText, fields, tenantId);

    return { extracted, confidence: 0.85 };
  }
}
