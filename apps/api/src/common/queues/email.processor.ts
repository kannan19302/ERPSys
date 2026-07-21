import { Processor, WorkerHost, OnWorkerEvent } from "@nestjs/bullmq";
import { Job } from "bullmq";
import nodemailer, { type Transporter } from "nodemailer";
import { pinoLogger } from "../services/logger.service";
import { syncBackgroundJobStatus } from "./job-tracking.util";

interface EmailJobData {
  to: string;
  subject: string;
  body: string;
  tenantId: string;
  template?: string;
  variables?: Record<string, string>;
}

@Processor("email")
export class EmailProcessor extends WorkerHost {
  // Built lazily (and reused across jobs) so a missing/changed SMTP config is
  // picked up without restarting the worker, and so unit tests never pay for
  // a real connection unless SMTP_HOST/SMTP_USER are actually set.
  private transporter: Transporter | null | undefined;

  private getTransporter(): Transporter | null {
    if (this.transporter !== undefined) return this.transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    if (!host || !user || !pass) {
      this.transporter = null;
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });
    return this.transporter;
  }

  async process(job: Job<EmailJobData>): Promise<void> {
    const { to, subject, body, tenantId } = job.data;

    pinoLogger.info(
      { jobId: job.id, to, subject, tenantId, queue: "email" },
      "Processing email job",
    );

    const transporter = this.getTransporter();
    if (!transporter) {
      pinoLogger.warn(
        { jobId: job.id },
        "SMTP not configured — email job skipped",
      );
      return;
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: body,
    });

    pinoLogger.info({ jobId: job.id, to, subject }, "Email sent successfully");
  }

  /**
   * Keeps the `BackgroundJob` Prisma row (surfaced by the admin Background Jobs UI) in sync
   * with real BullMQ lifecycle events, correlated by `bullJobId`. See P1-1 in
   * .ai/ADMIN_MODULE_COMPLETION_REQUIREMENTS.md — previously these were unconnected systems.
   */
  @OnWorkerEvent("active")
  async onActive(job: Job<EmailJobData>) {
    await syncBackgroundJobStatus("email", String(job.id), {
      status: "ACTIVE",
    });
  }

  @OnWorkerEvent("completed")
  async onCompleted(job: Job<EmailJobData>) {
    await syncBackgroundJobStatus("email", String(job.id), {
      status: "COMPLETED",
    });
  }

  @OnWorkerEvent("failed")
  async onFailed(job: Job<EmailJobData> | undefined, error: Error) {
    if (!job) return;
    await syncBackgroundJobStatus("email", String(job.id), {
      status: "FAILED",
      error: error?.message ?? "Unknown error",
    });
  }
}
