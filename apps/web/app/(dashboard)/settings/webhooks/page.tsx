import { redirect } from 'next/navigation';

export default function WebhooksRedirectPage() {
  redirect('/settings/api-platform?tab=webhooks');
}
