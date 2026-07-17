import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FixedAssetsController } from '../fixed-assets.controller';
import { FixedAssetsService } from '../fixed-assets.service';

describe('FixedAssetsController', () => {
  let controller: FixedAssetsController;
  let mockService: FixedAssetsService;

  const mockUserReq = {
    user: {
      tenantId: 'tenant-123',
      userId: 'user-456',
      email: 'admin@unerp.dev',
      roles: ['ADMIN'],
      orgId: 'org-789',
    },
  } as any;

  beforeEach(() => {
    mockService = {
      getCategories: vi.fn(),
      createCategory: vi.fn(),
      getAssets: vi.fn(),
      getAssetById: vi.fn(),
      createAsset: vi.fn(),
      updateAsset: vi.fn(),
      transferAsset: vi.fn(),
      logMaintenance: vi.fn(),
      postDepreciation: vi.fn(),
    } as unknown as FixedAssetsService;

    controller = new FixedAssetsController(mockService);
    vi.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should call service getCategories with tenant ID', async () => {
      const mockCats = [{ id: 'cat-1', name: 'IT' }];
      vi.mocked(mockService.getCategories).mockResolvedValue(mockCats as any);

      const result = await controller.getCategories(mockUserReq);
      expect(result).toEqual(mockCats);
      expect(mockService.getCategories).toHaveBeenCalledWith('tenant-123');
    });
  });

  describe('createCategory', () => {
    it('should call service createCategory with tenant ID and payload', async () => {
      const payload = {
        name: 'Machinery',
        depreciationMethod: 'SLM' as const,
        expectedLifeMonths: 120,
      };
      const mockCat = { id: 'cat-2', ...payload };
      vi.mocked(mockService.createCategory).mockResolvedValue(mockCat as any);

      const result = await controller.createCategory(mockUserReq, payload);
      expect(result).toEqual(mockCat);
      expect(mockService.createCategory).toHaveBeenCalledWith('tenant-123', payload);
    });
  });

  describe('getAssets', () => {
    it('should pass query filters to service getAssets', async () => {
      const mockAssets = [{ id: 'asset-1', name: 'Desk' }];
      vi.mocked(mockService.getAssets).mockResolvedValue(mockAssets as any);

      const result = await controller.getAssets(mockUserReq, 'cat-1', 'ACTIVE', 'loc-1');
      expect(result).toEqual(mockAssets);
      expect(mockService.getAssets).toHaveBeenCalledWith('tenant-123', {
        categoryId: 'cat-1',
        status: 'ACTIVE',
        locationId: 'loc-1',
      });
    });
  });

  describe('getAssetById', () => {
    it('should fetch single asset by ID', async () => {
      const mockAsset = { id: 'asset-1', name: 'Desk' };
      vi.mocked(mockService.getAssetById).mockResolvedValue(mockAsset as any);

      const result = await controller.getAssetById(mockUserReq, 'asset-1');
      expect(result).toEqual(mockAsset);
      expect(mockService.getAssetById).toHaveBeenCalledWith('tenant-123', 'asset-1');
    });
  });

  describe('createAsset', () => {
    it('should create fixed asset', async () => {
      const payload = {
        assetCode: 'AST-003',
        name: 'Desk',
        purchaseDate: '2026-07-04',
        purchaseValue: 500,
        salvageValue: 50,
        usefulLifeYears: 5,
        depreciationMethod: 'SLM' as const,
        accountId: 'acc-1',
        accumDepAccountId: 'acc-2',
      };
      const mockAsset = { id: 'asset-3', ...payload };
      vi.mocked(mockService.createAsset).mockResolvedValue(mockAsset as any);

      const result = await controller.createAsset(mockUserReq, payload);
      expect(result).toEqual(mockAsset);
      expect(mockService.createAsset).toHaveBeenCalledWith('tenant-123', 'org-789', 'user-456', payload);
    });
  });

  describe('transferAsset', () => {
    it('should invoke transferAsset service method', async () => {
      const payload = {
        transferDate: '2026-07-04',
        toLocationId: 'loc-2',
        toCustodianId: 'emp-2',
        reason: 'Office move',
      };
      vi.mocked(mockService.transferAsset).mockResolvedValue({ id: 'log-1' } as any);

      const result = await controller.transferAsset(mockUserReq, 'asset-1', payload);
      expect(result).toEqual({ id: 'log-1' });
      expect(mockService.transferAsset).toHaveBeenCalledWith('tenant-123', 'asset-1', 'user-456', payload);
    });
  });

  describe('logMaintenance', () => {
    it('should log maintenance schedule and state', async () => {
      const payload = {
        maintenanceDate: '2026-07-04',
        type: 'PREVENTIVE' as const,
        description: 'Monthly checkup',
        cost: 0,
        performedBy: 'IT Staff',
      };
      vi.mocked(mockService.logMaintenance).mockResolvedValue({ id: 'm-log-1' } as any);

      const result = await controller.logMaintenance(mockUserReq, 'asset-1', payload);
      expect(result).toEqual({ id: 'm-log-1' });
      expect(mockService.logMaintenance).toHaveBeenCalledWith('tenant-123', 'asset-1', 'user-456', payload);
    });
  });

  describe('postDepreciation', () => {
    it('should post periodic depreciation run', async () => {
      const payload = { periodName: '2026-07' };
      vi.mocked(mockService.postDepreciation).mockResolvedValue({ id: 'dep-log-1' } as any);

      const result = await controller.postDepreciation(mockUserReq, 'asset-1', payload);
      expect(result).toEqual({ id: 'dep-log-1' });
      expect(mockService.postDepreciation).toHaveBeenCalledWith('tenant-123', 'org-789', 'user-456', 'asset-1', '2026-07');
    });
  });
});
