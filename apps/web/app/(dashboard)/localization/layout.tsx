"use client";
import { Globe } from "lucide-react";
import {
  LocalizationTabLayout,
  LOCALIZATION_TABS,
} from "@/components/localization/LocalizationTabLayout";

export default function LocalizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LocalizationTabLayout
      tabs={LOCALIZATION_TABS}
      moduleId="localization"
      moduleLabel="Localization"
      moduleIcon={Globe}
      moduleDescription="Multi-language and translation management"
    >
      {children}
    </LocalizationTabLayout>
  );
}
