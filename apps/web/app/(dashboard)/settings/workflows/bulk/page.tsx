import { redirect } from 'next/navigation';

export default function WorkflowBulkRedirectPage() {
  redirect('/settings/approval-operations?tab=bulk');
}
