"use client";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@unerp/ui";
import { getCsrfToken } from "../../../../src/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

/**
 * Landing pad after the OAuth callback. The API has already set the httpOnly
 * auth + refresh cookies; this page rotates the refresh cookie into a
 * client-side session (localStorage token + user) and enters the workspace.
 */
export default function OAuthCompletePage() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const headers = new Headers();
    const csrf = getCsrfToken();
    if (csrf) headers.set("x-csrf-token", csrf);

    fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers,
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`refresh failed (${res.status})`);
        const data = (await res.json()) as { token?: string; user?: unknown };
        if (!data.token) throw new Error("no token");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.replace("/apps");
      })
      .catch(() => {
        setFailed(true);
        setTimeout(
          () =>
            router.replace(
              `/login?error=${encodeURIComponent("Sign-in could not be completed. Please try again.")}`,
            ),
          1500,
        );
      });
  }, [router]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: 16,
      }}
    >
      <Spinner size="lg" />
      <p style={{ color: "var(--color-text-muted)" }}>
        {failed
          ? "Sign-in failed — returning to login…"
          : "Completing sign-in…"}
      </p>
    </div>
  );
}
