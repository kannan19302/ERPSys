import { redirect } from 'next/navigation';

export default function MaintenanceRedirectPage() {
  redirect('/settings/branding-communication?tab=maintenance');
}
