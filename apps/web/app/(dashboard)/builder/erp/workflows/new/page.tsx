'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewWorkflowPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    async function createWorkflow() {
      try {
        const token = localStorage.getItem('token') || '';
        const res = await fetch('/api/v1/builder/workflows', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: 'New Workflow ' + Math.floor(Math.random() * 1000),
            trigger: 'MANUAL',
            status: 'DRAFT',
            nodes: [],
            edges: []
          })
        });

        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          router.push(`/builder/erp/workflows/${data.id}`);
        } else {
          router.push('/builder/erp/workflows');
        }
      } catch (err) {
        if (isMounted) router.push('/builder/erp/workflows');
      }
    }

    createWorkflow();

    return () => { isMounted = false; };
  }, [router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-secondary)' }}>
      <div className="animate-spin" style={{ width: '24px', height: '24px', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', marginRight: '8px' }}></div>
      Creating new workflow...
    </div>
  );
}
