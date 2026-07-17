import { redirect } from 'next/navigation';

export default function SystemHealthRedirectPage() {
  redirect('/settings/system-operations?tab=health');
}
