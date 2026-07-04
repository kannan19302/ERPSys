import { redirect } from 'next/navigation';

export default function CustomFieldsRedirectPage() {
  redirect('/settings/general-branding?tab=custom-fields');
}
