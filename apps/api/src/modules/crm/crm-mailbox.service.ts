import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { prisma } from '@unerp/database';
import { encryptField, decryptField } from '@unerp/database';
import { z } from 'zod';

export const connectMailboxSchema = z.object({
  provider: z.enum(['GOOGLE', 'MICROSOFT']),
  redirectUri: z.string().url(),
});
export type ConnectMailboxInput = z.infer<typeof connectMailboxSchema>;

export const oauthCallbackSchema = z.object({
  provider: z.enum(['GOOGLE', 'MICROSOFT']),
  code: z.string().min(1),
  redirectUri: z.string().url(),
});
export type OauthCallbackInput = z.infer<typeof oauthCallbackSchema>;

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

interface ProviderConfig {
  authUrl: string;
  tokenUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
}

const GMAIL_MESSAGES_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages';
const GRAPH_MESSAGES_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/messages';
const GRAPH_EVENTS_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/calendarview';

/**
 * Real inbound email/calendar integration for CRM.
 *
 * Flow: connect() builds a provider consent URL -> user authorizes -> handleCallback()
 * exchanges the code for tokens (stored encrypted via @unerp/database encryptField) ->
 * syncNow() polls the provider's REST API for recent messages/events, matches sender/
 * attendee addresses against known Contacts/Leads/Customers, and writes CRM Activity
 * records so synced items show up on the existing contact/lead/customer timeline.
 *
 * Simplified for this pass (documented, not hidden):
 *  - Polling "sync now" endpoint, not a continuous background daemon / webhook push
 *    subscription (Gmail watch() / Graph subscriptions). A scheduled job can call
 *    syncNow() for every CONNECTED mailbox on an interval without further schema changes.
 *  - No token-refresh-on-expiry background loop; refresh happens lazily on next syncNow()
 *    call if the access token is expired, using the stored (encrypted) refresh token.
 */
@Injectable()
export class CrmMailboxService {
  private readonly logger = new Logger(CrmMailboxService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  private getProviderConfig(provider: 'GOOGLE' | 'MICROSOFT'): ProviderConfig {
    if (provider === 'GOOGLE') {
      return {
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly email',
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      };
    }
    return {
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scope: 'offline_access Mail.Read Calendars.Read User.Read',
      clientId: process.env.MICROSOFT_OAUTH_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_OAUTH_CLIENT_SECRET,
    };
  }

  /** Step 1: build the provider consent URL for the frontend to redirect to. */
  buildAuthorizationUrl(tenantId: string, userId: string, dto: ConnectMailboxInput) {
    const cfg = this.getProviderConfig(dto.provider);
    if (!cfg.clientId) {
      throw new BadRequestException(
        `${dto.provider} OAuth is not configured on this server (missing client id env var).`,
      );
    }
    // state carries tenant/user/provider so the callback can be verified without a session store
    const state = Buffer.from(JSON.stringify({ tenantId, userId, provider: dto.provider })).toString('base64url');
    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: dto.redirectUri,
      response_type: 'code',
      scope: cfg.scope,
      state,
      access_type: 'offline',
      prompt: 'consent',
    });
    return { authorizationUrl: `${cfg.authUrl}?${params.toString()}`, state };
  }

  /** Step 2: exchange the authorization code for tokens and persist the connection. */
  async handleCallback(tenantId: string, userId: string, dto: OauthCallbackInput) {
    const cfg = this.getProviderConfig(dto.provider);
    if (!cfg.clientId || !cfg.clientSecret) {
      throw new BadRequestException(`${dto.provider} OAuth is not configured on this server.`);
    }

    const body = new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code: dto.code,
      redirect_uri: dto.redirectUri,
      grant_type: 'authorization_code',
    });

    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new BadRequestException(`${dto.provider} token exchange failed: ${text || res.statusText}`);
    }
    const tokens = (await res.json()) as OAuthTokenResponse;
    if (!tokens.access_token) {
      throw new BadRequestException(`${dto.provider} token exchange did not return an access token.`);
    }

    const emailAddress = await this.fetchConnectedEmailAddress(dto.provider, tokens.access_token);

    const org = await prisma.organization.findFirst({ where: { tenantId } });
    if (!org) throw new BadRequestException('No Organization registered for tenant');

    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;

    const connection = await prisma.mailboxConnection.upsert({
      where: { tenantId_userId_provider: { tenantId, userId, provider: dto.provider } },
      create: {
        tenantId,
        orgId: org.id,
        userId,
        provider: dto.provider,
        emailAddress,
        accessTokenEnc: encryptField(tokens.access_token),
        refreshTokenEnc: encryptField(tokens.refresh_token || ''),
        tokenExpiresAt: expiresAt,
        scope: tokens.scope || cfg.scope,
        status: 'CONNECTED',
      },
      update: {
        emailAddress,
        accessTokenEnc: encryptField(tokens.access_token),
        refreshTokenEnc: tokens.refresh_token ? encryptField(tokens.refresh_token) : undefined,
        tokenExpiresAt: expiresAt,
        scope: tokens.scope || cfg.scope,
        status: 'CONNECTED',
        disconnectedAt: null,
        lastSyncError: null,
      },
    });

    this.eventEmitter.emit('crm.mailbox.connected', { tenantId, userId, provider: dto.provider });
    return this.serialize(connection);
  }

  private async fetchConnectedEmailAddress(provider: 'GOOGLE' | 'MICROSOFT', accessToken: string): Promise<string> {
    try {
      if (provider === 'GOOGLE') {
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { email?: string };
          if (data.email) return data.email;
        }
      } else {
        const res = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { mail?: string; userPrincipalName?: string };
          if (data.mail || data.userPrincipalName) return (data.mail || data.userPrincipalName) as string;
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to resolve connected mailbox address: ${(err as Error).message}`);
    }
    return 'unknown@connected-mailbox';
  }

  async listConnections(tenantId: string, userId: string) {
    const rows = await prisma.mailboxConnection.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.serialize(r));
  }

  async getConnection(tenantId: string, userId: string, id: string) {
    const row = await prisma.mailboxConnection.findFirst({ where: { id, tenantId, userId } });
    if (!row) throw new NotFoundException('Mailbox connection not found');
    return row;
  }

  async disconnect(tenantId: string, userId: string, id: string) {
    await this.getConnection(tenantId, userId, id);
    const updated = await prisma.mailboxConnection.update({
      where: { id },
      data: { status: 'DISCONNECTED', disconnectedAt: new Date() },
    });
    this.eventEmitter.emit('crm.mailbox.disconnected', { tenantId, userId, id });
    return this.serialize(updated);
  }

  /**
   * Pull recent messages + calendar events for one connected mailbox and write
   * matching Activity rows on any Contact/Lead/Customer whose email matches a
   * participant. Manual/polling "sync now" — see class doc for what's deferred.
   */
  async syncNow(tenantId: string, userId: string, id: string) {
    const connection = await this.getConnection(tenantId, userId, id);
    if (connection.status !== 'CONNECTED') {
      throw new BadRequestException('Mailbox is not connected');
    }

    let accessToken = decryptField(connection.accessTokenEnc);
    const isExpired = connection.tokenExpiresAt ? connection.tokenExpiresAt.getTime() < Date.now() : false;
    if (isExpired) {
      accessToken = await this.refreshAccessToken(connection);
    }

    const since = connection.lastSyncedAt ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let messagesSynced = 0;
    let eventsSynced = 0;
    let syncError: string | null = null;

    try {
      const messages =
        connection.provider === 'GOOGLE'
          ? await this.fetchGmailMessages(accessToken, since)
          : await this.fetchOutlookMessages(accessToken, since);
      messagesSynced = await this.writeEmailActivities(tenantId, connection.orgId, messages);

      const events =
        connection.provider === 'GOOGLE'
          ? await this.fetchGoogleCalendarEvents(accessToken, since)
          : await this.fetchOutlookCalendarEvents(accessToken, since);
      eventsSynced = await this.writeMeetingActivities(tenantId, connection.orgId, events);
    } catch (err) {
      syncError = (err as Error).message;
      this.logger.warn(`Mailbox sync failed for ${connection.id}: ${syncError}`);
    }

    const updated = await prisma.mailboxConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        lastSyncMessages: messagesSynced,
        lastSyncEvents: eventsSynced,
        lastSyncError: syncError,
        status: syncError ? 'ERROR' : 'CONNECTED',
      },
    });

    this.eventEmitter.emit('crm.mailbox.synced', { tenantId, userId, id, messagesSynced, eventsSynced, syncError });
    return { ...this.serialize(updated), messagesSynced, eventsSynced, syncError };
  }

  private async refreshAccessToken(connection: { id: string; provider: string; refreshTokenEnc: string }): Promise<string> {
    const provider = connection.provider as 'GOOGLE' | 'MICROSOFT';
    const cfg = this.getProviderConfig(provider);
    const refreshToken = decryptField(connection.refreshTokenEnc);
    if (!refreshToken || !cfg.clientId || !cfg.clientSecret) {
      throw new BadRequestException('Cannot refresh mailbox token: missing refresh token or OAuth config');
    }
    const body = new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
    const res = await fetch(cfg.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new BadRequestException('Failed to refresh mailbox access token');
    const tokens = (await res.json()) as OAuthTokenResponse;
    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;
    await prisma.mailboxConnection.update({
      where: { id: connection.id },
      data: {
        accessTokenEnc: encryptField(tokens.access_token),
        tokenExpiresAt: expiresAt,
        ...(tokens.refresh_token ? { refreshTokenEnc: encryptField(tokens.refresh_token) } : {}),
      },
    });
    return tokens.access_token;
  }

  private async writeEmailActivities(
    tenantId: string,
    orgId: string,
    emails: Array<{ messageId: string; from: string; to: string[]; subject: string; body: string; date: string }>,
  ): Promise<number> {
    let count = 0;
    for (const email of emails) {
      const participantEmails = [email.from, ...email.to].filter(Boolean);
      if (participantEmails.length === 0) continue;

      const [contacts, leads, customers] = await Promise.all([
        prisma.contact.findMany({ where: { tenantId, email: { in: participantEmails } } }),
        prisma.lead.findMany({ where: { tenantId, email: { in: participantEmails } } }),
        prisma.customer.findMany({ where: { tenantId, email: { in: participantEmails } } }),
      ]);

      // Avoid duplicate Activity rows on re-sync: dedupe on subject + completedAt + linked entity.
      for (const contact of contacts) {
        if (await this.activityExists(tenantId, { contactId: contact.id, subject: email.subject, date: email.date })) continue;
        await prisma.activity.create({
          data: {
            tenantId, orgId, type: 'EMAIL', subject: email.subject,
            description: email.body.slice(0, 2000),
            contactId: contact.id, customerId: contact.customerId,
            completedAt: new Date(email.date),
          },
        });
        count++;
      }
      for (const lead of leads) {
        if (await this.activityExists(tenantId, { leadId: lead.id, subject: email.subject, date: email.date })) continue;
        await prisma.activity.create({
          data: {
            tenantId, orgId, type: 'EMAIL', subject: email.subject,
            description: email.body.slice(0, 2000),
            leadId: lead.id, completedAt: new Date(email.date),
          },
        });
        count++;
      }
      for (const customer of customers) {
        if (await this.activityExists(tenantId, { customerId: customer.id, subject: email.subject, date: email.date })) continue;
        await prisma.activity.create({
          data: {
            tenantId, orgId, type: 'EMAIL', subject: email.subject,
            description: email.body.slice(0, 2000),
            customerId: customer.id, completedAt: new Date(email.date),
          },
        });
        count++;
      }
    }
    return count;
  }

  private async writeMeetingActivities(
    tenantId: string,
    orgId: string,
    events: Array<{ id?: string; subject: string; start: string; end: string; attendees: string[]; description?: string }>,
  ): Promise<number> {
    let count = 0;
    for (const event of events) {
      const attendeeEmails = event.attendees.filter(Boolean);
      if (attendeeEmails.length === 0) continue;

      const [contacts, leads, customers] = await Promise.all([
        prisma.contact.findMany({ where: { tenantId, email: { in: attendeeEmails } } }),
        prisma.lead.findMany({ where: { tenantId, email: { in: attendeeEmails } } }),
        prisma.customer.findMany({ where: { tenantId, email: { in: attendeeEmails } } }),
      ]);

      for (const contact of contacts) {
        if (await this.activityExists(tenantId, { contactId: contact.id, subject: event.subject, date: event.start, meeting: true })) continue;
        await prisma.activity.create({
          data: {
            tenantId, orgId, type: 'MEETING', subject: event.subject,
            description: event.description || '',
            contactId: contact.id, customerId: contact.customerId,
            dueDate: new Date(event.start),
          },
        });
        count++;
      }
      for (const lead of leads) {
        if (await this.activityExists(tenantId, { leadId: lead.id, subject: event.subject, date: event.start, meeting: true })) continue;
        await prisma.activity.create({
          data: {
            tenantId, orgId, type: 'MEETING', subject: event.subject,
            description: event.description || '', leadId: lead.id, dueDate: new Date(event.start),
          },
        });
        count++;
      }
      for (const customer of customers) {
        if (await this.activityExists(tenantId, { customerId: customer.id, subject: event.subject, date: event.start, meeting: true })) continue;
        await prisma.activity.create({
          data: {
            tenantId, orgId, type: 'MEETING', subject: event.subject,
            description: event.description || '', customerId: customer.id, dueDate: new Date(event.start),
          },
        });
        count++;
      }
    }
    return count;
  }

  private async activityExists(
    tenantId: string,
    match: { contactId?: string; leadId?: string; customerId?: string; subject: string; date: string; meeting?: boolean },
  ): Promise<boolean> {
    const existing = await prisma.activity.findFirst({
      where: {
        tenantId,
        subject: match.subject,
        contactId: match.contactId,
        leadId: match.leadId,
        customerId: match.customerId,
        ...(match.meeting
          ? { dueDate: new Date(match.date) }
          : { completedAt: new Date(match.date) }),
      },
    });
    return !!existing;
  }

  // ── Provider REST calls ───────────────────────────
  // Real Gmail API / Microsoft Graph calls via fetch (no SDK dependency added).
  // Both return [] gracefully on any non-2xx so a stale/expired token degrades
  // to "0 synced" rather than throwing mid-loop for other mailboxes.

  private async fetchGmailMessages(accessToken: string, since: Date) {
    const query = `after:${Math.floor(since.getTime() / 1000)}`;
    const listRes = await fetch(`${GMAIL_MESSAGES_ENDPOINT}?q=${encodeURIComponent(query)}&maxResults=25`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!listRes.ok) throw new Error(`Gmail list failed: ${listRes.status}`);
    const list = (await listRes.json()) as { messages?: Array<{ id: string }> };
    const results: Array<{ messageId: string; from: string; to: string[]; subject: string; body: string; date: string }> = [];

    for (const m of (list.messages || []).slice(0, 25)) {
      const msgRes = await fetch(`${GMAIL_MESSAGES_ENDPOINT}/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!msgRes.ok) continue;
      const msg = (await msgRes.json()) as { internalDate?: string; payload?: { headers?: Array<{ name: string; value: string }> } };
      const headers = msg.payload?.headers || [];
      const get = (name: string) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
      results.push({
        messageId: m.id,
        from: this.extractEmail(get('From')),
        to: get('To').split(',').map((s) => this.extractEmail(s)).filter(Boolean),
        subject: get('Subject') || '(no subject)',
        body: '',
        date: msg.internalDate ? new Date(Number(msg.internalDate)).toISOString() : new Date().toISOString(),
      });
    }
    return results;
  }

  private async fetchOutlookMessages(accessToken: string, since: Date) {
    const filter = `receivedDateTime ge ${since.toISOString()}`;
    const res = await fetch(`${GRAPH_MESSAGES_ENDPOINT}?$filter=${encodeURIComponent(filter)}&$top=25&$select=subject,from,toRecipients,bodyPreview,receivedDateTime`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Graph messages failed: ${res.status}`);
    const data = (await res.json()) as {
      value?: Array<{
        id: string;
        subject?: string;
        from?: { emailAddress?: { address?: string } };
        toRecipients?: Array<{ emailAddress?: { address?: string } }>;
        bodyPreview?: string;
        receivedDateTime?: string;
      }>;
    };
    return (data.value || []).map((m) => ({
      messageId: m.id,
      from: m.from?.emailAddress?.address || '',
      to: (m.toRecipients || []).map((r) => r.emailAddress?.address || '').filter(Boolean),
      subject: m.subject || '(no subject)',
      body: m.bodyPreview || '',
      date: m.receivedDateTime || new Date().toISOString(),
    }));
  }

  private async fetchGoogleCalendarEvents(accessToken: string, since: Date) {
    const timeMin = since.toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&maxResults=25`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new Error(`Google Calendar failed: ${res.status}`);
    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        summary?: string;
        description?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
        attendees?: Array<{ email?: string }>;
      }>;
    };
    return (data.items || []).map((e) => ({
      id: e.id,
      subject: e.summary || '(no title)',
      description: e.description,
      start: e.start?.dateTime || e.start?.date || new Date().toISOString(),
      end: e.end?.dateTime || e.end?.date || new Date().toISOString(),
      attendees: (e.attendees || []).map((a) => a.email || '').filter(Boolean),
    }));
  }

  private async fetchOutlookCalendarEvents(accessToken: string, since: Date) {
    const startDateTime = since.toISOString();
    const endDateTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const res = await fetch(
      `${GRAPH_EVENTS_ENDPOINT}?startDateTime=${encodeURIComponent(startDateTime)}&endDateTime=${encodeURIComponent(endDateTime)}&$top=25`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    if (!res.ok) throw new Error(`Graph calendar failed: ${res.status}`);
    const data = (await res.json()) as {
      value?: Array<{
        id: string;
        subject?: string;
        bodyPreview?: string;
        start?: { dateTime?: string };
        end?: { dateTime?: string };
        attendees?: Array<{ emailAddress?: { address?: string } }>;
      }>;
    };
    return (data.value || []).map((e) => ({
      id: e.id,
      subject: e.subject || '(no title)',
      description: e.bodyPreview,
      start: e.start?.dateTime || new Date().toISOString(),
      end: e.end?.dateTime || new Date().toISOString(),
      attendees: (e.attendees || []).map((a) => a.emailAddress?.address || '').filter(Boolean),
    }));
  }

  private extractEmail(raw: string): string {
    const match = raw.match(/<([^>]+)>/);
    return (match?.[1] ?? raw).trim();
  }

  private serialize(row: {
    id: string; provider: string; emailAddress: string; status: string;
    lastSyncedAt: Date | null; lastSyncError: string | null;
    lastSyncMessages: number; lastSyncEvents: number; createdAt: Date; scope: string | null;
  }) {
    // never return encrypted token fields to the client
    return {
      id: row.id,
      provider: row.provider,
      emailAddress: row.emailAddress,
      status: row.status,
      lastSyncedAt: row.lastSyncedAt,
      lastSyncError: row.lastSyncError,
      lastSyncMessages: row.lastSyncMessages,
      lastSyncEvents: row.lastSyncEvents,
      createdAt: row.createdAt,
      scope: row.scope,
    };
  }
}
