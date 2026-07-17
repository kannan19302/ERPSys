import { redirect } from 'next/navigation';

export default function AlertsRedirectPage() {
  redirect('/settings/system-operations?tab=alerts');
}
