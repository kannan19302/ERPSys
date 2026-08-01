"use client";
import { Folder } from "lucide-react";
import {
  StorageTabLayout,
  STORAGE_TABS,
} from "@/components/storage/StorageTabLayout";

export default function StorageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StorageTabLayout
      tabs={STORAGE_TABS}
      moduleId="storage"
      moduleLabel="Storage"
      moduleIcon={Folder}
      moduleDescription="File storage, sharing, and quota management"
    >
      {children}
    </StorageTabLayout>
  );
}
