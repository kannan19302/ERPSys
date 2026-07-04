import { redirect } from 'next/navigation';

export default function WebhookLogsRedirectPage() {
  redirect('/settings/api-platform?tab=webhook-logs');
}
