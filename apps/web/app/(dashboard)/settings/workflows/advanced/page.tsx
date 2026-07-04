import { redirect } from 'next/navigation';

export default function WorkflowsAdvancedRedirectPage() {
  redirect('/settings/workflow-builder?tab=templates');
}
