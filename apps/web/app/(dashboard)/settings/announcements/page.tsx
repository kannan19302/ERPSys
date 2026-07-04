import { redirect } from 'next/navigation';

export default function AnnouncementsRedirectPage() {
  redirect('/settings/branding-communication?tab=announcements');
}
