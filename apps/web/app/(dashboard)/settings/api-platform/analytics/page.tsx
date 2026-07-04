import { redirect } from 'next/navigation';

export default function ApiPlatformAnalyticsRedirectPage() {
  redirect('/settings/api-platform?tab=analytics');
}
