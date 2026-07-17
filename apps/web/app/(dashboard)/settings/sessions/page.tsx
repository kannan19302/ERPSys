import { redirect } from 'next/navigation';

export default function SessionsRedirectPage() {
  redirect('/settings/security-policies?tab=sessions');
}
