import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommunicationService } from '../communication.service';

vi.mock('@prisma/client', () => ({
  Prisma: {
    join: (arr: unknown[]) => arr,
  },
}));

vi.mock('@unerp/database', () => {
  return {
    prisma: {
      user: { findMany: vi.fn(), findFirst: vi.fn() },
      channel: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
      channelMember: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() },
      message: { create: vi.fn() },
      $queryRaw: vi.fn(),
    },
  };
});

describe('CommunicationService — channel management & roles (US-B1/B2/B3)', () => {
  let svc: CommunicationService;

  beforeEach(() => {
    svc = new CommunicationService(
      { createDocument: vi.fn() } as never,
      { broadcastChatMessage: vi.fn(), broadcastPresenceUpdate: vi.fn() } as never
    );
    vi.clearAllMocks();
  });

  /* ── Tenant isolation ── */

  it('never finds a channel belonging to another tenant when updating', async () => {
    const { prisma } = await import('@unerp/database');
    // getMembership queries findFirst with {id, tenantId} — simulate cross-tenant miss.
    vi.mocked(prisma.channel.findFirst).mockResolvedValue(null as never);

    await expect(
      svc.updateChannel('tenant-A', 'channel-in-tenant-B', 'u1', { name: 'hacked' })
    ).rejects.toThrow('Channel not found');
    expect(prisma.channel.findFirst).toHaveBeenCalledWith({ where: { id: 'channel-in-tenant-B', tenantId: 'tenant-A' } });
  });

  it('search only returns messages from channels the tenant-scoped, member-scoped user belongs to', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channelMember.findMany).mockResolvedValue([{ channelId: 'c1' }] as never);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      { id: 'm1', channelId: 'c1', userId: 'u2', content: 'the secret plan', createdAt: new Date(), channelName: 'general', channelKind: 'CHANNEL', authorFirstName: 'Ada', authorLastName: 'Lovelace' },
    ] as never);

    const res = await svc.searchMessages('tenant-A', 'u1', 'secret');
    expect(prisma.channelMember.findMany).toHaveBeenCalledWith({ where: { tenantId: 'tenant-A', userId: 'u1' }, select: { channelId: true } });
    expect(res).toHaveLength(1);
    expect(res[0]?.channelName).toBe('#general');
  });

  it('returns no search results when the user has no channel memberships (cannot search outside their scope)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channelMember.findMany).mockResolvedValue([] as never);

    const res = await svc.searchMessages('tenant-A', 'outsider', 'anything');
    expect(res).toEqual([]);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });

  /* ── Channel creation seeds an OWNER (P0 regression: QA found createChannel never
     created a ChannelMember row for the creator, unlike getOrCreateDM/createGroup) ── */

  it('createChannel seeds the creator as a ChannelMember with role OWNER', async () => {
    const { prisma } = await import('@unerp/database');
    // orgId 'org1' is not the 'org-system-default' sentinel, so resolveOrgId short-circuits
    // and never touches prisma.organization — only the duplicate-name check hits channel.findFirst.
    vi.mocked(prisma.channel.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.channel.create).mockImplementation(async (args: never) => {
      const a = args as { data: { members?: { create?: { tenantId: string; userId: string; role: string }[] } } };
      return { id: 'c-new', name: 'qa-owner-test', kind: 'CHANNEL', members: a.data.members?.create ?? [] } as never;
    });

    const created = await svc.createChannel('t1', 'org1', 'creator-1', { name: 'qa-owner-test' });

    expect(prisma.channel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          members: { create: [{ tenantId: 't1', userId: 'creator-1', role: 'OWNER' }] },
        }),
      })
    );
    expect((created as unknown as { members: { userId: string; role: string }[] }).members).toEqual([
      { tenantId: 't1', userId: 'creator-1', role: 'OWNER' },
    ]);
  });

  it('creator of a freshly created channel can immediately list members, rename, and archive it (no 403)', async () => {
    const { prisma } = await import('@unerp/database');
    const channelRow = { id: 'c-new', tenantId: 't1', kind: 'CHANNEL', orgId: 'org1', name: 'qa-owner-test' };
    const ownerMembership = { id: 'cm-owner', tenantId: 't1', channelId: 'c-new', userId: 'creator-1', role: 'OWNER' };

    // getChannelMembers: getMembership -> channel.findFirst, channelMember.findFirst, then channelMember.findMany
    vi.mocked(prisma.channel.findFirst).mockResolvedValue(channelRow as never);
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue(ownerMembership as never);
    vi.mocked(prisma.channelMember.findMany).mockResolvedValue([
      { userId: 'creator-1', role: 'OWNER' },
    ] as never);

    const members = await svc.getChannelMembers('t1', 'c-new', 'creator-1');
    expect(members).toEqual([{ userId: 'creator-1', role: 'OWNER' }]);

    // rename (OWNER/ADMIN gate) — second channel.findFirst call is the duplicate-name check
    vi.mocked(prisma.channel.findFirst)
      .mockResolvedValueOnce(channelRow as never) // getMembership
      .mockResolvedValueOnce(null as never); // duplicate-name check
    vi.mocked(prisma.channel.update).mockResolvedValue({ ...channelRow, name: 'renamed' } as never);
    const renamed = await svc.updateChannel('t1', 'c-new', 'creator-1', { name: 'renamed' });
    expect(renamed.name).toBe('renamed');

    // archive (OWNER-only gate)
    vi.mocked(prisma.channel.findFirst).mockResolvedValue(channelRow as never);
    vi.mocked(prisma.channel.update).mockResolvedValue({ ...channelRow, archived: true } as never);
    await expect(svc.updateChannel('t1', 'c-new', 'creator-1', { archived: true })).resolves.toBeDefined();
  });

  /* ── RBAC: member vs owner/admin ── */

  it('blocks a plain MEMBER from renaming a channel (403)', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1', kind: 'CHANNEL', orgId: 'org1' } as never);
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({ role: 'MEMBER' } as never);

    await expect(svc.updateChannel('t1', 'c1', 'u1', { name: 'new-name' })).rejects.toThrow(
      'You do not have permission to manage this channel.'
    );
  });

  it('blocks an ADMIN (not OWNER) from archiving a channel', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1', kind: 'CHANNEL', orgId: 'org1' } as never);
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({ role: 'ADMIN' } as never);

    await expect(svc.updateChannel('t1', 'c1', 'u1', { archived: true })).rejects.toThrow(
      'You do not have permission to manage this channel.'
    );
  });

  it('allows an ADMIN to rename a channel', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst)
      .mockResolvedValueOnce({ id: 'c1', tenantId: 't1', kind: 'CHANNEL', orgId: 'org1' } as never) // getMembership
      .mockResolvedValueOnce(null as never); // duplicate-name check
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({ role: 'ADMIN' } as never);
    vi.mocked(prisma.channel.update).mockResolvedValue({ id: 'c1', name: 'new-name' } as never);

    const res = await svc.updateChannel('t1', 'c1', 'u1', { name: 'new-name' });
    expect(res.name).toBe('new-name');
  });

  it('allows the OWNER to archive a channel', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1', kind: 'CHANNEL', orgId: 'org1' } as never);
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({ role: 'OWNER' } as never);
    vi.mocked(prisma.channel.update).mockResolvedValue({ id: 'c1', archived: true } as never);

    await svc.updateChannel('t1', 'c1', 'u1', { archived: true });
    expect(prisma.channel.update).toHaveBeenCalled();
  });

  it('blocks a plain MEMBER from adding a channel member', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue({ role: 'MEMBER' } as never);

    await expect(svc.addChannelMember('t1', 'c1', 'u1', 'newUser')).rejects.toThrow(
      'You do not have permission to manage this channel.'
    );
  });

  it('allows OWNER/ADMIN to add a member and posts a SYSTEM join announcement', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);
    vi.mocked(prisma.channelMember.findFirst)
      .mockResolvedValueOnce({ role: 'OWNER' } as never) // requester membership
      .mockResolvedValueOnce(null as never); // target not already a member
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'newUser', firstName: 'Grace', lastName: 'Hopper' } as never);
    vi.mocked(prisma.channelMember.create).mockResolvedValue({ id: 'cm1', role: 'MEMBER' } as never);
    vi.mocked(prisma.message.create).mockResolvedValue({} as never);
    vi.mocked(prisma.channel.update).mockResolvedValue({} as never);

    await svc.addChannelMember('t1', 'c1', 'owner1', 'newUser');
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ kind: 'SYSTEM', content: expect.stringContaining('joined the channel') }) })
    );
  });

  it('removes a member, retains history (no message deletion), and posts a departure announcement', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);
    vi.mocked(prisma.channelMember.findFirst)
      .mockResolvedValueOnce({ role: 'ADMIN' } as never) // requester membership
      .mockResolvedValueOnce({ id: 'cm2', role: 'MEMBER' } as never); // target membership
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'leaver', firstName: 'Ada', lastName: 'Lovelace' } as never);
    vi.mocked(prisma.channelMember.delete).mockResolvedValue({} as never);
    vi.mocked(prisma.message.create).mockResolvedValue({} as never);

    await svc.removeChannelMember('t1', 'c1', 'admin1', 'leaver');
    expect(prisma.channelMember.delete).toHaveBeenCalledWith({ where: { id: 'cm2' } });
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ kind: 'SYSTEM', content: expect.stringContaining('left the channel') }) })
    );
  });

  it('blocks removing the channel OWNER', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1' } as never);
    vi.mocked(prisma.channelMember.findFirst)
      .mockResolvedValueOnce({ role: 'ADMIN' } as never)
      .mockResolvedValueOnce({ id: 'cm-owner', role: 'OWNER' } as never);

    await expect(svc.removeChannelMember('t1', 'c1', 'admin1', 'owner1')).rejects.toThrow('Cannot remove the channel owner.');
  });

  /* ── Browse / join ── */

  it('browse only lists PUBLIC channels in the same tenant that the user has not joined', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channelMember.findMany).mockResolvedValue([{ channelId: 'joined1' }] as never);
    vi.mocked(prisma.channel.findMany).mockResolvedValue([
      { id: 'pub1', name: 'random', topic: 'chat', description: null, _count: { members: 5 } },
    ] as never);

    const res = await svc.browseChannels('t1', 'u1');
    expect(prisma.channel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 't1', kind: 'CHANNEL', type: 'PUBLIC', id: { notIn: ['joined1'] } }) })
    );
    expect(res[0]).toEqual({ id: 'pub1', name: 'random', topic: 'chat', description: null, memberCount: 5 });
  });

  it('rejects joining a PRIVATE channel directly', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1', kind: 'CHANNEL', type: 'PRIVATE' } as never);

    await expect(svc.joinChannel('t1', 'c1', 'u1')).rejects.toThrow('Only public channels can be joined directly.');
  });

  it('allows joining a PUBLIC channel and posts a join announcement', async () => {
    const { prisma } = await import('@unerp/database');
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 'c1', tenantId: 't1', kind: 'CHANNEL', type: 'PUBLIC' } as never);
    vi.mocked(prisma.channelMember.findFirst).mockResolvedValue(null as never);
    vi.mocked(prisma.channelMember.create).mockResolvedValue({ id: 'cm1', role: 'MEMBER' } as never);
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: 'u1', firstName: 'Ada', lastName: 'Lovelace' } as never);
    vi.mocked(prisma.message.create).mockResolvedValue({} as never);

    const res = await svc.joinChannel('t1', 'c1', 'u1');
    expect(res).toEqual({ id: 'cm1', role: 'MEMBER' });
    expect(prisma.message.create).toHaveBeenCalled();
  });
});
