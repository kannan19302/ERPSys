'use client';
import styles from './page.module.css';
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
      <div className={styles.s1}>
        <div className={styles.s2}>
          <div className={styles.s3}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h2 className={styles.s4}>Success!</h2>
          <p className={styles.s5}>Your form submission has been received. Thank you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.s6}>
      <div className={styles.s7}>
        <div className={styles.s8}>
          <h1 className={styles.s9}>Public Form</h1>
          <p className={styles.s10}>Please fill out the form below.</p>
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
