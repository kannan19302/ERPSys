import { redirect } from 'next/navigation';

export default function BrandingRedirectPage() {
  redirect('/settings/general-branding?tab=branding');
}
