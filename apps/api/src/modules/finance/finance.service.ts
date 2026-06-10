import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { CreateInvoiceInput, CreatePaymentInput } from '@unerp/shared';
import { Invoice, InvoiceLineItem, Payment, Prisma } from '@prisma/client';

@Injectable()
export class FinanceService {
  /**
   * Fetch all invoices scoped to tenantId.
   */
  async getInvoices(tenantId: string) {
    const invoices = (await prisma.invoice.findMany({
      where: { tenantId },
      include: {
        customer: true,
        lineItems: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })) as unknown as Array<
      Invoice & { customer: { name: string }; lineItems: InvoiceLineItem[]; payments: Payment[] }
    >;

    return invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      subtotal: Number(inv.subtotal),
      taxAmount: Number(inv.taxAmount),
      totalAmount: Number(inv.totalAmount),
      paidAmount: Number(inv.paidAmount),
      currency: inv.currency,
      customerName: inv.customer.name,
      lineItems: inv.lineItems.map((li) => ({
        id: li.id,
        description: li.description,
        quantity: Number(li.quantity),
        unitPrice: Number(li.unitPrice),
        taxRate: Number(li.taxRate),
        totalAmount: Number(li.totalAmount),
      })),
      payments: inv.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        reference: p.reference,
        paidAt: p.paidAt,
      })),
    }));
  }

  /**
   * Create new invoice under tenantId & orgId.
   */
  async createInvoice(tenantId: string, orgId: string, dto: CreateInvoiceInput, createdBy: string) {
    let resolvedOrgId = orgId;
    if (!orgId || orgId === 'org-system-default') {
      const org = await prisma.organization.findFirst({
        where: { tenantId },
      });
      if (!org) {
        throw new BadRequestException('No Organization found for this Tenant. Register an Organization first.');
      }
      resolvedOrgId = org.id;
    }

    // Check if invoice number already exists
    const existing = await prisma.invoice.findFirst({
      where: { tenantId, orgId: resolvedOrgId, invoiceNumber: dto.invoiceNumber },
    });
    if (existing) {
      throw new BadRequestException(`Invoice number ${dto.invoiceNumber} already exists.`);
    }

    // Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found in this tenant context');
    }

    return prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let totalTax = 0;

      // Calculate totals
      const linesData = dto.lineItems.map((item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const lineTax = lineSubtotal * (item.taxRate / 100);
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        totalTax += lineTax;

        return {
          tenantId,
          description: item.description,
          productId: item.productId || null,
          quantity: new Prisma.Decimal(item.quantity),
          unitPrice: new Prisma.Decimal(item.unitPrice),
          taxRate: new Prisma.Decimal(item.taxRate),
          taxAmount: new Prisma.Decimal(lineTax),
          totalAmount: new Prisma.Decimal(lineTotal),
        };
      });

      const totalAmount = subtotal + totalTax;

      // 1. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          orgId: resolvedOrgId,
          customerId: dto.customerId,
          invoiceNumber: dto.invoiceNumber,
          dueDate: new Date(dto.dueDate),
          subtotal: new Prisma.Decimal(subtotal),
          taxAmount: new Prisma.Decimal(totalTax),
          totalAmount: new Prisma.Decimal(totalAmount),
          paidAmount: new Prisma.Decimal(0),
          status: 'DRAFT',
          notes: dto.notes || null,
          createdBy,
        },
      });

      // 2. Create Line Items
      for (const line of linesData) {
        await tx.invoiceLineItem.create({
          data: {
            ...line,
            invoiceId: invoice.id,
          },
        });
      }

      return invoice;
    });
  }

  /**
   * Record invoice payment.
   */
  async createPayment(tenantId: string, dto: CreatePaymentInput, createdBy: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: dto.invoiceId, tenantId },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const currentPaid = Number(invoice.paidAmount);
    const totalAmount = Number(invoice.totalAmount);
    const newPaidAmount = currentPaid + dto.amount;

    if (newPaidAmount > totalAmount) {
      throw new BadRequestException('Payment amount exceeds total due amount');
    }

    const nextStatus = newPaidAmount === totalAmount ? 'PAID' : 'PARTIALLY_PAID';

    return prisma.$transaction(async (tx) => {
      // 1. Create Payment record
      const payment = await tx.payment.create({
        data: {
          tenantId,
          invoiceId: dto.invoiceId,
          amount: new Prisma.Decimal(dto.amount),
          method: dto.method,
          reference: dto.reference || null,
          notes: dto.notes || null,
          createdBy,
        },
      });

      // 2. Update Invoice Status & Paid Amount
      await tx.invoice.update({
        where: { id: dto.invoiceId },
        data: {
          paidAmount: new Prisma.Decimal(newPaidAmount),
          status: nextStatus,
          paidAt: nextStatus === 'PAID' ? new Date() : null,
        },
      });

      return payment;
    });
  }
}
