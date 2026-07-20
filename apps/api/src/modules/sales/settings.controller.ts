import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('sales-settings')
@Controller('sales/settings')
export class SalesSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'sales';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'quotation-validity-days': {
      type: 'number',
      label: 'Default Quotation Validity (days)',
      default: 30,
      validation: z.number().min(1).max(365),
    },
    'auto-convert-quotation-to-order': {
      type: 'boolean',
      label: 'Auto-Convert Accepted Quotations to Orders',
      default: false,
    },
    'so-number-prefix': {
      type: 'string',
      label: 'Sales Order Number Prefix',
      default: 'SO-',
    },
    'dn-number-prefix': {
      type: 'string',
      label: 'Delivery Note Number Prefix',
      default: 'DN-',
    },
    'return-approval-required': {
      type: 'boolean',
      label: 'Require Approval for Returns',
      default: true,
    },
    'return-window-days': {
      type: 'number',
      label: 'Return Window (days)',
      default: 30,
      validation: z.number().min(0).max(365),
    },
    'default-price-list': {
      type: 'string',
      label: 'Default Price List',
      default: 'standard',
    },
    'enable-discount-approval': {
      type: 'boolean',
      label: 'Require Approval for Discounts Over Threshold',
      default: true,
    },
    'max-discount-percent': {
      type: 'number',
      label: 'Maximum Discount % Without Approval',
      default: 10,
      validation: z.number().min(0).max(100),
    },
    'auto-create-invoice-on-delivery': {
      type: 'boolean',
      label: 'Auto-Create Invoice on Delivery',
      default: true,
    },
    'shipping-integration-enabled': {
      type: 'boolean',
      label: 'Enable Shipping Carrier Integration',
      default: false,
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}