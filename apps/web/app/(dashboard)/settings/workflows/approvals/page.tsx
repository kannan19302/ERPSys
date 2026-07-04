import { redirect } from 'next/navigation';

export default function WorkflowApprovalsRedirectPage() {
  redirect('/settings/approval-operations?tab=active');
}
