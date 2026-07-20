import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('procurement-settings')
@Controller('procurement/settings')
export class ProcurementSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'procurement';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'require-po-approval': {
      type: 'boolean',
      label: 'Require Purchase Order Approval',
      default: true,
    },
    'po-approval-threshold': {
      type: 'number',
      label: 'PO Auto-Approval Threshold',
      default: 1000,
      description: 'Orders below this amount are auto-approved',
      validation: z.number().min(0),
    },
    'default-payment-terms-days': {
      type: 'number',
      label: 'Default Payment Terms (days)',
      default: 30,
      validation: z.number().min(0).max(365),
    },
    'rfq-response-deadline-days': {
      type: 'number',
      label: 'RFQ Response Deadline (days)',
      default: 14,
      validation: z.number().min(1).max(90),
    },
    'three-way-matching': {
      type: 'boolean',
      label: 'Enable Three-Way Matching',
      default: true,
      description: 'Match PO, Receipt, and Invoice before payment',
    },
    'auto-create-po-from-reorder': {
      type: 'boolean',
      label: 'Auto-Create PO from Reorder Points',
      default: false,
    },
    'vendor-rating-enabled': {
      type: 'boolean',
      label: 'Enable Vendor Rating',
      default: true,
    },
    'grn-required-before-invoice': {
      type: 'boolean',
      label: 'Require GRN Before Invoice Processing',
      default: true,
    },
    'po-number-prefix': {
      type: 'string',
      label: 'Purchase Order Number Prefix',
      default: 'PO-',
    },
    'default-currency': {
      type: 'string',
      label: 'Default Procurement Currency',
      default: 'USD',
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}