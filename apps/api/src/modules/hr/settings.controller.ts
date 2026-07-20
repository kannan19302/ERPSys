import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('hr-settings')
@Controller('hr/settings')
export class HrSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'hr';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'employee-id-format': {
      type: 'string',
      label: 'Employee ID Format',
      default: 'EMP-{0000}',
      description: 'Format for auto-generated employee IDs',
    },
    'default-work-hours-per-week': {
      type: 'number',
      label: 'Default Work Hours per Week',
      default: 40,
      validation: z.number().min(1).max(80),
    },
    'probation-period-days': {
      type: 'number',
      label: 'Default Probation Period (days)',
      default: 90,
      validation: z.number().min(0).max(365),
    },
    'leave-accrual-frequency': {
      type: 'string',
      label: 'Leave Accrual Frequency',
      default: 'monthly',
      options: [
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'annually', label: 'Annually' },
      ],
    },
    'require-manager-approval-for-leave': {
      type: 'boolean',
      label: 'Require Manager Approval for Leave',
      default: true,
    },
    'enable-employee-self-service': {
      type: 'boolean',
      label: 'Enable Employee Self-Service Portal',
      default: true,
    },
    'default-pay-frequency': {
      type: 'string',
      label: 'Default Pay Frequency',
      default: 'monthly',
      options: [
        { value: 'weekly', label: 'Weekly' },
        { value: 'biweekly', label: 'Bi-Weekly' },
        { value: 'semimonthly', label: 'Semi-Monthly' },
        { value: 'monthly', label: 'Monthly' },
      ],
    },
    'overtime-multiplier': {
      type: 'number',
      label: 'Overtime Pay Multiplier',
      default: 1.5,
      validation: z.number().min(1).max(3),
    },
    'max-concurrent-leave-requests': {
      type: 'number',
      label: 'Max Concurrent Leave Requests',
      default: 3,
      validation: z.number().min(1).max(10),
    },
    'termination-notice-period-days': {
      type: 'number',
      label: 'Default Termination Notice Period (days)',
      default: 30,
      validation: z.number().min(0).max(180),
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}