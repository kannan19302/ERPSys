import { Test, TestingModule } from '@nestjs/testing';
import { BuilderService } from '../builder.service';
import { prisma } from '@unerp/database';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@unerp/database', () => {
  const generateMock = () => ({
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  });

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
    }
  };
});

describe('BuilderService', () => {
  let service: BuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuilderService],
    }).compile();

    service = module.get<BuilderService>(BuilderService);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const models = [
    { entity: 'Form', prismaMock: prisma.builderForm, createArgs: ['t1', { name: 'n', slug: 's' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'Workflow', prismaMock: prisma.builderWorkflow, createArgs: ['t1', { name: 'n', docType: 'd' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'Dashboard', prismaMock: prisma.builderDashboard, createArgs: ['t1', { name: 'n', refreshRate: 60 }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'Module', prismaMock: prisma.builderModule, createArgs: ['t1', { name: 'n', slug: 's' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'AutomationRule', prismaMock: prisma.automationRule, createArgs: ['t1', { name: 'n', trigger: 't' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'WebPage', prismaMock: prisma.webPage, createArgs: ['t1', { name: 'n', slug: 's' }], updateArgs: ['t1', 'id', { name: 'n2' }] },
    { entity: 'BlogPost', prismaMock: prisma.blogPost, createArgs: ['t1', { title: 't', slug: 's' }], updateArgs: ['t1', 'id', { title: 't2' }] },
  ];

  for (const { entity, prismaMock, createArgs, updateArgs } of models) {
    describe(entity, () => {
      it(`should get ${entity}s`, async () => {
        (prismaMock.findMany as any).mockResolvedValue([]);
        const result = await (service as any)[`get${entity}s`]('t1');
        expect(result).toEqual([]);
        expect(prismaMock.findMany).toHaveBeenCalled();
      });

      it(`should get ${entity} by id`, async () => {
        (prismaMock.findFirst as any).mockResolvedValue({ id: '1' });
        const result = await (service as any)[`get${entity}ById`]('t1', '1');
        expect(result).toEqual({ id: '1' });
      });

      it(`should create ${entity}`, async () => {
        (prismaMock.findFirst as any).mockResolvedValue(null);
        (prismaMock.create as any).mockResolvedValue({ id: '1' });
        const result = await (service as any)[`create${entity}`](...createArgs);
        expect(result.id).toBe('1');
        expect(prismaMock.create).toHaveBeenCalled();
      });

      it(`should update ${entity}`, async () => {
        (prismaMock.findFirst as any).mockResolvedValue({ id: '1' });
        (prismaMock.update as any).mockResolvedValue({ id: '1' });
        const result = await (service as any)[`update${entity}`](...updateArgs);
        expect(result.id).toBe('1');
        expect(prismaMock.update).toHaveBeenCalled();
      });

      it(`should delete ${entity}`, async () => {
        (prismaMock.findFirst as any).mockResolvedValue({ id: '1' });
        (prismaMock.delete as any).mockResolvedValue({ id: '1' });
        const result = await (service as any)[`delete${entity}`]('t1', '1');
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
      expect(await service.createDataImport('t1', { name: 'n', targetModel: 't', fileName: 'f', fileSize: 1, totalRows: 1 })).toEqual({ id: '1' });
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

      const stats = await service.getStats('tenant1');
      expect(stats.erp.forms).toBe(5);
      expect(stats.web.pages).toBe(20);
    });
  });
});
