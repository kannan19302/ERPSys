import { redirect } from 'next/navigation';

export default function WhiteLabelRedirectPage() {
  redirect('/settings/general-branding?tab=white-label');
}
