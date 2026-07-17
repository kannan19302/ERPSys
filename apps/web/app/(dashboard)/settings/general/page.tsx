import { redirect } from 'next/navigation';

export default function GeneralRedirectPage() {
  redirect('/settings/general-branding?tab=general');
}
