import { redirect } from 'next/navigation';

export default function LoginCustomizerRedirectPage() {
  redirect('/settings/branding-communication?tab=login-page');
}
