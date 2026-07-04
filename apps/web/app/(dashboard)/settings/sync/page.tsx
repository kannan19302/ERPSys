import { redirect } from 'next/navigation';

export default function SyncRedirectPage() {
  redirect('/settings/import-export?tab=sync');
}
