// @ts-nocheck
"use client";
import { PackageOpen } from "lucide-react";
import {
  FixedAssetsTabLayout,
  FIXED_ASSETS_TABS,
} from "@/components/fixed-assets/FixedAssetsTabLayout";

export default function FixedAssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FixedAssetsTabLayout
      tabs={FIXED_ASSETS_TABS}
      moduleId="fixed-assets"
      moduleLabel="Fixed Assets"
      moduleIcon={PackageOpen}
      moduleDescription="Asset registry, depreciation, and disposal management"
    >
      {children}
    </FixedAssetsTabLayout>
  );
}
