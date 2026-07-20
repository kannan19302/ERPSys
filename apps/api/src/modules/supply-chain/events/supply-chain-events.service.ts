import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class SupplyChainEventsService {
  @OnEvent('asn.received')
  handleAsnReceived() {
    // Notification dispatch placeholder
  }

  @OnEvent('shipment.delivered')
  handleShipmentDelivered() {
    // Notification dispatch placeholder
  }

  @OnEvent('vendor-return.shipped')
  handleVendorReturnShipped() {
    // Notification dispatch placeholder
  }

  @OnEvent('cross-dock.order.completed')
  handleCrossDockCompleted() {
    // Notification dispatch placeholder
  }
}
