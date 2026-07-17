import { redirect } from 'next/navigation';

export default function DataRetentionRedirectPage() {
  redirect('/settings/compliance-governance?tab=data-retention');
}
