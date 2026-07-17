import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CrmMailboxService } from '../crm-mailbox.service';

vi.mock('@unerp/database', () => ({
  prisma: {
    mailboxConnection: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    organization: {
      findFirst: vi.fn(),
    },
    contact: { findMany: vi.fn() },
    lead: { findMany: vi.fn() },
    customer: { findMany: vi.fn() },
    activity: { findFirst: vi.fn(), create: vi.fn() },
  },
  encryptField: (v: string) => `enc:${v}`,
  decryptField: (v: string) => v.replace(/^enc:/, ''),
}));

import { prisma } from '@unerp/database';

const TENANT = 'tenant-1';
const USER = 'user-1';

function mockFetchSequence(responses: Array<{ ok: boolean; json?: unknown; status?: number }>) {
  let call = 0;
  global.fetch = vi.fn().mockImplementation(() => {
    const r = responses[Math.min(call, responses.length - 1)];
    call++;
    return Promise.resolve({
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 400),
      statusText: 'error',
      json: () => Promise.resolve(r.json ?? {}),
      text: () => Promise.resolve(JSON.stringify(r.json ?? {})),
    });
  }) as unknown as typeof fetch;
}

describe('CrmMailboxService', () => {
  let service: CrmMailboxService;
  const emit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CrmMailboxService({ emit } as any);
    process.env.GOOGLE_OAUTH_CLIENT_ID = 'gid';
    process.env.GOOGLE_OAUTH_CLIENT_SECRET = 'gsecret';
    process.env.MICROSOFT_OAUTH_CLIENT_ID = 'mid';
    process.env.MICROSOFT_OAUTH_CLIENT_SECRET = 'msecret';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('buildAuthorizationUrl', () => {
    it('builds a Google consent URL with tenant/user/provider encoded in state', () => {
      const result = service.buildAuthorizationUrl(TENANT, USER, {
        provider: 'GOOGLE',
        redirectUri: 'https://app.example.com/crm/settings/email-integration/callback',
      });
      expect(result.authorizationUrl).toContain('accounts.google.com');
      expect(result.authorizationUrl).toContain('client_id=gid');
      const decoded = JSON.parse(Buffer.from(result.state, 'base64url').toString());
      expect(decoded).toEqual({ tenantId: TENANT, userId: USER, provider: 'GOOGLE' });
    });

    it('throws if the provider client id is not configured', () => {
      delete process.env.MICROSOFT_OAUTH_CLIENT_ID;
      expect(() =>
        service.buildAuthorizationUrl(TENANT, USER, { provider: 'MICROSOFT', redirectUri: 'https://x.test/cb' }),
      ).toThrow(/not configured/);
    });
  });

  describe('handleCallback', () => {
    it('exchanges the code for tokens, resolves the email address, and stores an encrypted connection', async () => {
      mockFetchSequence([
        { ok: true, json: { access_token: 'AT1', refresh_token: 'RT1', expires_in: 3600, scope: 'gmail.readonly' } },
        { ok: true, json: { email: 'rep@tenant.com' } },
      ]);
      (prisma.organization.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'org-1' });
      (prisma.mailboxConnection.upsert as ReturnType<typeof vi.fn>).mockImplementation(({ create }) =>
        Promise.resolve({ id: 'mbx-1', ...create }),
      );

      const result = await service.handleCallback(TENANT, USER, {
        provider: 'GOOGLE',
        code: 'auth-code',
        redirectUri: 'https://app.example.com/cb',
      });

      expect(result.emailAddress).toBe('rep@tenant.com');
      expect(result.status).toBe('CONNECTED');
      // encrypted-token fields must never leak to the caller
      expect((result as any).accessTokenEnc).toBeUndefined();
      expect((result as any).refreshTokenEnc).toBeUndefined();

      const upsertArgs = (prisma.mailboxConnection.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(upsertArgs.create.accessTokenEnc).toBe('enc:AT1');
      expect(upsertArgs.create.refreshTokenEnc).toBe('enc:RT1');
      expect(emit).toHaveBeenCalledWith('crm.mailbox.connected', expect.objectContaining({ tenantId: TENANT }));
    });

    it('throws BadRequestException when token exchange fails', async () => {
      mockFetchSequence([{ ok: false, status: 400, json: { error: 'invalid_grant' } }]);
      await expect(
        service.handleCallback(TENANT, USER, { provider: 'GOOGLE', code: 'bad', redirectUri: 'https://app.example.com/cb' }),
      ).rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    it('marks the connection DISCONNECTED and stamps disconnectedAt', async () => {
      (prisma.mailboxConnection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'mbx-1', tenantId: TENANT, userId: USER });
      (prisma.mailboxConnection.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ id: 'mbx-1', provider: 'GOOGLE', emailAddress: 'rep@tenant.com', createdAt: new Date(), scope: null, ...data }),
      );
      const result = await service.disconnect(TENANT, USER, 'mbx-1');
      expect(result.status).toBe('DISCONNECTED');
      expect(emit).toHaveBeenCalledWith('crm.mailbox.disconnected', expect.objectContaining({ id: 'mbx-1' }));
    });

    it('throws NotFoundException for an unknown connection id', async () => {
      (prisma.mailboxConnection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      await expect(service.disconnect(TENANT, USER, 'missing')).rejects.toThrow();
    });
  });

  describe('syncNow', () => {
    const baseConnection = {
      id: 'mbx-1', tenantId: TENANT, userId: USER, provider: 'GOOGLE', orgId: 'org-1',
      status: 'CONNECTED', accessTokenEnc: 'enc:AT1', refreshTokenEnc: 'enc:RT1',
      tokenExpiresAt: new Date(Date.now() + 3600_000), lastSyncedAt: null,
      emailAddress: 'rep@tenant.com', createdAt: new Date(), scope: 'gmail.readonly',
      lastSyncError: null, lastSyncMessages: 0, lastSyncEvents: 0,
    };

    it('matches an inbound message to a known Contact and writes an EMAIL Activity', async () => {
      (prisma.mailboxConnection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(baseConnection);
      mockFetchSequence([
        { ok: true, json: { messages: [{ id: 'm1' }] } },
        {
          ok: true,
          json: {
            internalDate: `${Date.now()}`,
            payload: { headers: [
              { name: 'From', value: 'Jane Prospect <jane@known-contact.com>' },
              { name: 'To', value: 'rep@tenant.com' },
              { name: 'Subject', value: 'Re: proposal' },
              { name: 'Date', value: new Date().toISOString() },
            ] },
          },
        },
        { ok: true, json: { items: [] } }, // calendar
      ]);
      (prisma.contact.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'contact-1', customerId: null, email: 'jane@known-contact.com' }]);
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.customer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.activity.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'act-1' });
      (prisma.mailboxConnection.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ ...baseConnection, ...data }),
      );

      const result = await service.syncNow(TENANT, USER, 'mbx-1');

      expect(result.messagesSynced).toBe(1);
      expect(prisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ type: 'EMAIL', contactId: 'contact-1', tenantId: TENANT }) }),
      );
    });

    it('skips creating a duplicate Activity when one already exists for the same subject/date/entity', async () => {
      (prisma.mailboxConnection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(baseConnection);
      mockFetchSequence([
        { ok: true, json: { messages: [{ id: 'm1' }] } },
        {
          ok: true,
          json: {
            internalDate: `${Date.now()}`,
            payload: { headers: [
              { name: 'From', value: 'jane@known-contact.com' },
              { name: 'To', value: 'rep@tenant.com' },
              { name: 'Subject', value: 'Re: proposal' },
            ] },
          },
        },
        { ok: true, json: { items: [] } },
      ]);
      (prisma.contact.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: 'contact-1', customerId: null, email: 'jane@known-contact.com' }]);
      (prisma.lead.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.customer.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.activity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'existing-activity' });
      (prisma.mailboxConnection.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ ...baseConnection, ...data }),
      );

      const result = await service.syncNow(TENANT, USER, 'mbx-1');

      expect(result.messagesSynced).toBe(0);
      expect(prisma.activity.create).not.toHaveBeenCalled();
    });

    it('records a sync error and sets status ERROR when the provider call fails, without throwing', async () => {
      (prisma.mailboxConnection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(baseConnection);
      mockFetchSequence([{ ok: false, status: 500 }]);
      (prisma.mailboxConnection.update as ReturnType<typeof vi.fn>).mockImplementation(({ data }) =>
        Promise.resolve({ ...baseConnection, ...data }),
      );

      const result = await service.syncNow(TENANT, USER, 'mbx-1');

      expect(result.syncError).toBeTruthy();
      expect(result.status).toBe('ERROR');
    });

    it('throws if the mailbox is not CONNECTED', async () => {
      (prisma.mailboxConnection.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ ...baseConnection, status: 'DISCONNECTED' });
      await expect(service.syncNow(TENANT, USER, 'mbx-1')).rejects.toThrow();
    });
  });
});
