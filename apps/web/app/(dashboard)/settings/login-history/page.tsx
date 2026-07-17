import { redirect } from 'next/navigation';

export default function LoginHistoryRedirectPage() {
  redirect('/settings/security-policies?tab=login-history');
}
