import { redirect } from 'next/navigation';

export default function ErrorLogsRedirectPage() {
  redirect('/settings/system-operations?tab=error-logs');
}
