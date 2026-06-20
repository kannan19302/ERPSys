'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { WorkflowEditorWorkspace } from '@/components/builder/WorkflowEditorWorkspace';

export default function WorkflowEditorPage() {
  const params = useParams();
  return <WorkflowEditorWorkspace workflowId={params.id as string} />;
}
