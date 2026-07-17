'use client';
import styles from './global-error.module.css';
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
      <body className={styles.s1}>
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
