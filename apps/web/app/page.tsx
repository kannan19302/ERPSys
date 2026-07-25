"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "../src/lib/api";
import { PublicPageRenderer } from "../src/components/builder/PublicPageRenderer";
import { TenantStarterHome } from "../src/components/site/TenantStarterHome";
import { Spinner } from "@unerp/ui";

export default function HomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Check if user is authenticated; if logged in, send them directly to ERP Desk (/apps)
    apiGet("/auth/me")
      .then(() => {
        router.push("/apps");
      })
      .catch(() => {
        // Unauthenticated visitor -> render public Tenant Website & Portal
        setChecking(false);
      });
  }, [router]);

  if (!mounted || checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  // If tenant has published a custom homepage, render it with PublicPageRenderer
  if (page && page.status === "PUBLISHED") {
    return <PublicPageRenderer page={page} settings={settings} />;
  }

  // Fallback to TenantStarterHome (sleek default tenant site with CTA to Studio)
  return <TenantStarterHome settings={settings} />;
}
