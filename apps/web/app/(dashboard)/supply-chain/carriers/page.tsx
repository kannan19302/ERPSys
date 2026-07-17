import { redirect } from 'next/navigation';

export default function CarriersRedirect() {
  redirect('/supply-chain/operations?tab=carriers');
}
