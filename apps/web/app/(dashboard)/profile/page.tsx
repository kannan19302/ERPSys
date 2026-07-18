"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useTheme } from "@unerp/ui";
import { RouteGuard, useApiClient } from "@unerp/framework";

interface ProfileUser {
  firstName: string;
  lastName: string;
  email: string;
  roles?: string[];
  preferences?: {
    language: string;
    theme: string;
  };
}

export default function ProfilePage() {
  const client = useApiClient();
  const { setTheme, density, setDensity, densities } = useTheme();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingSecurity, setSavingSecurity] = useState(false);

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
    } catch {
      // profile not loaded
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [client]);

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
        <div className="ui-stack-2">
          <h1 className={styles.s3}>User Profile</h1>
          <p className="ui-text-sm-muted">
            Manage your personal information, security, and preferences.
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-md text-sm ${message.type === "success" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"}`}
          >
            {message.text}
          </div>
        )}

        <div className="ui-grid-2">
          {/* Personal Info */}
          <div className="ui-card h-fit">
            <div className="ui-flex-between">
              <div className="ui-hstack-2">
                <User size={18} className="ui-text-primary" />
                <span>Personal Information</span>
              </div>
              <div className={styles.s4}>
                {saveStatus === "saving" && (
                  <span className={styles.s5}>
                    <Loader2 size={12} className="animate-spin text-warning" />
                    Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="ui-flex ui-items-center ui-gap-1">
                    <Check size={14} className="text-success" />
                    Saved
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="ui-flex ui-items-center ui-gap-1">
                    Error
                  </span>
                )}
              </div>
            </div>
            <div className="ui-stack-4">
              <div className={styles.s6}>
                <div className={styles.s7}>
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </div>
                <div className="ui-flex-col">
                  <button className={styles.s8}>Upload Photo</button>
                  <span className="ui-text-xs-muted mt-1">
                    JPG, GIF or PNG. Max size of 800K
                  </span>
                </div>
              </div>

              <div className="ui-grid-2">
                <div className="ui-form-group">
                  <label className="ui-label">First Name</label>
                  <input
                    className="ui-input"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    onBlur={() => handleInfoSubmit()}
                  />
                </div>
                <div className="ui-form-group">
                  <label className="ui-label">Last Name</label>
                  <input
                    className="ui-input"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    onBlur={() => handleInfoSubmit()}
                  />
                </div>
              </div>

              <div className="ui-form-group">
                <label className="ui-label">Email Address</label>
                <input
                  className="ui-input bg-muted"
                  defaultValue={user?.email || ""}
                  readOnly
                />
                <p className="ui-text-xs-muted mt-1">
                  Contact your admin to change your email address.
                </p>
              </div>

              <div className="ui-form-group">
                <label className="ui-label">Job Title / Role</label>
                <input
                  className="ui-input bg-muted"
                  defaultValue={user?.roles?.join(", ") || "Employee"}
                  readOnly
                />
              </div>

              <hr className="border-border my-2" />

              <div className="ui-form-group">
                <label className="ui-hstack-2">
                  <Globe size={14} /> Language
                </label>
                <select
                  className="ui-input"
                  value={formData.language}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, language: val }));
                    handleInfoSubmit({ language: val });
                  }}
                >
                  <option>English (US)</option>
                  <option>Spanish (ES)</option>
                  <option>French (FR)</option>
                </select>
              </div>
              <div className="ui-form-group">
                <label className="ui-hstack-2">
                  <Monitor size={14} /> Theme
                </label>
                <select
                  className="ui-input"
                  value={formData.theme}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData((prev) => ({ ...prev, theme: val }));
                    handleInfoSubmit({ theme: val });

                    // Apply via ThemeProvider — 'system' follows prefers-color-scheme
                    setTheme(
                      val === "Dark Mode"
                        ? "dark"
                        : val === "Light Mode"
                          ? "light"
                          : "system",
                    );
                  }}
                >
                  <option>System Default</option>
                  <option>Light Mode</option>
                  <option>Dark Mode</option>
                </select>
              </div>
              <div className="ui-form-group">
                <label className="ui-hstack-2">
                  <LayoutGrid size={14} /> Density
                </label>
                <select
                  className="ui-input"
                  value={density}
                  onChange={(e) => setDensity(e.target.value as typeof density)}
                >
                  {densities.map((d) => (
                    <option key={d} value={d}>
                      {d === "compact"
                        ? "Compact (tighter fit)"
                        : "Comfortable (default)"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Security & Authentication */}
          <div className="ui-stack-4">
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
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  <button className={styles.s8}>Enable 2FA</button>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="ui-card">
              <div className="ui-flex-between">
                <div className="ui-hstack-2">
                  <Monitor size={18} className="ui-text-primary" />
                  Active Sessions
                </div>
                <button className={styles.s10}>
                  <LogOut size={14} /> Revoke all others
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
                    <tr className="border-b">
                      <td className={styles.s13}>
                        <div className="ui-hstack-2">
                          <Monitor size={16} className="ui-text-muted" />
                          <span>Windows • Chrome</span>
                        </div>
                      </td>
                      <td className={styles.s14}>192.168.1.1</td>
                      <td className={styles.s13}>Just now</td>
                      <td className={styles.s13}>
                        <span className={styles.s15}>
                          <Check size={12} /> Current
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
