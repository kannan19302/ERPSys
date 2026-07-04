import { redirect } from 'next/navigation';

export default function TicketsRedirect() {
  redirect('/hr/advanced/operations-service?tab=helpdesk');
}
