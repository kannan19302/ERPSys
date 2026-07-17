import { Test, TestingModule } from '@nestjs/testing';
import { BuilderService } from '../builder.service';
import { BuilderFormsService } from '../builder-forms.service';
import { BuilderWorkflowsService } from '../builder-workflows.service';
import { BuilderStatsService } from '../builder-stats.service';
import { BuilderDashboardsService } from '../builder-dashboards.service';
import { BuilderDevOpsService } from '../builder-devops.service';
import { BuilderWebContentService } from '../builder-web-content.service';
import { prisma } from '@unerp/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@unerp/database', () => {
  const generateMock = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  });

  const txMock = {
    schemaRegistry: generateMock(),
  };

  return {
    prisma: {
      builderForm: generateMock(),
      builderWorkflow: generateMock(),
      builderDashboard: generateMock(),
      builderModule: generateMock(),
      automationRule: generateMock(),
      dataImportJob: generateMock(),
      webPage: generateMock(),
      blogPost: generateMock(),
      webAsset: generateMock(),
      webTemplate: generateMock(),
      webMenu: generateMock(),
      webSeo: generateMock(),
      schemaRegistry: generateMock(),
      pageRegistry: generateMock(),
      customRecord: generateMock(),
      appRelease: generateMock(),
      installedApp: generateMock(),
      auditLog: generateMock(),
      invoice: generateMock(),
      employee: generateMock(),
      lead: generateMock(),
      inventoryItem: generateMock(),
      $transaction: vi.fn((fn: any) => fn(txMock)),
    }
  };
});

describe('BuilderService', () => {
  let service: BuilderService;
  let formsService: BuilderFormsService;
  let workflowsService: BuilderWorkflowsService;
  let statsService: BuilderStatsService;
  let dashboardsService: BuilderDashboardsService;
  let devOpsService: BuilderDevOpsService;
  let webContentService: BuilderWebContentService;
  let serviceMap: Record<string, any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BuilderService,
        BuilderFormsService,
        BuilderWorkflowsService,
        BuilderStatsService,
        BuilderDashboardsService,
        BuilderDevOpsService,
        BuilderWebContentService,
      ],
    }).compile();

    service = module.get<BuilderService>(BuilderService);
    formsService = module.get<BuilderFormsService>(BuilderFormsService);
    workflowsService = module.get<BuilderWorkflowsService>(BuilderWorkflowsService);
    statsService = module.get<BuilderStatsService>(BuilderStatsService);
    dashboardsService = module.get<BuilderDashboardsService>(BuilderDashboardsService);
    devOpsService = module.get<BuilderDevOpsService>(BuilderDevOpsService);
    webContentService = module.get<BuilderWebContentService>(BuilderWebContentService);

    serviceMap = {
      service,
      formsService,
      workflowsService,
      statsService,
      dashboardsService,
      devOpsService,
      webContentService,
    };

    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const models = [
    { entity: 'Form', serviceName: 'formsService', prismaMock: prisma.builderForm, createArgs: ['t1', { name: 'n', slug: 's' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'Workflow', serviceName: 'workflowsService', prismaMock: prisma.builderWorkflow, createArgs: ['t1', { name: 'n', docType: 'd' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'Dashboard', serviceName: 'dashboardsService', prismaMock: prisma.builderDashboard, createArgs: ['t1', { name: 'n', refreshRate: 60 }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'Module', serviceName: 'service', prismaMock: prisma.builderModule, createArgs: ['t1', { name: 'n', slug: 's' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'AutomationRule', serviceName: 'service', prismaMock: prisma.automationRule, createArgs: ['t1', { name: 'n', trigger: 't' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'WebPage', serviceName: 'webContentService', prismaMock: prisma.webPage, createArgs: ['t1', { name: 'n', slug: 's' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'BlogPost', serviceName: 'webContentService', prismaMock: prisma.blogPost, createArgs: ['t1', { title: 't', slug: 's' }], updateArgs: ['t1', 'id', { title: 't2' }] },
  ];

  for (const { entity, serviceName, prismaMock, createArgs, updateArgs } of models) {
    describe(entity, () => {
      it(`should get ${entity}s`, async () => {
        (prismaMock.findMany as any).mockResolvedValue([]);
        const targetService = serviceMap[serviceName];
        const result = await targetService[`get${entity}s`]('t1');
        expect(result.data || result).toEqual([]);
        expect(prismaMock.findMany).toHaveBeenCalled();
      });

      it(`should get ${entity} by id`, async () => {
        (prismaMock.findFirst as any).mockResolvedValue({ id: '1' });
        const targetService = serviceMap[serviceName];
        const result = await targetService[`get${entity}ById`]('t1', '1');
        expect(result).toEqual({ id: '1' });
      });

      it(`should create ${entity}`, async () => {
        (prismaMock.findFirst as any).mockResolvedValue(null);
        (prismaMock.create as any).mockResolvedValue({ id: '1' });
        const targetService = serviceMap[serviceName];
        const result = await targetService[`create${entity}`](...createArgs);
        expect(result.id).toBe('1');
        expect(prismaMock.create).toHaveBeenCalled();
      });

      it(`should update ${entity}`, async () => {
        (prismaMock.findFirst as any).mockResolvedValue({ id: '1' });
        (prismaMock.update as any).mockResolvedValue({ id: '1' });
        const targetService = serviceMap[serviceName];
        const result = await targetService[`update${entity}`](...updateArgs);
        expect(result.id).toBe('1');
        expect(prismaMock.update).toHaveBeenCalled();
      });

      it(`should delete ${entity}`, async () => {
        (prismaMock.findFirst as any).mockResolvedValue({ id: '1' });
        (prismaMock.delete as any).mockResolvedValue({ id: '1' });
        const targetService = serviceMap[serviceName];
        const result = await targetService[`delete${entity}`]('t1', '1');
        expect(result).toEqual({ id: '1' });
        expect(prismaMock.delete).toHaveBeenCalled();
      });
    });
  }

  describe('DataImport', () => {
    it('should get data imports', async () => {
      (prisma.dataImportJob.findMany as any).mockResolvedValue([]);
      expect(await service.getDataImports('t1')).toEqual([]);
    });
    it('should create data import', async () => {
      (prisma.dataImportJob.create as any).mockResolvedValue({ id: '1' });
      expect(await service.createDataImport('t1', { name: 'n', targetModel: 'employee', fileName: 'f', fileSize: 1, totalRows: 1 })).toEqual({ id: '1' });
    });
  });

  describe('Stats', () => {
    it('should return aggregated stats', async () => {
      (prisma.builderForm.count as any).mockResolvedValue(5);
      (prisma.builderWorkflow.count as any).mockResolvedValue(2);
      (prisma.builderDashboard.count as any).mockResolvedValue(1);
      (prisma.builderModule.count as any).mockResolvedValue(3);
      (prisma.automationRule.count as any).mockResolvedValue(10);
      (prisma.dataImportJob.count as any).mockResolvedValue(4);
      (prisma.webPage.count as any).mockResolvedValue(20);
      (prisma.blogPost.count as any).mockResolvedValue(15);
      (prisma.webAsset.count as any).mockResolvedValue(0);
      (prisma.webTemplate.count as any).mockResolvedValue(0);
      (prisma.webMenu.count as any).mockResolvedValue(0);
      (prisma.webSeo.count as any).mockResolvedValue(0);

      const stats = await statsService.getStats('tenant1');
      expect(stats.erp.forms).toBe(5);
      expect(stats.web.pages).toBe(20);
    });

    it('should aggregate and sort recent items', async () => {
      const d1 = new Date('2026-06-01T00:00:00Z');
      const d2 = new Date('2026-06-02T00:00:00Z');
      
      (prisma.builderForm.findMany as any).mockResolvedValue([{ id: 'f1', name: 'Form 1', status: 'DRAFT', updatedAt: d1 }]);
      (prisma.builderWorkflow.findMany as any).mockResolvedValue([{ id: 'w1', name: 'WF 1', status: 'ACTIVE', updatedAt: d2 }]);
      (prisma.builderDashboard.findMany as any).mockResolvedValue([]);
      (prisma.webPage.findMany as any).mockResolvedValue([]);
      (prisma.blogPost.findMany as any).mockResolvedValue([]);

      const items = await statsService.getRecentItems('tenant1');
      expect(items).toHaveLength(2);
      expect(items[0]?.id).toBe('w1'); // w1 is newer (d2)
      expect(items[1]?.id).toBe('f1');
    });
  });

  // ══════════════════════════════════════════════
  // SCHEMA REGISTRY — getSchemaRegistryById
  // ══════════════════════════════════════════════
  describe('SchemaRegistry', () => {
    it('should get schema by id', async () => {
      (prisma.schemaRegistry.findFirst as any).mockResolvedValue({ id: 's1', name: 'Test' });
      const result = await service.getSchemaRegistryById('t1', 's1');
      expect(result).toEqual({ id: 's1', name: 'Test' });
      expect(prisma.schemaRegistry.findFirst).toHaveBeenCalledWith({ where: { id: 's1', tenantId: 't1' } });
    });

    it('should throw if schema not found by id', async () => {
      (prisma.schemaRegistry.findFirst as any).mockResolvedValue(null);
      await expect(service.getSchemaRegistryById('t1', 's1')).rejects.toThrow();
    });
  });

  // ══════════════════════════════════════════════
  // PUBLISH FORM
  // ══════════════════════════════════════════════
  describe('publishForm', () => {
    it('should create a new schema and link it to the page on first publish', async () => {
      const page = {
        id: 'p1',
        module: 'crm',
        slug: 'vehicle-request',
        title: 'Vehicle Maintenance',
        layout: { fields: [
          { name: 'vehicle_type', label: 'Vehicle Type', type: 'Data', required: true, inListView: true },
          { name: 'Section Break', type: 'Section Break' },
        ], settings: { webhooks: [] } },
        status: 'DRAFT',
      };
      (prisma.pageRegistry.findFirst as any).mockResolvedValue(page);
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        // First call: findUnique for existing schema — not found
        prisma.schemaRegistry.findUnique = vi.fn().mockResolvedValue(null);
        prisma.schemaRegistry.create = vi.fn().mockResolvedValue({ id: 'schema1', slug: 'crm_vehicle-request' });
        return fn({ schemaRegistry: prisma.schemaRegistry });
      });
      (prisma.pageRegistry.update as any).mockResolvedValue({ ...page, schemaId: 'schema1', status: 'PUBLISHED' });

      const result = await service.publishForm('t1', 'p1');
      expect(result.page.status).toBe('PUBLISHED');
      expect(result.page.schemaId).toBe('schema1');
      expect(result.route).toBe('/app/crm/vehicle-request');
      expect(result.schema.id).toBe('schema1');
    });

    it('should update existing schema on re-publish', async () => {
      const page = {
        id: 'p1',
        module: 'crm',
        slug: 'vehicle-request',
        title: 'Vehicle Request Updated',
        layout: { fields: [
          { name: 'vehicle_type', label: 'Vehicle Type', type: 'Data', required: true },
        ], settings: {} },
        status: 'DRAFT',
      };
      (prisma.pageRegistry.findFirst as any).mockResolvedValue(page);
      (prisma.$transaction as any).mockImplementation(async (fn: any) => {
        prisma.schemaRegistry.findUnique = vi.fn().mockResolvedValue({ id: 'schema1' });
        prisma.schemaRegistry.update = vi.fn().mockResolvedValue({ id: 'schema1', name: 'Vehicle Request Updated' });
        return fn({ schemaRegistry: prisma.schemaRegistry });
      });
      (prisma.pageRegistry.update as any).mockResolvedValue({ ...page, schemaId: 'schema1', status: 'PUBLISHED' });

      const result = await service.publishForm('t1', 'p1');
      expect(result.schema.id).toBe('schema1');
      expect(result.route).toBe('/app/crm/vehicle-request');
    });

    it('should throw if page not found', async () => {
      (prisma.pageRegistry.findFirst as any).mockResolvedValue(null);
      await expect(service.publishForm('t1', 'nonexistent')).rejects.toThrow('Page not found');
    });
  });

  // ══════════════════════════════════════════════
  // CUSTOM RECORDS — getCustomRecords (search, sort, paginate)
  // ══════════════════════════════════════════════
  describe('getCustomRecords with query', () => {
    const schema = {
      id: 's1',
      fields: [
        { name: 'full_name', label: 'Name', type: 'Data', readRoles: '' },
        { name: 'status', label: 'Status', type: 'Select', readRoles: '' },
      ],
    };

    const records = [
      { id: 'r1', data: { full_name: 'Alice', status: 'Active' }, createdAt: '2026-01-01' },
      { id: 'r2', data: { full_name: 'Bob', status: 'Inactive' }, createdAt: '2026-01-02' },
      { id: 'r3', data: { full_name: 'Charlie', status: 'Active' }, createdAt: '2026-01-03' },
    ];

    beforeEach(() => {
      (prisma.schemaRegistry.findFirst as any).mockResolvedValue(schema);
      (prisma.customRecord.findMany as any).mockResolvedValue(records);
    });

    it('should return paginated results with defaults', async () => {
      const result = await service.getCustomRecords('t1', 's1', []);
      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it('should filter by search string', async () => {
      const result = await service.getCustomRecords('t1', 's1', [], { search: 'alice' });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('r1');
    });

    it('should sort ascending by a data field', async () => {
      const result = await service.getCustomRecords('t1', 's1', [], { sortBy: 'full_name', sortOrder: 'asc' });
      expect(result.data[0].data.full_name).toBe('Alice');
      expect(result.data[2].data.full_name).toBe('Charlie');
    });

    it('should sort descending by a data field', async () => {
      const result = await service.getCustomRecords('t1', 's1', [], { sortBy: 'full_name', sortOrder: 'desc' });
      expect(result.data[0].data.full_name).toBe('Charlie');
      expect(result.data[2].data.full_name).toBe('Alice');
    });

    it('should paginate correctly', async () => {
      // Mock findMany to return sliced result to simulate pagination
      (prisma.customRecord.findMany as any).mockResolvedValue(records);
      const result = await service.getCustomRecords('t1', 's1', [], { page: 2, pageSize: 2 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('r1');
      expect(result.totalPages).toBe(2);
    });

    it('should still apply RBAC scrubbing with query params', async () => {
      const schemaWithRoles = {
        id: 's1',
        fields: [
          { name: 'public_field', type: 'Data', readRoles: '' },
          { name: 'secret_field', type: 'Data', readRoles: 'admin' },
        ],
      };
      (prisma.schemaRegistry.findFirst as any).mockResolvedValue(schemaWithRoles);

      const result = await service.getCustomRecords('t1', 's1', ['viewer'], { search: 'something' });
      // All records should have secret_field scrubbed
      result.data.forEach((r: any) => {
        expect(r.data.secret_field).toBeUndefined();
        expect(r.data.public_field).toBeDefined();
      });
    });

    it('should return records unchanged when schema has no fields', async () => {
      (prisma.schemaRegistry.findFirst as any).mockResolvedValue({ id: 's1', fields: null });
      // Remove search so findMany just returns all records
      const result = await service.getCustomRecords('t1', 's1', []);
      expect(result.data).toHaveLength(3);
    });
  });

  // ══════════════════════════════════════════════
  // STUBS & MOCKS TESTS
  // ══════════════════════════════════════════════
  describe('executeWorkflow', () => {
    it('should execute active nodes and return logs', async () => {
      const wf = {
        id: 'w1',
        name: 'Test Workflow',
        nodes: [
          { id: 'n1', type: 'trigger', label: 'Start' },
          { id: 'n2', type: 'action', label: 'Send Email' }
        ],
        settings: { executions: [] }
      };
      (prisma.builderWorkflow.findFirst as any).mockResolvedValue(wf);
      (prisma.builderWorkflow.update as any).mockResolvedValue(wf);
      
      const result = await workflowsService.executeWorkflow('t1', 'w1');
      expect(result.status).toBe('COMPLETED');
      expect(result.logs.length).toBe(2);
      expect(result.logs[0]?.nodeLabel).toBe('Start');
      expect(result.logs[1]?.nodeLabel).toBe('Send Email');
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should fail if no executable nodes', async () => {
      (prisma.builderWorkflow.findFirst as any).mockResolvedValue({ id: 'w1', nodes: [] });
      await expect(workflowsService.executeWorkflow('t1', 'w1')).rejects.toThrow('Workflow has no executable nodes');
    });
  });

  describe('testRunAutomationRule', () => {
    it('should simulate automation actions', async () => {
      const rule = {
        id: 'r1',
        name: 'Test Rule',
        actions: [
          { type: 'CREATE_RECORD', label: 'Create Invoice' },
          { type: 'SEND_EMAIL', label: 'Notify Admin' }
        ]
      };
      (prisma.automationRule.findFirst as any).mockResolvedValue(rule);
      
      const result = await service.testRunAutomationRule('t1', 'r1');
      expect(result.success).toBe(true);
      expect(result.actions.length).toBe(2);
      expect(result.actions[0]?.type).toBe('CREATE_RECORD');
      expect(result.actions[1]?.type).toBe('SEND_EMAIL');
    });

    it('should fail if no actions configured', async () => {
      (prisma.automationRule.findFirst as any).mockResolvedValue({ id: 'r1', actions: [] });
      await expect(service.testRunAutomationRule('t1', 'r1')).rejects.toThrow('Automation rule has no actions to test');
    });
  });

  // ══════════════════════════════════════════════
  // RELEASES & MARKETPLACE
  // ══════════════════════════════════════════════
  describe('publishModule', () => {
    const baseModule = {
      id: 'm1', tenantId: 't1', name: 'My App', slug: 'my-app', version: '1.0.0',
      components: [], pages: [], dataModels: [], entities: [], relationships: [], permissions: {},
      testResults: { score: 85 },
    };

    it('creates an immutable release and bumps the patch version by default', async () => {
      (prisma.builderModule.findFirst as any).mockResolvedValue(baseModule);
      (prisma.appRelease.findUnique as any).mockResolvedValue(null);
      (prisma.appRelease.create as any).mockImplementation(({ data }: any) => Promise.resolve({ id: 'rel1', ...data }));
      (prisma.builderModule.update as any).mockImplementation(({ data }: any) => Promise.resolve({ ...baseModule, ...data }));

      const result = await service.publishModule('t1', 'm1', { scope: 'GLOBAL' }, 'u1');
      expect(result.release.version).toBe('1.0.1');
      expect(result.release.testScore).toBe(85);
      expect(result.module.status).toBe('ACTIVE');
      expect(result.module.currentReleaseId).toBe('rel1');
    });

    it('honors an explicit minor bump', async () => {
      (prisma.builderModule.findFirst as any).mockResolvedValue(baseModule);
      (prisma.appRelease.findUnique as any).mockResolvedValue(null);
      (prisma.appRelease.create as any).mockImplementation(({ data }: any) => Promise.resolve({ id: 'rel2', ...data }));
      (prisma.builderModule.update as any).mockImplementation(({ data }: any) => Promise.resolve({ ...baseModule, ...data }));

      const result = await service.publishModule('t1', 'm1', { scope: 'ORGANIZATION', bump: 'minor' }, 'u1');
      expect(result.release.version).toBe('1.1.0');
    });

    it('rejects a duplicate version', async () => {
      (prisma.builderModule.findFirst as any).mockResolvedValue(baseModule);
      (prisma.appRelease.findUnique as any).mockResolvedValue({ id: 'existing' });
      await expect(service.publishModule('t1', 'm1', { scope: 'GLOBAL', version: '1.0.0' }, 'u1')).rejects.toThrow(/already exists/);
    });
  });

  describe('getMarketplace', () => {
    it('annotates install state and update availability', async () => {
      (prisma.builderModule.findMany as any).mockResolvedValue([
        { id: 'm1', tenantId: 't1', name: 'A', slug: 'a', version: '1.2.0', scope: 'GLOBAL', currentReleaseId: 'r1', screenshots: [], installCount: 3 },
        { id: 'm2', tenantId: 't2', name: 'B', slug: 'b', version: '1.0.0', scope: 'GLOBAL', currentReleaseId: 'r2', screenshots: [], installCount: 0 },
      ]);
      (prisma.installedApp.findMany as any).mockResolvedValue([
        { sourceModuleId: 'm1', installedVersion: '1.1.0' },
      ]);

      const result = await service.getMarketplace('t1');
      expect(result).toHaveLength(2);
      expect(result[0].installed).toBe(true);
      expect(result[0].updateAvailable).toBe(true); // installed 1.1.0, current 1.2.0
      expect(result[0].isOwn).toBe(true);
      expect(result[1].installed).toBe(false);
    });
  });

  describe('installBuilderApp', () => {
    it('provisions pages/schemas and records the install', async () => {
      (prisma.builderModule.findFirst as any).mockResolvedValue({ id: 'm1', name: 'A', slug: 'a', currentReleaseId: 'r1', status: 'ACTIVE', scope: 'GLOBAL' });
      (prisma.appRelease.findFirst as any).mockResolvedValue({
        id: 'r1', version: '1.0.0', moduleId: 'm1',
        snapshot: { meta: { slug: 'a' }, forms: [{ id: 'f1', fields: [{ name: 'title', type: 'Data' }], settings: {} }], pages: [{ slug: 'tickets', name: 'Tickets', type: 'form', formId: 'f1' }], dataModels: [] },
      });
      (prisma.installedApp.findUnique as any).mockResolvedValue(null);
      (prisma.schemaRegistry.upsert as any).mockResolvedValue({ id: 'sch1' });
      (prisma.pageRegistry.upsert as any).mockResolvedValue({ id: 'pg1' });
      (prisma.installedApp.upsert as any).mockImplementation(({ create }: any) => Promise.resolve({ id: 'ins1', ...create }));
      (prisma.builderModule.update as any).mockResolvedValue({});

      const result = await service.installBuilderApp('t1', 'm1');
      expect(prisma.schemaRegistry.upsert).toHaveBeenCalled();
      expect(prisma.pageRegistry.upsert).toHaveBeenCalled();
      expect(result.version).toBe('1.0.0');
      expect(result.entry).toBe('/app/a/tickets');
      expect(prisma.builderModule.update).toHaveBeenCalled(); // installCount increment
    });

    it('throws when app has no published release', async () => {
      (prisma.builderModule.findFirst as any).mockResolvedValue({ id: 'm1', currentReleaseId: null, status: 'ACTIVE', scope: 'GLOBAL' });
      await expect(service.installBuilderApp('t1', 'm1')).rejects.toThrow(/no published release/);
    });
  });

  describe('uninstallBuilderApp', () => {
    it('tears down provisioned artifacts and removes the install', async () => {
      (prisma.installedApp.findUnique as any).mockResolvedValue({ id: 'ins1', provisioned: { pageRegistryIds: ['pg1'], schemaRegistryIds: ['sch1'] } });
      (prisma.pageRegistry.deleteMany as any).mockResolvedValue({ count: 1 });
      (prisma.schemaRegistry.deleteMany as any).mockResolvedValue({ count: 1 });
      (prisma.installedApp.delete as any).mockResolvedValue({});
      (prisma.builderModule.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await service.uninstallBuilderApp('t1', 'm1');
      expect(result.success).toBe(true);
      expect(prisma.pageRegistry.deleteMany).toHaveBeenCalled();
      expect(prisma.schemaRegistry.deleteMany).toHaveBeenCalled();
    });
  });

  describe('getGlobalPerformanceStats', () => {
    it('should aggregate and calculate stats from databases', async () => {
      (prisma.invoice.findMany as any).mockResolvedValue([
        { totalAmount: 1000, status: 'PAID' },
        { totalAmount: 500, status: 'Paid' },
        { totalAmount: 200, status: 'UNPAID' },
        { totalAmount: 100, status: 'Draft' },
      ]);
      (prisma.employee.count as any).mockResolvedValue(12);
      (prisma.lead.count as any).mockResolvedValue(45);
      (prisma.inventoryItem.findMany as any).mockResolvedValue([
        { quantity: 5, reorderPoint: 10 },
        { quantity: 15, reorderPoint: 10 },
      ]);
      (prisma.builderModule.findMany as any).mockResolvedValue([
        { id: 'm1', name: 'Sales App', slug: 'sales', category: 'Sales', version: '1.0.0', status: 'ACTIVE', pages: [1, 2], components: [{ type: 'form' }], dataModels: [1] }
      ]);
      (prisma.schemaRegistry.findMany as any).mockResolvedValue([
        { id: 's1', slug: 'orders', module: 'sales', name: 'Orders Schema', _count: { customRecords: 8 } }
      ]);
      (prisma.customRecord.findMany as any).mockImplementation(({ take }: any) => {
        if (take === 10) {
          return Promise.resolve([
            { id: 'r1', schemaRegistry: { module: 'sales', slug: 'orders', name: 'Orders Schema' }, createdAt: new Date('2026-06-15T12:00:00Z'), data: { total: 100 } }
          ]);
        }
        return Promise.resolve([
          { createdAt: new Date('2026-06-15T12:00:00Z') }
        ]);
      });

      const res = await statsService.getGlobalPerformanceStats('tenant-1');
      expect(res.metrics.totalRevenue).toBe(1500);
      expect(res.metrics.pendingInvoices).toBe(2);
      expect(res.metrics.activeEmployees).toBe(12);
      expect(res.metrics.totalLeads).toBe(45);
      expect(res.metrics.stockAlerts).toBe(1);
      expect(res.metrics.totalCustomApps).toBe(1);
      expect(res.metrics.totalCustomRecords).toBe(8);

      expect(res.customApps).toHaveLength(1);
      expect(res.customApps[0].submissionsCount).toBe(8);
      expect(res.recentSubmissions).toHaveLength(1);
      expect(res.recentSubmissions[0].appName).toBe('SALES App');

      expect(res.charts.submissionsByApp).toEqual([{ appName: 'Sales App', count: 8 }]);
      const junTrend = res.charts.monthlySubmissionsTrend.find((t: any) => t.month === 'Jun');
      expect(junTrend?.count).toBe(1);
    });

    it('should handle exceptions gracefully and return default empty structures', async () => {
      (prisma.invoice.findMany as any).mockRejectedValue(new Error('DB Error'));
      (prisma.employee.count as any).mockRejectedValue(new Error('DB Error'));
      (prisma.lead.count as any).mockRejectedValue(new Error('DB Error'));
      (prisma.inventoryItem.findMany as any).mockRejectedValue(new Error('DB Error'));
      (prisma.builderModule.findMany as any).mockRejectedValue(new Error('DB Error'));
      (prisma.customRecord.findMany as any).mockRejectedValue(new Error('DB Error'));

      const res = await statsService.getGlobalPerformanceStats('tenant-1');
      expect(res.metrics.totalRevenue).toBe(0);
      expect(res.metrics.activeEmployees).toBe(0);
      expect(res.metrics.totalCustomApps).toBe(0);
      expect(res.metrics.totalCustomRecords).toBe(0);
      expect(res.customApps).toHaveLength(0);
      expect(res.recentSubmissions).toHaveLength(0);
    });
  });
});
