export class PosOrderVoidedEvent {
    constructor(
        public readonly orderId: string,
        public readonly tenantId: string,
        public readonly orgId: string,
        public readonly orderNumber: string,
        public readonly reason: string,
        public readonly voidedBy: string,
    ) { }
}