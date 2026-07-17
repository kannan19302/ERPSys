import { redirect } from 'next/navigation';

export default function ComplianceRedirect() {
  redirect('/hr/advanced/operations-service?tab=compliance');
}
