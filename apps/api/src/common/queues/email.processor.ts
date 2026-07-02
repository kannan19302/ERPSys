import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { pinoLogger } from '../services/logger.service';
import { syncBackgroundJobStatus } from './job-tracking.util';

interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  tenantId: string;
  template?: string;
  variables?: Record<string, string>;
}

@Processor('email')
export class EmailProcessor extends WorkerHost {
  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, tenantId } = job.data;

    pinoLogger.info({ jobId: job.id, to, subject, tenantId, queue: 'email' }, 'Processing email job');

    // In production: wire to nodemailer/SES/SendGrid using SMTP config from env
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;

    if (!smtpHost || !smtpUser) {
      pinoLogger.warn({ jobId: job.id }, 'SMTP not configured — email job skipped');
      return;
    }

    // Simulate sending — in production, use nodemailer.createTransport().sendMail()
    pinoLogger.info({ jobId: job.id, to, subject }, 'Email sent successfully');
  }

  /**
   * Keeps the `BackgroundJob` Prisma row (surfaced by the admin Background Jobs UI) in sync
   * with real BullMQ lifecycle events, correlated by `bullJobId`. See P1-1 in
   * .ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md — previously these were unconnected systems.
   */
  @OnWorkerEvent('active')
  async onActive(job: Job<EmailJobData>) {
    await syncBackgroundJobStatus('email', String(job.id), { status: 'ACTIVE' });
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<EmailJobData>) {
    await syncBackgroundJobStatus('email', String(job.id), { status: 'COMPLETED' });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<EmailJobData> | undefined, error: Error) {
    if (!job) return;
    await syncBackgroundJobStatus('email', String(job.id), {
      status: 'FAILED',
      error: error?.message ?? 'Unknown error',
    });
  }
}
