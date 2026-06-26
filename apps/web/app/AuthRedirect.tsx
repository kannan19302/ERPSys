'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '../src/lib/api';

export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    apiGet('/auth/me')
      .then(() => router.push('/apps'))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      });
  }, [router]);

  return null;
}
