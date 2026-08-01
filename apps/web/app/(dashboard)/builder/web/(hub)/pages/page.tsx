"use client";
import styles from "./page.module.css";
import { GenericBuilderModal } from "@/components/builder/GenericBuilderModal";
import { useBuilderData } from "@/lib/hooks/useBuilderData";
import { PageHeader, DataTable, ConfirmDialog, type Column } from "@unerp/ui";
import { useApiClient } from "@unerp/framework";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Globe,
  PlusCircle,
  Search,
  Edit3,
  Trash2,
  Eye,
  Move,
  Layers,
  LayoutGrid,
  Image,
  Zap,
  Type,
  Tag,
  FileText,
  Monitor,
  LayoutTemplate,
  CheckCircle,
  Database,
} from "lucide-react";

const SECTIONS_PALETTE = [
  { type: "navbar", label: "Navbar" },
  { type: "hero", label: "Hero Banner" },
  { type: "collection", label: "Collection List" },
  { type: "features", label: "Features Grid" },
  { type: "columns", label: "Columns" },
  { type: "image", label: "Image" },
  { type: "gallery", label: "Gallery" },
  { type: "logos", label: "Logo Cloud" },
  { type: "trust", label: "Trust Bar" },
  { type: "social", label: "Social Proof" },
  { type: "steps", label: "How It Works" },
  { type: "pricing", label: "Pricing Table" },
  { type: "faq", label: "FAQ Accordion" },
  { type: "text", label: "Rich Text" },
  { type: "cta", label: "CTA Banner" },
  { type: "contact", label: "Contact Form" },
  { type: "cart", label: "Cart & Checkout" },
  { type: "footer", label: "Footer" },
];

function renderBlockIcon(type: string, size = 20, className = "ui-text-muted") {
  switch (type) {
    case "hero":
      return <Monitor size={size} className={className} />;
    case "collection":
      return <Database size={size} className={className} />;
    case "features":
    case "columns":
      return <LayoutGrid size={size} className={className} />;
    case "image":
    case "gallery":
      return <Image size={size} className={className} />;
    case "social":
      return <Type size={size} className={className} />;
    case "steps":
      return <LayoutTemplate size={size} className={className} />;
    case "pricing":
    case "cart":
      return <Tag size={size} className={className} />;
    case "faq":
    case "text":
    case "contact":
      return <FileText size={size} className={className} />;
    case "cta":
      return <Zap size={size} className={className} />;
    default:
      return <Layers size={size} className={className} />;
  }
}

// Inspector schema per block type — drives the right-hand property editor.
const BLOCK_INSPECTOR: Record<
  string,
  {
    name: string;
    label: string;
    type: "text" | "textarea" | "select" | "number" | "checkbox" | "asset";
    options?: string[];
  }[]
> = {
  hero: [
    { name: "title", label: "Headline", type: "text" },
    { name: "subtitle", label: "Subheadline", type: "textarea" },
    { name: "primaryCta", label: "Primary Button", type: "text" },
    { name: "primaryUrl", label: "Primary URL", type: "text" },
    { name: "secondaryCta", label: "Secondary Button", type: "text" },
    {
      name: "alignment",
      label: "Alignment",
      type: "select",
      options: ["center", "left"],
    },
  ],
  collection: [
    {
      name: "collectionSlug",
      label: "Collection",
      type: "select",
      options: [],
    }, // filled at runtime
    { name: "title", label: "Section Title", type: "text" },
    { name: "subtitle", label: "Subtitle", type: "textarea" },
    {
      name: "layout",
      label: "Layout",
      type: "select",
      options: ["grid", "list"],
    },
    {
      name: "columns",
      label: "Columns",
      type: "select",
      options: ["2", "3", "4"],
    },
    { name: "limit", label: "Max Items", type: "number" },
    { name: "featuredOnly", label: "Featured only", type: "checkbox" },
  ],
  features: [
    { name: "title", label: "Title", type: "text" },
    { name: "subtitle", label: "Subtitle", type: "textarea" },
  ],
  cta: [
    { name: "title", label: "Title", type: "text" },
    { name: "subtitle", label: "Subtitle", type: "textarea" },
    { name: "buttonText", label: "Button Text", type: "text" },
    { name: "buttonUrl", label: "Button URL", type: "text" },
  ],
  text: [
    { name: "title", label: "Heading", type: "text" },
    { name: "content", label: "Content (HTML)", type: "textarea" },
    {
      name: "align",
      label: "Align",
      type: "select",
      options: ["left", "center"],
    },
  ],
  image: [
    { name: "url", label: "Image URL", type: "asset" },
    { name: "caption", label: "Caption", type: "text" },
  ],
  gallery: [
    { name: "title", label: "Title", type: "text" },
    { name: "images", label: "Image URLs (one per line)", type: "textarea" },
    {
      name: "columns",
      label: "Columns",
      type: "select",
      options: ["2", "3", "4"],
    },
  ],
  columns: [
    { name: "col1Title", label: "Column 1 Title", type: "text" },
    { name: "col1Body", label: "Column 1 Body", type: "textarea" },
    { name: "col2Title", label: "Column 2 Title", type: "text" },
    { name: "col2Body", label: "Column 2 Body", type: "textarea" },
    { name: "col3Title", label: "Column 3 Title", type: "text" },
    { name: "col3Body", label: "Column 3 Body", type: "textarea" },
  ],
  logos: [
    { name: "title", label: "Heading", type: "text" },
    { name: "logos", label: "Logo URLs (one per line)", type: "textarea" },
  ],
  navbar: [
    { name: "brand", label: "Brand Name", type: "text" },
    { name: "links", label: "Links (Label=/url per line)", type: "textarea" },
    { name: "showCart", label: "Show cart icon", type: "checkbox" },
  ],
  footer: [
    { name: "brand", label: "Brand Name", type: "text" },
    { name: "tagline", label: "Tagline", type: "textarea" },
    { name: "links", label: "Links (Label=/url per line)", type: "textarea" },
    { name: "copyright", label: "Copyright", type: "text" },
  ],
  contact: [
    { name: "title", label: "Title", type: "text" },
    { name: "subtitle", label: "Subtitle", type: "textarea" },
    { name: "formName", label: "Form Name (inbox label)", type: "text" },
    { name: "buttonText", label: "Button Text", type: "text" },
  ],
  cart: [{ name: "title", label: "Title", type: "text" }],
};

const generateId = () => Math.random().toString(36).substring(2, 9);

function WebBuilderPagesPageContent() {
  const client = useApiClient();

  const {
    data: PAGES_DB,
    createItem,
    updateItem,
    deleteItem,
  } = useBuilderData<any>("web-pages", []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("new") === "1") {
      setEditingItem(null);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleSave = async (data: any) => {
    if (editingItem) {
      await updateItem(editingItem.id, data);
    } else {
      await createItem(data);
    }
    setIsModalOpen(false);
  };

  const router = useRouter();
  const activeTab: "list" | "editor" =
    searchParams.get("subtab") === "editor" ? "editor" : "list";
  const [searchQuery, setSearchQuery] = useState("");

  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const editingPage = PAGES_DB.find((p: any) => p.id === editingPageId) || null;

  // Local state for page sections during editing
  const [sections, setSections] = useState<any[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [collections, setCollections] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    client
      .get<unknown>("/builder/web-collections")
      .then((d) => setCollections(Array.isArray(d) ? d : []))
      .catch(() => {});
    client
      .get<unknown>("/builder/web-assets")
      .then((d) =>
        setAssets(
          Array.isArray(d) ? d.filter((a: any) => a.type === "IMAGE") : [],
        ),
      )
      .catch(() => {});
  }, [client]);

  const selectedSection =
    sections.find((s) => s.id === selectedSectionId) || null;
  const updateContent = (patch: Record<string, any>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === selectedSectionId
          ? { ...s, content: { ...(s.content || {}), ...patch } }
          : s,
      ),
    );
  };

  useEffect(() => {
    if (editingPage) {
      let parsedSections = [];
      try {
        if (typeof editingPage.sections === "string") {
          parsedSections = JSON.parse(editingPage.sections);
        } else if (Array.isArray(editingPage.sections)) {
          parsedSections = editingPage.sections;
        } else if (
          editingPage.sections &&
          Array.isArray(editingPage.sections.items)
        ) {
          parsedSections = editingPage.sections.items;
        }
      } catch (e) {
        parsedSections = [];
      }
      setSections(Array.isArray(parsedSections) ? parsedSections : []);
    } else {
      setSections([]);
    }
  }, [editingPage]);

  // Sync sections to iframe whenever they change
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SYNC_SECTIONS", payload: sections },
        "*",
      );
    }
  }, [sections]);

  // Sync selected section to iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: "SELECT_SECTION", payload: selectedSectionId },
        "*",
      );
    }
  }, [selectedSectionId]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === "CANVAS_READY") {
        // Send initial data
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage(
            { type: "SYNC_SECTIONS", payload: sections },
            "*",
          );
          // In a real app we'd fetch actual WebSettings theme tokens here
          iframeRef.current.contentWindow.postMessage(
            {
              type: "SYNC_THEME",
              payload: {
                colors: { primary: "#3B82F6" },
                fonts: { heading: "Inter, sans-serif" },
              },
            },
            "*",
          );
        }
      } else if (type === "SECTION_SELECTED") {
        setSelectedSectionId(payload);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [sections]);

  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );

  const handleSaveDraft = async () => {
    if (!editingPage) return;
    setSavingState("saving");
    await updateItem(editingPage.id, { sections: JSON.stringify(sections) });
    setSavingState("saved");
    setTimeout(() => setSavingState("idle"), 1500);
  };

  const handlePublishPage = async () => {
    if (!editingPage) return;
    setSavingState("saving");
    await updateItem(editingPage.id, {
      sections: JSON.stringify(sections),
      status: "PUBLISHED",
    });
    setSavingState("saved");
    setTimeout(() => setSavingState("idle"), 1500);
  };

  const handleUnpublish = async () => {
    if (!editingPage) return;
    await updateItem(editingPage.id, { status: "DRAFT" });
  };

  const handlePreview = () => {
    if (!editingPage) return;
    window.open(`/${editingPage.slug}`, "_blank");
  };

  const filtered = PAGES_DB.filter((p: any) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- Block Library Handlers ---
  const handleAddBlock = (blockType: string, label: string) => {
    const newSection = {
      id: `s_${generateId()}`,
      type: blockType,
      label: label,
      content: {}, // Default empty props for now
    };
    setSections([...sections, newSection]);
    setSelectedSectionId(newSection.id);
  };

  const removeSection = (e: React.MouseEvent, idx: number) => {
    e.stopPropagation();
    const newSections = [...sections];
    newSections.splice(idx, 1);
    setSections(newSections);
    if (selectedSectionId === sections[idx].id) {
      setSelectedSectionId(null);
    }
  };

  return (
    <div className={styles.s1}>
      {/* Header */}
      <PageHeader
        title={
          activeTab === "list"
            ? "Website Pages"
            : `Visual Editor: ${editingPage?.name || ""}`
        }
        description={
          activeTab === "list" ? "Manage your public-facing pages" : undefined
        }
        actions={
          <div className={styles.s2}>
            {activeTab === "editor" && (
              <>
                <button
                  className="ui-btn ui-btn-secondary"
                  onClick={() => {
                    setEditingPageId(null);
                    router.push("/builder/web/pages?subtab=list");
                  }}
                >
                  Back to List
                </button>
                {editingPage?.status === "PUBLISHED" && (
                  <span className={styles.s3}>
                    <CheckCircle size={13} /> Live
                  </span>
                )}
                <button
                  className="ui-btn ui-btn-secondary"
                  onClick={handlePreview}
                >
                  <Eye size={15} /> <span>Preview</span>
                </button>
                <button
                  className="ui-btn ui-btn-secondary"
                  onClick={handleSaveDraft}
                >
                  {savingState === "saving"
                    ? "Saving…"
                    : savingState === "saved"
                      ? "Saved ✓"
                      : "Save Draft"}
                </button>
              </>
            )}
            {activeTab === "editor" ? (
              <button
                className="ui-btn ui-btn-primary"
                onClick={handlePublishPage}
              >
                <CheckCircle size={15} />
                <span>
                  {editingPage?.status === "PUBLISHED"
                    ? "Update Live"
                    : "Publish"}
                </span>
              </button>
            ) : (
              <button
                className="ui-btn ui-btn-primary"
                onClick={() => {
                  setEditingItem(null);
                  setIsModalOpen(true);
                }}
              >
                <PlusCircle size={15} />
                <span>New Page</span>
              </button>
            )}
          </div>
        }
      />

      {activeTab === "list" && (
        <div className={styles.s4}>
          <div className={styles.s5}>
            <Search size={15} className="ui-input-icon-abs" />
            <input
              className={`ui-input ${styles.s6}`}
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DataTable<any>
            columns={[
              {
                key: "name",
                header: "Page Name",
                render: (row: any) => (
                  <div className={styles.s7}>
                    <FileText size={16} className="ui-text-tertiary" />
                    {row.name}
                  </div>
                ),
              },
              {
                key: "slug",
                header: "URL Slug",
                render: (row: any) => (
                  <span className={styles.s8}>/{row.slug}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (row: any) => (
                  <span
                    className={`ui-badge ${row.status === "PUBLISHED" ? "ui-badge-success" : "ui-badge-warning"}`}
                  >
                    {row.status || "DRAFT"}
                  </span>
                ),
              },
              {
                key: "visibility",
                header: "Visibility",
                render: (row: any) => <span>{row.visibility || "PUBLIC"}</span>,
              },
              {
                key: "actions",
                header: "Actions",
                width: "120px",
                render: (row: any) => (
                  <div
                    className="ui-flex ui-gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className={`ui-btn ui-btn-secondary ${styles.s9}`}
                      onClick={() => {
                        setEditingItem(row);
                        setIsModalOpen(true);
                      }}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className={`ui-btn ui-btn-secondary ${styles.s10}`}
                      onClick={() => setDeleteTarget(row.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ),
              },
            ]}
            data={filtered}
            rowKey={(row: any) => row.id}
            onRowClick={(row: any) => {
              setEditingPageId(row.id);
              router.push("/builder/web/pages?subtab=editor");
            }}
            emptyTitle="No pages found"
            emptyMessage="No pages found matching your search."
          />
        </div>
      )}

      {activeTab === "editor" && editingPage && (
        <div className={styles.s11}>
          {/* Left Sidebar: Block Library & Outline */}
          <div className={`ui-card ${styles.s12}`}>
            <div className={styles.s13}>Block Library</div>
            <div className={styles.s14}>
              <div className={styles.s15}>
                {SECTIONS_PALETTE.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => handleAddBlock(block.type, block.label)}
                    className={`${styles.s16} ${styles.blockOption}`}
                  >
                    {renderBlockIcon(block.type, 20, "ui-text-muted")}
                    <span className={styles.s17}>{block.label}</span>
                  </button>
                ))}
              </div>

              <hr className={styles.s18} />

              <div className={styles.s19}>Page Outline</div>
              {sections.length === 0 ? (
                <div className={styles.s20}>
                  No blocks added yet. Click above to add.
                </div>
              ) : (
                <div className="ui-stack-2">
                  {sections.map((section, idx) => (
                    <div
                      key={section.id}
                      onClick={() => setSelectedSectionId(section.id)}
                      style={{
                        background:
                          selectedSectionId === section.id
                            ? "rgba(59, 130, 246, 0.1)"
                            : "var(--color-bg-elevated)",
                        border: `1px solid ${selectedSectionId === section.id ? "var(--color-primary)" : "var(--color-border)"}`,
                      }}
                      className={styles.s21}
                    >
                      <div className="ui-hstack-2">
                        <Move size={14} className="ui-text-tertiary" />
                        <span className={styles.s22}>
                          {section.label || section.type}
                        </span>
                      </div>
                      <button
                        onClick={(e) => removeSection(e, idx)}
                        className="ui-btn-icon"
                      >
                        <Trash2 size={14} className="ui-text-danger" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Canvas iframe wrapper */}
          <div className={styles.s23}>
            <div className={styles.s24}>
              <div className={styles.s25}>
                <button className={`ui-btn ui-btn-secondary ${styles.s26}`}>
                  <Monitor size={14} />
                </button>
              </div>
            </div>
            <div className={styles.s27}>
              <iframe
                ref={iframeRef}
                src={`/builder/web/canvas?pageId=${editingPageId}`}
                className={styles.s28}
                title="Live Canvas"
              />
            </div>
          </div>

          {/* Right Sidebar: Block Inspector */}
          {selectedSection && (
            <div className={`ui-card ${styles.s29}`}>
              <div className={styles.s30}>
                <span className="font-bold">Block Properties</span>
                <span className={styles.s31}>{selectedSection.type}</span>
              </div>
              <div className={styles.s32}>
                {(
                  BLOCK_INSPECTOR[selectedSection.type] || [
                    { name: "title", label: "Title", type: "text" },
                  ]
                ).map((field) => {
                  const value = (selectedSection.content || {})[field.name];
                  // Collection picker gets its options from the tenant's collections.
                  const options =
                    field.name === "collectionSlug"
                      ? collections.map((c) => ({
                          label: `${c.icon || ""} ${c.name}`,
                          value: c.slug,
                        }))
                      : (field.options || []).map((o) => ({
                          label: o,
                          value: o,
                        }));
                  return (
                    <div key={field.name}>
                      {field.type !== "checkbox" && (
                        <label className="ui-label text-xs">
                          {field.label}
                        </label>
                      )}
                      {field.type === "textarea" ? (
                        <textarea
                          className={`ui-input ${styles.s33}`}
                          value={value || ""}
                          onChange={(e) =>
                            updateContent({ [field.name]: e.target.value })
                          }
                        />
                      ) : field.type === "select" ? (
                        <select
                          className="ui-input"
                          value={value ?? ""}
                          onChange={(e) =>
                            updateContent({ [field.name]: e.target.value })
                          }
                        >
                          <option value="">
                            {field.name === "collectionSlug"
                              ? "Choose a collection…"
                              : "Select…"}
                          </option>
                          {options.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "number" ? (
                        <input
                          className="ui-input"
                          type="number"
                          value={value ?? ""}
                          onChange={(e) =>
                            updateContent({
                              [field.name]:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                        />
                      ) : (field.type as string) === "asset" ? (
                        <div className={styles.s34}>
                          <input
                            className="ui-input"
                            type="text"
                            value={value || ""}
                            placeholder="Image URL"
                            onChange={(e) =>
                              updateContent({ [field.name]: e.target.value })
                            }
                          />
                          {assets.length > 0 && (
                            <select
                              className="ui-input"
                              value=""
                              onChange={(e) =>
                                e.target.value &&
                                updateContent({ [field.name]: e.target.value })
                              }
                            >
                              <option value="">
                                📁 Pick from Asset Manager…
                              </option>
                              {assets.map((a) => (
                                <option key={a.id} value={a.url}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          )}
                          {value && (
                            <img src={value} alt="" className={styles.s35} />
                          )}
                        </div>
                      ) : field.type === "checkbox" ? (
                        <label className={styles.s36}>
                          <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) =>
                              updateContent({ [field.name]: e.target.checked })
                            }
                          />{" "}
                          {field.label}
                        </label>
                      ) : (
                        <input
                          className="ui-input"
                          type="text"
                          value={value || ""}
                          onChange={(e) =>
                            updateContent({ [field.name]: e.target.value })
                          }
                        />
                      )}
                    </div>
                  );
                })}
                {selectedSection.type === "collection" &&
                  !(selectedSection.content || {}).collectionSlug && (
                    <div className={styles.s37}>
                      {collections.length === 0 ? (
                        <>
                          No collections yet. Create one in{" "}
                          <strong>CMS Collections</strong> first.
                        </>
                      ) : (
                        <>
                          Pick a collection above to render its published items
                          here.
                        </>
                      )}
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}

      <GenericBuilderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? "Edit Page Settings" : "Create New Page"}
        fields={[
          { name: "name", label: "Page Name", type: "text", required: true },
          { name: "slug", label: "URL Slug", type: "text", required: true },
          { name: "metaTitle", label: "Meta Title", type: "text" },
          { name: "metaDesc", label: "Meta Description", type: "text" },
          {
            name: "visibility",
            label: "Visibility",
            type: "select",
            options: [
              { label: "Public", value: "PUBLIC" },
              { label: "Unlisted", value: "UNLISTED" },
            ],
          },
        ]}
        initialData={editingItem}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteItem(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        title="Delete Page"
        message="Are you sure you want to delete this page? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

import { Suspense } from "react";

export default function WebBuilderPagesPage() {
  return (
    <Suspense fallback={<div className={styles.s38}>Loading Web Pages...</div>}>
      <WebBuilderPagesPageContent />
    </Suspense>
  );
}
