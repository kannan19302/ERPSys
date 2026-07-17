import { redirect } from 'next/navigation';

export default function SurveysRedirect() {
  redirect('/hr/advanced/operations-service?tab=surveys');
}
