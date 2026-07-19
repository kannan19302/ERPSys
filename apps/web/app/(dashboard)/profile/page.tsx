"use client";
import styles from "./page.module.css";
import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Shield,
  Monitor,
  Globe,
  Check,
  Smartphone,
  LogOut,
  Loader2,
  LayoutGrid,
  X,
  Bell,
  Trash2,
  Search,
  Users,
  Briefcase,
} from "lucide-react";
import { useTheme } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";
import { ProfileDirectorySection } from "./ProfileDirectorySection";

interface ProfileUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string | null;
  roles?: string[];
  mfaEnabled?: boolean;
  preferences?: {
    language: string;
    theme: string;
  };
}

type PresenceStatus =
  | "ACTIVE"
  | "AWAY"
  | "BRB"
  | "DND"
  | "OOO"
  | "INACTIVE"
  | "IN_MEETING"
  | "FOCUSING";
type PresenceVisibility = "EVERYONE" | "ORG_ONLY" | "NOBODY";

const PRESENCE_LABELS: Record<PresenceStatus, string> = {
  ACTIVE: "Online",
  AWAY: "Away",
  BRB: "Be right back",
  DND: "Do not disturb",
  OOO: "Out of office",
  INACTIVE: "Offline",
  IN_MEETING: "In a meeting",
  FOCUSING: "Focusing",
};

const PRESENCE_COLORS: Record<PresenceStatus, string> = {
  ACTIVE: "#10b981",
  IN_MEETING: "#10b981",
  FOCUSING: "#10b981",
  AWAY: "#f59e0b",
  BRB: "#f59e0b",
  DND: "#ef4444",
  OOO: "#94a3b8",
  INACTIVE: "#94a3b8",
};

interface PushDevice {
  id: string;
  label: string | null;
  createdAt: string;
}

interface SessionRow {
  id: string;
  device: string | null;
  browser: string | null;
  ipAddress: string | null;
  location: string | null;
  startedAt: string;
  lastActivityAt: string;
  isCurrent: boolean;
}

interface LoginHistoryRow {
  id: string;
  status: "SUCCESS" | "FAILED";
  ipAddress: string | null;
  device: string | null;
  browser: string | null;
  location: string | null;
  failureReason: string | null;
  createdAt: string;
}

interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  jobTitle?: string | null;
  employeeId?: string | null;
}

export default function ProfilePage() {
  const client = useApiClient();
  const { setTheme, density, setDensity, densities } = useTheme();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSecurity, setSavingSecurity] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [presences, setPresences] = useState<Record<string, PresenceStatus>>(
    {},
  );
  const [directoryLoading, setDirectoryLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "sessions"
  >("profile");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const userId = new URLSearchParams(window.location.search).get("userId");
    if (userId) {
      setSelectedUserId(userId);
    }
  }, []);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    language: "English (US)",
    theme: "System Default",
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">(
    "saved",
  );

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [presence, setPresence] = useState<PresenceStatus>("ACTIVE");
  const [visibility, setVisibility] = useState<PresenceVisibility>("EVERYONE");
  const [savingPresence, setSavingPresence] = useState(false);

  const [mfaStep, setMfaStep] = useState<"idle" | "enrolling" | "disabling">(
    "idle",
  );
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[] | null>(
    null,
  );

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [revoking, setRevoking] = useState(false);

  const [pushDevices, setPushDevices] = useState<PushDevice[]>([]);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const [thisDeviceEndpoint, setThisDeviceEndpoint] = useState<string | null>(
    null,
  );

  const fetchPresence = async (userId: string) => {
    try {
      const all = await client.get<
        Array<{
          userId: string;
          presence: PresenceStatus;
          visibility?: PresenceVisibility;
        }>
      >("/communication/presence");
      const mine = all.find((p) => p.userId === userId);
      if (mine) {
        setPresence(mine.presence);
        setVisibility(mine.visibility ?? "EVERYONE");
      }
    } catch {
      // presence not loaded — keep defaults
    }
  };

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const rows = await client.get<SessionRow[]>("/auth/sessions");
      setSessions(rows);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const [loginHistory, setLoginHistory] = useState<LoginHistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchLoginHistory = async () => {
    setHistoryLoading(true);
    try {
      const rows = await client.get<LoginHistoryRow[]>("/auth/login-history");
      setLoginHistory(rows);
    } catch {
      setLoginHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchPushDevices = async () => {
    try {
      const rows = await client.get<PushDevice[]>("/auth/push/devices");
      setPushDevices(rows);
    } catch {
      setPushDevices([]);
    }
  };

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }
    setPushSupported(true);
    navigator.serviceWorker
      .getRegistration("/mfa-push-sw.js")
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setThisDeviceEndpoint(sub?.endpoint ?? null))
      .catch(() => {});
  }, []);

  const urlBase64ToUint8Array = (base64: string) => {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const raw = window.atob(
      (base64 + padding).replace(/-/g, "+").replace(/_/g, "/"),
    );
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  };

  const enablePushOnThisDevice = async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setMessage({
        type: "error",
        text: "Push approval isn't configured on this server.",
      });
      return;
    }
    setPushSubscribing(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage({
          type: "error",
          text: "Notification permission was denied.",
        });
        return;
      }
      const registration =
        await navigator.serviceWorker.register("/mfa-push-sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      const raw = subscription.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
      if (!raw.endpoint || !raw.keys?.p256dh || !raw.keys?.auth) {
        throw new Error("Browser did not return a usable subscription.");
      }
      const ua = navigator.userAgent;
      const os = /windows/i.test(ua)
        ? "Windows"
        : /android/i.test(ua)
          ? "Android"
          : /iphone|ipad|ipod/i.test(ua)
            ? "iOS"
            : /mac os/i.test(ua)
              ? "macOS"
              : /linux/i.test(ua)
                ? "Linux"
                : null;
      const browser = /edg\//i.test(ua)
        ? "Edge"
        : /chrome/i.test(ua)
          ? "Chrome"
          : /firefox/i.test(ua)
            ? "Firefox"
            : /safari/i.test(ua)
              ? "Safari"
              : "browser";
      // Include the OS so "Chrome" on a phone and "Chrome" on a laptop show
      // up as distinguishable devices in the list below — the exact device
      // confusion this feature exists to prevent.
      const label = os ? `${os} • ${browser}` : browser;
      await client.post("/auth/push/subscribe", {
        subscription: {
          endpoint: raw.endpoint,
          keys: { p256dh: raw.keys.p256dh, auth: raw.keys.auth },
        },
        label,
      });
      setThisDeviceEndpoint(raw.endpoint);
      setMessage({
        type: "success",
        text: "Push approval enabled on this device.",
      });
      fetchPushDevices();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: msg });
    } finally {
      setPushSubscribing(false);
    }
  };

  const removePushDevice = async (deviceId: string) => {
    try {
      await client.post(`/auth/push/devices/${deviceId}/remove`);
      // If we just removed this browser's own subscription, also clear it
      // locally so the "Enable push approval" button reappears correctly.
      const registration =
        await navigator.serviceWorker.getRegistration("/mfa-push-sw.js");
      const sub = await registration?.pushManager.getSubscription();
      if (sub && sub.endpoint === thisDeviceEndpoint) {
        await sub.unsubscribe();
        setThisDeviceEndpoint(null);
      }
      await fetchPushDevices();
    } catch {
      setMessage({ type: "error", text: "Could not remove that device." });
    }
  };

  const handlePresenceChange = async (
    next: Partial<{ presence: PresenceStatus; visibility: PresenceVisibility }>,
  ) => {
    const nextPresence = next.presence ?? presence;
    const nextVisibility = next.visibility ?? visibility;
    setPresence(nextPresence);
    setVisibility(nextVisibility);
    setSavingPresence(true);
    try {
      await client.put("/communication/presence", {
        presence: nextPresence,
        visibility: nextVisibility,
      });
    } catch {
      setMessage({ type: "error", text: "Could not update your status." });
    } finally {
      setSavingPresence(false);
    }
  };

  const handleAvatarSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 800 * 1024) {
      setMessage({
        type: "error",
        text: "Image exceeds the 800KB size limit.",
      });
      return;
    }
    setUploadingAvatar(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await client.request<{ avatar: string }>(
        "/auth/me/avatar",
        { method: "POST", body },
      );
      setUser((prev) => (prev ? { ...prev, avatar: result.avatar } : prev));
      setMessage({ type: "success", text: "Profile photo updated." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: msg });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const startMfaEnrollment = async () => {
    setMfaBusy(true);
    setMessage(null);
    try {
      const result = await client.post<{
        secret: string;
        qrCodeUrl: string;
      }>("/auth/mfa/setup");
      setMfaQrCode(result.qrCodeUrl);
      setMfaSecret(result.secret);
      setMfaStep("enrolling");
    } catch {
      setMessage({ type: "error", text: "Could not start 2FA setup." });
    } finally {
      setMfaBusy(false);
    }
  };

  const confirmMfa = async (enable: boolean) => {
    setMfaBusy(true);
    setMessage(null);
    try {
      const result = await client.post<{
        message: string;
        recoveryCodes?: string[];
      }>("/auth/mfa/verify", { code: mfaCode, enable });
      setUser((prev) => (prev ? { ...prev, mfaEnabled: enable } : prev));
      if (enable && result.recoveryCodes) {
        setMfaRecoveryCodes(result.recoveryCodes);
      } else {
        setMfaStep("idle");
      }
      setMfaCode("");
      setMfaQrCode(null);
      setMfaSecret(null);
      setMessage({ type: "success", text: result.message });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: msg });
    } finally {
      setMfaBusy(false);
    }
  };

  const handleRevokeOthers = async () => {
    setRevoking(true);
    try {
      await client.post("/auth/sessions/revoke-others");
      await fetchSessions();
      setMessage({ type: "success", text: "Other sessions revoked." });
    } catch {
      setMessage({ type: "error", text: "Could not revoke sessions." });
    } finally {
      setRevoking(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const data = await client.get<ProfileUser>("/auth/me");
      setUser(data);
      setFormData({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        language: data.preferences?.language || "English (US)",
        theme: data.preferences?.theme || "System Default",
      });
      fetchPresence(data.id);
    } catch {
      // profile not loaded
    } finally {
      setLoading(false);
    }
  };

  const fetchDirectory = async (q = "") => {
    setDirectoryLoading(true);
    try {
      const res = await client.get<DirectoryUser[]>(
        `/people/directory?q=${encodeURIComponent(q)}`,
      );
      setDirectory(res);
    } catch {
      setDirectory([]);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const fetchAllPresences = async () => {
    try {
      const all = await client.get<
        Array<{
          userId: string;
          presence: PresenceStatus;
          visibility?: PresenceVisibility;
        }>
      >("/communication/presence");
      const map: Record<string, PresenceStatus> = {};
      all.forEach((p) => {
        if (p.visibility !== "NOBODY") {
          map[p.userId] = p.presence;
        } else {
          map[p.userId] = "INACTIVE";
        }
      });
      setPresences(map);
    } catch {}
  };

  useEffect(() => {
    fetchProfile();
    fetchSessions();
    fetchPushDevices();
    fetchLoginHistory();
    fetchAllPresences();
  }, [client]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchDirectory(directorySearch);
    }, 250);
    return () => clearTimeout(t);
  }, [directorySearch, client]);

  const handleInfoSubmit = async (updatedFields?: Partial<typeof formData>) => {
    setSaveStatus("saving");
    setMessage(null);

    const fieldsToSave = {
      firstName: updatedFields?.hasOwnProperty("firstName")
        ? updatedFields.firstName
        : formData.firstName,
      lastName: updatedFields?.hasOwnProperty("lastName")
        ? updatedFields.lastName
        : formData.lastName,
      preferences: {
        language: updatedFields?.language ?? formData.language,
        theme: updatedFields?.theme ?? formData.theme,
      },
    };

    try {
      const data = await client.patch<ProfileUser>("/auth/me", fieldsToSave);
      {
        localStorage.setItem("user", JSON.stringify(data));
        window.dispatchEvent(new Event("user-profile-updated"));
        setUser(data);
        setSaveStatus("saved");
      }
    } catch (err) {
      setSaveStatus("error");
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({
        type: "error",
        text: `An unexpected error occurred: ${msg}`,
      });
    }
  };

  const handleSecuritySubmit = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setSavingSecurity(true);
    setMessage(null);
    try {
      await client.patch("/auth/me", {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
      });
      {
        setMessage({ type: "success", text: "Password updated successfully." });
        setSecurityData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSavingSecurity(false);
    }
  };

  if (loading) {
    return <div className={styles.s1}>Loading profile...</div>;
  }

  return (
    <RouteGuard permission="profile.read">
      <div
        className={`max-w-7xl mx-auto md:p-8 animate-fade-in-up ${styles.s2}`}
      >
        {message && (
          <div
            className={`p-4 rounded-md text-sm ${message.type === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
          >
            {message.text}
          </div>
        )}

        <div className={styles.splitContainer}>
          {/* Left Sidebar: Organization Directory */}
          <div className={styles.sidebar}>
            <div className="ui-card p-4 space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Users size={18} className="ui-text-primary" />
                Org Directory
              </h3>
              <div className={styles.searchWrapper}>
                <Search size={14} className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search people..."
                  className={`ui-input ${styles.searchInput}`}
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                />
              </div>
              <div className={styles.memberList}>
                {/* My Account item */}
                <button
                  onClick={() => setSelectedUserId(null)}
                  className={`${styles.memberItem} ${
                    !selectedUserId ? styles.memberItemActive : ""
                  }`}
                >
                  <div className={styles.memberAvatarWrapper}>
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className={styles.memberAvatar}
                      />
                    ) : (
                      <div className={styles.meItemIcon}>ME</div>
                    )}
                    <span
                      className={styles.sidebarPresenceDot}
                      style={{
                        backgroundColor: PRESENCE_COLORS[presence] ?? "#94a3b8",
                      }}
                      title={PRESENCE_LABELS[presence]}
                    />
                  </div>
                  <div className={styles.memberDetails}>
                    <div className={styles.memberName}>My Account</div>
                    <div className={styles.memberJobTitle}>
                      Settings & Profile
                    </div>
                  </div>
                </button>

                <div className="border-t border-border/50 my-2" />

                {directory.map((member) => {
                  const isSelected = selectedUserId === member.id;
                  const isMe = member.id === user?.id;
                  if (isMe) return null; // Already shown on top

                  const initials =
                    `${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`.toUpperCase();
                  const memberPresence = presences[member.id] ?? "INACTIVE";

                  return (
                    <button
                      key={member.id}
                      onClick={() => setSelectedUserId(member.id)}
                      className={`${styles.memberItem} ${
                        isSelected ? styles.memberItemActive : ""
                      }`}
                    >
                      <div className={styles.memberAvatarWrapper}>
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt=""
                            className={styles.memberAvatar}
                          />
                        ) : (
                          <div className={styles.memberAvatarPlaceholder}>
                            {initials}
                          </div>
                        )}
                        <span
                          className={styles.sidebarPresenceDot}
                          style={{
                            backgroundColor:
                              PRESENCE_COLORS[memberPresence] ?? "#94a3b8",
                          }}
                          title={PRESENCE_LABELS[memberPresence]}
                        />
                      </div>
                      <div className={styles.memberDetails}>
                        <div className={styles.memberName}>
                          {member.firstName} {member.lastName}
                        </div>
                        {member.jobTitle && (
                          <div className={styles.memberJobTitle}>
                            {member.jobTitle}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}

                {directory.length === 0 && !directoryLoading && (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No members found
                  </div>
                )}
                {directoryLoading && (
                  <div className="text-center py-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Loading...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel: Detail Card or Settings Tab */}
          <div className={styles.mainPanel}>
            {selectedUserId ? (
              // Viewing colleague's card
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">Colleague Profile</h2>
                  <button
                    className="ui-btn ui-btn-secondary py-1 px-3 text-xs"
                    onClick={() => setSelectedUserId(null)}
                  >
                    Back to My Account
                  </button>
                </div>
                <ProfileDirectorySection
                  targetUserId={selectedUserId}
                  theme={formData.theme}
                  setTheme={(t) => setTheme(t as any)}
                  density={density}
                  setDensity={(d) => setDensity(d as any)}
                  language={formData.language}
                />
              </div>
            ) : (
              // Viewing own account settings / profile
              <div className="space-y-6">
                <div className="ui-stack-2">
                  <h1 className={styles.s3}>User Profile & Settings</h1>
                  <p className="ui-text-sm-muted">
                    Manage your personal information, security, and preferences.
                  </p>
                </div>

                <div className="flex items-center gap-6 border-b border-border overflow-x-auto mb-6">
                  <button
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                      activeTab === "profile"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <User size={16} /> Personal Info
                  </button>
                  <button
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                      activeTab === "security"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setActiveTab("security")}
                  >
                    <Shield size={16} /> Security & Auth
                  </button>
                  <button
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                      activeTab === "sessions"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                    }`}
                    onClick={() => setActiveTab("sessions")}
                  >
                    <Monitor size={16} /> Sessions & History
                  </button>
                </div>

                {/* Personal Info Tab */}
                <div className={activeTab === "profile" ? "block" : "hidden"}>
                  <ProfileDirectorySection
                    targetUserId={undefined}
                    theme={formData.theme}
                    setTheme={(t) => setTheme(t as any)}
                    density={density}
                    setDensity={(d) => setDensity(d as any)}
                    language={formData.language}
                    onSavePreferences={async (updated) => {
                      setFormData((prev) => ({ ...prev, ...updated }));
                      await handleInfoSubmit(updated);
                    }}
                  />
                </div>

                {/* Security & Auth Tab */}
                <div
                  className={`ui-stack-4 animate-in fade-in slide-in-from-bottom-2 ${activeTab === "security" ? "block" : "hidden"}`}
                >
                  <div className="ui-card">
                    <div className="ui-hstack-2">
                      <Shield size={18} className="ui-text-primary" />
                      Security & Authentication
                    </div>
                    <div className="ui-stack-4">
                      <div className="ui-form-group">
                        <label className="ui-label">Current Password</label>
                        <input
                          type="password"
                          className="ui-input"
                          placeholder="••••••••"
                          value={securityData.currentPassword}
                          onChange={(e) =>
                            setSecurityData({
                              ...securityData,
                              currentPassword: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="ui-grid-2">
                        <div className="ui-form-group">
                          <label className="ui-label">New Password</label>
                          <input
                            type="password"
                            className="ui-input"
                            placeholder="••••••••"
                            value={securityData.newPassword}
                            onChange={(e) =>
                              setSecurityData({
                                ...securityData,
                                newPassword: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="ui-form-group">
                          <label className="ui-label">Confirm Password</label>
                          <input
                            type="password"
                            className="ui-input"
                            placeholder="••••••••"
                            value={securityData.confirmPassword}
                            onChange={(e) =>
                              setSecurityData({
                                ...securityData,
                                confirmPassword: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <button
                          className="ui-btn ui-btn-secondary"
                          onClick={handleSecuritySubmit}
                          disabled={savingSecurity || !securityData.newPassword}
                        >
                          {savingSecurity ? "Updating..." : "Update Password"}
                        </button>
                      </div>

                      <hr className="border-border my-2" />

                      <div className="ui-flex-between">
                        <div>
                          <h4 className={styles.s9}>
                            <Smartphone size={16} /> Two-Factor Authentication
                          </h4>
                          <p className="ui-text-xs-muted mt-1">
                            {user?.mfaEnabled
                              ? "2FA is enabled on your account."
                              : "Add an extra layer of security to your account."}
                          </p>
                        </div>
                        {user?.mfaEnabled ? (
                          <button
                            className={styles.s8}
                            disabled={mfaBusy}
                            onClick={() => setMfaStep("disabling")}
                          >
                            Disable 2FA
                          </button>
                        ) : (
                          <button
                            className={styles.s8}
                            disabled={mfaBusy}
                            onClick={startMfaEnrollment}
                          >
                            {mfaBusy ? "Starting..." : "Enable 2FA"}
                          </button>
                        )}
                      </div>

                      {mfaStep === "enrolling" && mfaQrCode && (
                        <div className={`ui-stack-2 ${styles.subPanel}`}>
                          <p className="ui-text-xs-muted">
                            <strong>Step 1 of 2.</strong> Scan this with an
                            authenticator app on your phone (Google
                            Authenticator, Authy, 1Password, etc). This is
                            separate from the "Push Approval" device below — an
                            authenticator app only generates codes, it can't
                            receive push notifications.
                          </p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mfaQrCode}
                            alt="MFA QR code"
                            width={140}
                            height={140}
                          />
                          {mfaSecret && (
                            <p className="ui-text-xs-muted">
                              Can't scan? Enter this key manually:{" "}
                              <code>{mfaSecret}</code>
                            </p>
                          )}
                          <p className="ui-text-xs-muted">
                            Then enter the 6-digit code it shows you:
                          </p>
                          <div className="ui-hstack-2">
                            <input
                              className="ui-input"
                              placeholder="6-digit code"
                              value={mfaCode}
                              maxLength={6}
                              onChange={(e) => setMfaCode(e.target.value)}
                            />
                            <button
                              className="ui-btn ui-btn-secondary"
                              disabled={mfaBusy || mfaCode.length !== 6}
                              onClick={() => confirmMfa(true)}
                            >
                              Verify & Enable
                            </button>
                            <button
                              className="ui-btn"
                              onClick={() => {
                                setMfaStep("idle");
                                setMfaQrCode(null);
                                setMfaSecret(null);
                                setMfaCode("");
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {mfaStep === "disabling" && (
                        <div className={`ui-stack-2 ${styles.subPanel}`}>
                          <p className="ui-text-xs-muted">
                            Enter a current 6-digit code to disable 2FA.
                          </p>
                          <div className="ui-hstack-2">
                            <input
                              className="ui-input"
                              placeholder="6-digit code"
                              value={mfaCode}
                              maxLength={6}
                              onChange={(e) => setMfaCode(e.target.value)}
                            />
                            <button
                              className="ui-btn ui-btn-secondary"
                              disabled={mfaBusy || mfaCode.length !== 6}
                              onClick={() => confirmMfa(false)}
                            >
                              Confirm Disable
                            </button>
                            <button
                              className="ui-btn"
                              onClick={() => {
                                setMfaStep("idle");
                                setMfaCode("");
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      )}

                      {mfaRecoveryCodes && (
                        <div className={`ui-stack-2 ${styles.subPanel}`}>
                          <p className="ui-text-xs-muted">
                            Save these one-time recovery codes — each can be
                            used once if you lose access to your authenticator.
                          </p>
                          <div className="ui-grid-2">
                            {mfaRecoveryCodes.map((c) => (
                              <code key={c}>{c}</code>
                            ))}
                          </div>
                          {pushSupported && !thisDeviceEndpoint && (
                            <div className={styles.pushNudge}>
                              <p className="ui-text-xs-muted">
                                <strong>Step 2 of 2 (optional).</strong> Your
                                authenticator app is set up. Want to approve
                                sign-ins with a tap instead of typing a code?
                                Enable push-approval on{" "}
                                <strong>this browser</strong> too — it's
                                registered per-device, so do this on your phone
                                as well if that's where you'd rather approve
                                from.
                              </p>
                              <button
                                className="ui-btn ui-btn-secondary"
                                disabled={pushSubscribing}
                                onClick={enablePushOnThisDevice}
                              >
                                {pushSubscribing
                                  ? "Enabling..."
                                  : "Enable push-approval on this device"}
                              </button>
                            </div>
                          )}
                          <button
                            className="ui-btn ui-btn-secondary"
                            onClick={() => {
                              setMfaRecoveryCodes(null);
                              setMfaStep("idle");
                            }}
                          >
                            Done
                          </button>
                        </div>
                      )}

                      {user?.mfaEnabled && (
                        <>
                          <hr className="border-border my-2" />
                          <div className={styles.sectionHeader}>
                            <div>
                              <h4 className={styles.s9}>
                                <Bell size={16} /> Push Approval
                              </h4>
                              <p className="ui-text-xs-muted mt-1">
                                Skip typing a code — approve sign-ins with a tap
                                on a registered device instead. Manual code
                                entry always stays available as a fallback.
                              </p>
                            </div>
                          </div>

                          {pushDevices.length > 0 && (
                            <div className="ui-stack-2">
                              <label className="ui-label">
                                Registered Devices
                              </label>
                              <div className="ui-stack-2">
                                {pushDevices.map((d) => (
                                  <div key={d.id} className={styles.deviceRow}>
                                    <div className={styles.deviceRowInfo}>
                                      <span className={styles.deviceRowLabel}>
                                        {d.label || "Unnamed Device"}
                                      </span>
                                      <span className={styles.deviceRowMeta}>
                                        Registered on{" "}
                                        {new Date(
                                          d.createdAt,
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className={styles.removeDeviceBtn}
                                      onClick={() => removePushDevice(d.id)}
                                      title="Remove device"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sessions & History Tab */}
                <div
                  className={`ui-stack-4 animate-in fade-in slide-in-from-bottom-2 ${activeTab === "sessions" ? "block" : "hidden"}`}
                >
                  {/* Active Sessions */}
                  <div className="ui-card">
                    <div className="ui-flex-between">
                      <div className="ui-hstack-2">
                        <Monitor size={18} className="ui-text-primary" />
                        Active Sessions
                      </div>
                      <button
                        className={styles.s10}
                        disabled={
                          revoking ||
                          sessions.filter((s) => !s.isCurrent).length === 0
                        }
                        onClick={handleRevokeOthers}
                      >
                        <LogOut size={14} />{" "}
                        {revoking ? "Revoking..." : "Revoke all others"}
                      </button>
                    </div>
                    <div className="ui-card-body p-0">
                      <table className={styles.s11}>
                        <thead className="border-b">
                          <tr>
                            <th className={styles.s12}>Device</th>
                            <th className={styles.s12}>IP Address</th>
                            <th className={styles.s12}>Last Active</th>
                            <th className={styles.s12}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sessionsLoading && (
                            <tr>
                              <td className={styles.s13} colSpan={4}>
                                Loading sessions...
                              </td>
                            </tr>
                          )}
                          {!sessionsLoading && sessions.length === 0 && (
                            <tr>
                              <td className={styles.s13} colSpan={4}>
                                No active sessions found.
                              </td>
                            </tr>
                          )}
                          {sessions.map((s) => (
                            <tr key={s.id} className="border-b">
                              <td className={styles.s13}>
                                <div className="ui-hstack-2">
                                  <Monitor
                                    size={16}
                                    className="ui-text-muted"
                                  />
                                  <span>
                                    {[s.device, s.browser]
                                      .filter(Boolean)
                                      .join(" • ") || "Unknown device"}
                                  </span>
                                </div>
                              </td>
                              <td className={styles.s14}>
                                {s.ipAddress || "—"}
                              </td>
                              <td className={styles.s13}>
                                {new Date(s.lastActivityAt).toLocaleString()}
                              </td>
                              <td className={styles.s13}>
                                {s.isCurrent ? (
                                  <span className={styles.s15}>
                                    <Check size={12} /> Current
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Login History */}
                  <div className="ui-card">
                    <div className="ui-hstack-2">
                      <Globe size={18} className="ui-text-primary" />
                      Recent Login History
                    </div>
                    <div className="ui-card-body p-0">
                      <table className={styles.s11}>
                        <thead className="border-b">
                          <tr>
                            <th className={styles.s12}>Date & Time</th>
                            <th className={styles.s12}>Status</th>
                            <th className={styles.s12}>IP Address</th>
                            <th className={styles.s12}>Device / Browser</th>
                            <th className={styles.s12}>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historyLoading && (
                            <tr>
                              <td className={styles.s13} colSpan={5}>
                                Loading login history...
                              </td>
                            </tr>
                          )}
                          {!historyLoading && loginHistory.length === 0 && (
                            <tr>
                              <td className={styles.s13} colSpan={5}>
                                No login history found.
                              </td>
                            </tr>
                          )}
                          {loginHistory.map((h) => (
                            <tr key={h.id} className="border-b">
                              <td className={styles.s13}>
                                {new Date(h.createdAt).toLocaleString()}
                              </td>
                              <td className={styles.s13}>
                                <span
                                  className={
                                    h.status === "SUCCESS"
                                      ? "ui-badge ui-badge-success"
                                      : "ui-badge ui-badge-danger"
                                  }
                                  style={{
                                    backgroundColor:
                                      h.status === "SUCCESS"
                                        ? "rgba(16, 185, 129, 0.1)"
                                        : "rgba(239, 68, 68, 0.1)",
                                    color:
                                      h.status === "SUCCESS"
                                        ? "#10b981"
                                        : "#ef4444",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {h.status}
                                  {h.failureReason
                                    ? ` (${h.failureReason})`
                                    : ""}
                                </span>
                              </td>
                              <td className={styles.s14}>
                                {h.ipAddress || "—"}
                              </td>
                              <td className={styles.s13}>
                                {[h.device, h.browser]
                                  .filter(Boolean)
                                  .join(" • ") || "—"}
                              </td>
                              <td className={styles.s13}>
                                {h.location || "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
