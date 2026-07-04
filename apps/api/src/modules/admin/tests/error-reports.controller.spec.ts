import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorReportsService } from '../error-reports.service';
import { ErrorReportsController } from '../error-reports.controller';
import { prisma } from '@unerp/database';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      tenant: {
        findFirst: vi.fn(),
      },
      errorLog: {
        create: vi.fn(),
      },
      adminAlert: {
        create: vi.fn(),
      },
    },
    runWithTenantSession: vi.fn((ctx, fn) => fn()),
  };
});

describe('ErrorReportsController & ErrorReportsService', () => {
  let service: ErrorReportsService;
  let controller: ErrorReportsController;

  beforeEach(() => {
    service = new ErrorReportsService();
    controller = new ErrorReportsController(service);
    vi.clearAllMocks();
  });

  it('should successfully submit an error report without a user description (ErrorLog only)', async () => {
    vi.mocked(prisma.tenant.findFirst).mockResolvedValue({ id: 'system-tenant-id', slug: 'system' } as any);
    vi.mocked(prisma.errorLog.create).mockResolvedValue({ id: 'err-log-1' } as any);

    const dto = {
      message: 'Failed to fetch settings',
      stack: 'Error: Failed to fetch...\n at Page.tsx:12',
      url: 'http://localhost:3000/settings',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-abc-123',
      tenantId: 'tenant-123',
    };

    const result = await controller.submitReport(dto);

    expect(result).toEqual({ success: true, logId: 'err-log-1' });
    expect(prisma.errorLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-123',
        source: 'FRONTEND',
        level: 'ERROR',
        message: 'Failed to fetch settings',
        stack: 'Error: Failed to fetch...\n at Page.tsx:12',
        requestId: 'req-abc-123',
        metadata: {
          url: 'http://localhost:3000/settings',
          userAgent: 'Mozilla/5.0',
          description: null,
          userEmail: null,
          userName: null,
        },
      },
    });
    expect(prisma.adminAlert.create).not.toHaveBeenCalled();
  });

  it('should submit an error report with user description and create an AdminAlert', async () => {
    vi.mocked(prisma.tenant.findFirst).mockResolvedValue({ id: 'system-tenant-id', slug: 'system' } as any);
    vi.mocked(prisma.errorLog.create).mockResolvedValue({ id: 'err-log-2' } as any);
    vi.mocked(prisma.adminAlert.create).mockResolvedValue({ id: 'alert-1' } as any);

    const dto = {
      message: 'Network Error',
      stack: 'Error: Network Error',
      url: 'http://localhost:3000/dashboard',
      userAgent: 'Mozilla/5.0',
      description: 'I clicked the save button and the page crashed.',
      userEmail: 'user@example.com',
      userName: 'Test User',
      requestId: 'req-456',
      tenantId: 'tenant-123',
    };

    const result = await controller.submitReport(dto);

    expect(result).toEqual({ success: true, logId: 'err-log-2' });
    expect(prisma.errorLog.create).toHaveBeenCalled();
    expect(prisma.adminAlert.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-123',
        type: 'USER_ERROR_REPORT',
        severity: 'ERROR',
        title: 'User Error Report: Network Error',
        message: expect.stringContaining('I clicked the save button and the page crashed.'),
        metadata: {
          errorLogId: 'err-log-2',
          url: 'http://localhost:3000/dashboard',
          requestId: 'req-456',
          userEmail: 'user@example.com',
        },
      },
    });
  });

  it('should resolve tenantId to system tenant when not provided', async () => {
    vi.mocked(prisma.tenant.findFirst).mockResolvedValue({ id: 'system-tenant-id', slug: 'system' } as any);
    vi.mocked(prisma.errorLog.create).mockResolvedValue({ id: 'err-log-3' } as any);

    const dto = {
      message: 'Public page error',
      url: 'http://localhost:3000/landing',
    };

    const result = await controller.submitReport(dto);

    expect(result).toEqual({ success: true, logId: 'err-log-3' });
    expect(prisma.tenant.findFirst).toHaveBeenCalledWith({ where: { slug: 'system' } });
    expect(prisma.errorLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'system-tenant-id',
        }),
      }),
    );
  });
});
