import { Injectable } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface CalendarEvent {
  id?: string;
  subject: string;
  start: string;
  end: string;
  attendees: string[];
  location?: string;
  description?: string;
}

interface EmailSyncResult {
  synced: number;
  errors: number;
  lastSyncAt: string;
}

@Injectable()
export class CrmIntegrationsService {
  constructor(private eventEmitter: EventEmitter2) {}

  async syncEmails(
    tenantId: string,
    _userId: string,
    provider: 'GOOGLE' | 'MICROSOFT',
    accessToken: string,
    sinceDate?: string,
  ): Promise<EmailSyncResult> {
    const since = sinceDate ? new Date(sinceDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const emails = provider === 'GOOGLE'
      ? await this.fetchGmailMessages(accessToken, since)
      : await this.fetchOutlookMessages(accessToken, since);

    let synced = 0;
    let errors = 0;

    for (const email of emails) {
      try {
        const contactEmails = [email.from, ...email.to];
        const contacts = await prisma.contact.findMany({
          where: { tenantId, email: { in: contactEmails } },
        });

        for (const contact of contacts) {
          await prisma.activity.create({
            data: {
              tenantId,
              orgId: contact.orgId,
              type: 'EMAIL',
              subject: email.subject,
              description: email.body.substring(0, 2000),
              contactId: contact.id,
              customerId: contact.customerId,
              completedAt: new Date(email.date),
            },
          });
          synced++;
        }
      } catch {
        errors++;
      }
    }

    this.eventEmitter.emit('crm.email.synced', { tenantId, synced, errors });
    return { synced, errors, lastSyncAt: new Date().toISOString() };
  }

  async syncCalendarEvents(
    tenantId: string,
    _userId: string,
    provider: 'GOOGLE' | 'MICROSOFT',
    accessToken: string,
    sinceDate?: string,
  ) {
    const since = sinceDate ? new Date(sinceDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = provider === 'GOOGLE'
      ? await this.fetchGoogleCalendarEvents(accessToken, since)
      : await this.fetchOutlookCalendarEvents(accessToken, since);

    let synced = 0;

    for (const event of events) {
      const contacts = await prisma.contact.findMany({
        where: { tenantId, email: { in: event.attendees || [] } },
      });

      for (const contact of contacts) {
        await prisma.activity.create({
          data: {
            tenantId,
            orgId: contact.orgId,
            type: 'MEETING',
            subject: event.subject,
            description: event.description || '',
            contactId: contact.id,
            customerId: contact.customerId,
            dueDate: new Date(event.start),
          },
        });
        synced++;
      }
    }

    return { synced, provider, lastSyncAt: new Date().toISOString() };
  }

  async bulkRecalculateScores(tenantId: string) {
    const leads = await prisma.lead.findMany({
      where: { tenantId, deletedAt: null, status: { notIn: ['CONVERTED', 'LOST', 'DISQUALIFIED'] } },
      include: { activities: true },
    });

    let updated = 0;
    for (const lead of leads) {
      const score = this.calculateLeadScore(lead);
      await prisma.lead.update({ where: { id: lead.id }, data: { score } });
      updated++;
    }

    return { leadsScored: updated };
  }

  private calculateLeadScore(lead: any): number {
    let score = 0;
    if (lead.email) score += 15;
    if (lead.phone || lead.mobile) score += 10;
    if (lead.company) score += 10;
    if (lead.website) score += 5;
    if (lead.industry) score += 5;
    if (lead.jobTitle) score += 5;

    if (lead.annualRevenue) {
      const rev = Number(lead.annualRevenue);
      if (rev > 10_000_000) score += 30;
      else if (rev > 1_000_000) score += 25;
      else if (rev > 100_000) score += 15;
      else score += 5;
    }

    if (lead.employeeCount) {
      if (lead.employeeCount > 500) score += 20;
      else if (lead.employeeCount > 100) score += 15;
      else if (lead.employeeCount > 10) score += 10;
    }

    const activities = lead.activities || [];
    const completedActivities = activities.filter((a: any) => a.completedAt);
    score += Math.min(30, completedActivities.length * 10);

    if (activities.length > 0) {
      const latestActivity = new Date(Math.max(...activities.map((a: any) => new Date(a.createdAt).getTime())));
      const daysSinceActivity = (Date.now() - latestActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity < 7) score += 15;
      else if (daysSinceActivity < 30) score += 10;
      else if (daysSinceActivity > 90) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  // Provider stubs — structured for OAuth integration
  private async fetchGmailMessages(_accessToken: string, _since: Date) {
    return [] as Array<{ messageId: string; from: string; to: string[]; subject: string; body: string; date: string }>;
  }
  private async fetchOutlookMessages(_accessToken: string, _since: Date) {
    return [] as Array<{ messageId: string; from: string; to: string[]; subject: string; body: string; date: string }>;
  }
  private async fetchGoogleCalendarEvents(_accessToken: string, _since: Date) {
    return [] as CalendarEvent[];
  }
  private async fetchOutlookCalendarEvents(_accessToken: string, _since: Date) {
    return [] as CalendarEvent[];
  }
}
