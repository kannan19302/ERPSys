"use client";
import styles from "./page.module.css";
import { GenericBuilderModal } from "@/components/builder/GenericBuilderModal";
import { useBuilderData } from "@/lib/hooks/useBuilderData";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PageHeader,
  ConfirmDialog,
  ListPageTemplate,
  type ListColumn,
} from "@unerp/ui";
import {
  Image,
  PlusCircle,
  Search,
  Trash2,
  Download,
  Copy,
  Upload,
  Grid3X3,
  List,
  FileText,
  Film,
  Music,
  Archive,
} from "lucide-react";

const TYPE_ICONS: Record<
  string,
  React.ComponentType<{ size?: number; style?: React.CSSProperties }>
> = {
  IMAGE: Image,
  VIDEO: Film,
  AUDIO: Music,
  DOCUMENT: FileText,
  ARCHIVE: Archive,
};

const TYPE_COLORS: Record<string, string> = {
  IMAGE: "var(--color-primary)",
  VIDEO: "#7c3aed",
  AUDIO: "#059669",
  DOCUMENT: "#d97706",
  ARCHIVE: "#dc2626",
};

const FOLDERS = ["All Files"];

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function WebAssetsPageContent() {
  const {
    data: ASSETS_DB,
    createItem,
    updateItem,
    deleteItem,
  } = useBuilderData<any>("web-assets", []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("new") === "1") {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleSave = async (data: any) => {
    if (data.sizeBytes) data.sizeBytes = parseInt(data.sizeBytes, 10);
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const executeDeleteAsset = async (id: any) => {
    await deleteItem(id);
  };

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("All Files");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filtered = ASSETS_DB.filter((a: any) =>
    a.name?.toLowerCase().includes(search.toLowerCase()),
  );

  const assetColumns: ListColumn[] = [
    {
      key: "name",
      header: "Name",
      render: (_v, row) => {
        const asset = row as unknown as { name: string; type: string };
        const Icon = TYPE_ICONS[asset.type] || Image;
        const color = TYPE_COLORS[asset.type] || "var(--color-primary)";
        return (
          <div className="ui-hstack-2">
            <div style={{ background: `${color}20` }} className={styles.s1}>
              <Icon size={13} style={{ color }} />
            </div>
            <span className={styles.s2}>{asset.name}</span>
          </div>
        );
      },
    },
    { key: "type", header: "Type" },
    { key: "sizeBytes", header: "Size", render: (v) => formatBytes(Number(v)) },
    { key: "url", header: "URL" },
    {
      key: "uploadedBy",
      header: "Uploaded By",
      render: (v) => String(v || "System"),
    },
    {
      key: "createdAt",
      header: "Uploaded At",
      render: (v) => new Date(String(v)).toLocaleDateString(),
    },
    {
      key: "id",
      header: "Actions",
      render: (_v, row) => {
        const asset = row as unknown as { id: string; url: string };
        return (
          <div className="ui-flex ui-gap-1">
            <button
              onClick={() => window.open(asset.url, "_blank")}
              className={`ui-btn ui-btn-secondary ${styles.s3}`}
            >
              <Download size={11} />
            </button>
            <button
              onClick={() => {
                setEditingItem(row);
                setIsModalOpen(true);
              }}
              className={`ui-btn ui-btn-secondary ${styles.s3}`}
            >
              <Copy size={11} />
            </button>
            <button
              className={`ui-btn ${styles.s4}`}
              onClick={() => setDeleteTarget(asset.id)}
            >
              <Trash2 size={11} />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="Asset Manager"
        description="Upload and organize media assets for your website and ERP templates"
        actions={
          <div className="ui-flex ui-gap-2">
            <button
              className="ui-btn ui-btn-secondary"
              onClick={() => router.push("/builder/web")}
            >
              ← Web Studio
            </button>
            <button
              className="ui-btn ui-btn-primary"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
            >
              <Upload size={15} />
              <span>Upload Files</span>
            </button>
          </div>
        }
      />

      <div className={styles.s5}>
        {/* Folder Sidebar */}
        <div className={`ui-card ${styles.s6}`}>
          <p className={styles.s7}>Folders</p>
          <div className={styles.s8}>
            {FOLDERS.map((f) => (
              <button
                key={f}
                onClick={() => setFolder(f)}
                style={{
                  background:
                    folder === f ? "var(--color-primary-light)" : "transparent",
                  color:
                    folder === f
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                  fontWeight:
                    folder === f
                      ? "var(--weight-semibold)"
                      : "var(--weight-normal)",
                }}
                className={styles.s9}
              >
                {f}
              </button>
            ))}
          </div>
          <div className={styles.s10}>
            <button
              onClick={() => {
                /* New folder */
              }}
              className={`ui-btn ui-btn-secondary ${styles.s11}`}
            >
              <PlusCircle size={12} />
              <span>New Folder</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="ui-stack-3">
          {/* Toolbar */}
          <div className="ui-hstack-3">
            <div className={styles.s12}>
              <Search size={15} className="ui-input-icon-abs" />
              <input
                className={`ui-input ${styles.s13}`}
                type="text"
                placeholder="Search assets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={styles.s14}>
              <button
                onClick={() => setViewMode("grid")}
                style={{
                  background:
                    viewMode === "grid"
                      ? "var(--color-primary-light)"
                      : "transparent",
                  color:
                    viewMode === "grid"
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                }}
                className={styles.s15}
              >
                <Grid3X3 size={15} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                style={{
                  background:
                    viewMode === "list"
                      ? "var(--color-primary-light)"
                      : "transparent",
                  color:
                    viewMode === "list"
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                }}
                className={styles.s15}
              >
                <List size={15} />
              </button>
            </div>
          </div>

          {/* Upload Zone */}
          <div className={`${styles.s16} ${styles.uploadZone}`}>
            <Upload size={24} className={styles.s17} />
            <p className={styles.s18}>Drop files here or click to upload</p>
            <p className={styles.s19}>
              Supports JPG, PNG, SVG, MP4, PDF up to 100MB
            </p>
          </div>

          {/* Assets Grid/List */}
          {viewMode === "grid" ? (
            <div className={styles.s20}>
              {filtered.map((asset: any) => {
                const Icon = TYPE_ICONS[asset.type] || Image;
                const color = TYPE_COLORS[asset.type] || "var(--color-primary)";
                return (
                  <div
                    key={asset.id}
                    className={`ui-card ${styles.s21} ${styles.assetCard}`}
                  >
                    <div
                      style={{ background: `${color}15` }}
                      className={styles.s22}
                    >
                      <Icon size={28} style={{ color }} />
                    </div>
                    <p className={styles.s23}>{asset.name}</p>
                    <p className={styles.s24}>{formatBytes(asset.sizeBytes)}</p>
                    <div className={styles.s25}>
                      <button
                        onClick={() => window.open(asset.url, "_blank")}
                        className={`ui-btn ui-btn-secondary ${styles.s26}`}
                      >
                        <Download size={11} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingItem(asset);
                          setIsModalOpen(true);
                        }}
                        className={`ui-btn ui-btn-secondary ${styles.s26}`}
                      >
                        <Copy size={11} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(asset.id)}
                        className={`ui-btn ${styles.s27}`}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <ListPageTemplate
              title=""
              columns={assetColumns}
              data={filtered as unknown as Record<string, unknown>[]}
              emptyTitle="No assets yet"
              emptyDescription="Upload files to get started."
            />
          )}
        </div>
      </div>

      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Asset" : "Upload Asset"}
        fields={[
          { name: "name", label: "Name", type: "text", required: true },
          {
            name: "type",
            label: "Type (IMAGE/VIDEO/DOCUMENT)",
            type: "text",
            required: true,
          },
          { name: "url", label: "URL", type: "text", required: true },
          { name: "sizeBytes", label: "Size (bytes)", type: "number" },
          { name: "uploadedBy", label: "Uploaded By", type: "text" },
        ]}
        initialData={editingItem}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            executeDeleteAsset(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

import { Suspense } from "react";

export default function WebAssetsPage() {
  return (
    <Suspense
      fallback={<div className={styles.s28}>Loading Asset Manager...</div>}
    >
      <WebAssetsPageContent />
    </Suspense>
  );
}
