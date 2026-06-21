import { redirect } from 'next/navigation';

// The Communication app was renamed to "Connect". Preserve old links.
export default function CommunicationRedirect() {
  redirect('/connect');
}
