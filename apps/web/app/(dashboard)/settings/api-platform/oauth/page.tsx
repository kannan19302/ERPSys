import { redirect } from 'next/navigation';

export default function ApiPlatformOauthRedirectPage() {
  redirect('/settings/api-platform?tab=oauth');
}
