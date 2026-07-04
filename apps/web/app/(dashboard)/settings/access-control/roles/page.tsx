import { redirect } from 'next/navigation';

export default function RolesRedirectPage() {
  redirect('/settings/identity-access?tab=roles');
}
