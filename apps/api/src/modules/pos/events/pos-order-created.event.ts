export class PosOrderCreatedEvent {
    constructor(
        public readonly orderId: string,
        public readonly tenantId: string,
        public readonly orgId: string,
        public readonly orderNumber: string,
        public readonly terminalId: string,
        public readonly cashierId: string,
        public readonly customerId: string | null,
        public readonly grandTotal: number,
        public readonly items: Array<{
            productId: string | null;
            productName: string;
            sku: string;
            qty: number;
            unitPrice: number;
            lineTotal: number;
        }>,
    ) { }
}