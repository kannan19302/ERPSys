import { redirect } from 'next/navigation';

export default function ApiPlatformRedirectPage() {
  redirect('/admin/api-platform/oauth');
}
