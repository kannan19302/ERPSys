import { redirect } from 'next/navigation';

export default function GdprErasureRedirectPage() {
  redirect('/settings/compliance-governance?tab=erasure');
}
