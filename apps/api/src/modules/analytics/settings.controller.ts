import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('analytics-settings')
@Controller('analytics/settings')
export class AnalyticsSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'analytics';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'default-dashboard': {
      type: 'string',
      label: 'Default Dashboard',
      default: 'executive',
    },
    'data-retention-days': {
      type: 'number',
      label: 'Analytics Data Retention (days)',
      default: 365,
      validation: z.number().min(30).max(2555),
    },
    'auto-refresh-interval-seconds': {
      type: 'number',
      label: 'Dashboard Auto-Refresh Interval (seconds)',
      default: 300,
      validation: z.number().min(30).max(3600),
    },
    'enable-real-time-updates': {
      type: 'boolean',
      label: 'Enable Real-Time Dashboard Updates',
      default: true,
    },
    'max-rows-in-report': {
      type: 'number',
      label: 'Max Rows in Report Export',
      default: 10000,
      validation: z.number().min(100).max(100000),
    },
    'default-chart-type': {
      type: 'string',
      label: 'Default Chart Type',
      default: 'bar',
      options: [
        { value: 'bar', label: 'Bar Chart' },
        { value: 'line', label: 'Line Chart' },
        { value: 'pie', label: 'Pie Chart' },
        { value: 'area', label: 'Area Chart' },
        { value: 'scatter', label: 'Scatter Plot' },
      ],
    },
    'enable-scheduled-reports': {
      type: 'boolean',
      label: 'Enable Scheduled Report Delivery',
      default: true,
    },
    'report-export-formats': {
      type: 'array',
      label: 'Available Export Formats',
      default: ['pdf', 'csv', 'xlsx'],
      options: [
        { value: 'pdf', label: 'PDF' },
        { value: 'csv', label: 'CSV' },
        { value: 'xlsx', label: 'Excel' },
        { value: 'json', label: 'JSON' },
      ],
    },
    'kpi-calculation-frequency': {
      type: 'string',
      label: 'KPI Calculation Frequency',
      default: 'hourly',
      options: [
        { value: 'realtime', label: 'Real-time' },
        { value: 'hourly', label: 'Hourly' },
        { value: 'daily', label: 'Daily' },
      ],
    },
    'cache-ttl-minutes': {
      type: 'number',
      label: 'Query Cache TTL (minutes)',
      default: 15,
      validation: z.number().min(1).max(1440),
    },
    'enable-drill-down': {
      type: 'boolean',
      label: 'Enable Drill-Down on Charts',
      default: true,
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}