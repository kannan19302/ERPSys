"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  PageHeader,
  DataTable,
  Tabs,
  Spinner,
  Modal,
  TextField,
  FormField,
  Select,
  Textarea,
  Button,
  Badge,
  KPICard,
} from "@unerp/ui";
import {
  Lock,
  Smartphone,
  Key,
  Globe,
  Monitor,
  History,
  Shield,
  UserCog,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { RouteGuard, Guarded, useApiClient } from "@unerp/framework";

/* ── Types ───────────────────────────────────────── */
interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecial: boolean;
  maxAge: number;
}
interface MfaSettings {
  enabled: boolean;
  mfaType: string;
  enforced: boolean;
}
interface SsoConfig {
  id: string;
  providerType: string;
  name: string;
  clientId: string | null;
  clientSecret: string | null;
  issuerUrl: string | null;
  samlEntryPoint: string | null;
  samlIssuer: string | null;
  samlCert: string | null;
  isActive: boolean;
}
interface IpRestriction {
  id: string;
  ipRange: string;
  description: string | null;
  ruleType: string;
  isActive: boolean;
  createdAt: string;
}
interface ActiveSession {
  id: string;
  userId: string;
  device: string | null;
  browser: string | null;
  ipAddress: string | null;
  location: string | null;
  startedAt: string;
  lastActivityAt: string;
  user?: { email: string; firstName: string; lastName: string };
}
interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  allowedIps?: string[];
  expiresAt: string | null;
  createdAt: string;
  revokedAt?: string | null;
}
interface SecurityScore {
  score: number;
  checks?: { name: string; passed: boolean }[];
}
interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}
interface Delegation {
  id: string;
  delegatorId: string;
  delegateId: string;
  type: string;
  reason?: string;
  startDate: string;
  endDate?: string | null;
  status: string;
}
interface DirectoryUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
}

const TAB_KEYS = [
  "mfa",
  "password-policy",
  "sso",
  "ip-restrictions",
  "sessions",
  "api-keys",
  "delegations",
  "impersonate",
  "score",
] as const;
type TabKey = (typeof TAB_KEYS)[number];
function isTabKey(v: string | null): v is TabKey {
  return !!v && (TAB_KEYS as readonly string[]).includes(v);
}

/* ── MFA Tab ─────────────────────────────────────── */
function MfaTab() {
  const client = useApiClient();
  const [settings, setSettings] = useState<MfaSettings>({
    enabled: false,
    mfaType: "TOTP",
    enforced: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setSettings(await client.get<MfaSettings>("/saas-portal/security/mfa"));
      } catch {
        /* use defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post("/saas-portal/security/mfa", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <Card padding="lg">
      <form onSubmit={save} className="ui-stack-4">
        <div className="ui-flex-end">
          {saved && (
            <Badge variant="success">
              <CheckCircle size={12} /> Saved
            </Badge>
          )}
        </div>
        <label className="ui-hstack-3">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) =>
              setSettings({
                ...settings,
                enabled: e.target.checked,
                enforced: e.target.checked ? settings.enforced : false,
              })
            }
          />
          <div>
            <div className="ui-heading-sm">
              Enable Multi-Factor Authentication
            </div>
            <div className="ui-text-xs-muted">
              Allow users to configure MFA for their accounts
            </div>
          </div>
        </label>
        <label className="ui-hstack-3">
          <input
            type="checkbox"
            checked={settings.enforced}
            disabled={!settings.enabled}
            onChange={(e) =>
              setSettings({ ...settings, enforced: e.target.checked })
            }
          />
          <div>
            <div className="ui-heading-sm">Enforce MFA for All Users</div>
            <div className="ui-text-xs-muted">
              Require every user to set up MFA before access
            </div>
          </div>
        </label>
        <FormField label="MFA Method">
          <Select
            value={settings.mfaType}
            disabled={!settings.enabled}
            onChange={(e) =>
              setSettings({ ...settings, mfaType: e.target.value })
            }
          >
            <option value="TOTP">Authenticator App (TOTP)</option>
            <option value="SMS">SMS Verification</option>
            <option value="EMAIL">Email Verification</option>
            <option value="WEBAUTHN">Hardware Security Key (WebAuthn)</option>
          </Select>
        </FormField>
        <div className="ui-flex-end">
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ── Password Policy Tab ─────────────────────────── */
function PasswordPolicyTab() {
  const client = useApiClient();
  const [policy, setPolicy] = useState<PasswordPolicy>({
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecial: false,
    maxAge: 90,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setPolicy(
          await client.get<PasswordPolicy>(
            "/saas-portal/security/password-policy",
          ),
        );
      } catch {
        /* use defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post("/saas-portal/security/password-policy", policy);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );

  return (
    <Card padding="lg">
      <form onSubmit={save} className="ui-stack-4">
        <div className="ui-flex-end">
          {saved && (
            <Badge variant="success">
              <CheckCircle size={12} /> Saved
            </Badge>
          )}
        </div>
        <FormField label="Minimum Password Length">
          <input
            type="range"
            min={6}
            max={24}
            value={policy.minLength}
            onChange={(e) =>
              setPolicy({ ...policy, minLength: +e.target.value })
            }
          />
          <span className="ui-text-xs-muted">
            {policy.minLength} characters
          </span>
        </FormField>
        <TextField
          label="Maximum Password Lifetime (days, 0 = unlimited)"
          type="number"
          min={0}
          max={365}
          value={String(policy.maxAge)}
          onChange={(e) => setPolicy({ ...policy, maxAge: +e.target.value })}
        />
        <label className="ui-hstack-3">
          <input
            type="checkbox"
            checked={policy.requireUppercase}
            onChange={(e) =>
              setPolicy({ ...policy, requireUppercase: e.target.checked })
            }
          />
          <span className="text-sm">Require Uppercase Letters</span>
        </label>
        <label className="ui-hstack-3">
          <input
            type="checkbox"
            checked={policy.requireNumbers}
            onChange={(e) =>
              setPolicy({ ...policy, requireNumbers: e.target.checked })
            }
          />
          <span className="text-sm">Require Digits</span>
        </label>
        <label className="ui-hstack-3">
          <input
            type="checkbox"
            checked={policy.requireSpecial}
            onChange={(e) =>
              setPolicy({ ...policy, requireSpecial: e.target.checked })
            }
          />
          <span className="text-sm">Require Special Characters</span>
        </label>
        <div className="ui-flex-end">
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Apply Password Policy"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

/* ── SSO Tab ─────────────────────────────────────── */
function SsoTab() {
  const client = useApiClient();
  const [provider, setProvider] = useState<"OIDC" | "SAML">("OIDC");
  const [form, setForm] = useState({
    name: "Google Workspace",
    clientId: "",
    clientSecret: "",
    issuerUrl: "",
    samlEntryPoint: "",
    samlIssuer: "",
    samlCert: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await client.get<SsoConfig[]>("/saas-portal/security/sso");
      const active = data?.find((c) => c.providerType === provider);
      if (active) {
        setForm({
          name: active.name,
          clientId: active.clientId || "",
          clientSecret: active.clientSecret || "",
          issuerUrl: active.issuerUrl || "",
          samlEntryPoint: active.samlEntryPoint || "",
          samlIssuer: active.samlIssuer || "",
          samlCert: active.samlCert || "",
          isActive: active.isActive,
        });
      } else {
        setForm({
          name: provider === "OIDC" ? "Google Workspace" : "Okta Enterprise",
          clientId: "",
          clientSecret: "",
          issuerUrl: "",
          samlEntryPoint: "",
          samlIssuer: "",
          samlCert: "",
          isActive: true,
        });
      }
    } catch {
      /* use defaults */
    }
  }, [client, provider]);

  useEffect(() => {
    void fetchConfig();
  }, [fetchConfig]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await client.post("/saas-portal/security/sso", {
        providerType: provider,
        ...form,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ui-stack-4">
      <div className="ui-flex-end">
        {saved && (
          <Badge variant="success">
            <CheckCircle size={12} /> Saved
          </Badge>
        )}
      </div>
      <Tabs
        tabs={[
          { key: "OIDC", label: "OpenID Connect", icon: <Key size={14} /> },
          { key: "SAML", label: "SAML 2.0", icon: <Shield size={14} /> },
        ]}
        value={provider}
        onChange={(k) => setProvider(k as "OIDC" | "SAML")}
      />
      <Card padding="lg">
        <form onSubmit={save} className="ui-stack-4">
          <TextField
            label="Provider Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {provider === "OIDC" ? (
            <>
              <TextField
                label="Client ID"
                value={form.clientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientId: e.target.value }))
                }
              />
              <TextField
                label="Client Secret"
                type="password"
                value={form.clientSecret}
                onChange={(e) =>
                  setForm((f) => ({ ...f, clientSecret: e.target.value }))
                }
              />
              <TextField
                label="Issuer URL"
                hint="OIDC discovery endpoint"
                value={form.issuerUrl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issuerUrl: e.target.value }))
                }
              />
            </>
          ) : (
            <>
              <TextField
                label="SAML Entry Point"
                value={form.samlEntryPoint}
                onChange={(e) =>
                  setForm((f) => ({ ...f, samlEntryPoint: e.target.value }))
                }
              />
              <TextField
                label="SAML Issuer / Entity ID"
                value={form.samlIssuer}
                onChange={(e) =>
                  setForm((f) => ({ ...f, samlIssuer: e.target.value }))
                }
              />
              <FormField label="X.509 Certificate">
                <Textarea
                  rows={5}
                  value={form.samlCert}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, samlCert: e.target.value }))
                  }
                  placeholder="-----BEGIN CERTIFICATE-----"
                />
              </FormField>
            </>
          )}
          <label className="ui-hstack-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
            />
            <span className="text-sm">Enable SSO Provider</span>
          </label>
          <div className="ui-flex-end">
            <Button
              variant="secondary"
              type="button"
              onClick={() => fetchConfig()}
            >
              Reset
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ── IP Restrictions Tab ─────────────────────────── */
function IpRestrictionsTab() {
  const client = useApiClient();
  const [rules, setRules] = useState<IpRestriction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [ipRange, setIpRange] = useState("");
  const [desc, setDesc] = useState("");
  const [ruleType, setRuleType] = useState<"ALLOW" | "DENY">("ALLOW");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRules(
        (await client.get<IpRestriction[]>(
          "/saas-portal/security/ip-restrictions",
        )) || [],
      );
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = async () => {
    if (!ipRange) return;
    try {
      await client.post("/saas-portal/security/ip-restrictions", {
        ipRange,
        description: desc,
        ruleType,
      });
      setModalOpen(false);
      setIpRange("");
      setDesc("");
      await load();
    } catch {
      /* ignore */
    }
  };

  const remove = async (id: string) => {
    try {
      await client.delete(`/saas-portal/security/ip-restrictions/${id}`);
      await load();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="ui-stack-4">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <Plus size={14} /> Add IP Rule
        </Button>
      </div>
      <Card padding="lg">
        {loading ? (
          <Spinner size="md" />
        ) : rules.length === 0 ? (
          <p className="ui-text-xs-muted">
            No custom IP rules active. Access allowed from any network.
          </p>
        ) : (
          <div className="ui-stack-3">
            {rules.map((r) => (
              <div key={r.id} className="ui-list-item ui-flex-between">
                <div className="ui-hstack-3">
                  <Globe
                    size={18}
                    className={
                      r.ruleType === "ALLOW"
                        ? "ui-text-success"
                        : "ui-text-danger"
                    }
                  />
                  <div>
                    <div className="ui-hstack-2">
                      <code className="text-sm">{r.ipRange}</code>
                      <span
                        className={`ui-badge ${r.ruleType === "ALLOW" ? "ui-badge-success" : "ui-badge-danger"}`}
                      >
                        {r.ruleType}
                      </span>
                    </div>
                    <div className="ui-text-xs-muted">
                      {r.description || "No description"} &bull;{" "}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  className="ui-table-action-btn ui-table-action-btn-danger"
                  onClick={() => remove(r.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add IP Access Rule"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={add}>
              Add Rule
            </Button>
          </>
        }
      >
        <div className="ui-stack-4">
          <TextField
            label="IP Address / CIDR"
            required
            value={ipRange}
            onChange={(e) => setIpRange(e.target.value)}
            placeholder="192.168.1.0/24"
          />
          <TextField
            label="Description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="London Office"
          />
          <FormField label="Rule Action">
            <Select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value as "ALLOW" | "DENY")}
            >
              <option value="ALLOW">ALLOW Access</option>
              <option value="DENY">DENY Access</option>
            </Select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

/* ── Sessions Tab ────────────────────────────────── */
function SessionsTab() {
  const client = useApiClient();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSessions(
        (await client.get<ActiveSession[]>("/saas-portal/security/sessions")) ||
          [],
      );
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const revoke = async (id: string) => {
    try {
      await client.delete(`/saas-portal/security/sessions/${id}`);
      await load();
    } catch {
      /* ignore */
    }
  };

  return (
    <Card padding="lg">
      <div className="ui-flex-between ui-mb-4">
        <h3 className="ui-heading-sm">Active Sessions ({sessions.length})</h3>
        <button className="ui-btn-icon" onClick={load}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      {loading ? (
        <Spinner size="md" />
      ) : sessions.length === 0 ? (
        <p className="ui-text-xs-muted">No active sessions tracked.</p>
      ) : (
        <div className="ui-stack-3">
          {sessions.map((s) => (
            <div key={s.id} className="ui-list-item ui-flex-between">
              <div className="ui-hstack-3">
                <Monitor size={20} className="ui-text-primary" />
                <div>
                  <div className="font-medium text-sm">
                    {s.device || "Unknown Device"} &bull;{" "}
                    {s.browser || "Unknown Browser"}
                  </div>
                  <div className="ui-text-xs-muted">
                    {s.user
                      ? `${s.user.firstName} ${s.user.lastName} (${s.user.email})`
                      : "Unknown user"}
                  </div>
                  <div className="ui-text-xs-muted">
                    IP: {s.ipAddress || "—"} &bull; {s.location || "—"}
                  </div>
                </div>
              </div>
              <button
                className="ui-btn ui-btn-secondary"
                onClick={() => revoke(s.id)}
              >
                <XCircle size={12} /> Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ── API Keys Tab ────────────────────────────────── */
function ApiKeysTab() {
  const client = useApiClient();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ key?: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setKeys(
        (await client.get<ApiKey[]>("/saas-portal/security/api-keys")) || [],
      );
    } catch {
      /* keep empty */
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    if (!name.trim()) return;
    try {
      const result = await client.post<ApiKey & { key?: string }>(
        "/saas-portal/security/api-keys",
        { name, permissions: [] },
      );
      setCreated(result);
      await load();
    } catch {
      /* ignore */
    }
  };

  const revoke = async (id: string) => {
    try {
      await client.delete(`/saas-portal/security/api-keys/${id}`);
      await load();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="ui-stack-4">
      <Guarded permission="admin.api-keys.create">
        <div className="ui-flex-end">
          <Button
            variant="primary"
            onClick={() => {
              setName("");
              setCreated(null);
              setModalOpen(true);
            }}
          >
            <Plus size={14} /> Create API Key
          </Button>
        </div>
      </Guarded>
      <Card padding="lg">
        <DataTable
          columns={[
            { key: "name", header: "Name", sortable: true },
            { key: "permissions", header: "Permissions" },
            { key: "expiresAt", header: "Expires" },
            { key: "status", header: "Status" },
            { key: "actions", header: "" },
          ]}
          data={
            keys.map((k) => ({
              ...k,
              permissions: k.permissions?.length
                ? k.permissions.join(", ")
                : "All",
              expiresAt: k.expiresAt
                ? new Date(k.expiresAt).toLocaleDateString()
                : "Never",
              status: (
                <span
                  className={`ui-badge ${k.revokedAt ? "ui-badge-neutral" : "ui-badge-success"}`}
                >
                  {k.revokedAt ? "Revoked" : "Active"}
                </span>
              ),
              actions: !k.revokedAt ? (
                <Guarded permission="admin.api-keys.delete">
                  <button
                    className="ui-table-action-btn ui-table-action-btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      revoke(k.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </Guarded>
              ) : null,
            })) as unknown as Record<string, unknown>[]
          }
          emptyTitle={loading ? "Loading..." : "No API keys"}
          emptyMessage="Create an API key to allow programmatic access."
        />
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create API Key"
        footer={
          created ? (
            <Button variant="primary" onClick={() => setModalOpen(false)}>
              Done
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={create}>
                Create
              </Button>
            </>
          )
        }
      >
        {created ? (
          <div className="ui-stack-3">
            <p className="ui-text-xs-muted">
              Copy this key now — it will not be shown again.
            </p>
            <code className="ui-code-block">
              {created.key || "(key hidden by server)"}
            </code>
          </div>
        ) : (
          <TextField
            label="Key Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Production Integration"
          />
        )}
      </Modal>
    </div>
  );
}

/* ── Security Score Tab ──────────────────────────── */
function ScoreTab() {
  const client = useApiClient();
  const [data, setData] = useState<SecurityScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setData(await client.get<SecurityScore>("/saas-portal/security/score"));
      } catch {
        /* keep null */
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading)
    return (
      <div className="ui-center-pad">
        <Spinner size="lg" />
      </div>
    );
  if (!data)
    return (
      <div className="ui-empty-state">
        <AlertTriangle size={32} className="ui-text-muted" />
        <p className="ui-text-xs-muted">Could not load security score.</p>
      </div>
    );

  return (
    <div className="ui-stack-6">
      <div className="ui-grid-auto">
        <KPICard
          title="Security Score"
          value={`${data.score}%`}
          icon={<Shield size={20} />}
          color={
            data.score >= 80 ? "var(--color-success)" : "var(--color-warning)"
          }
        />
      </div>
      {data.checks && data.checks.length > 0 && (
        <Card padding="lg">
          <div className="ui-stack-3">
            {data.checks.map((c, i) => (
              <div key={i} className="ui-kv-pair">
                <span className="ui-hstack-2">
                  {c.passed ? (
                    <CheckCircle size={14} className="ui-text-success" />
                  ) : (
                    <AlertTriangle size={14} className="ui-text-warning" />
                  )}
                  {c.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ── Delegations Tab ─────────────────────────────── */
function DelegationsTab() {
  const client = useApiClient();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    delegatorId: "",
    delegateId: "",
    type: "ALL",
    reason: "",
    startDate: "",
    endDate: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, m] = await Promise.all([
        client.get<Delegation[]>("/saas-portal/delegations").catch(() => []),
        client.get<TeamMember[]>("/saas/team").catch(() => []),
      ]);
      setDelegations(d || []);
      setMembers(m || []);
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const memberName = (id: string) => {
    const m = members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : id.slice(0, 8);
  };

  const openNew = () => {
    setForm({
      delegatorId: "",
      delegateId: "",
      type: "ALL",
      reason: "",
      startDate: "",
      endDate: "",
    });
    setEditId(null);
    setModalOpen(true);
  };
  const openEdit = (d: Delegation) => {
    setForm({
      delegatorId: d.delegatorId,
      delegateId: d.delegateId,
      type: d.type,
      reason: d.reason || "",
      startDate: d.startDate?.slice(0, 10) || "",
      endDate: d.endDate?.slice(0, 10) || "",
    });
    setEditId(d.id);
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editId) {
        await client.patch(`/saas-portal/delegations/${editId}`, {
          type: form.type,
          reason: form.reason || undefined,
          startDate: form.startDate
            ? new Date(form.startDate).toISOString()
            : undefined,
          endDate: form.endDate
            ? new Date(form.endDate).toISOString()
            : undefined,
        });
      } else {
        await client.post("/saas-portal/delegations", {
          delegatorId: form.delegatorId,
          delegateId: form.delegateId,
          type: form.type,
          reason: form.reason || undefined,
          startDate: new Date(form.startDate).toISOString(),
          endDate: form.endDate
            ? new Date(form.endDate).toISOString()
            : undefined,
        });
      }
      setModalOpen(false);
      await load();
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await client.post(`/saas-portal/delegations/${id}/revoke`);
      await load();
    } catch {
      /* ignore */
    }
  };

  const statusBadge = (s: string) =>
    s === "ACTIVE"
      ? "ui-badge-success"
      : s === "REVOKED"
        ? "ui-badge-danger"
        : "ui-badge-neutral";

  return (
    <div className="ui-stack-4">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={openNew}>
          <Plus size={14} /> New Delegation
        </Button>
      </div>
      <Card padding="lg">
        <DataTable
          columns={[
            { key: "delegator", header: "Delegator" },
            { key: "delegate", header: "Delegate" },
            { key: "type", header: "Type" },
            { key: "startDate", header: "Start" },
            { key: "endDate", header: "End" },
            { key: "status", header: "Status" },
            { key: "actions", header: "" },
          ]}
          data={
            delegations.map((d) => ({
              ...d,
              delegator: memberName(d.delegatorId),
              delegate: memberName(d.delegateId),
              startDate: new Date(d.startDate).toLocaleDateString(),
              endDate: d.endDate
                ? new Date(d.endDate).toLocaleDateString()
                : "Indefinite",
              status: (
                <span className={`ui-badge ${statusBadge(d.status)}`}>
                  {d.status}
                </span>
              ),
              actions: (
                <div className="ui-table-actions">
                  <button
                    className="ui-table-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(d);
                    }}
                    title="Edit"
                  >
                    <UserCog size={14} />
                  </button>
                  {d.status === "ACTIVE" && (
                    <button
                      className="ui-table-action-btn ui-table-action-btn-danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        revoke(d.id);
                      }}
                      title="Revoke"
                    >
                      <XCircle size={14} />
                    </button>
                  )}
                </div>
              ),
            })) as unknown as Record<string, unknown>[]
          }
          emptyTitle={loading ? "Loading..." : "No delegations found"}
          emptyMessage="No approval delegations have been set up."
        />
      </Card>
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit Delegation" : "New Delegation"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={save}
              disabled={
                saving ||
                (!editId && (!form.delegatorId || !form.delegateId)) ||
                !form.startDate
              }
            >
              {saving ? "Saving..." : editId ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <div className="ui-stack-4">
          {!editId && (
            <>
              <FormField label="Delegator">
                <Select
                  value={form.delegatorId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, delegatorId: e.target.value }))
                  }
                >
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.email})
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Delegate">
                <Select
                  value={form.delegateId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, delegateId: e.target.value }))
                  }
                >
                  <option value="">Select member</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.email})
                    </option>
                  ))}
                </Select>
              </FormField>
            </>
          )}
          <FormField label="Type">
            <Select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            >
              <option value="ALL">All</option>
              <option value="APPROVALS">Approvals</option>
              <option value="SPECIFIC_WORKFLOW">Specific Workflow</option>
            </Select>
          </FormField>
          <FormField label="Reason">
            <Textarea
              rows={3}
              value={form.reason}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              placeholder="Reason for delegation"
            />
          </FormField>
          <div className="ui-grid-2">
            <TextField
              label="Start Date"
              type="date"
              required
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
            />
            <TextField
              label="End Date (optional)"
              type="date"
              value={form.endDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, endDate: e.target.value }))
              }
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Impersonate Tab ─────────────────────────────── */
function ImpersonateTab() {
  const client = useApiClient();
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await client.get<DirectoryUser[]>("/admin/users"));
    } catch {
      setError("Failed to load the user directory.");
    } finally {
      setLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void load();
  }, [load]);

  const startImpersonation = async (userId: string) => {
    setImpersonatingId(userId);
    setError(null);
    try {
      const data = await client.post<{ token: string }>(
        `/saas-portal/security/impersonate/${userId}`,
      );
      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "/saas/portal";
      }
    } catch {
      setError("Failed to start the impersonation session.");
      setImpersonatingId(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="ui-stack-4">
      <Card padding="lg">
        <div className="ui-stack-2">
          <div className="ui-hstack-2">
            <AlertTriangle size={16} className="ui-text-warning" />
            <strong>Audit policy enforcement</strong>
          </div>
          <p className="ui-text-sm-muted">
            Impersonation bypasses normal authentication to operate as another
            tenant member. Every session is audit-logged under your own account;
            use it only with explicit authorization.
          </p>
        </div>
      </Card>

      {error && (
        <div className="ui-alert ui-alert-danger">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <Card padding="lg">
        <div className="ui-hstack-2 ui-flex-between">
          <TextField
            aria-label="Search users"
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant="secondary"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
            Refresh
          </Button>
        </div>
      </Card>

      <Card padding="lg">
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "status", header: "Status" },
            { key: "actions", header: "" },
          ]}
          data={
            filtered.map((u) => ({
              id: u.id,
              name: `${u.firstName} ${u.lastName}`,
              email: u.email,
              status: (
                <span
                  className={`ui-badge ${u.status === "ACTIVE" ? "ui-badge-success" : "ui-badge-neutral"}`}
                >
                  {u.status}
                </span>
              ),
              actions: (
                <Button
                  variant="secondary"
                  onClick={() => void startImpersonation(u.id)}
                  disabled={impersonatingId !== null}
                >
                  {impersonatingId === u.id ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <UserCheck size={12} />
                  )}
                  {impersonatingId === u.id ? "Starting..." : "Impersonate"}
                </Button>
              ),
            })) as unknown as Record<string, unknown>[]
          }
          emptyTitle={loading ? "Loading..." : "No users found"}
          emptyMessage="No users match the search criteria."
        />
      </Card>
    </div>
  );
}

/* ── Page ────────────────────────────────────────── */
function SecurityPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = isTabKey(searchParams.get("tab"))
    ? (searchParams.get("tab") as TabKey)
    : "mfa";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [visited, setVisited] = useState<Set<TabKey>>(new Set([initialTab]));

  const handleChange = (key: string) => {
    if (!isTabKey(key)) return;
    setActiveTab(key);
    setVisited((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
    router.replace(`/saas/security?tab=${key}`, { scroll: false });
  };

  return (
    <RouteGuard permission="admin.security.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Security"
          description="Authentication, access policies, sessions, API keys, and delegations."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Security" },
          ]}
        />

        <Tabs
          tabs={[
            { key: "mfa", label: "MFA / 2FA", icon: <Smartphone size={14} /> },
            {
              key: "password-policy",
              label: "Password Policy",
              icon: <Lock size={14} />,
            },
            { key: "sso", label: "SSO", icon: <Key size={14} /> },
            {
              key: "ip-restrictions",
              label: "IP Restrictions",
              icon: <Globe size={14} />,
            },
            { key: "sessions", label: "Sessions", icon: <Monitor size={14} /> },
            { key: "api-keys", label: "API Keys", icon: <Key size={14} /> },
            {
              key: "delegations",
              label: "Delegations",
              icon: <UserCog size={14} />,
            },
            {
              key: "impersonate",
              label: "Impersonate",
              icon: <UserCheck size={14} />,
            },
            {
              key: "score",
              label: "Compliance Score",
              icon: <History size={14} />,
            },
          ]}
          value={activeTab}
          onChange={handleChange}
        />

        <div style={{ display: activeTab === "mfa" ? "block" : "none" }}>
          {visited.has("mfa") && <MfaTab />}
        </div>
        <div
          style={{
            display: activeTab === "password-policy" ? "block" : "none",
          }}
        >
          {visited.has("password-policy") && <PasswordPolicyTab />}
        </div>
        <div style={{ display: activeTab === "sso" ? "block" : "none" }}>
          {visited.has("sso") && <SsoTab />}
        </div>
        <div
          style={{
            display: activeTab === "ip-restrictions" ? "block" : "none",
          }}
        >
          {visited.has("ip-restrictions") && <IpRestrictionsTab />}
        </div>
        <div style={{ display: activeTab === "sessions" ? "block" : "none" }}>
          {visited.has("sessions") && <SessionsTab />}
        </div>
        <div style={{ display: activeTab === "api-keys" ? "block" : "none" }}>
          {visited.has("api-keys") && <ApiKeysTab />}
        </div>
        <div
          style={{ display: activeTab === "delegations" ? "block" : "none" }}
        >
          {visited.has("delegations") && <DelegationsTab />}
        </div>
        <div
          style={{ display: activeTab === "impersonate" ? "block" : "none" }}
        >
          {visited.has("impersonate") && <ImpersonateTab />}
        </div>
        <div style={{ display: activeTab === "score" ? "block" : "none" }}>
          {visited.has("score") && <ScoreTab />}
        </div>
      </div>
    </RouteGuard>
  );
}

export default function SaasSecurityPage() {
  return (
    <Suspense
      fallback={
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      }
    >
      <SecurityPageContent />
    </Suspense>
  );
}
