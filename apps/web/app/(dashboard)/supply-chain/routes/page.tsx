import { redirect } from 'next/navigation';

export default function RoutesRedirect() {
  redirect('/supply-chain/operations?tab=routes');
}
