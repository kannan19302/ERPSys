import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('crm-settings')
@Controller('crm/settings')
export class CrmSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'crm';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'lead-auto-assignment': {
      type: 'boolean',
      label: 'Auto-Assign Leads',
      default: false,
      description: 'Automatically assign new leads to sales reps',
    },
    'lead-assignment-rule': {
      type: 'string',
      label: 'Lead Assignment Rule',
      default: 'round-robin',
      options: [
        { value: 'round-robin', label: 'Round Robin' },
        { value: 'territory', label: 'By Territory' },
        { value: 'manual', label: 'Manual Assignment' },
      ],
    },
    'opportunity-auto-close-days': {
      type: 'number',
      label: 'Auto-Close Stale Opportunities (days)',
      default: 90,
      validation: z.number().min(0).max(365),
    },
    'default-deal-stage': {
      type: 'string',
      label: 'Default Deal Stage',
      default: 'prospecting',
      description: 'Initial stage for new opportunities',
    },
    'pipeline-probability-mapping': {
      type: 'object',
      label: 'Pipeline Stage Probabilities',
      default: {
        prospecting: 10,
        qualification: 25,
        proposal: 50,
        negotiation: 75,
        closed_won: 100,
        closed_lost: 0,
      },
    },
    'activity-reminder-default-hours': {
      type: 'number',
      label: 'Default Activity Reminder (hours before)',
      default: 24,
      validation: z.number().min(0).max(168),
    },
    'enable-lead-scoring': {
      type: 'boolean',
      label: 'Enable Lead Scoring',
      default: false,
    },
    'contact-duplicate-check': {
      type: 'boolean',
      label: 'Check for Duplicate Contacts',
      default: true,
    },
    'email-tracking-enabled': {
      type: 'boolean',
      label: 'Enable Email Tracking',
      default: true,
    },
    'customer-portal-enabled': {
      type: 'boolean',
      label: 'Enable Customer Portal',
      default: false,
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}