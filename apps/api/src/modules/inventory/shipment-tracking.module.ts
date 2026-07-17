import { Module } from '@nestjs/common';
import { ShipmentTrackingService } from './shipment-tracking.service';
import { ShipmentTrackingController } from './shipment-tracking.controller';

@Module({ providers: [ShipmentTrackingService], controllers: [ShipmentTrackingController] })
export class ShipmentTrackingModule {}
