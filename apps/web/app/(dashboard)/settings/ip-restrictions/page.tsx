import { redirect } from 'next/navigation';

export default function IpRestrictionsRedirectPage() {
  redirect('/settings/security-policies?tab=ip-rules');
}
