'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    async function createDashboard() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/v1/builder/dashboards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'New Dashboard ' + Math.floor(Math.random() * 1000),
            status: 'DRAFT',
            widgets: [],
            layout: []
          })
        });

        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          router.push(`/builder/erp/dashboards/${data.id}`);
        } else {
          router.push('/builder/erp/dashboards');
        }
      } catch (err) {
        if (isMounted) router.push('/builder/erp/dashboards');
      }
    }

    createDashboard();

    return () => { isMounted = false; };
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-secondary)' }}>
      <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', marginRight: '8px' }}></div>
      Creating new dashboard...
    </div>
  );
}
