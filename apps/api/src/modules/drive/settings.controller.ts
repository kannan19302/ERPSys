import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema, SettingOption } from '../../common/settings/settings.interface';

const STORAGE_PROVIDER_OPTIONS: SettingOption[] = [
  { value: 'minio', label: 'MinIO (S3 Compatible)' },
  { value: 's3', label: 'AWS S3' },
  { value: 'azure', label: 'Azure Blob Storage' },
  { value: 'gcs', label: 'Google Cloud Storage' },
];

const DEFAULT_ACL_OPTIONS: SettingOption[] = [
  { value: 'private', label: 'Private' },
  { value: 'public-read', label: 'Public Read' },
  { value: 'authenticated-read', label: 'Authenticated Read' },
];

@ApiTags('drive-settings')
@Controller('drive/settings')
export class DriveSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'drive';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'storage-provider': {
      type: 'string',
      label: 'Storage Provider',
      default: 'minio',
      options: STORAGE_PROVIDER_OPTIONS,
      rbac: { roles: ['admin', 'drive.admin'], permission: 'drive.settings.write' },
    },
    'default-bucket': {
      type: 'string',
      label: 'Default Bucket Name',
      default: 'unerp-documents',
      rbac: { roles: ['admin', 'drive.admin'], permission: 'drive.settings.write' },
    },
    'max-file-size-mb': {
      type: 'number',
      label: 'Maximum File Size (MB)',
      default: 100,
      validation: z.number().min(1).max(5000),
      rbac: { roles: ['admin', 'drive.admin'], permission: 'drive.settings.write' },
    },
    'allowed-file-types': {
      type: 'array',
      label: 'Allowed File Types (MIME types)',
      default: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/*'],
      rbac: { roles: ['admin', 'drive.admin'], permission: 'drive.settings.write' },
    },
    'default-acl': {
      type: 'string',
      label: 'Default ACL for Uploads',
      default: 'private',
      options: DEFAULT_ACL_OPTIONS,
      rbac: { roles: ['admin', 'drive.admin'], permission: 'drive.settings.write' },
    },
    'enable-versioning': {
      type: 'boolean',
      label: 'Enable Document Versioning',
      default: true,
    },
    'version-retention-count': {
      type: 'number',
      label: 'Maximum Versions to Retain',
      default: 10,
      validation: z.number().min(1).max(100),
    },
    'enable-ocr': {
      type: 'boolean',
      label: 'Enable OCR for Document Search',
      default: false,
    },
    'enable-virus-scan': {
      type: 'boolean',
      label: 'Enable Virus Scanning on Upload',
      default: false,
    },
    'storage-quota-gb-per-tenant': {
      type: 'number',
      label: 'Default Storage Quota per Tenant (GB)',
      default: 10,
      validation: z.number().min(1).max(10000),
      rbac: { roles: ['admin', 'drive.admin'], permission: 'drive.settings.write' },
    },
    'presigned-url-expiry-seconds': {
      type: 'number',
      label: 'Presigned URL Expiry (seconds)',
      default: 3600,
      validation: z.number().min(60).max(86400),
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}