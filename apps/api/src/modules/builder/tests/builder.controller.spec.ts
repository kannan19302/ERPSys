import { BuilderController } from '../builder.controller';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('BuilderController', () => {
  let controller: BuilderController;

  beforeEach(async () => {
    const generateMockService = () => ({
      getForms: vi.fn().mockResolvedValue([]),
      getFormById: vi.fn().mockResolvedValue({}),
      createForm: vi.fn().mockResolvedValue({ id: '1' }),
      updateForm: vi.fn().mockResolvedValue({ id: '1' }),
      deleteForm: vi.fn().mockResolvedValue(true),

      getWorkflows: vi.fn().mockResolvedValue([]),
      getWorkflowById: vi.fn().mockResolvedValue({}),
      createWorkflow: vi.fn().mockResolvedValue({ id: '1' }),
      updateWorkflow: vi.fn().mockResolvedValue({ id: '1' }),
      deleteWorkflow: vi.fn().mockResolvedValue(true),

      getDashboards: vi.fn().mockResolvedValue([]),
      getDashboardById: vi.fn().mockResolvedValue({}),
      createDashboard: vi.fn().mockResolvedValue({ id: '1' }),
      updateDashboard: vi.fn().mockResolvedValue({ id: '1' }),
      deleteDashboard: vi.fn().mockResolvedValue(true),

      getModules: vi.fn().mockResolvedValue([]),
      getModuleById: vi.fn().mockResolvedValue({}),
      createModule: vi.fn().mockResolvedValue({ id: '1' }),
      updateModule: vi.fn().mockResolvedValue({ id: '1' }),
      deleteModule: vi.fn().mockResolvedValue(true),

      getAutomationRules: vi.fn().mockResolvedValue([]),
      getAutomationRuleById: vi.fn().mockResolvedValue({}),
      createAutomationRule: vi.fn().mockResolvedValue({ id: '1' }),
      updateAutomationRule: vi.fn().mockResolvedValue({ id: '1' }),
      deleteAutomationRule: vi.fn().mockResolvedValue(true),

      getDataImports: vi.fn().mockResolvedValue([]),
      createDataImport: vi.fn().mockResolvedValue({ id: '1' }),

      getWebPages: vi.fn().mockResolvedValue([]),
      getWebPageById: vi.fn().mockResolvedValue({}),
      createWebPage: vi.fn().mockResolvedValue({ id: '1' }),
      updateWebPage: vi.fn().mockResolvedValue({ id: '1' }),
      deleteWebPage: vi.fn().mockResolvedValue(true),

      getBlogPosts: vi.fn().mockResolvedValue([]),
      getBlogPostById: vi.fn().mockResolvedValue({}),
      createBlogPost: vi.fn().mockResolvedValue({ id: '1' }),
      updateBlogPost: vi.fn().mockResolvedValue({ id: '1' }),
      deleteBlogPost: vi.fn().mockResolvedValue(true),

      getWebAssets: vi.fn().mockResolvedValue([]),
      getWebTemplates: vi.fn().mockResolvedValue([]),
      getWebMenus: vi.fn().mockResolvedValue([]),
      getWebSeo: vi.fn().mockResolvedValue([]),
      getStats: vi.fn().mockResolvedValue({}),
      getGlobalPerformanceStats: vi.fn().mockResolvedValue({ metrics: { totalRevenue: 100 } }),
    });

    const mockService = generateMockService();
    controller = new BuilderController(
      mockService as any, // builderService
      {} as any,          // webCollections
      {} as any,          // builderAiService
      mockService as any, // builderFormsService
      mockService as any, // builderWorkflowsService
      mockService as any, // builderStatsService
      mockService as any, // builderDashboardsService
      {} as any,          // builderDevOpsService
      mockService as any, // builderWebContentService
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const req = { user: { tenantId: 'tenant1' } };

  const endpoints = [
    { name: 'Forms', createDto: { name: 'n', slug: 's' } },
    { name: 'Workflows', createDto: { name: 'n', docType: 'd', trigger: 't' } },
    { name: 'Dashboards', createDto: { name: 'n', refreshRate: 60 } },
    { name: 'Modules', createDto: { name: 'n', slug: 's' } },
    { name: 'AutomationRules', createDto: { name: 'n', trigger: 't' } },
    { name: 'WebPages', createDto: { name: 'n', slug: 's' } },
    { name: 'BlogPosts', createDto: { title: 't', slug: 's' } },
  ];

  for (const { name, createDto } of endpoints) {
    const singularName = name.endsWith('s') ? name.slice(0, -1) : name;

    describe(name, () => {
      it('should get all', async () => {
        expect(await (controller as any)[`get${name}`](req)).toEqual([]);
      });
      it('should get by id', async () => {
        expect(await (controller as any)[`get${singularName}ById`](req, '1')).toEqual({});
      });
      it('should create', async () => {
        expect(await (controller as any)[`create${singularName}`](req, createDto)).toEqual({ id: '1' });
      });
      it('should update', async () => {
        expect(await (controller as any)[`update${singularName}`](req, '1', {})).toEqual({ id: '1' });
      });
      it('should delete', async () => {
        expect(await (controller as any)[`delete${singularName}`](req, '1')).toEqual(true);
      });
    });
  }

  describe('DataImports', () => {
    it('should get', async () => {
      expect(await controller.getDataImports(req as any)).toEqual([]);
    });
    it('should create', async () => {
      expect(await controller.createDataImport(req as any, { name: 'n', targetModel: 't', fileName: 'f', fileSize: 1, totalRows: 1 })).toEqual({ id: '1' });
    });
  });

  describe('ReadOnly endpoints', () => {
    it('should get assets', async () => expect(await controller.getWebAssets(req as any)).toEqual([]));
    it('should get templates', async () => expect(await controller.getWebTemplates(req as any)).toEqual([]));
    it('should get menus', async () => expect(await controller.getWebMenus(req as any)).toEqual([]));
    it('should get seo', async () => expect(await controller.getWebSeo(req as any)).toEqual([]));
    it('should get stats', async () => expect(await controller.getStats(req as any)).toEqual({}));
    it('should get global performance stats', async () => {
      expect(await controller.getGlobalPerformanceStats(req as any)).toEqual({ metrics: { totalRevenue: 100 } });
    });
  });
});
