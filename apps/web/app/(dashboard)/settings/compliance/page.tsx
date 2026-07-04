import { redirect } from 'next/navigation';

export default function ComplianceRedirectPage() {
  redirect('/settings/compliance-governance?tab=reports');
}
