// @ts-nocheck
"use client";
import React, { useEffect, useState } from "react";
import { Card, PageHeader, Spinner, Button } from "@unerp/ui";
import {
  Palette,
  BarChart3,
  FileText,
  MessageSquare,
  Bell,
  Users,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { apiGet, apiSend } from "../_components/api";

interface Customization {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  headerTitle: string;
  welcomeMessage: string;
  showKnowledgeBase: boolean;
  showTickets: boolean;
  showBilling: boolean;
  showDocuments: boolean;
  customCss?: string;
  domains?: any;
}
interface Analytics {
  totalCustomers: number;
  totalDocuments: number;
  totalForumTopics: number;
  totalForumReplies: number;
  totalNotifications: number;
}

export default function PortalSettingsPage() {
  const [custom, setCustom] = useState<Customization | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, a] = await Promise.all([
        apiGet("/api/crm/portal/customization"),
        apiGet("/api/crm/portal/analytics"),
      ]);
      setCustom(
        c &&
          typeof c === "object" &&
          !Array.isArray(c) &&
          Object.keys(c).length > 0
          ? (c as Customization)
          : null,
      );
      setAnalytics(
        a &&
          typeof a === "object" &&
          !Array.isArray(a) &&
          Object.keys(a).length > 0
          ? (a as Analytics)
          : null,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveCustomization = async () => {
    if (!custom) return;
    setSaving(true);
    try {
      await apiSend("/api/crm/portal/customization", "PUT", custom);
      alert("Saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-page">
      <PageHeader
        title="Portal Settings"
        description="Customize the customer portal and view usage analytics"
      />
      <div className="ui-flex ui-gap-2 ui-mb-4 ui-flex-wrap">
        <Link href="/crm/portal-settings/documents">
          <Button variant="outline">
            <FileText size={14} /> Documents
          </Button>
        </Link>
        <Link href="/crm/portal-settings/forum">
          <Button variant="outline">
            <MessageSquare size={14} /> Forum
          </Button>
        </Link>
        <Link href="/crm/portal-settings/notifications">
          <Button variant="outline">
            <Bell size={14} /> Notifications
          </Button>
        </Link>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="ui-grid-2">
          <Card>
            <div className="ui-card-body">
              <h3 className="ui-card-title">
                <Palette size={16} /> Branding & Customization
              </h3>
              {custom && (
                <div>
                  <div className="ui-form-group">
                    <label className="ui-label">Portal Title</label>
                    <input
                      className="ui-input"
                      value={custom.headerTitle}
                      onChange={(e) =>
                        setCustom({ ...custom, headerTitle: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Welcome Message</label>
                    <input
                      className="ui-input"
                      value={custom.welcomeMessage}
                      onChange={(e) =>
                        setCustom({ ...custom, welcomeMessage: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Primary Color</label>
                    <input
                      className="ui-input"
                      type="color"
                      value={custom.primaryColor}
                      onChange={(e) =>
                        setCustom({ ...custom, primaryColor: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Secondary Color</label>
                    <input
                      className="ui-input"
                      type="color"
                      value={custom.secondaryColor}
                      onChange={(e) =>
                        setCustom({ ...custom, secondaryColor: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Logo URL</label>
                    <input
                      className="ui-input"
                      value={custom.logoUrl || ""}
                      onChange={(e) =>
                        setCustom({ ...custom, logoUrl: e.target.value })
                      }
                    />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Show Sections</label>
                    <div className="ui-flex ui-gap-3 ui-flex-wrap">
                      {(
                        [
                          "showKnowledgeBase",
                          "showTickets",
                          "showBilling",
                          "showDocuments",
                        ] as const
                      ).map((f) => (
                        <label
                          key={f}
                          className="ui-flex ui-items-center ui-gap-1 ui-text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={custom[f] as boolean}
                            onChange={(e) =>
                              setCustom({ ...custom, [f]: e.target.checked })
                            }
                          />
                          {f.replace("show", "")}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Custom CSS</label>
                    <textarea
                      className="ui-input"
                      rows={3}
                      value={custom.customCss || ""}
                      onChange={(e) =>
                        setCustom({ ...custom, customCss: e.target.value })
                      }
                    />
                  </div>
                  <Button onClick={saveCustomization} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          <div>
            <Card className="ui-mb-4">
              <div className="ui-card-body">
                <h3 className="ui-card-title">
                  <BarChart3 size={16} /> Portal Analytics
                </h3>
                {analytics ? (
                  <div className="ui-grid-2">
                    <div>
                      <p className="ui-text-xs text-muted">Customers</p>
                      <p className="ui-text-lg ui-font-bold">
                        {analytics.totalCustomers}
                      </p>
                    </div>
                    <div>
                      <p className="ui-text-xs text-muted">Documents</p>
                      <p className="ui-text-lg ui-font-bold">
                        {analytics.totalDocuments}
                      </p>
                    </div>
                    <div>
                      <p className="ui-text-xs text-muted">Forum Topics</p>
                      <p className="ui-text-lg ui-font-bold">
                        {analytics.totalForumTopics}
                      </p>
                    </div>
                    <div>
                      <p className="ui-text-xs text-muted">Notifications</p>
                      <p className="ui-text-lg ui-font-bold">
                        {analytics.totalNotifications}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="ui-text-sm text-muted">Loading...</p>
                )}
              </div>
            </Card>

            {analytics && analytics.totalForumTopics > 0 && (
              <Card>
                <div className="ui-card-body">
                  <h3 className="ui-card-title">
                    <MessageSquare size={16} /> Recent Topics
                  </h3>
                  {(analytics as any).recentTopics?.map((t: any) => (
                    <div
                      key={t.id}
                      className="ui-flex ui-items-center ui-justify-between ui-py-1 ui-border-b"
                    >
                      <span className="ui-text-sm">{t.title}</span>
                      <span className="ui-text-xs text-muted">
                        {t._count?.replies || 0} replies
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
