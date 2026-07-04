import { redirect } from 'next/navigation';

export default function SecurityRedirectPage() {
  redirect('/settings/security-policies?tab=overview');
}
