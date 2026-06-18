'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { DynamicFormRenderer } from '@/components/builder/DynamicFormRenderer';

export default function PublicFormPage() {
  const params = useParams();
  const formId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    // Simulate API call to save form submission
    console.log('Submitting public form data:', data);
    await new Promise(r => setTimeout(r, 1000));
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-sunken)' }}>
        <div style={{ background: 'var(--color-bg-elevated)', padding: 'var(--space-8)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-4)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', marginBottom: 'var(--space-2)' }}>Success!</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Your form submission has been received. Thank you.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-sunken)', padding: 'var(--space-8)' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Public Form</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>Please fill out the form below.</p>
        </div>
        
        <DynamicFormRenderer 
          formId={formId} 
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
