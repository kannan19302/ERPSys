import { redirect } from 'next/navigation';

export default function ShipmentsRedirect() {
  redirect('/supply-chain/operations?tab=shipments');
}
