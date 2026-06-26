import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { pinoLogger } from '../services/logger.service';

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
}
