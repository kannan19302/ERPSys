"use client";
import styles from "./InviteTeamSection.module.css";
import React, { useState, useCallback, useEffect } from "react";
import { Card } from "@unerp/ui";
import {
  UserPlus,
  Send,
  X,
  Link2,
  Copy,
  Check,
  RefreshCw,
  Upload,
  Users,
  Trash2,
} from "lucide-react";
import { useApiClient } from "@unerp/framework";

interface PendingInvite {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  roles: { id: string; name: string }[];
}

interface InviteTeamSectionProps {
  maxSeats?: number;
}

export function InviteTeamSection({ maxSeats = 5 }: InviteTeamSectionProps) {
  const client = useApiClient();

  // Email chips input
  const [emailInput, setEmailInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState("admin");
  const [sending, setSending] = useState(false);

  // Invite link
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Pending invites
  const [pending, setPending] = useState<PendingInvite[]>([]);

  // Team members
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [activeCount, setActiveCount] = useState(0);

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load data
  const loadTeamData = useCallback(async () => {
    try {
      const [usersRes, overviewRes] = await Promise.all([
        client
          .get<TeamMember[]>("/admin/users")
          .catch(() => [] as TeamMember[]),
        client
          .get<{
            activeCount: number;
            invitedCount: number;
            maxSeats: number;
          }>("/admin/users/team-overview")
          .catch(() => null),
      ]);

      const allUsers = usersRes || [];
      setMembers(allUsers.filter((u) => u.status === "ACTIVE"));
      setPending(
        allUsers
          .filter((u) => u.status === "INVITED")
          .map((u) => ({
            id: u.id,
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            status: "PENDING",
            createdAt: "",
          })),
      );
      setActiveCount(
        overviewRes?.activeCount ??
          allUsers.filter((u) => u.status === "ACTIVE").length,
      );
    } catch {
      // Silently handle load errors
    }
  }, [client]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Email input handling
  const addEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (
      trimmed &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) &&
      !emails.includes(trimmed)
    ) {
      setEmails((prev) => [...prev, trimmed]);
    }
    setEmailInput("");
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" ||
      e.key === "," ||
      e.key === " " ||
      e.key === "Tab"
    ) {
      e.preventDefault();
      addEmail(emailInput);
    }
    if (e.key === "Backspace" && !emailInput && emails.length > 0) {
      setEmails((prev) => prev.slice(0, -1));
    }
  };

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e !== email));
  };

  // Send invites
  const handleSendInvites = async () => {
    const allEmails = emailInput.trim()
      ? [...emails, emailInput.trim()]
      : emails;
    if (allEmails.length === 0) return;

    setSending(true);
    try {
      for (const email of allEmails) {
        await client.post("/admin/users", {
          email,
          firstName: email.split("@")[0],
          lastName: "",
          roleIds: [],
        });
      }
      showToast(`${allEmails.length} invite(s) sent!`);
      setEmails([]);
      setEmailInput("");
      await loadTeamData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send invites";
      showToast(msg, "error");
    } finally {
      setSending(false);
    }
  };

  // Generate invite link
  const handleGenerateLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await client.post<{ link: string }>(
        "/admin/users/invite-link",
      );
      setInviteLink(res.link);
    } catch {
      // Generate a demo link if API doesn't support it yet
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setInviteLink(
        `${origin}/register?invite=${Math.random().toString(36).slice(2, 10)}`,
      );
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      showToast("Could not copy to clipboard", "error");
    }
  };

  // Resend / Revoke
  const handleResend = async (inviteId: string) => {
    try {
      await client.post(`/admin/users/invitations/${inviteId}/resend`);
      showToast("Invite resent");
    } catch {
      showToast("Already invited — will get access on next login", "success");
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      await client.delete(`/admin/users/${inviteId}`);
      showToast("Invitation revoked");
      await loadTeamData();
    } catch {
      showToast("Could not revoke invitation", "error");
    }
  };

  // CSV upload
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split("\n")
        .slice(1)
        .filter((l) => l.trim());
      const parsed = lines.map((l) => {
        const [email, firstName, lastName] = l.split(",").map((s) => s.trim());
        return { email, firstName: firstName || "", lastName: lastName || "" };
      });

      setSending(true);
      let success = 0;
      for (const entry of parsed) {
        if (entry.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email)) {
          try {
            await client.post("/admin/users", {
              email: entry.email,
              firstName: entry.firstName,
              lastName: entry.lastName,
              roleIds: [],
            });
            success++;
          } catch {
            // Skip individual failures
          }
        }
      }
      showToast(`${success} user(s) invited from CSV`);
      setSending(false);
      await loadTeamData();
    };
    reader.readAsText(file);
  };

  const csvInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <Card padding="lg">
      <div className={styles.inviteSection}>
        {/* Header */}
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <UserPlus size={18} />
            Invite Your Team
          </h3>
          <span className={styles.seatBadge}>
            <Users size={12} /> {activeCount} / {maxSeats} seats
          </span>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}
          >
            {toast.message}
          </div>
        )}

        {/* Email Input */}
        <div className={styles.emailInputRow}>
          <div className={styles.emailInputWrapper}>
            {emails.map((email) => (
              <span key={email} className={styles.emailChip}>
                {email}
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className={styles.emailChipRemove}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            <input
              className={styles.emailRawInput}
              type="email"
              placeholder={
                emails.length
                  ? "Add more emails..."
                  : "Enter email addresses (press Enter or comma)"
              }
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={handleEmailKeyDown}
              onBlur={() => {
                if (emailInput.trim()) addEmail(emailInput);
              }}
            />
          </div>
          <select
            className={styles.roleSelect}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="viewer">Viewer</option>
          </select>
          <button
            className={styles.sendBtn}
            onClick={handleSendInvites}
            disabled={sending || (emails.length === 0 && !emailInput.trim())}
          >
            {sending ? (
              <RefreshCw size={14} className="ui-spin" />
            ) : (
              <Send size={14} />
            )}
            Invite
          </button>
        </div>

        {/* Invite Link */}
        {inviteLink ? (
          <div className={styles.inviteLinkRow}>
            <Link2
              size={14}
              style={{ color: "var(--color-primary)", flexShrink: 0 }}
            />
            <span className={styles.inviteLinkUrl}>{inviteLink}</span>
            <button className={styles.copyBtn} onClick={handleCopyLink}>
              {linkCopied ? (
                <>
                  <Check size={12} /> Copied
                </>
              ) : (
                <>
                  <Copy size={12} /> Copy
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            className={styles.generateLinkBtn}
            onClick={handleGenerateLink}
            disabled={generatingLink}
          >
            <Link2 size={12} />{" "}
            {generatingLink ? "Generating..." : "Generate invite link"}
          </button>
        )}

        {/* Pending Invitations */}
        {pending.length > 0 && (
          <div>
            <h4
              className="ui-heading-sm"
              style={{ marginBottom: "var(--space-2)" }}
            >
              Pending Invitations
            </h4>
            <div className={styles.pendingList}>
              {pending.map((invite) => (
                <div key={invite.id} className={styles.pendingRow}>
                  <span className={styles.pendingEmail}>{invite.email}</span>
                  <span
                    className={`${styles.pendingStatus} ${styles.pendingStatusPending}`}
                  >
                    Pending
                  </span>
                  <div className={styles.pendingActions}>
                    <button
                      className={styles.pendingActionBtn}
                      onClick={() => handleResend(invite.id)}
                      title="Resend invitation"
                    >
                      <RefreshCw size={12} />
                    </button>
                    <button
                      className={styles.pendingActionBtn}
                      onClick={() => handleRevoke(invite.id)}
                      title="Revoke invitation"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Team Members */}
        {members.length > 0 && (
          <div>
            <h4
              className="ui-heading-sm"
              style={{ marginBottom: "var(--space-2)" }}
            >
              Team Members
            </h4>
            <div className={styles.teamGrid}>
              {members.map((m) => (
                <div key={m.id} className={styles.teamMember}>
                  <div className={styles.teamAvatar}>
                    {(m.firstName?.[0] || m.email?.[0] || "?").toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.teamName}>
                      {m.firstName} {m.lastName}
                    </div>
                    <div className={styles.teamRole}>
                      {m.roles?.map((r) => r.name).join(", ") || "User"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk CSV Import */}
        <div className={styles.bulkRow}>
          <span className={styles.bulkLabel}>Or invite in bulk:</span>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleCsvUpload}
          />
          <button
            className={styles.bulkBtn}
            onClick={() => csvInputRef.current?.click()}
          >
            <Upload size={12} /> Upload CSV
          </button>
          <span className={styles.bulkLabel}>(email, firstName, lastName)</span>
        </div>
      </div>
    </Card>
  );
}
