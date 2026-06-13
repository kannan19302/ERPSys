import { redirect } from 'next/navigation';

export default function AdvancedPageRedirect() {
  redirect('/inventory/stock-entries');
}
