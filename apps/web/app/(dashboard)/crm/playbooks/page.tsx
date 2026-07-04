import { redirect } from 'next/navigation';

export default function PlaybooksRedirect() {
  redirect('/crm/sales-enablement?tab=playbooks');
}
