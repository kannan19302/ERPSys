import { redirect } from 'next/navigation';

export default function SequencesRedirect() {
  redirect('/crm/marketing-outreach?tab=sequences');
}
