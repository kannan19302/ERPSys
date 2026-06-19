'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (token !== 'mock-token-xyz') {
        fetch('/api/v1/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
          if (res.ok) {
            router.push('/apps');
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }).catch(() => {});
      } else {
        router.push('/apps');
      }
    }
  }, [router]);

  return null;
}
