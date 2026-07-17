'use client';
import styles from './page.module.css';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function NewDashboardPage() {
  const router = useRouter();
  const client = useApiClient();

  useEffect(() => {
    let isMounted = true;
    async function createDashboard() {
      try {
        const data = await client.post<{ id: string }>('/builder/dashboards', {
            name: 'New Dashboard ' + Math.floor(Math.random() * 1000),
            status: 'DRAFT',
            widgets: [],
            layout: []
          });

        if (!isMounted) return;

        router.push(`/builder/erp/dashboards/${data.id}`);
      } catch (err) {
        if (isMounted) router.push('/builder/erp/dashboards');
      }
    }

    createDashboard();

    return () => { isMounted = false; };
  }, [router, client]);

  return (
    <RouteGuard permission="builder.dashboards.create">
    <div className={styles.s1}>
      <div className={`animate-spin ${styles.s2}`} ></div>
      Creating new dashboard...
    </div>
    </RouteGuard>
  );
}
