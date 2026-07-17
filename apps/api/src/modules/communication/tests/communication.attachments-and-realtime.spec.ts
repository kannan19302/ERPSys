import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunicationService } from '../communication.service';

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      channel: { findFirst: vi.fn(), update: vi.fn() },
      message: { create: vi.fn(), findFirst: vi.fn() },
      user: { findFirst: vi.fn(), findMany: vi.fn() },
      userPresence: { upsert: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      organization: { findFirst: vi.fn() },
      channelMember: { findFirst: vi.fn(), findMany: vi.fn() },
      channelRead: { findMany: vi.fn() },
      department: { findMany: vi.fn() },
      employee: { findMany: vi.fn() },
    },
  };
});

describe('CommunicationService — real file attachments (US-A1/US-A2)', () => {
  let documentsService: { createDocument: ReturnType<typeof vi.fn> };
  let gateway: { broadcastChatMessage: ReturnType<typeof vi.fn>; broadcastPresenceUpdate: ReturnType<typeof vi.fn> };
  let svc: CommunicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    documentsService = { createDocument: vi.fn() };
    gateway = { broadcastChatMessage: vi.fn(), broadcastPresenceUpdate: vi.fn() };
    svc = new CommunicationService(documentsService as never, gateway as never);
  });

  const fakeFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
    ({
      fieldname: 'file',
      originalname: 'report.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('hello'),
      ...overrides,
    }) as Express.Multer.File;

  it('rejects upload if the channel does not belong to the caller tenant (tenant isolation)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue(null as never);

    await expect(svc.uploadAttachment('tenant-A', 'channel-in-tenant-B', 'u1', fakeFile())).rejects.toThrow(
      'Conversation not found'
    );
    expect(prisma.channel.findFirst).toHaveBeenCalledWith({ where: { id: 'channel-in-tenant-B', tenantId: 'tenant-A' } });
    expect(documentsService.createDocument).not.toHaveBeenCalled();
  });

  it('rejects a missing file', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);

    await expect(svc.uploadAttachment('t1', 'c1', 'u1', undefined as never)).rejects.toThrow('No file provided.');
    expect(documentsService.createDocument).not.toHaveBeenCalled();
  });

  it('rejects a file over the size cap before ever calling Drive', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);

    const bigFile = fakeFile({ size: 26 * 1024 * 1024 });
    await expect(svc.uploadAttachment('t1', 'c1', 'u1', bigFile)).rejects.toThrow(/attachment limit/);
    expect(documentsService.createDocument).not.toHaveBeenCalled();
  });

  it('stores the file via Drive service and returns a durable documentId + download URL, not a blob URL', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);
    vi.mocked(prisma.organization.findFirst).mockResolvedValue({ id: 'org-1', tenantId: 't1' } as never);
    documentsService.createDocument.mockResolvedValue({
      id: 'doc-1',
      versions: [{ id: 'ver-1' }],
    } as never);

    const file = fakeFile();
    const result = await svc.uploadAttachment('t1', 'c1', 'u1', file);

    expect(documentsService.createDocument).toHaveBeenCalledWith(
      't1',
      'org-1',
      expect.objectContaining({ name: 'report.pdf' }),
      'u1',
      file
    );
    expect(result.documentId).toBe('doc-1');
    expect(result.attachment.id).toBe('doc-1');
    expect(result.attachment.url).toBe('/drive/documents/versions/ver-1/download');
    expect(result.attachment.url).not.toMatch(/^blob:/);
    expect(result.attachment.name).toBe('report.pdf');
    expect(result.attachment.size).toBe(1024);
    expect(result.attachment.mime).toBe('application/pdf');
  });
});

describe('CommunicationService — WebSocket gateway wiring (US-A3/US-A4/US-A5)', () => {
  let documentsService: { createDocument: ReturnType<typeof vi.fn> };
  let gateway: { broadcastChatMessage: ReturnType<typeof vi.fn>; broadcastPresenceUpdate: ReturnType<typeof vi.fn> };
  let svc: CommunicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    documentsService = { createDocument: vi.fn() };
    gateway = { broadcastChatMessage: vi.fn(), broadcastPresenceUpdate: vi.fn() };
    svc = new CommunicationService(documentsService as never, gateway as never);
  });

  it('broadcasts the persisted message (real id/createdAt) into the channel room after createMessage', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);
    vi.mocked(prisma.channel.update).mockResolvedValue({} as never);
    const createdAt = new Date('2026-07-02T10:00:00Z');
    vi.mocked(prisma.message.create).mockResolvedValue({
      id: 'msg-1',
      channelId: 'c1',
      userId: 'u1',
      content: 'hello team',
      kind: 'USER',
      parentId: null,
      pinned: false,
      attachments: [],
      meetingId: null,
      editedAt: null,
      deletedAt: null,
      createdAt,
      reactions: [],
    } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as never);

    const result = await svc.createMessage('t1', 'c1', 'u1', { content: 'hello team' });

    expect(gateway.broadcastChatMessage).toHaveBeenCalledTimes(1);
    const [broadcastChannelId, payload] = gateway.broadcastChatMessage.mock.calls[0]!;
    expect(broadcastChannelId).toBe('c1');
    expect(payload).toMatchObject({ id: 'msg-1', content: 'hello team', tenantId: 't1' });
    // Must be the real persisted id/timestamp, not an ephemeral client-echoed guess.
    expect(payload.ts).toBe(createdAt.getTime());
    expect(result.id).toBe('msg-1');
  });

  it('does not broadcast when message creation fails validation (empty message)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);

    await expect(svc.createMessage('t1', 'c1', 'u1', { content: '' })).rejects.toThrow('Message is empty.');
    expect(gateway.broadcastChatMessage).not.toHaveBeenCalled();
  });

  it('broadcasts a presence update via the gateway when setPresence is called', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.userPresence.upsert).mockResolvedValue({
      tenantId: 't1',
      userId: 'u1',
      presence: 'DND',
      statusText: 'Focus time',
      statusEmoji: '🎧',
    } as never);

    await svc.setPresence('t1', 'u1', { presence: 'DND', statusText: 'Focus time', statusEmoji: '🎧' });

    expect(gateway.broadcastPresenceUpdate).toHaveBeenCalledTimes(1);
    const [tenantId, payload] = gateway.broadcastPresenceUpdate.mock.calls[0]!;
    expect(tenantId).toBe('t1');
    expect(payload).toMatchObject({ userId: 'u1', presence: 'DND', statusText: 'Focus time', statusEmoji: '🎧' });
  });
});

describe('CommunicationService — getMessageReadReceipts (US-B4)', () => {
  let svc: CommunicationService;

  beforeEach(() => {
    svc = new CommunicationService({} as never, {} as never);
    vi.clearAllMocks();
  });

  it('rejects if message not found', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.message.findFirst).mockResolvedValue(null as never);

    await expect(svc.getMessageReadReceipts('t1', 'm1', 'u1')).rejects.toThrow('Message not found');
  });

  it('rejects if caller is not a member of the channel', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.message.findFirst).mockResolvedValue({ id: 'm1', channelId: 'c1' } as never);
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue(null as never);

    await expect(svc.getMessageReadReceipts('t1', 'm1', 'u1')).rejects.toThrow('You are not a member of this channel');
  });

  it('returns read receipts for small groups showing who read the message', async () => {
    const { prisma } = await import('@unerp/database');
    const msgCreatedAt = new Date('2026-07-02T10:00:00Z');
    vi.mocked(prisma.message.findFirst).mockResolvedValue({ id: 'm1', channelId: 'c1', userId: 'u1', createdAt: msgCreatedAt } as never);
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({ id: 'cm-caller' } as never);
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', kind: 'GROUP', _count: { members: 3 } } as never);
    vi.mocked(prisma.channelMember.findMany).mockResolvedValue([
      { userId: 'u2' },
      { userId: 'u3' }
    ] as never);
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { id: 'u2', firstName: 'Jane', lastName: 'Doe', avatar: null },
      { id: 'u3', firstName: 'Bob', lastName: 'Smith', avatar: null }
    ] as never);
    vi.mocked(prisma.channelRead.findMany).mockResolvedValue([
      { userId: 'u2', lastReadAt: new Date('2026-07-02T10:05:00Z') }, // seen after message
      { userId: 'u3', lastReadAt: new Date('2026-07-02T09:50:00Z') }  // not seen
    ] as never);

    const receipts = await svc.getMessageReadReceipts('t1', 'm1', 'u1');
    expect(receipts).toHaveLength(1);
    expect(receipts[0]).toMatchObject({
      userId: 'u2',
      name: 'Jane Doe',
      avatar: null
    });
  });

  it('returns empty array if channel has more than 8 members (budgeting constraints)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.message.findFirst).mockResolvedValue({ id: 'm1', channelId: 'c1', userId: 'u1' } as never);
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({ id: 'cm-caller' } as never);
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', kind: 'CHANNEL', _count: { members: 9 } } as never);

    const receipts = await svc.getMessageReadReceipts('t1', 'm1', 'u1');
    expect(receipts).toEqual([]);
  });
});

describe('CommunicationService — getLinkPreview (US-C2)', () => {
  let svc: CommunicationService;

  beforeEach(() => {
    svc = new CommunicationService({} as never, {} as never);
    vi.clearAllMocks();
  });

  it('returns Clean URL and metadata when fetch succeeds', async () => {
    const fakeHtml = `
      <html>
        <head>
          <title>Test Title</title>
          <meta property="og:description" content="Test Description"/>
          <meta property="og:image" content="https://example.com/image.png"/>
          <meta property="og:site_name" content="ExampleSite"/>
        </head>
      </html>
    `;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => fakeHtml
    });
    vi.stubGlobal('fetch', fetchMock);

    const res = await svc.getLinkPreview('example.com');
    expect(res).toMatchObject({
      url: 'http://example.com',
      title: 'Test Title',
      description: 'Test Description',
      image: 'https://example.com/image.png',
      siteName: 'ExampleSite'
    });

    // Check caching
    const resCached = await svc.getLinkPreview('example.com');
    expect(fetchMock).toHaveBeenCalledTimes(1); // Only fetched once
  });
});
