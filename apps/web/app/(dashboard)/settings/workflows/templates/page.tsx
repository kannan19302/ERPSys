import { redirect } from 'next/navigation';

export default function WorkflowTemplatesRedirectPage() {
  redirect('/settings/workflow-builder?tab=templates');
}
