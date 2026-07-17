import { redirect } from 'next/navigation';

export default function UsersRedirectPage() {
  redirect('/settings/identity-access?tab=users');
}
