import { redirect } from 'next/navigation';

export default function ApiKeysRedirectPage() {
  redirect('/settings/api-platform?tab=api-keys');
}
