"use client";
import React, { useState, useEffect } from "react";
import { Card, PageHeader, DataTable } from "@unerp/ui";
import {
  UserPlus,
  Send,
  X,
  RefreshCw,
  Users,
  Shield,
  Ban,
} from "lucide-react";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "ACTIVE" | "INVITED" | "DISABLED";
  roles: { id: string; name: string }[];
  lastActiveAt: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

export default function SaasTeamPage() {
  const client = useApiClient();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [sending, setSending] = useState(false);
  const [showRolePanel, setShowRolePanel] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [mRes, rRes] = await Promise.all([
        client.get<TeamMember[]>("/saas/team").catch(() => []),
        client.get<Role[]>("/saas/team/roles").catch(() => []),
      ]);
      setMembers(mRes || []);
      setRoles(rRes || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);
    try {
      await client.post("/saas/team/invite", {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      showToast("Invitation sent!");
      setInviteEmail("");
      setShowInvite(false);
      loadData();
    } catch {
      showToast("Failed to send invitation");
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (memberId: string) => {
    try {
      await client.delete(`/saas/team/${memberId}`);
      showToast("Member removed");
      loadData();
    } catch {
      showToast("Failed to remove member");
    }
  };

  const handleResend = async (memberId: string) => {
    try {
      await client.post(`/saas/team/${memberId}/resend`);
      showToast("Invitation resent");
    } catch {
      showToast("Failed to resend");
    }
  };

  const statusBadge = (status: string) => {
    const cls = status === "ACTIVE" ? "ui-badge-success" :
      status === "INVITED" ? "ui-badge-warning" : "ui-badge-neutral";
    return <span className={`ui-badge ${cls}`}>{status}</span>;
  };

  const activeMembers = members.filter((m) => m.status === "ACTIVE");
  const pendingInvites = members.filter((m) => m.status === "INVITED");

  return (
    <RouteGuard permission="saas.team.read">
      <div className="ui-stack-6 ui-animate-in">
        <PageHeader
          title="Team Management"
          description="Manage team members, invite new users, and configure roles."
          breadcrumbs={[
            { label: "SaaS", href: "/saas/portal" },
            { label: "Team" },
          ]}
        />

        {toast && (
          <div className="toast-container">
            <div className="toast-item toast-success">{toast}</div>
          </div>
        )}

        <div className="ui-list-toolbar">
          <div className="ui-hstack-3">
            <span className="ui-heading-sm">{activeMembers.length} Active Members</span>
            {pendingInvites.length > 0 && (
              <span className="ui-badge ui-badge-warning">{pendingInvites.length} Pending</span>
            )}
          </div>
          <div className="ui-hstack-2">
            <button className="ui-btn ui-btn-secondary" onClick={() => setShowRolePanel(!showRolePanel)}>
              <Shield size={14} /> Roles
            </button>
            <button className="ui-btn ui-btn-primary" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Invite Member
            </button>
          </div>
        </div>

        <Card padding="lg">
          <DataTable
            columns={[
              { key: "name", header: "Name", sortable: true },
              { key: "email", header: "Email", sortable: true },
              { key: "roles", header: "Roles" },
              { key: "status", header: "Status" },
              { key: "lastActive", header: "Last Active" },
              { key: "actions", header: "" },
            ]}
            data={members.map((m) => ({
              ...m,
              name: `${m.firstName} ${m.lastName}`.trim() || m.email,
              roles: m.roles.map((r) => r.name).join(", ") || "User",
              status: statusBadge(m.status),
              lastActive: m.lastActiveAt ? new Date(m.lastActiveAt).toLocaleDateString() : "Never",
              actions: (
                <div className="ui-table-actions">
                  {m.status === "INVITED" && (
                    <button className="ui-table-action-btn" onClick={(e) => { e.stopPropagation(); handleResend(m.id); }} title="Resend">
                      <RefreshCw size={14} />
                    </button>
                  )}
                  <button className="ui-table-action-btn ui-table-action-btn-danger" onClick={(e) => { e.stopPropagation(); handleRevoke(m.id); }} title="Remove">
                    <Ban size={14} />
                  </button>
                </div>
              ),
            })) as unknown as Record<string, unknown>[]}
            emptyTitle="No team members"
            emptyMessage="Invite your first team member to get started."
          />
        </Card>

        {showRolePanel && (
          <Card padding="lg">
            <div className="ui-flex-between ui-mb-4">
              <h3 className="ui-heading-base">Roles & Permissions</h3>
              <button className="ui-btn-icon" onClick={() => setShowRolePanel(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="ui-grid-auto">
              {roles.length === 0 && !loading && (
                <p className="ui-text-xs-muted">No roles defined.</p>
              )}
              {roles.map((role) => (
                <div key={role.id} className="ui-card" style={{ padding: "var(--space-4)" }}>
                  <div className="ui-hstack-3 ui-mb-2">
                    <Shield size={16} className="ui-text-primary" />
                    <span className="font-semibold text-sm">{role.name}</span>
                  </div>
                  <p className="ui-text-xs-muted">{role.description}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {showInvite && (
          <div className="ui-modal-overlay" onClick={() => setShowInvite(false)}>
            <div className="ui-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ui-modal-header">
                <span>Invite Team Member</span>
                <button className="ui-btn-icon" onClick={() => setShowInvite(false)}>
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleInvite}>
                <div className="ui-modal-body ui-stack-4">
                  <div className="ui-form-group">
                    <label className="ui-label">Email Address</label>
                    <input className="ui-input" type="email" required placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                  </div>
                  <div className="ui-form-group">
                    <label className="ui-label">Role</label>
                    <select className="ui-select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                      {roles.map((r) => (
                        <option key={r.id} value={r.name.toLowerCase()}>{r.name}</option>
                      ))}
                      {roles.length === 0 && (
                        <>
                          <option value="admin">Admin</option>
                          <option value="user">User</option>
                          <option value="viewer">Viewer</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
                <div className="ui-modal-footer">
                  <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setShowInvite(false)}>Cancel</button>
                  <button type="submit" className="ui-btn ui-btn-primary" disabled={sending}>
                    {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {sending ? "Sending..." : "Send Invite"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RouteGuard>
  );
}
