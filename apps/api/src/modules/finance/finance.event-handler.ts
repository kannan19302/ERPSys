import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { prisma } from '@unerp/database';
import { FinanceService } from './finance.service';

@Injectable()
export class FinanceEventHandler {
  private readonly logger = new Logger(FinanceEventHandler.name);

  constructor(private readonly financeService: FinanceService) {}

  @OnEvent('sales.delivery.created')
  async handleSalesDeliveryCreated(event: {
    tenantId: string;
    salesOrderId: string;
    deliveryNumber: string;
    lineItems: Array<{
      productId: string | null;
      description: string;
      deliveredQty: number;
    }>;
  }) {
    this.logger.log(`Handling sales.delivery.created event for auto-invoicing: ${event.deliveryNumber}`);

    try {
      // Fetch Sales Order to get customer ID and pricing details
      const salesOrder = await prisma.salesOrder.findFirst({
        where: { id: event.salesOrderId, tenantId: event.tenantId },
        include: {
          lineItems: true,
        },
      });

      if (!salesOrder) {
        this.logger.error(`Sales order ${event.salesOrderId} not found. Cannot auto-create invoice.`);
        return;
      }

      // Prepare invoice line items using the delivered quantities and pricing from sales order
      const invoiceLineItems = event.lineItems.map((deliveredItem) => {
        // Find matching pricing from sales order line items
        const orderLine = salesOrder.lineItems.find(
          (li) => li.productId === deliveredItem.productId
        );
        const unitPrice = orderLine ? Number(orderLine.unitPrice) : 0;
        const taxRate = orderLine ? Number(orderLine.taxRate) : 0;

        return {
          productId: deliveredItem.productId || undefined,
          description: deliveredItem.description,
          quantity: deliveredItem.deliveredQty,
          unitPrice,
          taxRate,
        };
      });

      // Auto-generate invoice number
      const invoiceNumber = `INV-AUTO-${event.deliveryNumber}`;

      // Set due date to 30 days from now
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      // Create the invoice via FinanceService
      const invoice = await this.financeService.createInvoice(
        event.tenantId,
        salesOrder.orgId,
        {
          customerId: salesOrder.customerId,
          invoiceNumber,
          dueDate: dueDate.toISOString(),
          notes: `Auto-generated from delivery note: ${event.deliveryNumber}`,
          lineItems: invoiceLineItems,
        },
        'system'
      );

      // Link invoice ID to Sales Order
      await prisma.salesOrder.update({
        where: { id: salesOrder.id },
        data: { invoiceId: invoice.id },
      });

      this.logger.log(`Successfully auto-created invoice ${invoice.invoiceNumber} for sales order ${salesOrder.id}`);
    } catch (err) {
      this.logger.error(`Failed to auto-create invoice for delivery ${event.deliveryNumber}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
