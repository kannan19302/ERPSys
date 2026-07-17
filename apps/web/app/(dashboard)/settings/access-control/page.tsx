import { redirect } from 'next/navigation';

export default function AccessControlRedirectPage() {
  redirect('/settings/identity-access?tab=roles');
}
