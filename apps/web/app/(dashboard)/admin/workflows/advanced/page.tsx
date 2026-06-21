import { redirect } from 'next/navigation';

export default function WorkflowsAdvancedRedirectPage() {
  redirect('/admin/workflows/bulk');
}
