import { redirect } from 'next/navigation';

export default function ScheduledTasksRedirectPage() {
  redirect('/settings/system-operations?tab=tasks');
}
