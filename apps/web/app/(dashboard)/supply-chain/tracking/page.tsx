import { redirect } from 'next/navigation';

export default function TrackingRedirect() {
  redirect('/supply-chain/operations?tab=tracking');
}
