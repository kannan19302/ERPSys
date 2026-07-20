import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema } from '../../common/settings/settings.interface';

@ApiTags('drive-settings')
@Controller('drive/settings')
export class DriveSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'drive';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'max-file-size-mb': {
      type: 'number',
      label: 'Maximum File Size (MB)',
      default: 100,
      validation: z.number().min(1).max(5000),
    },
    'allowed-file-types': {
      type: 'array',
      label: 'Allowed File Types (MIME types)',
      default: ['application/pdf', 'image/*', 'video/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    },
    'default-storage-quota-gb': {
      type: 'number',
      label: 'Default Storage Quota per User (GB)',
      default: 5,
      validation: z.number().min(0).max(1000),
    },
    'version-retention-count': {
      type: 'number',
      label: 'Maximum Versions to Retain per File',
      default: 10,
      validation: z.number().min(1).max(100),
    },
    'version-retention-days': {
      type: 'number',
      label: 'Version Retention Period (days)',
      default: 365,
      validation: z.number().min(1).max(2555),
    },
    'enable-virus-scan': {
      type: 'boolean',
      label: 'Enable Virus Scanning on Upload',
      default: false,
    },
    'enable-ocr': {
      type: 'boolean',
      label: 'Enable OCR for Searchable PDFs',
      default: false,
    },
    'public-link-expiry-days': {
      type: 'number',
      label: 'Public Share Link Expiry (days)',
      default: 30,
      validation: z.number().min(1).max(365),
    },
    'require-password-for-public-links': {
      type: 'boolean',
      label: 'Require Password for Public Links',
      default: false,
    },
    'enable-file-preview': {
      type: 'boolean',
      label: 'Enable In-Browser File Preview',
      default: true,
    },
    'thumbnail-generation': {
      type: 'boolean',
      label: 'Generate Thumbnails for Images/Videos',
      default: true,
    },
    'recycle-bin-retention-days': {
      type: 'number',
      label: 'Recycle Bin Retention (days)',
      default: 30,
      validation: z.number().min(1).max(365),
    },
    'external-sharing-enabled': {
      type: 'boolean',
      label: 'Allow External Sharing',
      default: true,
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}