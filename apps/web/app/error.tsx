'use client';

import { useEffect } from 'react';
import { ErrorFallback } from '@/components/ErrorFallback';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <ErrorFallback
      statusCode={500}
      title="Application Error"
      message="An unexpected system or runtime error occurred. You can attempt to reload the page or report the issue below."
      error={error}
      reset={reset}
    />
  );
}
