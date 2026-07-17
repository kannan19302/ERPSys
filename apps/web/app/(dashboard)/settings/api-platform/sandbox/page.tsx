import { redirect } from 'next/navigation';

export default function ApiPlatformSandboxRedirectPage() {
  redirect('/settings/api-platform?tab=sandbox');
}
