"use client";
import styles from "./BrandingTab.module.css";
import React, { useRef, useState, useEffect } from "react";
import {
  Image as ImageIcon,
  Loader2,
  Check,
  Link2,
  X,
  ImagePlus,
} from "lucide-react";
import { useApiClient } from "@unerp/framework";
import { resizeImageFile } from "../../../../src/lib/imageResize";

/** Logos are stored as a data URI (same convention as the avatar upload) — cap the final payload. */
const MAX_LOGO_BYTES = 300 * 1024;

export default function BrandingTab() {
  const client = useApiClient();
  const [loading, setLoading] = useState(true);
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );
  const [logoError, setLogoError] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSettings = async () => {
    try {
      const data = await client.get<{
        tenant?: { settings?: { primaryColor?: string; logoUrl?: string } };
      }>("/admin/settings");
      setPrimaryColor(data.tenant?.settings?.primaryColor || "#6366f1");
      setLogoUrl(data.tenant?.settings?.logoUrl || null);
    } catch {
      /* not loaded */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSettings();
  }, [client]);

  const saveLogo = async (nextLogoUrl: string | null) => {
    setSaveStatus("saving");
    setLogoError(null);
    try {
      await client.patch("/admin/settings", { logoUrl: nextLogoUrl ?? "" });
      setLogoUrl(nextLogoUrl);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
      setLogoError(
        err instanceof Error ? err.message : "Could not save the logo.",
      );
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Choose an image file (PNG, JPG, GIF, SVG, WebP).");
      return;
    }
    try {
      const resized = await resizeImageFile(file);
      if (resized.length > (MAX_LOGO_BYTES * 4) / 3) {
        setLogoError(
          "That image is too complex to store even after resizing — try a simpler image.",
        );
        return;
      }
      await saveLogo(resized);
    } catch (err) {
      setLogoError(
        err instanceof Error ? err.message : "Could not process that image.",
      );
    }
  };

  const handleUrlSave = async () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput.trim());
    } catch {
      setLogoError("Enter a valid, fully-qualified URL (https://...).");
      return;
    }
    await saveLogo(urlInput.trim());
    setUrlMode(false);
    setUrlInput("");
  };

  const handleSave = async (colorVal: string) => {
    setSaveStatus("saving");
    try {
      await client.request("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ primaryColor: colorVal }),
      });
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  };

  if (loading) {
    return <div className={styles.s1}>Loading branding settings...</div>;
  }

  return (
    <div className={styles.s2}>
      <div className={styles.s3}>
        {saveStatus === "saving" && (
          <span className={styles.s4}>
            <Loader2 size={12} className="animate-spin" />
            Saving changes...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className={styles.s5}>
            <Check size={14} /> All changes saved
          </span>
        )}
        {saveStatus === "error" && (
          <span className={styles.s6}>Error saving changes</span>
        )}
      </div>

      <div className={styles.s7}>
        <div>
          <h3 className={styles.s8}>
            <ImageIcon size={18} className="ui-text-primary" /> Branding
          </h3>
          <p className={styles.s9}>
            Customize the visual assets of your ERP client.
          </p>
        </div>
        <hr className={styles.s10} />

        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3 space-y-4">
              <div>
                <h4 className="text-base font-semibold text-foreground">
                  Company Logo
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your organization's logo. It will be resized to fit the
                  header and generated documents.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="ui-btn ui-btn-outline ui-btn-sm"
                  type="button"
                  onClick={() => setUrlMode((v) => !v)}
                >
                  <Link2 size={14} /> Use URL
                </button>
                {logoUrl && (
                  <button
                    className="ui-btn ui-btn-ghost ui-btn-sm text-danger hover:text-danger hover:bg-danger/10"
                    type="button"
                    onClick={() => saveLogo(null)}
                  >
                    <X size={14} /> Remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelected}
              />

              <div
                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[200px]
                  ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"}
                `}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) {
                    Object.defineProperty(e, "target", {
                      writable: true,
                      value: { files: e.dataTransfer.files },
                    });
                    handleFileSelected(e as any);
                  }
                }}
                onClick={() => !urlMode && fileInputRef.current?.click()}
              >
                {logoUrl && !urlMode ? (
                  <div className="relative group w-full h-full flex items-center justify-center">
                    <img
                      src={logoUrl}
                      alt="Company logo"
                      className="max-w-[200px] max-h-[120px] object-contain drop-shadow-sm group-hover:opacity-50 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="bg-background/90 text-foreground px-4 py-2 rounded-full text-sm font-medium shadow-sm flex items-center gap-2">
                        <ImagePlus size={16} /> Replace Logo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                      <ImagePlus size={24} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        Click to upload or drag and drop
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        SVG, PNG, JPG or WebP (max. 300KB)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {urlMode && (
                <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-2">
                  <input
                    className="ui-input flex-1"
                    placeholder="https://example.com/logo.png"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUrlSave()}
                  />
                  <button
                    className="ui-btn ui-btn-primary"
                    type="button"
                    onClick={handleUrlSave}
                  >
                    Save URL
                  </button>
                </div>
              )}

              {logoError && (
                <div className="mt-3 p-3 bg-danger/10 text-danger text-sm rounded-lg flex items-start gap-2">
                  <X size={16} className="shrink-0 mt-0.5" />
                  <p>{logoError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className={styles.s16}>Primary Brand Color (Hex)</label>
          <div className="ui-hstack-3">
            <input
              type="color"
              className={styles.s17}
              value={primaryColor}
              onChange={(e) => {
                const val = e.target.value;
                setPrimaryColor(val);
                handleSave(val);
              }}
            />
            <input
              className={styles.s18}
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              onBlur={() => handleSave(primaryColor)}
            />
          </div>
          <p className="ui-text-xs-muted mt-1">
            Used for primary buttons, active states, and highlights.
          </p>
        </div>
      </div>
    </div>
  );
}
