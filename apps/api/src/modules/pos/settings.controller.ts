import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema, SettingOption } from '../../common/settings/settings.interface';

const RECEIPT_TEMPLATE_OPTIONS: SettingOption[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'detailed', label: 'Detailed with Line Items' },
  { value: 'minimal', label: 'Minimal' },
];

const PAYMENT_METHOD_OPTIONS: SettingOption[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Credit/Debit Card' },
  { value: 'mobile', label: 'Mobile Payment' },
  { value: 'gift-card', label: 'Gift Card' },
  { value: 'store-credit', label: 'Store Credit' },
];

@ApiTags('pos-settings')
@Controller('pos/settings')
export class PosSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'pos';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'receipt-template': {
      type: 'string',
      label: 'Receipt Template',
      default: 'standard',
      options: RECEIPT_TEMPLATE_OPTIONS,
    },
    'receipt-header': {
      type: 'string',
      label: 'Receipt Header Text',
      default: 'Thank you for your purchase!',
    },
    'receipt-footer': {
      type: 'string',
      label: 'Receipt Footer Text',
      default: 'Visit us again!',
    },
    'enable-barcode-scanner': {
      type: 'boolean',
      label: 'Enable Barcode Scanner',
      default: true,
    },
    'default-tax-rate': {
      type: 'number',
      label: 'Default Tax Rate (%)',
      default: 0,
      validation: z.number().min(0).max(100),
    },
    'auto-apply-tax': {
      type: 'boolean',
      label: 'Auto-Apply Tax to Items',
      default: true,
    },
    'allowed-payment-methods': {
      type: 'array',
      label: 'Allowed Payment Methods',
      default: ['cash', 'card'],
      options: PAYMENT_METHOD_OPTIONS,
    },
    'require-customer-for-sale': {
      type: 'boolean',
      label: 'Require Customer for Sale',
      default: false,
    },
    'enable-loyalty-program': {
      type: 'boolean',
      label: 'Enable Loyalty Program',
      default: false,
    },
    'cash-drawer-auto-open': {
      type: 'boolean',
      label: 'Auto-Open Cash Drawer on Cash Sale',
      default: true,
    },
    'shift-auto-close-hours': {
      type: 'number',
      label: 'Auto-Close Shift After Hours of Inactivity',
      default: 0,
      validation: z.number().min(0).max(24),
      description: '0 = disabled',
    },
    'offline-mode-enabled': {
      type: 'boolean',
      label: 'Enable Offline Mode',
      default: false,
    },
    'receipt-printer-type': {
      type: 'string',
      label: 'Receipt Printer Type',
      default: 'thermal',
      options: [
        { value: 'thermal', label: 'Thermal (ESC/POS)' },
        { value: 'impact', label: 'Impact/Dot Matrix' },
        { value: 'browser', label: 'Browser Print' },
      ],
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}