import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { hashPassword, comparePassword, signToken } from '@unerp/auth';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { CrmPortalPaymentGatewayService } from './crm-portal-payment-gateway.service';

export const inviteCustomerPortalUserSchema = z.object({
  email: z.string().email(),
  contactId: z.string().optional().nullable(),
});
export type InviteCustomerPortalUserInput = z.infer<typeof inviteCustomerPortalUserSchema>;

export const portalLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type PortalLoginInput = z.infer<typeof portalLoginSchema>;

export const portalCreateCaseSchema = z.object({
  subject: z.string().min(1),
  description: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
});
export type PortalCreateCaseInput = z.infer<typeof portalCreateCaseSchema>;

export const portalCaseCommentSchema = z.object({
  body: z.string().min(1),
});
export type PortalCaseCommentInput = z.infer<typeof portalCaseCommentSchema>;

export const portalQuotationDecisionSchema = z.object({
  reason: z.string().optional().nullable(),
});
export type PortalQuotationDecisionInput = z.infer<typeof portalQuotationDecisionSchema>;

export const portalInitiatePaymentSchema = z.object({
  amount: z.number().positive(),
});
export type PortalInitiatePaymentInput = z.infer<typeof portalInitiatePaymentSchema>;

export const portalConfirmPaymentSchema = z.object({
  simulateDecline: z.boolean().optional().default(false),
});
export type PortalConfirmPaymentInput = z.infer<typeof portalConfirmPaymentSchema>;

/**
 * CRM customer self-service portal: lets a customer's own staff log in
 * (separately from tenant staff — no Role/Permission records, no RbacGuard)
 * and view/act on only their own quotations, sales orders, invoices, and
 * support cases. Tenant admins invite/manage the portal accounts; login
 * issues a scoped JWT (`{ tenantId, userId, customerId, portal: true }`)
 * consumed by `CustomerPortalAuthGuard` — every portal query is filtered by
 * that customerId, never just tenantId.
 *
 * Mirrors the `VendorPortalService` pattern in `procurement/`, but goes
 * further: the portal-facing controller is guarded by a real portal-JWT
 * guard (not RbacGuard), so logged-in customers can genuinely self-serve
 * rather than only tenant admins viewing a "portal" endpoint on their behalf.
 */
@Injectable()
export class CustomerPortalService {
  constructor(private readonly paymentGateway: CrmPortalPaymentGatewayService) {}

  // ── ADMIN: manage portal accounts ──────────────────────────────────────

  async inviteUser(tenantId: string, customerId: string, dto: InviteCustomerPortalUserInput) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const existing = await prisma.customerPortalUser.findFirst({ where: { tenantId, email: dto.email } });
    if (existing) throw new BadRequestException('A portal user with this email already exists for this tenant');

    if (dto.contactId) {
      const contact = await prisma.contact.findFirst({ where: { id: dto.contactId, tenantId, customerId } });
      if (!contact) throw new BadRequestException('Contact does not belong to this customer');
    }

    // Dev/demo-friendly invite flow: generate a temporary password and return
    // it directly instead of sending an email (no email-delivery integration
    // wired into this module). A production rollout would email an invite link.
    const tempPassword = randomBytes(9).toString('base64url');
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.customerPortalUser.create({
      data: { tenantId, customerId, contactId: dto.contactId ?? null, email: dto.email, passwordHash, status: 'INVITED' },
    });

    return { id: user.id, email: user.email, status: user.status, tempPassword };
  }

  async listUsers(tenantId: string, customerId: string) {
    return prisma.customerPortalUser.findMany({
      where: { tenantId, customerId },
      select: { id: true, email: true, status: true, contactId: true, lastLoginAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async disableUser(tenantId: string, userId: string) {
    const existing = await prisma.customerPortalUser.findFirst({ where: { id: userId, tenantId } });
    if (!existing) throw new NotFoundException('Portal user not found');
    return prisma.customerPortalUser.update({ where: { id: userId }, data: { status: 'DISABLED' } });
  }

  async reactivateUser(tenantId: string, userId: string) {
    const existing = await prisma.customerPortalUser.findFirst({ where: { id: userId, tenantId } });
    if (!existing) throw new NotFoundException('Portal user not found');
    return prisma.customerPortalUser.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
  }

  // ── PORTAL: authentication ──────────────────────────────────────────────

  /**
   * Portal login. Email is only unique per-tenant (`@@unique([tenantId, email])`),
   * not globally, so every matching row across tenants is checked and the
   * password verified against each — the same pattern any global-email login
   * needs when there's no tenant-identifying subdomain/slug at login time.
   */
  async login(dto: PortalLoginInput) {
    const candidates = await prisma.customerPortalUser.findMany({
      where: { email: dto.email, status: { not: 'DISABLED' } },
    });
    for (const candidate of candidates) {
      if (await comparePassword(dto.password, candidate.passwordHash)) {
        await prisma.customerPortalUser.update({
          where: { id: candidate.id },
          data: { status: 'ACTIVE', lastLoginAt: new Date() },
        });
        const token = signToken(
          {
            tenantId: candidate.tenantId,
            userId: candidate.id,
            customerId: candidate.customerId,
            portal: true,
            email: candidate.email,
          },
          '8h',
        );
        return { token, customerId: candidate.customerId };
      }
    }
    throw new UnauthorizedException('Invalid portal credentials');
  }

  // ── PORTAL: self-service data (strictly scoped to the caller's customerId) ──

  async getDashboardSummary(tenantId: string, customerId: string) {
    const [openCases, pendingQuotes, unpaidInvoices, recentOrders, customer] = await Promise.all([
      prisma.case.count({ where: { tenantId, customerId, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.quotation.count({ where: { tenantId, customerId, status: 'SENT', deletedAt: null } }),
      prisma.invoice.count({ where: { tenantId, customerId, status: { not: 'PAID' }, deletedAt: null } }),
      prisma.salesOrder.count({ where: { tenantId, customerId, deletedAt: null } }),
      prisma.customer.findFirst({ where: { id: customerId, tenantId }, select: { id: true, name: true, email: true } }),
    ]);
    return { customer, openCases, pendingQuotes, unpaidInvoices, recentOrders };
  }

  async getMyQuotations(tenantId: string, customerId: string) {
    return prisma.quotation.findMany({
      where: { tenantId, customerId, deletedAt: null },
      include: { lineItems: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  async getMyQuotationDetail(tenantId: string, customerId: string, id: string) {
    const q = await prisma.quotation.findFirst({
      where: { id, tenantId, customerId, deletedAt: null },
      include: { lineItems: true, signatures: true },
    });
    if (!q) throw new NotFoundException('Quotation not found');
    return q;
  }

  async acceptQuotation(tenantId: string, customerId: string, id: string) {
    const q = await prisma.quotation.findFirst({ where: { id, tenantId, customerId, deletedAt: null } });
    if (!q) throw new NotFoundException('Quotation not found');
    if (q.status !== 'SENT') throw new BadRequestException(`Cannot accept a quotation in status ${q.status}`);
    return prisma.quotation.update({ where: { id }, data: { status: 'ACCEPTED' } });
  }

  async rejectQuotation(tenantId: string, customerId: string, id: string, dto: PortalQuotationDecisionInput) {
    const q = await prisma.quotation.findFirst({ where: { id, tenantId, customerId, deletedAt: null } });
    if (!q) throw new NotFoundException('Quotation not found');
    if (q.status !== 'SENT') throw new BadRequestException(`Cannot reject a quotation in status ${q.status}`);
    const notes = dto.reason ? `${q.notes ?? ''}\n[Rejected by customer] ${dto.reason}`.trim() : q.notes;
    return prisma.quotation.update({ where: { id }, data: { status: 'REJECTED', notes } });
  }

  async getMyOrders(tenantId: string, customerId: string) {
    return prisma.salesOrder.findMany({
      where: { tenantId, customerId, deletedAt: null },
      include: { lineItems: true, deliveryNotes: true },
      orderBy: { orderDate: 'desc' },
    });
  }

  async getMyOrderDetail(tenantId: string, customerId: string, id: string) {
    const o = await prisma.salesOrder.findFirst({
      where: { id, tenantId, customerId, deletedAt: null },
      include: { lineItems: true, deliveryNotes: true, returns: true },
    });
    if (!o) throw new NotFoundException('Sales order not found');
    return o;
  }

  async getMyInvoices(tenantId: string, customerId: string) {
    return prisma.invoice.findMany({
      where: { tenantId, customerId, deletedAt: null },
      include: { lineItems: true, payments: true },
      orderBy: { issueDate: 'desc' },
    });
  }

  async getMyInvoiceDetail(tenantId: string, customerId: string, id: string) {
    const inv = await prisma.invoice.findFirst({
      where: { id, tenantId, customerId, deletedAt: null },
      include: { lineItems: true, payments: true, creditNotes: true },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    return inv;
  }

  async getMyCases(tenantId: string, customerId: string) {
    return prisma.case.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyCaseDetail(tenantId: string, customerId: string, id: string) {
    const c = await prisma.case.findFirst({ where: { id, tenantId, customerId } });
    if (!c) throw new NotFoundException('Case not found');
    const comments = await prisma.caseComment.findMany({
      where: { caseId: id, tenantId, isInternal: false },
      orderBy: { createdAt: 'asc' },
    });
    return { ...c, comments };
  }

  async createCase(tenantId: string, customerId: string, _portalUserId: string, dto: PortalCreateCaseInput) {
    const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId } });
    if (!customer) throw new NotFoundException('Customer not found');
    const count = await prisma.case.count({ where: { tenantId } });
    const caseNumber = `CASE-${String(count + 1).padStart(5, '0')}`;
    return prisma.case.create({
      data: {
        tenantId,
        orgId: (customer as { orgId: string }).orgId,
        caseNumber,
        subject: dto.subject,
        description: dto.description ?? null,
        customerId,
        priority: dto.priority,
        status: 'OPEN',
        channel: 'WEB',
      },
    });
  }

  async addCaseComment(tenantId: string, customerId: string, portalUserId: string, caseId: string, dto: PortalCaseCommentInput) {
    const c = await prisma.case.findFirst({ where: { id: caseId, tenantId, customerId } });
    if (!c) throw new NotFoundException('Case not found');
    return prisma.caseComment.create({
      data: {
        tenantId,
        caseId,
        authorId: portalUserId,
        authorType: 'PORTAL',
        body: dto.body,
        isInternal: false,
      },
    });
  }

  // ── PORTAL: online invoice payment collection (Up Next item 37) ─────────

  /** Initiate a payment intent for an open invoice via the mock gateway. */
  async initiateInvoicePayment(
    tenantId: string,
    customerId: string,
    portalUserId: string,
    invoiceId: string,
    dto: PortalInitiatePaymentInput,
  ) {
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId, customerId, deletedAt: null } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'PAID') throw new BadRequestException('This invoice is already paid');

    const outstanding = Number(invoice.totalAmount) - Number(invoice.paidAmount);
    if (outstanding <= 0) throw new BadRequestException('This invoice has no outstanding balance');
    if (dto.amount > outstanding + 0.01) {
      throw new BadRequestException(`Payment amount (${dto.amount}) exceeds outstanding balance (${outstanding})`);
    }

    const intent = await this.paymentGateway.createIntent(dto.amount, invoice.currency, { invoiceId, customerId });

    const record = await prisma.portalPaymentIntent.create({
      data: {
        tenantId,
        invoiceId,
        customerId,
        portalUserId,
        amount: dto.amount,
        currency: invoice.currency,
        provider: this.paymentGateway.provider,
        gatewayIntentId: intent.id,
        status: 'REQUIRES_CONFIRMATION',
      },
    });

    return { intentId: record.id, gatewayIntentId: intent.id, status: record.status, amount: dto.amount };
  }

  /** List payment intents the portal customer has initiated for their invoices. */
  async listMyPaymentIntents(tenantId: string, customerId: string) {
    return prisma.portalPaymentIntent.findMany({
      where: { tenantId, customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Confirm a previously-created payment intent. On success, creates a real
   * `Payment` row against the invoice and rolls the invoice's `paidAmount`/
   * `status` forward — same posting path a staff-recorded payment takes.
   */
  async confirmInvoicePayment(tenantId: string, customerId: string, intentId: string, dto: PortalConfirmPaymentInput) {
    const record = await prisma.portalPaymentIntent.findFirst({ where: { id: intentId, tenantId, customerId } });
    if (!record) throw new NotFoundException('Payment intent not found');
    if (record.status !== 'REQUIRES_CONFIRMATION') {
      throw new BadRequestException(`Payment intent is already ${record.status}`);
    }

    const result = await this.paymentGateway.confirmIntent(record.gatewayIntentId, dto.simulateDecline);

    if (result.status === 'failed') {
      await prisma.portalPaymentIntent.update({ where: { id: intentId }, data: { status: 'FAILED' } });
      throw new BadRequestException('Payment was declined by the gateway (mock)');
    }

    const invoice = await prisma.invoice.findFirst({ where: { id: record.invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');

    const payment = await prisma.payment.create({
      data: {
        tenantId,
        invoiceId: record.invoiceId,
        amount: record.amount,
        currency: record.currency,
        method: 'ONLINE_PORTAL',
        reference: record.gatewayIntentId,
        notes: 'Paid via customer portal (mock gateway)',
      },
    });

    const newPaidAmount = Number(invoice.paidAmount) + Number(record.amount);
    const newStatus = newPaidAmount >= Number(invoice.totalAmount) - 0.01 ? 'PAID' : invoice.status;
    await prisma.invoice.update({
      where: { id: record.invoiceId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? new Date() : invoice.paidAt,
      },
    });

    return prisma.portalPaymentIntent.update({
      where: { id: intentId },
      data: { status: 'SUCCEEDED', paymentId: payment.id, confirmedAt: new Date() },
    });
  }
}
