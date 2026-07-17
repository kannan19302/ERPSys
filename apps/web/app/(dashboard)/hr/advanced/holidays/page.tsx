import { redirect } from 'next/navigation';

export default function HolidaysRedirect() {
  redirect('/hr/advanced/operations-service?tab=holidays');
}
