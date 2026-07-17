import { redirect } from 'next/navigation';

export default function WorkflowsRedirectPage() {
  redirect('/settings/approval-operations?tab=active');
}
