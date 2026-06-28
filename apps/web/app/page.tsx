'use client';

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
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      apiGet('/auth/me')
        .then(() => {
          router.push('/apps');
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setChecking(false);
        });
    } else {
      setChecking(false);
    }
  }, [router]);

  if (!mounted || checking) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return <LandingPage />;
}

