import { redirect } from 'next/navigation';

export default function GroupsRedirectPage() {
  redirect('/settings/identity-access?tab=groups');
}
