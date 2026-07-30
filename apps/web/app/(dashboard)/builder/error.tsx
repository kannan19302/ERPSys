// @ts-nocheck
"use client";

import { Card, Button } from "@unerp/ui";
import { AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "60vh",
      }}
    >
      <Card padding="lg" style={{ textAlign: "center", maxWidth: 480 }}>
        <div style={{ marginBottom: 16 }}>
          <AlertCircle
            size={48}
            style={{ color: "var(--color-danger, #dc2626)" }}
          />
        </div>
        <h2 style={{ margin: "0 0 8px" }}>Something went wrong</h2>
        <p
          style={{
            margin: "0 0 24px",
            color: "var(--color-muted-foreground, #6b7280)",
          }}
        >
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <Button variant="primary" onClick={reset}>
          Try Again
        </Button>
      </Card>
    </div>
  );
}
