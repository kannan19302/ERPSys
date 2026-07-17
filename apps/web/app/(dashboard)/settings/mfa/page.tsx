import { redirect } from 'next/navigation';

export default function MfaRedirectPage() {
  redirect('/settings/security-policies?tab=mfa');
}
