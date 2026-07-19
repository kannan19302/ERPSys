"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApiClient } from "@unerp/framework";
import { useRouter } from "next/navigation";
import {
  Volume2,
  Mic,
  Square,
  Trash2,
  Pencil,
  Check,
  X,
  Mail,
  Briefcase,
  Clock,
  MapPin,
  Users as UsersIcon,
  Network,
  Loader2,
  Search,
  MessageSquare,
  StickyNote,
  Camera,
  Globe,
  Monitor,
  LayoutGrid,
} from "lucide-react";
import styles from "./ProfileDirectorySection.module.css";

/** Curated, broad-coverage IANA timezone list — full Intl.supportedValuesOf('timeZone') is 400+ entries, overkill for a picker. */
const TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "America/Toronto",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Moscow",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Perth",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const WEEKDAYS: Array<{ key: string; label: string }> = [
  { key: "MON", label: "M" },
  { key: "TUE", label: "T" },
  { key: "WED", label: "W" },
  { key: "THU", label: "T" },
  { key: "FRI", label: "F" },
  { key: "SAT", label: "S" },
  { key: "SUN", label: "S" },
];

const PRESENCE_LABELS: Record<string, string> = {
  ACTIVE: "Online",
  AWAY: "Away",
  BRB: "Be right back",
  DND: "Do not disturb",
  OOO: "Out of office",
  INACTIVE: "Offline",
  IN_MEETING: "In a meeting",
  FOCUSING: "Focusing",
};
const PRESENCE_COLORS: Record<string, string> = {
  ACTIVE: "#10b981",
  IN_MEETING: "#10b981",
  FOCUSING: "#10b981",
  AWAY: "#f59e0b",
  BRB: "#f59e0b",
  DND: "#ef4444",
  OOO: "#94a3b8",
  INACTIVE: "#94a3b8",
};

interface DirectoryUser {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  email?: string;
  jobTitle?: string | null;
  employeeId?: string | null;
}

interface ProfileCardData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  employeeId: string;
  pronouns: string | null;
  jobTitle: string | null;
  department: { id: string; name: string } | null;
  overview: string | null;
  pronunciationAudioUrl: string | null;
  timezone: string | null;
  workingHoursStart: string | null;
  workingHoursEnd: string | null;
  workingDays: string[];
  workingLocation: string | null;
  organization: { id: string; name: string; slug: string };
  presence: {
    status: string;
    statusText: string | null;
    statusEmoji: string | null;
  } | null;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  } | null;
  directReportsCount: number;
  colleagueCount: number;
  isSelf: boolean;
}

interface OrgChartNode {
  self: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    jobTitle: string | null;
    presence: string | null;
  };
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    presence: string | null;
  } | null;
  directReports: Array<{
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
    jobTitle: string | null;
    presence: string | null;
  }>;
}

function Avatar({
  name,
  url,
  size = 40,
}: {
  name: string;
  url?: string | null;
  size?: number;
}) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    );
  }
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={styles.genericAvatar}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

function PresenceDot({ status }: { status: string | null }) {
  if (!status) return null;
  return (
    <span
      className={styles.orgNodeDot}
      style={{ background: PRESENCE_COLORS[status] ?? "#94a3b8" }}
      title={PRESENCE_LABELS[status] ?? status}
    />
  );
}

/** Inline-editable text/textarea field with a pencil affordance. */
function EditableField({
  label,
  value,
  onSave,
  placeholder,
  multiline,
  icon,
  readOnlyHint,
}: {
  label: string;
  value: string;
  onSave: (next: string) => Promise<void>;
  placeholder?: string;
  multiline?: boolean;
  icon?: React.ReactNode;
  readOnlyHint?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(value), [value]);

  if (readOnlyHint) {
    return (
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {icon} {label}
        </label>
        <div className={styles.fieldReadonly}>
          {value || <span className={styles.fieldEmpty}>Not set</span>}
          <span className={styles.fieldHint}>{readOnlyHint}</span>
        </div>
      </div>
    );
  }

  if (!editing) {
    return (
      <div className={styles.field}>
        <label className={styles.fieldLabel}>
          {icon} {label}
        </label>
        <button
          type="button"
          className={styles.fieldValueBtn}
          onClick={() => setEditing(true)}
        >
          <span>
            {value || (
              <span className={styles.fieldEmpty}>{placeholder ?? "Add"}</span>
            )}
          </span>
          <Pencil size={12} className={styles.fieldPencil} />
        </button>
      </div>
    );
  }

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>
        {icon} {label}
      </label>
      <div className={styles.fieldEditRow}>
        {multiline ? (
          <textarea
            className={styles.fieldTextarea}
            value={draft}
            autoFocus
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
          />
        ) : (
          <input
            className={styles.fieldInput}
            value={draft}
            autoFocus
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
        )}
        <div className={styles.fieldEditActions}>
          <button
            type="button"
            className={styles.fieldIconBtn}
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(draft);
              setSaving(false);
              setEditing(false);
            }}
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={13} />
            )}
          </button>
          <button
            type="button"
            className={styles.fieldIconBtn}
            onClick={() => {
              setDraft(value);
              setEditing(false);
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export interface ProfileDirectorySectionProps {
  /** If set, view another user's card/org-chart read-only; otherwise the signed-in user's own, editable. */
  targetUserId?: string;
  theme?: string;
  setTheme?: (t: string) => void;
  density?: string;
  setDensity?: (d: string) => void;
  language?: string;
  onSavePreferences?: (updated: {
    language?: string;
    theme?: string;
  }) => Promise<void>;
}

export function ProfileDirectorySection({
  targetUserId,
  theme,
  setTheme,
  density,
  setDensity,
  language,
  onSavePreferences,
}: ProfileDirectorySectionProps) {
  const client = useApiClient();
  const router = useRouter();
  const isSelf = !targetUserId;

  const [card, setCard] = useState<ProfileCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<DirectoryUser[]>([]);
  const [colleagues, setColleagues] = useState<DirectoryUser[]>([]);
  const [chartCenterId, setChartCenterId] = useState<string | undefined>(
    targetUserId,
  );
  const [chart, setChart] = useState<OrgChartNode | null>(null);

  // Manager picker
  const [managerQuery, setManagerQuery] = useState("");
  const [managerResults, setManagerResults] = useState<DirectoryUser[]>([]);
  const [managerPickerOpen, setManagerPickerOpen] = useState(false);

  // Pronunciation recorder
  const [recording, setRecording] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  // Avatar upload
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Presence & status
  const [presence, setPresence] = useState<string>("ACTIVE");
  const [visibility, setVisibility] = useState<string>("EVERYONE");
  const [savingPresence, setSavingPresence] = useState(false);

  const fetchPresence = useCallback(
    async (uid: string) => {
      try {
        const data = await client.get<any>(`/communication/presence/${uid}`);
        setPresence(data.presence);
        setVisibility(data.visibility);
      } catch {}
    },
    [client],
  );

  const handlePresenceChange = async (
    next: Partial<{ presence: string; visibility: string }>,
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
      loadCard();
    } catch {
      alert("Could not update your status.");
    } finally {
      setSavingPresence(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 800 * 1024) {
      alert("Image exceeds the 800KB size limit.");
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
      const localUserStr = localStorage.getItem("user");
      if (localUserStr) {
        const localUser = JSON.parse(localUserStr);
        localUser.avatar = result.avatar;
        localStorage.setItem("user", JSON.stringify(localUser));
      }
      window.dispatchEvent(new Event("user-profile-updated"));
      loadCard();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setUploadingAvatar(false);
    }
  };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const loadCard = useCallback(() => {
    setLoading(true);
    // Self view: one consolidated call (/people/me already includes the
    // user identity fields + org + reports + colleagues — see
    // PeopleService.getMyFullProfile). Other-user view reuses the compact
    // card endpoint, which already has everything a read-only view needs.
    if (isSelf) {
      client
        .get<any>("/people/me")
        .then((me) => {
          setCard({
            userId: me.userId,
            firstName: me.firstName,
            lastName: me.lastName,
            email: me.email,
            avatar: me.avatar,
            employeeId: me.employeeId,
            pronouns: me.pronouns,
            jobTitle: me.jobTitle,
            department: me.department,
            overview: me.overview,
            pronunciationAudioUrl: me.pronunciationAudioUrl,
            timezone: me.timezone,
            workingHoursStart: me.workingHoursStart,
            workingHoursEnd: me.workingHoursEnd,
            workingDays: Array.isArray(me.workingDays) ? me.workingDays : [],
            workingLocation: me.workingLocation,
            organization: me.organization ?? { id: "", name: "", slug: "" },
            presence: null,
            manager: me.manager,
            directReportsCount: me.directReports?.length ?? 0,
            colleagueCount: me.colleagues?.length ?? 0,
            isSelf: true,
          });
          setReports(me.directReports ?? []);
          setColleagues(me.colleagues ?? []);
        })
        .catch(() => setCard(null))
        .finally(() => setLoading(false));
    } else {
      client
        .get<ProfileCardData>(`/people/${targetUserId}/card`)
        .then((res) => setCard(res))
        .catch(() => setCard(null))
        .finally(() => setLoading(false));
    }
  }, [client, targetUserId, isSelf]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  useEffect(() => {
    if (card) {
      fetchPresence(card.userId);
    }
  }, [card, fetchPresence]);

  useEffect(() => {
    setChartCenterId(targetUserId);
  }, [targetUserId]);

  const loadChart = useCallback(
    (centerId: string) => {
      client
        .get<OrgChartNode>(`/people/${centerId}/org-chart`)
        .then((res) => setChart(res))
        .catch(() => setChart(null));
    },
    [client],
  );

  useEffect(() => {
    if (!card) return;
    // Org chart always centers on a concrete user id (self or the viewed target).
    loadChart(chartCenterId ?? card.userId);
  }, [card, chartCenterId, loadChart]);

  useEffect(() => {
    if (!managerPickerOpen) return;
    const t = setTimeout(() => {
      client
        .get<DirectoryUser[]>(
          `/people/directory?q=${encodeURIComponent(managerQuery)}`,
        )
        .then((res) =>
          setManagerResults(res.filter((u) => u.id !== card?.userId)),
        )
        .catch(() => setManagerResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [managerQuery, managerPickerOpen, client, card?.userId]);

  const saveField = async (patch: Record<string, unknown>) => {
    await client.patch("/people/me", patch);
    loadCard();
  };

  const startRecording = async () => {
    setRecError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        if (blob.size > 300 * 1024) {
          setRecError("Recording too long — keep it under ~5 seconds.");
          return;
        }
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            await client.post("/people/me/pronunciation", {
              audioDataUrl: reader.result,
            });
            loadCard();
          } catch (err) {
            setRecError(err instanceof Error ? err.message : "Upload failed.");
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
        setRecording(false);
      }, 6000);
    } catch {
      setRecError("Microphone access was denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const playPronunciation = () => {
    if (!card?.pronunciationAudioUrl) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = card.pronunciationAudioUrl;
    audioRef.current.onended = () => setPlaying(false);
    audioRef.current.play().catch(() => setPlaying(false));
    setPlaying(true);
  };

  const goToChat = async () => {
    try {
      const channel = targetUserId
        ? await client.post<{ id: string }>("/communication/channels/dm", {
            userId: targetUserId,
          })
        : await client.post<{ id: string }>(
            "/communication/channels/self-notes",
            {},
          );
      router.push(`/connect?dm=${channel.id}`);
    } catch {
      /* Connect module unavailable — no-op */
    }
  };

  const toggleWorkingDay = (day: string) => {
    if (!card) return;
    const next = card.workingDays.includes(day)
      ? card.workingDays.filter((d) => d !== day)
      : [...card.workingDays, day];
    saveField({ workingDays: next });
  };

  if (loading && !card) {
    return (
      <div className={styles.loadingCard}>
        <Loader2 size={18} className="animate-spin" /> Loading profile…
      </div>
    );
  }
  if (!card) {
    return (
      <div className={styles.loadingCard}>Couldn't load this profile.</div>
    );
  }

  return (
    <div className={styles.wrap}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroTop}>
          <div className={styles.heroAvatarBlock}>
            <div
              className={`${styles.heroAvatarLarge} ${isSelf ? "cursor-pointer hover:opacity-90 relative group" : ""}`}
              style={{ width: 90, height: 90, borderRadius: "50%" }}
              onClick={() =>
                isSelf && !uploadingAvatar && avatarFileRef.current?.click()
              }
            >
              <Avatar
                name={`${card.firstName} ${card.lastName}`}
                url={card.avatar}
                size={84}
              />
              {isSelf && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? (
                    <Loader2 size={20} className="animate-spin text-white" />
                  ) : (
                    <Camera size={20} className="text-white" />
                  )}
                </div>
              )}
            </div>
            {isSelf && (
              <input
                ref={avatarFileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            )}
          </div>
          <div className={styles.heroDetails}>
            <div className={styles.heroNameRow}>
              <h2 className={styles.heroName}>
                {card.firstName} {card.lastName}
              </h2>
              {card.pronunciationAudioUrl && (
                <button
                  type="button"
                  className={styles.pronounceBtn}
                  onClick={playPronunciation}
                  title="Hear name pronunciation"
                >
                  <Volume2
                    size={16}
                    className={playing ? styles.pronouncePlaying : undefined}
                  />
                </button>
              )}
              {isSelf && (
                <>
                  {!recording ? (
                    <button
                      type="button"
                      className={styles.recordBtn}
                      onClick={startRecording}
                      title="Record how to pronounce your name (max ~6s)"
                    >
                      <Mic size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.recordBtnActive}
                      onClick={stopRecording}
                      title="Stop recording"
                    >
                      <Square size={12} />
                    </button>
                  )}
                  {card.pronunciationAudioUrl && (
                    <button
                      type="button"
                      className={styles.recordBtn}
                      onClick={() =>
                        client.delete("/people/me/pronunciation").then(loadCard)
                      }
                      title="Remove pronunciation clip"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </>
              )}
            </div>
            {recError && <p className={styles.recError}>{recError}</p>}

            <div className={styles.heroMetaRow}>
              {isSelf ? (
                <EditableField
                  label=""
                  value={card.pronouns ?? ""}
                  placeholder="Add pronouns (e.g. he/him)"
                  onSave={(v) => saveField({ pronouns: v })}
                />
              ) : (
                card.pronouns && (
                  <span className={styles.pronounsBadge}>{card.pronouns}</span>
                )
              )}
              <span className={styles.employeeIdBadge}>
                ID {card.employeeId}
              </span>
            </div>

            <div className={styles.heroRoleRow}>
              {isSelf ? (
                <EditableField
                  label=""
                  icon={<Briefcase size={12} />}
                  value={card.jobTitle ?? ""}
                  placeholder="Add your job title"
                  onSave={(v) => saveField({ jobTitle: v })}
                />
              ) : (
                <span className={styles.roleText}>
                  <Briefcase size={12} /> {card.jobTitle ?? "No title set"}
                </span>
              )}
              {card.department && (
                <span className={styles.deptChip}>{card.department.name}</span>
              )}
            </div>
          </div>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.heroActionBtn}
              onClick={goToChat}
            >
              {isSelf ? <StickyNote size={14} /> : <MessageSquare size={14} />}
              {isSelf ? "Notes to Self" : "Message"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Grid ── */}
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Overview</h3>
          {isSelf ? (
            <EditableField
              label="About"
              value={card.overview ?? ""}
              placeholder="Write a short bio…"
              multiline
              onSave={(v) => saveField({ overview: v })}
            />
          ) : (
            <p className={styles.overviewText}>
              {card.overview || "No overview provided."}
            </p>
          )}
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Contact &amp; Organization</h3>
          {isSelf ? (
            <>
              <EditableField
                label="First Name"
                value={card.firstName}
                onSave={async (v) => {
                  await client.patch("/auth/me", { firstName: v });
                  loadCard();
                }}
              />
              <EditableField
                label="Last Name"
                value={card.lastName}
                onSave={async (v) => {
                  await client.patch("/auth/me", { lastName: v });
                  loadCard();
                }}
              />
            </>
          ) : (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Name</label>
              <div className={styles.fieldReadonly}>
                {card.firstName} {card.lastName}
              </div>
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              <Mail size={12} /> Email
            </label>
            <div className={styles.fieldReadonly}>{card.email}</div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              <Briefcase size={12} /> Organization
            </label>
            <div className={styles.fieldReadonly}>{card.organization.name}</div>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Department</label>
            <div className={styles.fieldReadonly}>
              {card.department?.name || (
                <span className={styles.fieldEmpty}>Not set</span>
              )}
              <span className={styles.fieldHint}>set by HR/admin</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Work Details</h3>
          {isSelf ? (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  <Clock size={12} /> Timezone
                </label>
                <select
                  className={styles.fieldSelect}
                  value={card.timezone ?? ""}
                  onChange={(e) => saveField({ timezone: e.target.value })}
                >
                  <option value="">Not set</option>
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Working hours</label>
                <div className={styles.hoursRow}>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={card.workingHoursStart ?? ""}
                    onChange={(e) =>
                      saveField({ workingHoursStart: e.target.value })
                    }
                  />
                  <span>–</span>
                  <input
                    type="time"
                    className={styles.timeInput}
                    value={card.workingHoursEnd ?? ""}
                    onChange={(e) =>
                      saveField({ workingHoursEnd: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Working days</label>
                <div className={styles.daysRow}>
                  {WEEKDAYS.map((d) => (
                    <button
                      key={d.key}
                      type="button"
                      className={
                        card.workingDays.includes(d.key)
                          ? styles.dayChipActive
                          : styles.dayChip
                      }
                      onClick={() => toggleWorkingDay(d.key)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
              <EditableField
                label="Working location"
                icon={<MapPin size={12} />}
                value={card.workingLocation ?? ""}
                placeholder="Remote, HQ, city…"
                onSave={(v) => saveField({ workingLocation: v })}
              />
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  <Clock size={12} /> Timezone
                </label>
                <div className={styles.fieldReadonly}>
                  {card.timezone || "Not set"}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Working hours</label>
                <div className={styles.fieldReadonly}>
                  {card.workingHoursStart && card.workingHoursEnd
                    ? `${card.workingHoursStart}–${card.workingHoursEnd}`
                    : "Not set"}
                  {card.workingDays.length > 0
                    ? ` · ${card.workingDays.join(", ")}`
                    : ""}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  <MapPin size={12} /> Location
                </label>
                <div className={styles.fieldReadonly}>
                  {card.workingLocation || "Not set"}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Reporting</h3>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>
              <UsersIcon size={12} /> Manager
            </label>
            {isSelf ? (
              <div className={styles.managerPickerWrap}>
                {card.manager ? (
                  <div className={styles.managerChip}>
                    <Avatar
                      name={`${card.manager.firstName} ${card.manager.lastName}`}
                      url={card.manager.avatar}
                      size={22}
                    />
                    <span>
                      {card.manager.firstName} {card.manager.lastName}
                    </span>
                    <button
                      type="button"
                      onClick={() => saveField({ managerId: "" })}
                      title="Remove manager"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={styles.fieldValueBtn}
                    onClick={() => setManagerPickerOpen((v) => !v)}
                  >
                    <span className={styles.fieldEmpty}>Set your manager</span>
                    <Search size={12} />
                  </button>
                )}
                {managerPickerOpen && (
                  <div className={styles.managerDropdown}>
                    <input
                      className={styles.fieldInput}
                      placeholder="Search people…"
                      value={managerQuery}
                      autoFocus
                      onChange={(e) => setManagerQuery(e.target.value)}
                    />
                    <div className={styles.managerResults}>
                      {managerResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          className={styles.managerResultRow}
                          onClick={() => {
                            saveField({ managerId: u.id });
                            setManagerPickerOpen(false);
                            setManagerQuery("");
                          }}
                        >
                          <Avatar
                            name={`${u.firstName} ${u.lastName}`}
                            url={u.avatar}
                            size={22}
                          />
                          <span>
                            {u.firstName} {u.lastName}
                          </span>
                        </button>
                      ))}
                      {managerResults.length === 0 && (
                        <p className={styles.fieldHint} style={{ padding: 8 }}>
                          Type to search…
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.fieldReadonly}>
                {card.manager
                  ? `${card.manager.firstName} ${card.manager.lastName}`
                  : "Not set"}
              </div>
            )}
          </div>

          {isSelf && reports.length > 0 && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Reports to me ({reports.length})
              </label>
              <div className={styles.peopleList}>
                {reports.map((r) => (
                  <div key={r.id} className={styles.personRow}>
                    <Avatar
                      name={`${r.firstName} ${r.lastName}`}
                      url={r.avatar}
                      size={22}
                    />
                    <span>
                      {r.firstName} {r.lastName}
                    </span>
                    {r.jobTitle && (
                      <span className={styles.personRole}>{r.jobTitle}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {isSelf && colleagues.length > 0 && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Colleagues ({colleagues.length})
              </label>
              <div className={styles.peopleList}>
                {colleagues.slice(0, 6).map((c) => (
                  <div key={c.id} className={styles.personRow}>
                    <Avatar
                      name={`${c.firstName} ${c.lastName}`}
                      url={c.avatar}
                      size={22}
                    />
                    <span>
                      {c.firstName} {c.lastName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {isSelf && (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Preferences &amp; Status</h3>

            {/* Presence Status */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Status Presence</label>
              <div className="flex gap-2">
                <select
                  className={styles.fieldSelect}
                  value={presence}
                  disabled={savingPresence}
                  onChange={(e) =>
                    handlePresenceChange({ presence: e.target.value })
                  }
                >
                  {Object.keys(PRESENCE_LABELS).map((p) => (
                    <option key={p} value={p}>
                      {PRESENCE_LABELS[p]}
                    </option>
                  ))}
                </select>
                <select
                  className={styles.fieldSelect}
                  value={visibility}
                  disabled={savingPresence}
                  onChange={(e) =>
                    handlePresenceChange({ visibility: e.target.value })
                  }
                >
                  <option value="EVERYONE">Visible to org</option>
                  <option value="NOBODY">Appear offline</option>
                </select>
              </div>
            </div>

            {/* Language */}
            {language && onSavePreferences && (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  <Globe size={12} /> Language
                </label>
                <select
                  className={styles.fieldSelect}
                  value={language}
                  onChange={(e) =>
                    onSavePreferences({ language: e.target.value })
                  }
                >
                  <option>English (US)</option>
                  <option>Spanish (ES)</option>
                  <option>French (FR)</option>
                </select>
              </div>
            )}

            {/* Theme */}
            {theme && setTheme && onSavePreferences && (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  <Monitor size={12} /> Theme
                </label>
                <select
                  className={styles.fieldSelect}
                  value={theme}
                  onChange={(e) => {
                    const val = e.target.value;
                    onSavePreferences({ theme: val });
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
            )}

            {/* Density */}
            {density && setDensity && (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  <LayoutGrid size={12} /> Density
                </label>
                <select
                  className={styles.fieldSelect}
                  value={density}
                  onChange={(e) => setDensity(e.target.value as any)}
                >
                  <option value="comfortable">Comfortable (default)</option>
                  <option value="compact">Compact (tighter fit)</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Org chart ── */}
      <div id="org-chart" className={styles.orgChartCard}>
        <h3 className={styles.cardTitle}>
          <Network size={16} /> Org Chart
        </h3>
        {!chart ? (
          <p className={styles.fieldHint}>Loading org chart…</p>
        ) : (
          <div className={styles.orgChart}>
            {chart.manager && (
              <div className={styles.orgLevel}>
                <button
                  type="button"
                  className={styles.orgNode}
                  onClick={() => setChartCenterId(chart.manager!.id)}
                >
                  <Avatar
                    name={`${chart.manager.firstName} ${chart.manager.lastName}`}
                    url={chart.manager.avatar}
                    size={40}
                  />
                  <PresenceDot status={chart.manager.presence} />
                  <span>
                    {chart.manager.firstName} {chart.manager.lastName}
                  </span>
                </button>
                <div className={styles.orgConnector} />
              </div>
            )}
            <div className={styles.orgLevel}>
              <div className={`${styles.orgNode} ${styles.orgNodeSelf}`}>
                <Avatar
                  name={`${chart.self.firstName} ${chart.self.lastName}`}
                  url={chart.self.avatar}
                  size={48}
                />
                <PresenceDot status={chart.self.presence} />
                <span>
                  {chart.self.firstName} {chart.self.lastName}
                </span>
                {chart.self.jobTitle && (
                  <span className={styles.orgNodeRole}>
                    {chart.self.jobTitle}
                  </span>
                )}
              </div>
            </div>
            {chart.directReports.length > 0 && (
              <>
                <div className={styles.orgConnector} />
                <div className={styles.orgLevelRow}>
                  {chart.directReports.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      className={styles.orgNode}
                      onClick={() => setChartCenterId(r.id)}
                    >
                      <Avatar
                        name={`${r.firstName} ${r.lastName}`}
                        url={r.avatar}
                        size={40}
                      />
                      <PresenceDot status={r.presence} />
                      <span>
                        {r.firstName} {r.lastName}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
