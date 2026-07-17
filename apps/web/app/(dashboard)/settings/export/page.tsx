import { redirect } from 'next/navigation';

export default function ExportRedirectPage() {
  redirect('/settings/import-export?tab=export');
}
