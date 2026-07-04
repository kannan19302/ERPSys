import { redirect } from 'next/navigation';

export default function SsoRedirectPage() {
  redirect('/settings/security-policies?tab=sso');
}
