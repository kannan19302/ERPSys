'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { FormBuilderWorkspace } from '@/components/builder/FormBuilderWorkspace';

export default function FormBuilderPage() {
  const params = useParams();
  return <FormBuilderWorkspace formId={params.id as string} />;
}
