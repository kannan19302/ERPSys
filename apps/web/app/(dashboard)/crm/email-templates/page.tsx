import { redirect } from 'next/navigation';

export default function EmailTemplatesRedirect() {
  redirect('/crm/marketing-outreach?tab=templates');
}
