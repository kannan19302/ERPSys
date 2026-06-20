'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { DashboardEditorWorkspace } from '@/components/builder/DashboardEditorWorkspace';

export default function DashboardEditorPage() {
  const params = useParams();
  return <DashboardEditorWorkspace dashboardId={params.id as string} />;
}
