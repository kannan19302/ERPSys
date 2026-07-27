"use client";
import { KeyRound } from "lucide-react";
import {
  ApiPlatformTabLayout,
  API_PLATFORM_TABS,
} from "@/components/api-platform/ApiPlatformTabLayout";

export default function ApiPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ApiPlatformTabLayout
      tabs={API_PLATFORM_TABS}
      moduleId="api-platform"
      moduleLabel="API Platform"
      moduleIcon={KeyRound}
      moduleDescription="API keys, webhooks, and usage metrics"
    >
      {children}
    </ApiPlatformTabLayout>
  );
}
