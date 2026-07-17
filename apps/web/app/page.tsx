'use client';
import styles from './page.module.css';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '../src/lib/api';
import LandingPage from './LandingPage';
import { Spinner } from '@unerp/ui';

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    apiGet('/auth/me')
      .then(() => {
        router.push('/apps');
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router]);

  if (!mounted || checking) {
    return (
      <div className={styles.s1}>
        <Spinner size="lg" />
      </div>
    );
  }

  return <LandingPage />;
}

