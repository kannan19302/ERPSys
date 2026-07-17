import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@unerp/database';
import { Response } from 'express';
import PDFDocument from 'pdfkit';

/**
 * Customer-portal document/PDF download (Up Next item 36) — the shipped
 * customer portal (item 15) previously returned structured JSON only for
 * quotations/invoices; leaders (Odoo, Zoho, Dynamics) let the customer
 * download an actual PDF. Uses `pdfkit` (already a dependency, see
 * `common/services/export.service.ts` for the tabular-export precedent) with
 * a document-style (not tabular) layout suited to a single quote/invoice.
 */
@Injectable()
export class CrmPortalDocumentsService {
  async streamQuotationPdf(res: Response, tenantId: string, customerId: string, quotationId: string) {
    const q = await prisma.quotation.findFirst({
      where: { id: quotationId, tenantId, customerId, deletedAt: null },
      include: { lineItems: true, customer: { select: { name: true, email: true } } },
    });
    if (!q) throw new NotFoundException('Quotation not found');

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quotation-${q.quotationNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('QUOTATION', { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(`# ${q.quotationNumber}`, { align: 'right' });
    doc.moveDown(1);
    doc.fontSize(11).text(`Bill To: ${q.customer?.name ?? ''}`);
    if (q.customer?.email) doc.text(q.customer.email);
    doc.text(`Issue Date: ${q.issueDate.toDateString()}`);
    if (q.validUntil) doc.text(`Valid Until: ${q.validUntil.toDateString()}`);
    doc.text(`Status: ${q.status}`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold');
    const colX = { desc: 50, qty: 300, price: 370, total: 460 };
    const headerY = doc.y;
    doc.text('Description', colX.desc, headerY);
    doc.text('Qty', colX.qty, headerY);
    doc.text('Unit Price', colX.price, headerY);
    doc.text('Total', colX.total, headerY);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica');

    for (const item of q.lineItems) {
      const rowY = doc.y;
      doc.text(item.description, colX.desc, rowY, { width: 240 });
      doc.text(String(item.quantity), colX.qty, rowY);
      doc.text(Number(item.unitPrice).toFixed(2), colX.price, rowY);
      doc.text(Number(item.totalAmount).toFixed(2), colX.total, rowY);
      doc.moveDown(0.5);
    }

    doc.moveDown(1);
    doc.moveTo(350, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.text(`Subtotal: ${Number(q.subtotal).toFixed(2)} ${q.currency}`, 350, doc.y, { align: 'right' });
    doc.text(`Tax: ${Number(q.taxAmount).toFixed(2)} ${q.currency}`, 350, doc.y, { align: 'right' });
    doc.text(`Discount: ${Number(q.discountAmount).toFixed(2)} ${q.currency}`, 350, doc.y, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Total: ${Number(q.totalAmount).toFixed(2)} ${q.currency}`, 350, doc.y, { align: 'right' });

    if (q.notes) {
      doc.moveDown(1.5);
      doc.font('Helvetica').fontSize(9).text(`Notes: ${q.notes}`, 50);
    }

    doc.end();
  }

  async streamInvoicePdf(res: Response, tenantId: string, customerId: string, invoiceId: string) {
    const inv = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, customerId, deletedAt: null },
      include: { lineItems: true, payments: true, customer: { select: { name: true, email: true } } },
    });
    if (!inv) throw new NotFoundException('Invoice not found');

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${inv.invoiceNumber}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('INVOICE', { align: 'right' });
    doc.fontSize(10).font('Helvetica').text(`# ${inv.invoiceNumber}`, { align: 'right' });
    doc.moveDown(1);
    doc.fontSize(11).text(`Bill To: ${inv.customer?.name ?? ''}`);
    if (inv.customer?.email) doc.text(inv.customer.email);
    doc.text(`Issue Date: ${inv.issueDate.toDateString()}`);
    doc.text(`Due Date: ${inv.dueDate.toDateString()}`);
    doc.text(`Status: ${inv.status}`);
    doc.moveDown(1);

    doc.font('Helvetica-Bold');
    const colX = { desc: 50, qty: 300, price: 370, total: 460 };
    const headerY = doc.y;
    doc.text('Description', colX.desc, headerY);
    doc.text('Qty', colX.qty, headerY);
    doc.text('Unit Price', colX.price, headerY);
    doc.text('Total', colX.total, headerY);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.font('Helvetica');

    for (const item of inv.lineItems) {
      const rowY = doc.y;
      doc.text(item.description, colX.desc, rowY, { width: 240 });
      doc.text(String(item.quantity), colX.qty, rowY);
      doc.text(Number(item.unitPrice).toFixed(2), colX.price, rowY);
      doc.text(Number(item.totalAmount).toFixed(2), colX.total, rowY);
      doc.moveDown(0.5);
    }

    doc.moveDown(1);
    doc.moveTo(350, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.text(`Subtotal: ${Number(inv.subtotal).toFixed(2)} ${inv.currency}`, 350, doc.y, { align: 'right' });
    doc.text(`Tax: ${Number(inv.taxAmount).toFixed(2)} ${inv.currency}`, 350, doc.y, { align: 'right' });
    doc.font('Helvetica-Bold').text(`Total: ${Number(inv.totalAmount).toFixed(2)} ${inv.currency}`, 350, doc.y, { align: 'right' });
    doc.font('Helvetica').text(`Paid: ${Number(inv.paidAmount).toFixed(2)} ${inv.currency}`, 350, doc.y, { align: 'right' });
    doc.font('Helvetica-Bold').text(
      `Balance Due: ${(Number(inv.totalAmount) - Number(inv.paidAmount)).toFixed(2)} ${inv.currency}`,
      350, doc.y, { align: 'right' },
    );

    doc.end();
  }
}
