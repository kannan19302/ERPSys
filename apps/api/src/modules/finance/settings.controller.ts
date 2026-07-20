import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { z } from 'zod';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { AppSettingsService } from '../../common/settings/settings.service';
import { ModuleSettingsSchema, SettingOption } from '../../common/settings/settings.interface';
import { ModuleSettings } from '../../common/settings/settings.decorator';

const CURRENCY_OPTIONS: SettingOption[] = [
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
  { value: 'JPY', label: 'Japanese Yen (JPY)' },
  { value: 'CNY', label: 'Chinese Yuan (CNY)' },
  { value: 'INR', label: 'Indian Rupee (INR)' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)' },
  { value: 'AUD', label: 'Australian Dollar (AUD)' },
];

const TAX_CALCULATION_OPTIONS: SettingOption[] = [
  { value: 'line-level', label: 'Line Level' },
  { value: 'document-level', label: 'Document Level' },
];

const FISCAL_YEAR_START_SCHEMA = z.string().regex(/^\d{2}-\d{2}$/, 'Format must be MM-DD');

@ApiTags('finance')
@ApiBearerAuth()
@ModuleSettings('finance')
@Controller()
export class FinanceSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'finance';

  protected readonly settingsSchema: ModuleSettingsSchema = {
    'default-currency': {
      type: 'string',
      label: 'Default Currency',
      default: 'USD',
      options: CURRENCY_OPTIONS,
      description: 'Base currency for all financial transactions',
      rbac: { roles: ['finance.admin'], permission: 'finance.settings.write' },
    },
    'fiscal-year-start': {
      type: 'string',
      label: 'Fiscal Year Start',
      default: '01-01',
      validation: FISCAL_YEAR_START_SCHEMA,
      description: 'Month and day when fiscal year starts (MM-DD)',
      rbac: { roles: ['finance.admin'], permission: 'finance.settings.write' },
    },
    'invoice-number-prefix': {
      type: 'string',
      label: 'Invoice Number Prefix',
      default: 'INV-',
      description: 'Prefix for auto-generated invoice numbers',
      rbac: { roles: ['finance.admin'], permission: 'finance.settings.write' },
    },
    'payment-terms-default': {
      type: 'number',
      label: 'Default Payment Terms (days)',
      default: 30,
      description: 'Default net payment terms in days',
      validation: z.number().int().min(0).max(365),
      rbac: { roles: ['finance.admin'], permission: 'finance.settings.write' },
    },
    'tax-calculation-method': {
      type: 'string',
      label: 'Tax Calculation Method',
      default: 'line-level',
      options: TAX_CALCULATION_OPTIONS,
      description: 'How taxes are calculated on transactions',
      rbac: { roles: ['finance.admin'], permission: 'finance.settings.write' },
    },
    'enable-multi-currency': {
      type: 'boolean',
      label: 'Enable Multi-Currency',
      default: false,
      description: 'Allow transactions in multiple currencies',
      rbac: { roles: ['finance.admin'], permission: 'finance.settings.write' },
    },
    'auto-post-journals': {
      type: 'boolean',
      label: 'Auto-Post Journals',
      default: true,
      description: 'Automatically post journals on creation',
      rbac: { roles: ['finance.admin'], permission: 'finance.settings.write' },
    },
    'default-tax-rate': {
      type: 'number',
      label: 'Default Tax Rate (%)',
      default: 0,
      description: 'Default tax rate applied to taxable items',
      validation: z.number().min(0).max(100),
      rbac: { roles: ['finance.admin'], permission: 'finance.settings.write' },
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}