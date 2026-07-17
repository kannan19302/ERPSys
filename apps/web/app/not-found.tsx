'use client';

import { ErrorFallback } from '@/components/ErrorFallback';

export default function NotFound() {
  return (
    <ErrorFallback
      statusCode={404}
      title="Page Not Found"
      message="The page you are looking for does not exist or has been moved. Please verify the URL or navigate back to the dashboard."
      lightweight
    />
  );
}
