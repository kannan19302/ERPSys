import { redirect } from 'next/navigation';

export default function WorkflowSimulationRedirectPage() {
  redirect('/settings/workflow-builder?tab=simulator');
}
