import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';

@Injectable()
export class PlatformService {
  /**
   * List ERP modules configurations.
   */
  async getModules(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const settings = tenant.settings as Record<string, any>;
    const activeModules = settings.modules || ['finance', 'hr', 'crm', 'inventory'];

    const availableModules = [
      { name: 'finance', label: 'Finance & Accounting', description: 'General ledger, double-entry bookkeeping, invoicing and payments' },
      { name: 'hr', label: 'Human Resources', description: 'Employee directories, department structures, leave and attendance' },
      { name: 'crm', label: 'CRM & Sales Pipeline', description: 'Leads, opportunities, customer accounts, and activities tracker' },
      { name: 'inventory', label: 'Inventory & Warehouse', description: 'Product list, SKU registries, bins, stock ledger transactions' },
      { name: 'procurement', label: 'Procurement (Phase 2)', description: 'Purchase orders, receipts, RFQs, vendor price comparisons' },
      { name: 'manufacturing', label: 'Manufacturing & MRP', description: 'Bill of materials (BOM), work orders, job routings' },
      { name: 'pos', label: 'Point of Sale (POS)', description: 'Retail check-out register interface, scans, shifts' },
    ];

    return availableModules.map(m => ({
      ...m,
      isActive: activeModules.includes(m.name),
    }));
  }

  /**
   * Toggle ERP module status.
   */
  async toggleModule(tenantId: string, name: string, enabled: boolean) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const settings = tenant.settings as Record<string, any>;
    let activeModules = settings.modules || ['finance', 'hr', 'crm', 'inventory'];

    if (enabled && !activeModules.includes(name)) {
      activeModules.push(name);
    } else if (!enabled && activeModules.includes(name)) {
      activeModules = activeModules.filter((m: string) => m !== name);
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          ...settings,
          modules: activeModules,
        },
      },
    });

    return { name, isActive: enabled };
  }

  /**
   * Get feature flags configuration.
   */
  async getFeatureFlags(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'platform.feature-flags' } },
    });
    if (!setting) {
      return [
        { key: 'ui-v2-enabled', name: 'Premium Theme v2 UI', enabled: true, description: 'Activates ERPNext/Frappe soft card styles.' },
        { key: 'real-time-chat', name: 'Real-Time In-App Messaging', enabled: false, description: 'Enables chat channels between team users.' },
        { key: 'ai-ocr-reading', name: 'AI Document OCR Scanning', enabled: false, description: 'Automatically parses uploaded PDFs/images.' },
        { key: 'advanced-reporting', name: 'Drag-and-Drop Pivot Builder', enabled: true, description: 'Aggregates metrics dynamically.' },
      ];
    }
    return setting.value;
  }

  /**
   * Save feature flag configuration.
   */
  async saveFeatureFlag(tenantId: string, key: string, enabled: boolean) {
    const flags = await this.getFeatureFlags(tenantId) as any[];
    const updated = flags.map(f => f.key === key ? { ...f, enabled } : f);

    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'platform.feature-flags' } },
      update: { value: updated as any, category: 'platform' },
      create: {
        tenantId,
        key: 'platform.feature-flags',
        value: updated as any,
        category: 'platform',
      },
    });

    return { success: true, key, enabled };
  }

  /**
   * Custom Domains CRUD.
   */
  async getCustomDomains(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'platform.custom-domains' } },
    });
    if (!setting) {
      return [];
    }
    return setting.value;
  }

  async addCustomDomain(tenantId: string, domain: string) {
    const domains = await this.getCustomDomains(tenantId) as any[];
    const existing = domains.find(d => d.domain === domain);
    if (existing) return existing;

    const newDomain = {
      id: `dom-${Date.now()}`,
      domain,
      status: 'VERIFYING',
      dnsRecords: [
        { type: 'CNAME', host: '@', value: 'cname.unerp.dev', verified: false },
        { type: 'TXT', host: 'verification-token', value: `unerp-verify-${Date.now()}`, verified: false },
      ],
      createdAt: new Date().toISOString(),
    };

    const updated = [...domains, newDomain];
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'platform.custom-domains' } },
      update: { value: updated as any, category: 'platform' },
      create: {
        tenantId,
        key: 'platform.custom-domains',
        value: updated as any,
        category: 'platform',
      },
    });

    return newDomain;
  }

  /**
   * Sandbox Environment management.
   */
  async getEnvironments(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'platform.environments' } },
    });
    if (!setting) {
      return [
        { name: 'Production', type: 'PROD', status: 'ACTIVE', url: 'https://app.unerp.dev', lastSyncAt: new Date().toISOString() },
        { name: 'Staging Sandbox', type: 'STAGE', status: 'ACTIVE', url: 'https://staging.unerp.dev', lastSyncAt: new Date(Date.now() - 86400000).toISOString() },
        { name: 'Development Sandbox', type: 'DEV', status: 'ACTIVE', url: 'https://dev.unerp.dev', lastSyncAt: new Date(Date.now() - 172800000).toISOString() },
      ];
    }
    return setting.value;
  }

  async syncEnvironment(tenantId: string, type: string) {
    const envs = await this.getEnvironments(tenantId) as any[];
    const updated = envs.map(e => e.type === type ? { ...e, lastSyncAt: new Date().toISOString() } : e);

    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'platform.environments' } },
      update: { value: updated as any, category: 'platform' },
      create: {
        tenantId,
        key: 'platform.environments',
        value: updated as any,
        category: 'platform',
      },
    });

    return { success: true, message: `Environment ${type} synced successfully.` };
  }

  /**
   * Maintenance Mode.
   */
  async getMaintenanceMode(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'platform.maintenance-mode' } },
    });
    if (!setting) {
      return { enabled: false, message: 'System undergoing brief scheduled maintenance. Please refresh in a few minutes.' };
    }
    return setting.value;
  }

  async saveMaintenanceMode(tenantId: string, maintenance: { enabled: boolean; message: string }) {
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'platform.maintenance-mode' } },
      update: { value: maintenance as any, category: 'platform' },
      create: {
        tenantId,
        key: 'platform.maintenance-mode',
        value: maintenance as any,
        category: 'platform',
      },
    });
    return maintenance;
  }

  /**
   * SMTP Settings.
   */
  async getSmtpConfig(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'platform.smtp' } },
    });
    if (!setting) {
      return { host: 'smtp.mailgun.org', port: 587, username: 'postmaster@unerp.dev', secure: false };
    }
    return setting.value;
  }

  async saveSmtpConfig(tenantId: string, config: any) {
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'platform.smtp' } },
      update: { value: config as any, category: 'platform' },
      create: {
        tenantId,
        key: 'platform.smtp',
        value: config as any,
        category: 'platform',
      },
    });
    return config;
  }

  /**
   * Login Designer Settings.
   */
  async getLoginCustomizer(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'platform.login-customizer' } },
    });
    if (!setting) {
      return { companyName: 'UniERP', logoUrl: '', welcomeMessage: 'Welcome to Enterprise Portal', primaryColor: 'var(--color-primary)' };
    }
    return setting.value;
  }

  async saveLoginCustomizer(tenantId: string, config: any) {
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'platform.login-customizer' } },
      update: { value: config as any, category: 'platform' },
      create: {
        tenantId,
        key: 'platform.login-customizer',
        value: config as any,
        category: 'platform',
      },
    });
    return config;
  }

  /**
   * Email Templates Database CRUD.
   */
  async getEmailTemplates(tenantId: string) {
    return prisma.emailTemplate.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async saveEmailTemplate(tenantId: string, data: { id?: string; name: string; category: string; subject: string; body: string; isActive?: boolean }) {
    if (data.id) {
      return prisma.emailTemplate.update({
        where: { id: data.id },
        data: {
          name: data.name,
          category: data.category,
          subject: data.subject,
          body: data.body,
          isActive: data.isActive ?? true,
        },
      });
    }

    return prisma.emailTemplate.create({
      data: {
        tenantId,
        name: data.name,
        category: data.category,
        subject: data.subject,
        body: data.body,
        variables: JSON.stringify(['{{customerName}}', '{{invoiceNumber}}', '{{totalAmount}}']),
        isActive: data.isActive ?? true,
      },
    });
  }

  async deleteEmailTemplate(tenantId: string, id: string) {
    const template = await prisma.emailTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) throw new NotFoundException('Email template not found');
    await prisma.emailTemplate.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Tenant Usage Analytics.
   */
  async getUsageAnalytics(tenantId: string) {
    const usersCount = await prisma.user.count({ where: { tenantId } });
    const invoicesCount = await prisma.invoice.count({ where: { tenantId } });
    const productsCount = await prisma.product.count({ where: { tenantId } });

    return {
      usersCount,
      invoicesCount,
      productsCount,
      storageUsedBytes: 845214000, // 845 MB mock storage used
      storageLimitBytes: 10737418240, // 10 GB limit
      apiHitsCount: 421045,
    };
  }

  /**
   * White-Label Settings.
   */
  async getWhiteLabelSettings(tenantId: string) {
    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'platform.white-label' } },
    });
    if (!setting) {
      return { appName: 'UniERP', primaryColor: '#10b981', secondaryColor: '#3b82f6', borderRadius: '8px', fontFamily: 'Inter', enablePWA: true, theme: 'light', logoUrl: '' };
    }
    return setting.value;
  }

  async saveWhiteLabelSettings(tenantId: string, config: any) {
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'platform.white-label' } },
      update: { value: config as any, category: 'platform' },
      create: { tenantId, key: 'platform.white-label', value: config as any, category: 'platform' },
    });
    return config;
  }

  /**
   * System Update status.
   */
  async getSystemUpdates(tenantId: string) {
    const fs = await import('fs');
    const path = await import('path');
    let currentVersion = 'v1.0.0';
    try {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      currentVersion = `v${pkg.version || '1.0.0'}`;
    } catch {}

    const setting = await prisma.setting.findUnique({
      where: { tenantId_key: { tenantId, key: 'platform.system-updates' } },
    });

    const lastCheck = setting?.value as any;
    return {
      currentVersion,
      latestVersion: lastCheck?.latestVersion || currentVersion,
      updateAvailable: lastCheck?.latestVersion ? lastCheck.latestVersion !== currentVersion : false,
      lastCheckedAt: lastCheck?.checkedAt || null,
      releaseNotes: lastCheck?.releaseNotes || [],
    };
  }

  async checkForUpdates(tenantId: string) {
    const current = await this.getSystemUpdates(tenantId);
    const checkResult = {
      latestVersion: current.currentVersion,
      checkedAt: new Date().toISOString(),
      releaseNotes: [],
    };
    await prisma.setting.upsert({
      where: { tenantId_key: { tenantId, key: 'platform.system-updates' } },
      update: { value: checkResult as any, category: 'platform' },
      create: { tenantId, key: 'platform.system-updates', value: checkResult as any, category: 'platform' },
    });
    return { ...current, lastCheckedAt: checkResult.checkedAt };
  }
}
