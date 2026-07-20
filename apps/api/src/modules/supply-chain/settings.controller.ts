import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('supply-chain-settings')
@Controller('supply-chain/settings')
export class SupplyChainSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'supply-chain';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'default-carrier': {
      type: 'string',
      label: 'Default Carrier',
      default: '',
    },
    'shipment-tracking-enabled': {
      type: 'boolean',
      label: 'Enable Shipment Tracking',
      default: true,
    },
    'auto-assign-carrier': {
      type: 'boolean',
      label: 'Auto-Assign Carrier Based on Rules',
      default: false,
    },
    'demand-forecast-horizon-months': {
      type: 'number',
      label: 'Demand Forecast Horizon (months)',
      default: 6,
      validation: z.number().min(1).max(24),
    },
    'safety-stock-multiplier': {
      type: 'number',
      label: 'Safety Stock Multiplier',
      default: 1.5,
      validation: z.number().min(0).max(5),
    },
    'asn-required': {
      type: 'boolean',
      label: 'Require ASN for Inbound Shipments',
      default: false,
    },
    'cross-dock-enabled': {
      type: 'boolean',
      label: 'Enable Cross-Docking',
      default: false,
    },
    'route-optimization-enabled': {
      type: 'boolean',
      label: 'Enable Route Optimization',
      default: false,
    },
    'shipment-notification-email': {
      type: 'boolean',
      label: 'Send Shipment Notification Emails',
      default: true,
    },
    'freight-cost-allocation-method': {
      type: 'string',
      label: 'Freight Cost Allocation Method',
      default: 'weight',
      options: [
        { value: 'weight', label: 'By Weight' },
        { value: 'volume', label: 'By Volume' },
        { value: 'value', label: 'By Value' },
        { value: 'quantity', label: 'By Quantity' },
      ],
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}