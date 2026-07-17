import { redirect } from 'next/navigation';

export default function WorkflowEscalationsRedirectPage() {
  redirect('/settings/approval-operations?tab=escalations');
}
