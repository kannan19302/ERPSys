import { redirect } from 'next/navigation';

export default function WorkflowRoutingRedirectPage() {
  redirect('/settings/workflow-builder?tab=routing');
}
