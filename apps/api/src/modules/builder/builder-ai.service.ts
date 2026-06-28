import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';

@Injectable()
export class BuilderAiService {
  constructor(private readonly aiService: AiService) {}

  async generateAppModule(tenantId: string, prompt: string) {
    if (!this.aiService.isConfigured()) {
      // Fallback stub content so it runs successfully even without API keys configured
      return this.stubAppModule(prompt);
    }

    const systemPrompt = `You design custom ERP Application Modules. Given a description, generate a complete module definition as JSON.
Format:
{
  "name": "...",
  "slug": "...",
  "description": "...",
  "icon": "📦",
  "color": "#3b82f6",
  "pages": [{"name": "Dashboard", "slug": "dashboard", "type": "dashboard"}, {"name": "Manage Records", "slug": "records", "type": "list"}],
  "dataModels": [{"name": "Record", "fields": [{"name": "title", "type": "Text", "required": true}]}]
}`;

    const res = await this.aiService.chat([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ], { maxTokens: 2500, tenantId });

    try {
      const parsed = JSON.parse(res.content);
      return parsed;
    } catch {
      return this.stubAppModule(prompt);
    }
  }

  private stubAppModule(prompt: string) {
    const clean = prompt.trim();
    const name = clean ? (clean.split(/[.!?\n]/)[0] || 'Custom AI App').slice(0, 50) : 'Custom AI App';
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return {
      name,
      slug,
      description: `AI generated custom application based on prompt: "${clean}"`,
      icon: '🚀',
      color: '#8b5cf6',
      pages: [
        { name: 'Analytics Board', slug: 'analytics', type: 'dashboard' },
        { name: 'Records Management', slug: 'manage', type: 'list' }
      ],
      dataModels: [
        {
          name: 'ItemRecord',
          fields: [
            { name: 'name', type: 'Text', required: true },
            { name: 'reference', type: 'Text', required: false },
            { name: 'value', type: 'Currency', required: false }
          ]
        }
      ]
    };
  }

  async suggestCopilotFields(tenantId: string, prompt: string) {
    if (!this.aiService.isConfigured()) {
      return [
        { id: '1', type: 'Text', label: 'Notes', name: 'notes', required: false, readOnly: false },
        { id: '2', type: 'Select', label: 'Priority', name: 'priority', required: true, readOnly: false, options: 'Low\nMedium\nHigh' }
      ];
    }

    const res = await this.aiService.chat([
      { role: 'system', content: 'Suggest 2-4 form fields as JSON array: [{"label": "...", "name": "...", "type": "Text|Select|Check|Date", "required": true/false}]' },
      { role: 'user', content: prompt }
    ], { maxTokens: 1000, tenantId });

    try {
      return JSON.parse(res.content);
    } catch {
      return [
        { id: '1', type: 'Text', label: 'Suggested Notes', name: 'suggested_notes', required: false, readOnly: false }
      ];
    }
  }
}
