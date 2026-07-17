import { redirect } from 'next/navigation';

export default function WorkflowAnalyticsRedirectPage() {
  redirect('/settings/approval-operations?tab=analytics');
}
