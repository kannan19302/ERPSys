'use client';
import styles from './page.module.css';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function NewWorkflowPage() {
  const router = useRouter();
  const client = useApiClient();

  useEffect(() => {
    let isMounted = true;
    async function createWorkflow() {
      try {
        const data = await client.post<{ id: string }>('/builder/workflows', {
            name: 'New Workflow ' + Math.floor(Math.random() * 1000),
            trigger: 'MANUAL',
            status: 'DRAFT',
            nodes: [],
            edges: []
          });

        if (!isMounted) return;

        router.push(`/builder/erp/workflows/${data.id}`);
      } catch (err) {
        if (isMounted) router.push('/builder/erp/workflows');
      }
    }

    createWorkflow();

    return () => { isMounted = false; };
  }, [router, client]);

  return (
    <RouteGuard permission="builder.workflows.create">
    <div className={styles.s1}>
      <div className={`animate-spin ${styles.s2}`} ></div>
      Creating new workflow...
    </div>
    </RouteGuard>
  );
}
