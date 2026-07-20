import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('manufacturing-settings')
@Controller('manufacturing/settings')
export class ManufacturingSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'manufacturing';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'default-bom-type': {
      type: 'string',
      label: 'Default BOM Type',
      default: 'manufacturing',
      options: [
        { value: 'manufacturing', label: 'Manufacturing BOM' },
        { value: 'engineering', label: 'Engineering BOM' },
        { value: 'sales', label: 'Sales BOM' },
      ],
    },
    'auto-create-work-orders': {
      type: 'boolean',
      label: 'Auto-Create Work Orders from Sales Orders',
      default: false,
    },
    'work-order-number-prefix': {
      type: 'string',
      label: 'Work Order Number Prefix',
      default: 'WO-',
    },
    'track-scrap': {
      type: 'boolean',
      label: 'Track Scrap/Waste',
      default: true,
    },
    'scrap-rate-default-percent': {
      type: 'number',
      label: 'Default Scrap Rate (%)',
      default: 5,
      validation: z.number().min(0).max(100),
    },
    'enable-routing': {
      type: 'boolean',
      label: 'Enable Routing/Operations',
      default: true,
    },
    'capacity-planning-horizon-days': {
      type: 'number',
      label: 'Capacity Planning Horizon (days)',
      default: 30,
      validation: z.number().min(1).max(365),
    },
    'auto-release-work-orders': {
      type: 'boolean',
      label: 'Auto-Release Work Orders on Creation',
      default: false,
    },
    'quality-check-required': {
      type: 'boolean',
      label: 'Require Quality Check on Completion',
      default: true,
    },
    'track-by-serial-number': {
      type: 'boolean',
      label: 'Track Finished Goods by Serial Number',
      default: false,
    },
    'bom-revision-control': {
      type: 'boolean',
      label: 'Enable BOM Revision Control',
      default: true,
    },
    'mrp-run-frequency': {
      type: 'string',
      label: 'MRP Run Frequency',
      default: 'daily',
      options: [
        { value: 'manual', label: 'Manual Only' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
      ],
    },
    'lead-time-buffer-days': {
      type: 'number',
      label: 'Lead Time Buffer (days)',
      default: 2,
      validation: z.number().min(0).max(30),
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}