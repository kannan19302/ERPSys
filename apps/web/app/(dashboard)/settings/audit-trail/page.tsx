import { redirect } from 'next/navigation';

export default function AuditTrailRedirectPage() {
  redirect('/settings/security-policies?tab=audit-trail');
}
