'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/ErrorFallback';

export default function DashboardErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard runtime error:', error);
  }, [error]);

  return (
    <div style={{ padding: 'var(--space-4)', width: '100%' }}>
      <ErrorFallback
        statusCode={500}
        title="Module Error"
        message="The requested workspace or dashboard page encountered an unexpected runtime crash. You can reload the page or report the error."
        error={error}
        reset={reset}
      />
    </div>
  );
}
