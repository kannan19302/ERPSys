import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('projects-settings')
@Controller('projects/settings')
export class ProjectsSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'projects';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'default-project-template': {
      type: 'string',
      label: 'Default Project Template',
      default: 'standard',
    },
    'task-number-prefix': {
      type: 'string',
      label: 'Task Number Prefix',
      default: 'TASK-',
    },
    'enable-gantt-chart': {
      type: 'boolean',
      label: 'Enable Gantt Chart View',
      default: true,
    },
    'default-task-duration-hours': {
      type: 'number',
      label: 'Default Task Duration (hours)',
      default: 8,
      validation: z.number().min(0.5).max(1000),
    },
    'timesheet-approval-required': {
      type: 'boolean',
      label: 'Require Timesheet Approval',
      default: true,
    },
    'timesheet-submission-deadline-day': {
      type: 'number',
      label: 'Timesheet Submission Deadline (day of week)',
      default: 1,
      validation: z.number().min(0).max(6),
      description: '0 = Sunday, 1 = Monday, etc.',
    },
    'enable-milestone-tracking': {
      type: 'boolean',
      label: 'Enable Milestone Tracking',
      default: true,
    },
    'budget-alert-threshold-percent': {
      type: 'number',
      label: 'Budget Alert Threshold (%)',
      default: 80,
      validation: z.number().min(0).max(100),
    },
    'auto-calculate-progress': {
      type: 'boolean',
      label: 'Auto-Calculate Project Progress from Tasks',
      default: true,
    },
    'risk-assessment-enabled': {
      type: 'boolean',
      label: 'Enable Risk Assessment',
      default: false,
    },
    'resource-allocation-view': {
      type: 'boolean',
      label: 'Enable Resource Allocation View',
      default: true,
    },
    'project-number-prefix': {
      type: 'string',
      label: 'Project Number Prefix',
      default: 'PRJ-',
    },
    'default-currency': {
      type: 'string',
      label: 'Default Project Currency',
      default: 'USD',
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}