"use client";
import React, { useState, useEffect } from "react";
import { Card, PageHeader } from "@unerp/ui";
import {
  Palette,
  Globe,
  Shield,
  Bell,
  Upload,
  X,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Plug,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

type Tab = "branding" | "domains" | "sso" | "notifications" | "integrations";

interface CredentialField {
  key: string;
  label: string;
  value: string;
  isSet: boolean;
  sensitive: boolean;
}
interface CredentialProvider {
  provider: string;
  label: string;
  fields: CredentialField[];
}

interface Domain {
  id: string;
  domain: string;
  verified: boolean;
  sslStatus: "ACTIVE" | "PENDING" | "FAILED";
}

interface SSOProvider {
  id: string;
  provider: string;
  enabled: boolean;
  clientId: string;
  issuerUrl: string;
}

export default function SaasSettingsPage() {
  const client = useApiClient();
  const [activeTab, setActiveTab] = useState<Tab>("branding");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "branding", label: "Branding", icon: <Palette size={14} /> },
    { key: "domains", label: "Domains", icon: <Globe size={14} /> },
    { key: "sso", label: "SSO / Security", icon: <Shield size={14} /> },
    { key: "notifications", label: "Notifications", icon: <Bell size={14} /> },
    { key: "integrations", label: "Integrations", icon: <Plug size={14} /> },
  ];

  const [companyName, setCompanyName] = useState("My Company");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");

  const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [alertEmail, setAlertEmail] = useState("");

  const [credentialProviders, setCredentialProviders] = useState<
    CredentialProvider[]
  >([]);
  // Only fields the admin actually typed into are sent on save, so an
  // untouched masked placeholder is never resubmitted as if it were the
  // real secret. Keyed by `${provider}:${key}`.
  const [credentialEdits, setCredentialEdits] = useState<
    Record<string, string>
  >({});
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, ssoRes] = await Promise.all([
        client.get<Domain[]>("/saas/domains").catch(() => []),
        client.get<SSOProvider[]>("/saas/sso").catch(() => []),
      ]);
      setDomains(dRes || []);
      setSsoProviders(ssoRes || []);
      const branding = await client
        .get<{ companyName: string; primaryColor: string }>("/saas/branding")
        .catch(() => null);
      if (branding) {
        setCompanyName(branding.companyName || "My Company");
        setPrimaryColor(branding.primaryColor || "#6366f1");
      }
      const notif = await client
        .get<{
          billingAlerts?: boolean;
          usageAlerts?: boolean;
          webhookUrl?: string;
          alertEmail?: string;
        }>("/saas/notifications/preferences")
        .catch(() => null);
      if (notif) {
        setWebhookUrl((notif as any).webhookUrl || "");
        setAlertEmail((notif as any).alertEmail || "");
      }
      const creds = await client
        .get<CredentialProvider[]>("/admin/platform-credentials")
        .catch(() => null);
      if (creds) setCredentialProviders(creds);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put("/saas/branding", { companyName, primaryColor });
      showToast("Branding saved");
    } catch {
      showToast("Failed to save branding");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomain.trim()) return;
    try {
      await client.post("/saas/domains", { domain: newDomain.trim() });
      setNewDomain("");
      loadData();
      showToast("Domain added");
    } catch {
      showToast("Failed to add domain");
    }
  };

  const handleRemoveDomain = async (id: string) => {
    try {
      await client.delete(`/saas/domains/${id}`);
      loadData();
      showToast("Domain removed");
    } catch {
      showToast("Failed to remove domain");
    }
  };

  const handleVerifyDomain = async (id: string) => {
    try {
      await client.post(`/saas/domains/${id}/verify`);
      loadData();
      showToast("Domain verification requested");
    } catch {}
  };

  const handleToggleSSO = async (provider: SSOProvider) => {
    try {
      await client.patch(`/saas/sso/${provider.id}`, {
        enabled: !provider.enabled,
      });
      loadData();
    } catch {}
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.put("/saas/notifications/preferences", {
        webhookUrl,
        alertEmail,
      });
      showToast("Notification settings saved");
    } catch {
      showToast("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleCredentialFieldChange = (
    provider: string,
    key: string,
    value: string,
  ) => {
    setCredentialEdits((prev) => ({ ...prev, [`${provider}:${key}`]: value }));
  };

  const handleSaveCredentials = async (provider: string) => {
    const prefix = `${provider}:`;
    const values: Record<string, string> = {};
    for (const [k, v] of Object.entries(credentialEdits)) {
      if (k.startsWith(prefix)) values[k.slice(prefix.length)] = v;
    }
    if (Object.keys(values).length === 0) {
      showToast("No changes to save");
      return;
    }
    setSavingProvider(provider);
    try {
      await client.put(`/admin/platform-credentials/${provider}`, { values });
      setCredentialEdits((prev) => {
        const next = { ...prev };
        for (const k of Object.keys(next))
          if (k.startsWith(prefix)) delete next[k];
        return next;
      });
      await loadData();
      showToast("Credentials saved");
    } catch {
      showToast("Failed to save credentials");
    } finally {
      setSavingProvider(null);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const sslBadge = (status: string) => {
    const cls =
      status === "ACTIVE"
        ? "ui-badge-success"
        : status === "PENDING"
          ? "ui-badge-warning"
          : "ui-badge-danger";
    return <span className={`ui-badge ${cls}`}>{status}</span>;
  };

  return (
    <RouteGuard permission="saas.settings.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Workspace Settings"
          description="Configure branding, domains, SSO and notification preferences."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Settings" },
          ]}
        />

        {toast && (
          <div className="toast-container">
            <div className="toast-item toast-success">{toast}</div>
          </div>
        )}

        <div className="ui-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`ui-tab ${activeTab === tab.key ? "ui-tab-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="ui-tab-content">
          {activeTab === "branding" && (
            <form
              onSubmit={handleSaveBranding}
              className="ui-grid-3"
              style={{ alignItems: "start" }}
            >
              <Card padding="lg" style={{ gridColumn: "span 2" }}>
                <h3 className="ui-heading-base ui-mb-4">Branding Settings</h3>
                <div className="ui-form-group">
                  <label className="ui-label">Company Name</label>
                  <input
                    className="ui-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Primary Color</label>
                  <div className="ui-hstack-2">
                    <input
                      className="ui-input"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{ width: "48px", padding: "2px", height: "36px" }}
                    />
                    <input
                      className="ui-input"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Logo</label>
                  <div className="ui-hstack-3">
                    {logoPreview && (
                      <div
                        style={{
                          width: "64px",
                          height: "64px",
                          borderRadius: "var(--radius-md)",
                          overflow: "hidden",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    )}
                    <label
                      className="ui-btn ui-btn-secondary"
                      style={{ cursor: "pointer" }}
                    >
                      <Upload size={14} /> Upload Logo
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </div>
                </div>
                <button
                  type="submit"
                  className="ui-btn ui-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : null}
                  Save Branding
                </button>
              </Card>
              <Card padding="lg">
                <h3 className="ui-heading-base ui-mb-4">Preview</h3>
                <div
                  style={{
                    padding: "var(--space-4)",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-bg-elevated)",
                  }}
                >
                  <div className="ui-hstack-3 ui-mb-3">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt=""
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "var(--radius-sm)",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "var(--radius-sm)",
                          background: primaryColor,
                        }}
                      />
                    )}
                    <span
                      className="font-semibold"
                      style={{ color: primaryColor }}
                    >
                      {companyName}
                    </span>
                  </div>
                  <div className="ui-hstack-2 ui-mb-3">
                    <span
                      className="ui-btn ui-btn-primary"
                      style={{
                        background: primaryColor,
                        borderColor: primaryColor,
                      }}
                    >
                      Primary Button
                    </span>
                    <span className="ui-btn ui-btn-secondary">Secondary</span>
                  </div>
                  <p className="ui-text-xs-muted">
                    This is a preview of how your branding will appear.
                  </p>
                </div>
              </Card>
            </form>
          )}

          {activeTab === "domains" && (
            <div className="ui-grid-3" style={{ alignItems: "start" }}>
              <Card padding="lg" style={{ gridColumn: "span 2" }}>
                <h3 className="ui-heading-base ui-mb-4">Custom Domains</h3>
                <form
                  onSubmit={handleAddDomain}
                  className="ui-hstack-2 ui-mb-4"
                >
                  <input
                    className="ui-input"
                    placeholder="e.g. app.yourcompany.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="ui-btn ui-btn-primary">
                    <Plus size={14} /> Add
                  </button>
                </form>
                {domains.length === 0 && !loading && (
                  <p className="ui-text-xs-muted">
                    No custom domains configured.
                  </p>
                )}
                <div className="ui-stack-2">
                  {domains.map((d) => (
                    <div
                      key={d.id}
                      className="ui-flex-between ui-py-3 ui-border-b ui-border-border/30"
                    >
                      <div>
                        <div className="font-medium text-sm">{d.domain}</div>
                        <div className="ui-hstack-2 ui-mt-1">
                          {sslBadge(d.sslStatus)}
                          {d.verified ? (
                            <span className="ui-badge ui-badge-success">
                              Verified
                            </span>
                          ) : (
                            <span className="ui-badge ui-badge-warning">
                              Unverified
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="ui-hstack-2">
                        {!d.verified && (
                          <button
                            className="ui-btn ui-btn-secondary"
                            onClick={() => handleVerifyDomain(d.id)}
                          >
                            <Check size={14} /> Verify
                          </button>
                        )}
                        <button
                          className="ui-btn-icon ui-table-action-btn-danger"
                          onClick={() => handleRemoveDomain(d.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card padding="lg">
                <h4 className="ui-heading-sm ui-mb-2">DNS Configuration</h4>
                <p className="ui-text-xs-muted ui-mb-3">
                  Add a CNAME record pointing your domain to your workspace URL
                  to verify ownership.
                </p>
                <div className="ui-field-box font-mono text-xs">
                  Type: CNAME
                  <br />
                  Name: @<br />
                  Value: workspace.unierp.com
                </div>
              </Card>
            </div>
          )}

          {activeTab === "sso" && (
            <div className="ui-grid-3" style={{ alignItems: "start" }}>
              <Card padding="lg" style={{ gridColumn: "span 2" }}>
                <h3 className="ui-heading-base ui-mb-4">
                  SSO / OIDC Providers
                </h3>
                {ssoProviders.length === 0 && !loading && (
                  <p className="ui-text-xs-muted">
                    No SSO providers configured.
                  </p>
                )}
                <div className="ui-stack-3">
                  {ssoProviders.map((p) => (
                    <div
                      key={p.id}
                      className="ui-flex-between ui-py-3 ui-border-b ui-border-border/30"
                    >
                      <div>
                        <div className="font-medium text-sm capitalize">
                          {p.provider}
                        </div>
                        <div className="ui-text-xs-muted">
                          Client ID: {p.clientId}
                        </div>
                      </div>
                      <div className="ui-hstack-2">
                        <button
                          className={`ui-pill ${p.enabled ? "ui-pill-active" : ""}`}
                          onClick={() => handleToggleSSO(p)}
                        >
                          {p.enabled ? "Enabled" : "Disabled"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card padding="lg">
                <h4 className="ui-heading-sm ui-mb-2">Add SSO Provider</h4>
                <p className="ui-text-xs-muted ui-mb-3">
                  Configure SAML or OIDC to allow your team to sign in with
                  their identity provider.
                </p>
                <div className="ui-stack-3">
                  {[
                    "Google Workspace",
                    "Microsoft Entra ID",
                    "Okta",
                    "OneLogin",
                  ].map((provider) => (
                    <button
                      key={provider}
                      className="ui-btn ui-btn-secondary"
                      style={{ width: "100%" }}
                    >
                      <Plus size={14} /> {provider}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {activeTab === "notifications" && (
            <form
              onSubmit={handleSaveNotifications}
              className="ui-grid-2"
              style={{ alignItems: "start" }}
            >
              <Card padding="lg">
                <h3 className="ui-heading-base ui-mb-4">
                  Notification Preferences
                </h3>
                <div className="ui-form-group">
                  <label className="ui-label">Alert Email</label>
                  <input
                    className="ui-input"
                    type="email"
                    placeholder="alerts@company.com"
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Webhook URL</label>
                  <input
                    className="ui-input"
                    placeholder="https://hooks.example.com/alerts"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="ui-btn ui-btn-primary"
                  disabled={saving}
                >
                  {saving ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : null}
                  Save Settings
                </button>
              </Card>
              <Card padding="lg">
                <h4 className="ui-heading-sm ui-mb-3">Alert Events</h4>
                <div className="ui-stack-2">
                  {[
                    "Usage threshold exceeded",
                    "New team member added",
                    "Invoice generated",
                    "API key created",
                    "Domain verification",
                  ].map((event) => (
                    <label key={event} className="ui-checkbox-row">
                      <input type="checkbox" defaultChecked className="mr-2" />
                      {event}
                    </label>
                  ))}
                </div>
              </Card>
            </form>
          )}

          {activeTab === "integrations" && (
            <div className="ui-stack-4">
              <p className="ui-text-xs-muted">
                Credentials saved here are stored encrypted in the database and
                take effect within ~15 seconds — no code change, .env edit, or
                restart needed. Leave a field blank to keep using the server's
                environment default.
              </p>
              {credentialProviders.length === 0 && !loading && (
                <p className="ui-text-xs-muted">
                  No integration providers available.
                </p>
              )}
              <div className="ui-grid-2" style={{ alignItems: "start" }}>
                {credentialProviders.map((cp) => (
                  <Card key={cp.provider} padding="lg">
                    <h3 className="ui-heading-base ui-mb-4">{cp.label}</h3>
                    <div className="ui-stack-3">
                      {cp.fields.map((f) => {
                        const editKey = `${cp.provider}:${f.key}`;
                        const dirty = editKey in credentialEdits;
                        return (
                          <div className="ui-form-group" key={f.key}>
                            <label className="ui-label">
                              {f.label}{" "}
                              {f.isSet ? (
                                <span
                                  className="ui-badge ui-badge-success"
                                  style={{ marginLeft: "6px" }}
                                >
                                  Set in database
                                </span>
                              ) : (
                                <span
                                  className="ui-badge ui-badge-warning"
                                  style={{ marginLeft: "6px" }}
                                >
                                  Using environment default
                                </span>
                              )}
                            </label>
                            <input
                              className="ui-input"
                              type={f.sensitive ? "password" : "text"}
                              placeholder={
                                f.sensitive && f.isSet
                                  ? f.value
                                  : f.value || "Not set"
                              }
                              value={dirty ? credentialEdits[editKey] : ""}
                              onChange={(e) =>
                                handleCredentialFieldChange(
                                  cp.provider,
                                  f.key,
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="ui-btn ui-btn-primary"
                      disabled={savingProvider === cp.provider}
                      onClick={() => handleSaveCredentials(cp.provider)}
                    >
                      {savingProvider === cp.provider ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : null}
                      Save {cp.label}
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </RouteGuard>
  );
}
