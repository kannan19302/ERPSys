import { redirect } from 'next/navigation';

export default function GdprRedirectPage() {
  redirect('/admin/gdpr/erasure');
}
