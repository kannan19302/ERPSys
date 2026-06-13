import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationsService } from '../notifications.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      notificationChannel: {
        findMany: vi.fn(),
        createMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
      notificationPreference: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(() => {
    service = new NotificationsService();
    vi.clearAllMocks();
  });

  it('should get channels', async () => {
    const { prisma } = await import('@unerp/database');
    const mockChannels = [{ id: 'ch-1', name: 'Web', isEnabled: true }];
    vi.mocked(prisma.notificationChannel.findMany).mockResolvedValue(mockChannels as never);

    const res = await service.getChannels('tenant-123');
    expect(res).toBeDefined();
    expect(res[0]?.name).toBe('Web');
  });
});
