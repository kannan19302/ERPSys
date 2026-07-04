import { redirect } from 'next/navigation';

export default function AccessControlRedirectPage() {
  redirect('/admin/access-control/roles');
}
