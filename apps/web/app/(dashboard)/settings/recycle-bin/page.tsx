import { redirect } from 'next/navigation';

export default function RecycleBinRedirectPage() {
  redirect('/settings/system-operations?tab=recycle-bin');
}
