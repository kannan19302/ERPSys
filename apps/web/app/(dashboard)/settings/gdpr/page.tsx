import { redirect } from 'next/navigation';

export default function GdprRedirectPage() {
  redirect('/settings/compliance-governance?tab=erasure');
}
