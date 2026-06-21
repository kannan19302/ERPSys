import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunicationService } from '../communication.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      user: { findMany: vi.fn(), findFirst: vi.fn() },
      userPresence: { findMany: vi.fn(), upsert: vi.fn() },
      connectSpace: { findMany: vi.fn(), count: vi.fn(), create: vi.fn() },
      channel: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
      channelMember: { findMany: vi.fn() },
      message: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
      channelRead: { findMany: vi.fn(), upsert: vi.fn() },
      messageReaction: { findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
      connectMeeting: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
      calendarEvent: { findMany: vi.fn(), create: vi.fn() },
      notification: { findMany: vi.fn(), create: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
      emailTemplate: { findMany: vi.fn(), create: vi.fn(), findFirst: vi.fn() },
      organization: { findFirst: vi.fn() },
    },
  };
});

describe('CommunicationService (Connect)', () => {
  let svc: CommunicationService;

  beforeEach(() => {
    svc = new CommunicationService();
    vi.clearAllMocks();
  });

  it('builds a directory merging users with presence', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'u1', firstName: 'Ada', lastName: 'Lovelace', email: 'ada@x.io', avatar: null },
    ] as never);
    vi.mocked(prisma.userPresence.findMany).mockResolvedValue([
      { userId: 'u1', presence: 'DND', statusText: 'Focus' },
    ] as never);

    const res = await svc.getDirectory('t1');
    expect(res[0]?.name).toBe('Ada Lovelace');
    expect(res[0]?.presence).toBe('DND');
    expect(res[0]?.statusText).toBe('Focus');
  });

  it('serializes messages with grouped reactions and deleted tombstones', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);
    vi.mocked(prisma.message.findMany).mockResolvedValue([
      { id: 'm1', channelId: 'c1', userId: 'u1', content: 'hi', kind: 'USER', parentId: null, pinned: false, attachments: [], meetingId: null, editedAt: null, deletedAt: null, createdAt: new Date(), reactions: [{ emoji: '👍', userId: 'u1' }, { emoji: '👍', userId: 'u2' }] },
      { id: 'm2', channelId: 'c1', userId: 'u2', content: 'secret', kind: 'USER', parentId: null, pinned: false, attachments: [], meetingId: null, editedAt: null, deletedAt: new Date(), createdAt: new Date(), reactions: [] },
    ] as never);

    const res = await svc.getMessages('t1', 'c1');
    expect(res[0]?.reactions[0]).toEqual({ emoji: '👍', userIds: ['u1', 'u2'] });
    expect(res[1]?.deleted).toBe(true);
    expect(res[1]?.content).toBe('');
  });

  it('adds a reaction when none exists', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.message.findFirst).mockResolvedValue({ id: 'm1', tenantId: 't1' } as never);
    vi.mocked(prisma.messageReaction.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.messageReaction.findMany).mockResolvedValue([{ emoji: '🎉', userId: 'u1' }] as never);

    const res = await svc.toggleReaction('t1', 'm1', 'u1', '🎉');
    expect(prisma.messageReaction.create).toHaveBeenCalled();
    expect(res.reactions).toEqual([{ emoji: '🎉', userIds: ['u1'] }]);
  });

  it('upserts presence', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.userPresence.upsert).mockResolvedValue({ userId: 'u1', presence: 'AWAY' } as never);

    const res = await svc.setPresence('t1', 'u1', { presence: 'AWAY' });
    expect(prisma.userPresence.upsert).toHaveBeenCalled();
    expect(res.presence).toBe('AWAY');
  });

  it('creates a meeting and posts a system message into the conversation', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.connectMeeting.create).mockResolvedValue({ id: 'meet1', code: 'aaaa-bbbb-cccc', tenantId: 't1' } as never);
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);
    vi.mocked(prisma.message.create).mockResolvedValue({} as never);

    const res = await svc.createMeeting('t1', 'u1', { title: 'Standup', conversationId: 'c1' });
    expect(res.id).toBe('meet1');
    expect(prisma.message.create).toHaveBeenCalled();
  });

  it('upserts read state when marking a conversation read', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channelRead.upsert).mockResolvedValue({} as never);

    const res = await svc.markRead('t1', 'c1', 'u1');
    expect(prisma.channelRead.upsert).toHaveBeenCalled();
    expect(res.ok).toBe(true);
  });

  it('creates mention notifications when sending a message with @names', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1', name: 'general', kind: 'CHANNEL' } as never);
    vi.mocked(prisma.message.create).mockResolvedValue({ id: 'm1', channelId: 'c1', userId: 'author', content: 'hi @Ada', kind: 'USER', parentId: null, pinned: false, attachments: [], meetingId: null, editedAt: null, deletedAt: null, createdAt: new Date(), reactions: [] } as never);
    vi.mocked(prisma.channel.update).mockResolvedValue({} as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ firstName: 'Grace', lastName: 'Hopper' } as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'ada', firstName: 'Ada' }, { id: 'author', firstName: 'Grace' }] as never);
    vi.mocked(prisma.notification.create).mockResolvedValue({} as never);

    await svc.createMessage('t1', 'c1', 'author', { content: 'hi @Ada' });
    expect(prisma.notification.create).toHaveBeenCalledTimes(1);
  });

  it('fetches notifications', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.notification.findMany).mockResolvedValue([{ id: 'n1', title: 'Alert' }] as never);

    const res = await svc.getNotifications('t1', 'u1');
    expect(res[0]?.title).toBe('Alert');
  });
});
