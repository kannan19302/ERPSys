import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { AppSettingsService } from '../../common/settings/settings.service';
import { SettingsControllerBase } from '../../common/settings/settings.controller.base';
import { ModuleSettingsSchema, SettingOption } from '../../common/settings/settings.interface';

const EMAIL_PROVIDER_OPTIONS: SettingOption[] = [
  { value: 'smtp', label: 'SMTP' },
  { value: 'sendgrid', label: 'SendGrid' },
  { value: 'mailgun', label: 'Mailgun' },
  { value: 'ses', label: 'AWS SES' },
  { value: 'postmark', label: 'Postmark' },
];

const NOTIFICATION_CHANNEL_OPTIONS: SettingOption[] = [
  { value: 'email', label: 'Email' },
  { value: 'in-app', label: 'In-App' },
  { value: 'push', label: 'Push Notification' },
  { value: 'sms', label: 'SMS' },
  { value: 'webhook', label: 'Webhook' },
];

@ApiTags('communication-settings')
@Controller('communication/settings')
export class CommunicationSettingsController extends SettingsControllerBase {
  protected readonly moduleSlug = 'communication';
  protected readonly settingsSchema: ModuleSettingsSchema = {
    'email-provider': {
      type: 'string',
      label: 'Email Provider',
      default: 'smtp',
      options: EMAIL_PROVIDER_OPTIONS,
      rbac: { roles: ['admin', 'communication.admin'], permission: 'communication.settings.write' },
    },
    'smtp-host': {
      type: 'string',
      label: 'SMTP Host',
      default: 'localhost',
      rbac: { roles: ['admin', 'communication.admin'], permission: 'communication.settings.write' },
    },
    'smtp-port': {
      type: 'number',
      label: 'SMTP Port',
      default: 587,
      validation: z.number().min(1).max(65535),
      rbac: { roles: ['admin', 'communication.admin'], permission: 'communication.settings.write' },
    },
    'smtp-username': {
      type: 'string',
      label: 'SMTP Username',
      default: '',
      rbac: { roles: ['admin', 'communication.admin'], permission: 'communication.settings.write' },
    },
    'smtp-password': {
      type: 'string',
      label: 'SMTP Password',
      default: '',
      rbac: { roles: ['admin', 'communication.admin'], permission: 'communication.settings.write' },
    },
    'smtp-secure': {
      type: 'boolean',
      label: 'SMTP Secure (TLS)',
      default: true,
      rbac: { roles: ['admin', 'communication.admin'], permission: 'communication.settings.write' },
    },
    'from-email': {
      type: 'string',
      label: 'Default From Email',
      default: 'noreply@unerp.dev',
      validation: z.string().email(),
    },
    'from-name': {
      type: 'string',
      label: 'Default From Name',
      default: 'UniERP',
    },
    'default-notification-channels': {
      type: 'array',
      label: 'Default Notification Channels',
      default: ['in-app', 'email'],
      options: NOTIFICATION_CHANNEL_OPTIONS,
    },
    'enable-email-digest': {
      type: 'boolean',
      label: 'Enable Email Digests',
      default: true,
    },
    'digest-frequency': {
      type: 'string',
      label: 'Digest Frequency',
      default: 'daily',
      options: [
        { value: 'realtime', label: 'Real-time' },
        { value: 'hourly', label: 'Hourly' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
      ],
    },
    'enable-push-provider': {
      type: 'string',
      label: 'Push Provider',
      default: 'web-push',
      options: [
        { value: 'web-push', label: 'Web Push (VAPID)' },
        { value: 'firebase', label: 'Firebase Cloud Messaging' },
      ],
      rbac: { roles: ['admin', 'communication.admin'], permission: 'communication.settings.write' },
    },
    'sms-provider': {
      type: 'string',
      label: 'SMS Provider',
      default: 'twilio',
      options: [
        { value: 'twilio', label: 'Twilio' },
        { value: 'sns', label: 'AWS SNS' },
        { value: 'plivo', label: 'Plivo' },
      ],
      rbac: { roles: ['admin', 'communication.admin'], permission: 'communication.settings.write' },
    },
    'max-notification-retention-days': {
      type: 'number',
      label: 'Notification Retention (days)',
      default: 90,
      validation: z.number().min(1).max(365),
    },
  };

  constructor(settingsService: AppSettingsService) {
    super(settingsService);
  }
}