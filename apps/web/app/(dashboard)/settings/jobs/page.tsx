import { redirect } from 'next/navigation';

export default function JobsRedirectPage() {
  redirect('/settings/system-operations?tab=jobs');
}
