import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('inventory-settings')
@Controller('inventory/settings')
export class InventorySettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'inventory';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'default-costing-method': {
      type: 'string',
      label: 'Default Costing Method',
      default: 'fifo',
      options: [
        { value: 'fifo', label: 'FIFO (First In, First Out)' },
        { value: 'lifo', label: 'LIFO (Last In, First Out)' },
        { value: 'weighted-average', label: 'Weighted Average' },
        { value: 'standard', label: 'Standard Cost' },
      ],
    },
    'track-serial-numbers': {
      type: 'boolean',
      label: 'Track Serial Numbers',
      default: false,
    },
    'track-batches': {
      type: 'boolean',
      label: 'Track Batches/Lots',
      default: false,
    },
    'negative-stock-allowed': {
      type: 'boolean',
      label: 'Allow Negative Stock',
      default: false,
    },
    'auto-reorder-enabled': {
      type: 'boolean',
      label: 'Enable Auto Reorder',
      default: true,
    },
    'default-reorder-lead-time-days': {
      type: 'number',
      label: 'Default Reorder Lead Time (days)',
      default: 7,
      validation: z.number().min(0).max(365),
    },
    'stock-reservation-on-order': {
      type: 'boolean',
      label: 'Reserve Stock on Sales Order',
      default: true,
    },
    'barcode-format': {
      type: 'string',
      label: 'Default Barcode Format',
      default: 'CODE128',
      options: [
        { value: 'CODE128', label: 'Code 128' },
        { value: 'EAN13', label: 'EAN-13' },
        { value: 'QR', label: 'QR Code' },
      ],
    },
    'cycle-count-frequency-days': {
      type: 'number',
      label: 'Default Cycle Count Frequency (days)',
      default: 90,
      validation: z.number().min(1).max(365),
    },
    'low-stock-threshold-percent': {
      type: 'number',
      label: 'Low Stock Alert Threshold (%)',
      default: 20,
      validation: z.number().min(0).max(100),
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}