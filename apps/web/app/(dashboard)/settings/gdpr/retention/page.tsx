import { redirect } from 'next/navigation';

export default function GdprRetentionRedirectPage() {
  redirect('/settings/compliance-governance?tab=gdpr-retention');
}
