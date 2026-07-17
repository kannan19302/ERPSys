import { redirect } from 'next/navigation';

export default function WorkflowEmailRedirectPage() {
  redirect('/settings/workflow-builder?tab=email');
}
