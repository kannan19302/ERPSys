'use client';

import { ErrorFallback } from '@/components/ErrorFallback';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: 'var(--color-bg)' }}>
        <ErrorFallback
          statusCode={500}
          title="Critical System Error"
          message="A critical crash occurred in the root framework of the application. Try reloading or contact the administrator."
          error={error}
          reset={reset}
        />
      </body>
    </html>
  );
}
