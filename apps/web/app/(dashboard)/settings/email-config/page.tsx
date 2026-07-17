import { redirect } from 'next/navigation';

export default function EmailConfigRedirectPage() {
  redirect('/settings/branding-communication?tab=email-server');
}
