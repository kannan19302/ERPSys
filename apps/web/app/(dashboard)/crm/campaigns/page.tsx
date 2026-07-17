import { redirect } from 'next/navigation';

export default function CampaignsRedirect() {
  redirect('/crm/marketing-outreach?tab=campaigns');
}
