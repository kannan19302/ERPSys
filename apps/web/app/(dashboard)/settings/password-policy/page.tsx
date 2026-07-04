import { redirect } from 'next/navigation';

export default function PasswordPolicyRedirectPage() {
  redirect('/settings/security-policies?tab=password-policy');
}
