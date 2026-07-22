"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  ConfirmDialog,
  ListPageTemplate,
  type ListColumn,
} from "@unerp/ui";
import { useApiClient } from "@unerp/framework";
import {
  Database,
  Plus,
  Search,
  Trash2,
  Edit3,
  Star,
  ArrowLeft,
  X,
  Sparkles,
  Layers,
  CheckCircle,
  Circle,
  Eye,
  Wand2,
  Globe,
  FileText,
  GripVertical,
} from "lucide-react";

const FIELD_TYPES = [
  "Text",
  "Textarea",
  "RichText",
  "Number",
  "Price",
  "Boolean",
  "Date",
  "Image",
  "Gallery",
  "Select",
  "Color",
  "URL",
  "Email",
  "Tags",
  "Reference",
];

// ════════════════════════════════════════════════
// Dynamic entry field renderer
// ════════════════════════════════════════════════
function EntryField({
  field,
  value,
  onChange,
}: {
  field: any;
  value: any;
  onChange: (v: any) => void;
}) {
  const label = (
    <label className={styles.s1}>
      {field.label}
      {field.required && <span className="ui-text-danger"> *</span>}
    </label>
  );
  const base: React.CSSProperties = {
    width: "100%",
    padding: "var(--space-2) var(--space-3)",
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--color-border)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    fontSize: "var(--text-sm)",
  };

  switch (field.type) {
    case "Boolean":
      return (
        <div>
          <label className={styles.s2}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />{" "}
            {field.label}
          </label>
        </div>
      );
    case "Textarea":
    case "RichText":
      return (
        <div>
          {label}
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={{
              ...base,
              minHeight: field.type === "RichText" ? 140 : 70,
              fontFamily: field.type === "RichText" ? "inherit" : undefined,
            }}
            className={styles.s3}
            placeholder={
              field.type === "RichText"
                ? "Rich content (HTML/markdown supported at render time)…"
                : ""
            }
          />
        </div>
      );
    case "Number":
    case "Price":
      return (
        <div>
          {label}
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? "" : Number(e.target.value))
            }
            style={base}
            placeholder={field.type === "Price" ? "0.00" : "0"}
          />
        </div>
      );
    case "Date":
      return (
        <div>
          {label}
          <input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={base}
          />
        </div>
      );
    case "Color":
      return (
        <div>
          {label}
          <div className={styles.s4}>
            <input
              type="color"
              value={value || "#000000"}
              onChange={(e) => onChange(e.target.value)}
              className={styles.s5}
            />
            <input
              value={value || ""}
              onChange={(e) => onChange(e.target.value)}
              style={base}
              placeholder="#000000"
            />
          </div>
        </div>
      );
    case "Select":
      return (
        <div>
          {label}
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={base}
          >
            <option value="">Select…</option>
            {String(field.options || "")
              .split(/\n|,/)
              .map((o: string) => o.trim())
              .filter(Boolean)
              .map((o: string) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
          </select>
        </div>
      );
    case "Gallery":
      return (
        <div>
          {label}
          <textarea
            value={Array.isArray(value) ? value.join("\n") : value || ""}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            style={{ ...base }}
            className={styles.s6}
            placeholder="One image URL per line"
          />
        </div>
      );
    case "Tags":
      return (
        <div>
          {label}
          <input
            value={Array.isArray(value) ? value.join(", ") : value || ""}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
            style={base}
            placeholder="comma, separated, tags"
          />
        </div>
      );
    case "Image":
      return (
        <div>
          {label}
          <input
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={base}
            placeholder="https://… image URL"
          />
          {value && <img src={value} alt="" className={styles.s7} />}
        </div>
      );
    default: // Text, URL, Email, Reference (basic)
      return (
        <div>
          {label}
          <input
            type={
              field.type === "Email"
                ? "email"
                : field.type === "URL"
                  ? "url"
                  : "text"
            }
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            style={base}
            placeholder={field.helpText || ""}
          />
        </div>
      );
  }
}

// ════════════════════════════════════════════════
// Entry editor drawer
// ════════════════════════════════════════════════
function EntryEditor({
  collection,
  item,
  onClose,
  onSaved,
}: {
  collection: any;
  item: any | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const client = useApiClient();
  const fields: any[] = Array.isArray(collection.fields)
    ? collection.fields
    : [];
  const [data, setData] = useState<Record<string, any>>(item?.data || {});
  const [status, setStatus] = useState(item?.status || "DRAFT");
  const [featured, setFeatured] = useState(!!item?.featured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    // Required validation
    const missing = fields.filter(
      (f) =>
        f.required &&
        (data[f.name] === undefined ||
          data[f.name] === "" ||
          data[f.name] === null),
    );
    if (missing.length) {
      setError(`Missing required: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (item) {
        await client.patch(
          `/builder/web-collections/${collection.id}/items/${item.id}`,
          { data, status, featured },
        );
      } else {
        await client.post(`/builder/web-collections/${collection.id}/items`, {
          data,
          status,
          featured,
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className={styles.s8}>
      <div className={styles.s9} onClick={onClose} />
      <div className={styles.s10}>
        <div className={styles.s11}>
          <div>
            <h3 className={styles.s12}>
              {item ? "Edit" : "New"} {collection.singular || "Entry"}
            </h3>
            <span className="ui-text-xs-soft">{collection.name}</span>
          </div>
          <button onClick={onClose} className={styles.s13}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.s14}>
          {error && <div className={styles.s15}>{error}</div>}
          {fields.length === 0 && (
            <div className={styles.s16}>
              This collection has no fields yet. Add fields in collection
              settings.
            </div>
          )}
          {fields.map((f) => (
            <EntryField
              key={f.name}
              field={f}
              value={data[f.name]}
              onChange={(v) => setData((p) => ({ ...p, [f.name]: v }))}
            />
          ))}
        </div>

        <div className={styles.s17}>
          <div className={styles.s18}>
            {["DRAFT", "PUBLISHED"].map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                style={{
                  background:
                    status === s
                      ? s === "PUBLISHED"
                        ? "#16a34a"
                        : "var(--color-text-secondary)"
                      : "transparent",
                  color: status === s ? "#fff" : "var(--color-text-secondary)",
                }}
                className={styles.s19}
              >
                {s === "PUBLISHED" ? "Published" : "Draft"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFeatured(!featured)}
            title="Featured"
            style={{ color: featured ? "#f59e0b" : "var(--color-text-muted)" }}
            className={styles.s20}
          >
            <Star size={16} fill={featured ? "#f59e0b" : "none"} />
          </button>
          <div className="flex-1" />
          <button onClick={handleSave} disabled={saving} className={styles.s21}>
            {saving ? "Saving…" : "Save Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// Create-collection modal (presets + custom field builder)
// ════════════════════════════════════════════════
function CreateCollectionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const client = useApiClient();
  const [tab, setTab] = useState<"preset" | "custom">("preset");
  const [presets, setPresets] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fields, setFields] = useState<any[]>([
    { name: "title", label: "Title", type: "Text", required: true },
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    client
      .get<any[]>("/builder/web-collections/presets")
      .then(setPresets)
      .catch(() => setPresets([]));
  }, [client]);

  const seedPreset = async (preset: string) => {
    setBusy(preset);
    try {
      await client.post("/builder/web-collections/seed", { preset });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
    setBusy(null);
  };

  const addField = () =>
    setFields([
      ...fields,
      { name: "", label: "", type: "Text", required: false },
    ]);
  const updateField = (i: number, key: string, val: any) => {
    const n = [...fields];
    (n[i] as any)[key] = val;
    if (key === "label" && !n[i].name)
      n[i].name = String(val)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/(^_|_$)/g, "");
    setFields(n);
  };
  const removeField = (i: number) =>
    setFields(fields.filter((_, idx) => idx !== i));

  const createCustom = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Name and slug are required");
      return;
    }
    setBusy("custom");
    try {
      await client.post("/builder/web-collections", {
        name,
        slug,
        singular: name,
        fields,
        settings: { titleField: fields[0]?.name || "title" },
      });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    }
    setBusy(null);
  };

  return (
    <div className={styles.s22}>
      <div className={styles.s23} onClick={onClose} />
      <div className={styles.s24}>
        <div className={styles.s25}>
          <h3 className={styles.s26}>New Collection</h3>
          <button onClick={onClose} className={styles.s13}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.s27}>
          {(
            [
              ["preset", "Start from preset", Sparkles],
              ["custom", "Build custom", Wand2],
            ] as const
          ).map(([v, lbl, Icon]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              style={{
                borderBottom:
                  tab === v
                    ? "2px solid var(--color-primary)"
                    : "2px solid transparent",
                color:
                  tab === v
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
              }}
              className={styles.s28}
            >
              <Icon size={15} /> {lbl}
            </button>
          ))}
        </div>

        <div className={styles.s29}>
          {error && <div className={styles.s30}>{error}</div>}

          {tab === "preset" ? (
            <div className="ui-grid-2 ui-gap-3">
              {presets.map((p) => (
                <button
                  key={p.preset}
                  onClick={() => seedPreset(p.preset)}
                  disabled={!!busy}
                  className={`${styles.s31} ${styles.presetCard}`}
                  style={{ "--preset-color": p.color } as React.CSSProperties}
                >
                  <div className={styles.s32}>{p.icon}</div>
                  <div>
                    <div className={styles.s33}>{p.name}</div>
                    <div className={styles.s34}>{p.description}</div>
                    <div className={styles.s35}>
                      {busy === p.preset
                        ? "Creating…"
                        : `${p.fieldCount} fields · ${p.sampleCount} samples`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="ui-stack-4">
              <div className="ui-grid-2 ui-gap-3">
                <div>
                  <label className={styles.s1}>Name</label>
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .replace(/(^-|-$)/g, ""),
                      );
                    }}
                    placeholder="e.g. Case Studies"
                    className={styles.s36}
                  />
                </div>
                <div>
                  <label className={styles.s1}>Slug</label>
                  <input
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className={styles.s37}
                  />
                </div>
              </div>
              <div>
                <div className="ui-flex-between mb-2">
                  <label className={styles.s38}>Fields</label>
                  <button onClick={addField} className={styles.s39}>
                    <Plus size={14} /> Add Field
                  </button>
                </div>
                {fields.map((f, i) => (
                  <div key={i} className={styles.s40}>
                    <input
                      value={f.label}
                      onChange={(e) => updateField(i, "label", e.target.value)}
                      placeholder="Label"
                      className={styles.s41}
                    />
                    <input
                      value={f.name}
                      onChange={(e) => updateField(i, "name", e.target.value)}
                      placeholder="field_name"
                      className={styles.s42}
                    />
                    <select
                      value={f.type}
                      onChange={(e) => updateField(i, "type", e.target.value)}
                      className={styles.s43}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <label className={styles.s44}>
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) =>
                          updateField(i, "required", e.target.checked)
                        }
                      />
                      Req
                    </label>
                    <button
                      onClick={() => removeField(i)}
                      className={styles.s13}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="ui-flex-end">
                <button
                  onClick={createCustom}
                  disabled={busy === "custom"}
                  className={styles.s45}
                >
                  {busy === "custom" ? "Creating…" : "Create Collection"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════
// Main page
// ════════════════════════════════════════════════
export default function WebCollectionsPage() {
  const client = useApiClient();
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [active, setActive] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingItem, setEditingItem] = useState<any | null | undefined>(
    undefined,
  ); // undefined=closed, null=new

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      setCollections(await client.get<any[]>("/builder/web-collections"));
    } catch {
      setCollections([]);
    }
    setLoading(false);
  }, [client]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const fetchItems = useCallback(
    async (col: any) => {
      const qp = new URLSearchParams();
      if (itemSearch) qp.set("search", itemSearch);
      if (statusFilter !== "ALL") qp.set("status", statusFilter);
      try {
        const d = await client.get<{ data?: any[] }>(
          `/builder/web-collections/${col.id}/items?${qp}`,
        );
        setItems(d.data || []);
      } catch {
        setItems([]);
      }
    },
    [client, itemSearch, statusFilter],
  );

  useEffect(() => {
    if (active) fetchItems(active);
  }, [active, fetchItems]);

  const openCollection = async (col: any) => {
    setActive(col);
    setStatusFilter("ALL");
    setItemSearch("");
  };

  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<
    string | null
  >(null);
  const [deleteItemTarget, setDeleteItemTarget] = useState<string | null>(null);

  const deleteCollection = async (id: string) => {
    await client.delete(`/builder/web-collections/${id}`);
    fetchCollections();
  };

  const deleteItem = async (id: string) => {
    await client.delete(`/builder/web-collections/${active.id}/items/${id}`);
    fetchItems(active);
  };

  const titleOf = (col: any, item: any) => {
    const tf = (col.settings && (col.settings as any).titleField) || "title";
    const d = item.data || {};
    return d[tf] || d.name || d.title || item.slug;
  };

  // ── Items view ──
  if (active) {
    const fieldCount = Array.isArray(active.fields) ? active.fields.length : 0;
    return (
      <div className="p-6 ui-stack-5">
        <div className={styles.s46}>
          <div>
            <button onClick={() => setActive(null)} className={styles.s47}>
              <ArrowLeft size={14} /> All Collections
            </button>
            <div className="ui-hstack-2">
              <span className={styles.s48}>{active.icon || "📦"}</span>
              <h1 className={styles.s49}>{active.name}</h1>
              <span className={styles.s50}>{active.kind}</span>
            </div>
            <p className={styles.s51}>
              {items.length} entries · {fieldCount} fields ·{" "}
              <span className="font-mono">/{active.slug}</span>
            </p>
          </div>
          <button
            className="ui-btn ui-btn-primary"
            onClick={() => setEditingItem(null)}
          >
            <Plus size={15} /> New {active.singular || "Entry"}
          </button>
        </div>

        <div className="ui-stack-3">
          <div className={styles.s52}>
            <div className={styles.s53}>
              <Search size={14} className={styles.s54} />
              <input
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                placeholder="Search entries…"
                className={styles.s55}
              />
            </div>
            {["ALL", "PUBLISHED", "DRAFT"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{
                  border:
                    statusFilter === s
                      ? "1px solid var(--color-primary)"
                      : "1px solid var(--color-border)",
                  background:
                    statusFilter === s
                      ? "var(--color-primary-bg)"
                      : "transparent",
                  color:
                    statusFilter === s
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                }}
                className={styles.s56}
              >
                {s.toLowerCase()}
              </button>
            ))}
          </div>
          <ListPageTemplate
            title=""
            columns={
              [
                {
                  key: "id",
                  header: "Title",
                  render: (_v, row) => {
                    const it = row as unknown as {
                      id: string;
                      data: Record<string, unknown>;
                      slug: string;
                    };
                    return (
                      <span className="font-medium">{titleOf(active, it)}</span>
                    );
                  },
                },
                {
                  key: "status",
                  header: "Status",
                  width: "110px",
                  render: (v) => (
                    <span
                      className={`ui-badge ${v === "PUBLISHED" ? "ui-badge-success" : "ui-badge-warning"}`}
                    >
                      {String(v)}
                    </span>
                  ),
                },
                {
                  key: "featured",
                  header: "Featured",
                  width: "70px",
                  render: (v) =>
                    v ? (
                      <Star size={14} fill="#f59e0b" className={styles.s57} />
                    ) : (
                      <span className="ui-text-tertiary">—</span>
                    ),
                },
                {
                  key: "slug",
                  header: "Slug",
                  width: "160px",
                  render: (v) => (
                    <span className={styles.s58}>{String(v)}</span>
                  ),
                },
                {
                  key: "id",
                  header: "",
                  width: "90px",
                  render: (_v, row) => {
                    const it = row as unknown as { id: string };
                    return (
                      <div
                        className={styles.s59}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className={`ui-btn ui-btn-secondary ${styles.s60}`}
                          onClick={() => setEditingItem(row)}
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          className={`ui-btn ui-btn-secondary ${styles.s61}`}
                          onClick={() => setDeleteItemTarget(it.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    );
                  },
                },
              ] as ListColumn[]
            }
            data={items as unknown as Record<string, unknown>[]}
            onRowClick={(row) => setEditingItem(row)}
            emptyTitle={`No entries yet`}
            emptyDescription={`Click “New ${active.singular || "Entry"}” to add the first entry.`}
          />
        </div>

        {editingItem !== undefined && (
          <EntryEditor
            collection={active}
            item={editingItem}
            onClose={() => setEditingItem(undefined)}
            onSaved={() => {
              setEditingItem(undefined);
              fetchItems(active);
              fetchCollections();
            }}
          />
        )}
        <ConfirmDialog
          open={!!deleteItemTarget}
          onClose={() => setDeleteItemTarget(null)}
          onConfirm={() => {
            if (deleteItemTarget) {
              deleteItem(deleteItemTarget);
              setDeleteItemTarget(null);
            }
          }}
          title="Delete Entry"
          message="Are you sure you want to delete this entry?"
          confirmLabel="Delete"
          variant="danger"
        />
      </div>
    );
  }

  // ── Collections list view ──
  return (
    <div className="p-6 ui-stack-5">
      <PageHeader
        title="CMS Collections"
        description="Model dynamic content — products, projects, team, testimonials — for your website"
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
              onClick={() => setShowCreate(true)}
            >
              <Plus size={15} /> New Collection
            </button>
          </div>
        }
      />

      {loading ? (
        <div className={styles.s62}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={`ui-card ${styles.s63}`} />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="ui-card text-center p-12">
          <Layers size={44} className={styles.s64} />
          <h3 className={styles.s65}>No collections yet</h3>
          <p className={styles.s66}>
            Start from a ready-made preset (Products, Projects, Team…) or build
            your own.
          </p>
          <button
            className={`ui-btn ui-btn-primary ${styles.s67}`}
            onClick={() => setShowCreate(true)}
          >
            <Sparkles size={15} /> Create your first collection
          </button>
        </div>
      ) : (
        <div className={styles.s62}>
          {collections.map((c) => (
            <div
              key={c.id}
              onClick={() => openCollection(c)}
              className={`ui-card ${styles.s68} ${styles.collectionCard}`}
              style={{
                borderTop: `3px solid ${c.color || "var(--color-primary)"}`,
              }}
            >
              <div className="ui-flex-between ui-items-start">
                <div className="ui-hstack-3">
                  <div
                    style={{ background: `${c.color || "#6366f1"}18` }}
                    className={styles.s69}
                  >
                    {c.icon || "📦"}
                  </div>
                  <div>
                    <div className={styles.s70}>{c.name}</div>
                    <div className={styles.s71}>/{c.slug}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteCollectionTarget(c.id);
                  }}
                  className={styles.s72}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className={styles.s73}>
                <span>
                  <strong className={styles.s74}>{c.itemCount ?? 0}</strong>{" "}
                  entries
                </span>
                <span>
                  <strong className={styles.s74}>
                    {Array.isArray(c.fields) ? c.fields.length : 0}
                  </strong>{" "}
                  fields
                </span>
                <span style={{ color: c.color }} className={styles.s75}>
                  {c.kind}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCollectionModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchCollections();
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleteCollectionTarget}
        onClose={() => setDeleteCollectionTarget(null)}
        onConfirm={() => {
          if (deleteCollectionTarget) {
            deleteCollection(deleteCollectionTarget);
            setDeleteCollectionTarget(null);
          }
        }}
        title="Delete Collection"
        message="Are you sure you want to delete this collection and all its entries? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
      <style>{`@keyframes pulse {0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  );
}
