import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunicationService } from '../communication.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      channel: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      message: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      notification: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        findFirst: vi.fn(),
      },
      emailTemplate: {
        findMany: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
    },
  };
});

describe('CommunicationService', () => {
  let commService: CommunicationService;

  beforeEach(() => {
    commService = new CommunicationService();
    vi.clearAllMocks();
  });

  it('should fetch channels', async () => {
    const { prisma } = await import('@unerp/database');
    const mockChannels = [{ id: 'ch-1', name: 'General' }];
    vi.mocked(prisma.channel.findMany).mockResolvedValue(mockChannels as never);

    const res = await commService.getChannels('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('General');
  });

  it('should fetch notifications', async () => {
    const { prisma } = await import('@unerp/database');
    const mockNotifications = [{ id: 'n-1', title: 'Alert' }];
    vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications as never);

    const res = await commService.getNotifications('tenant-123', 'user-456');
    expect(res).toBeDefined();
    expect(res[0]?.title).toBe('Alert');
  });
});
