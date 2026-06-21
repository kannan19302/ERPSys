// Types, presentation metadata, and the live API client for the Connect app.
// All data comes from the backend (/api/v1/communication/*) — no seed/mock data.

export type Presence = 'ACTIVE' | 'AWAY' | 'BRB' | 'DND' | 'OOO' | 'INACTIVE';

export const PRESENCE_META: Record<Presence, { label: string; color: string; icon: string; ring?: boolean }> = {
  ACTIVE: { label: 'Active', color: '#10b981', icon: '🟢' },
  AWAY: { label: 'Away', color: '#f59e0b', icon: '🟡' },
  BRB: { label: 'Be right back', color: '#f59e0b', icon: '⏳' },
  DND: { label: 'Do not disturb', color: '#f43f5e', icon: '⛔', ring: true },
  OOO: { label: 'Out of office', color: '#a855f7', icon: '🏖️' },
  INACTIVE: { label: 'Offline', color: '#9ca3af', icon: '⚫' },
};

export const PRESENCE_ORDER: Presence[] = ['ACTIVE', 'AWAY', 'BRB', 'DND', 'OOO', 'INACTIVE'];

export const EMOJI_PALETTE = ['👍', '❤️', '😂', '🎉', '🙌', '👀', '🔥', '✅', '⚠️', '🚀', '💡', '🤝'];

export const STATUS_SUGGESTIONS: { emoji: string; text: string; duration?: string }[] = [
  { emoji: '📅', text: 'In a meeting', duration: '1 hour' },
  { emoji: '🚌', text: 'Commuting', duration: '30 minutes' },
  { emoji: '🤒', text: 'Out sick', duration: 'Today' },
  { emoji: '🌴', text: 'Vacationing', duration: 'This week' },
  { emoji: '🏠', text: 'Working remotely', duration: 'Today' },
  { emoji: '🎯', text: 'Focusing', duration: '2 hours' },
];

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  presence: Presence;
  statusText?: string | null;
  statusEmoji?: string | null;
  role?: string | null;
  timezone?: string | null;
  lastSeen?: number | null;
}

export interface Space { id: string; name: string; emoji: string; description?: string }

export type ConversationKind = 'CHANNEL' | 'DM' | 'GROUP';

export interface LastMessage { content: string; ts: number; authorName: string; system: boolean }

export interface Conversation {
  id: string;
  kind: ConversationKind;
  name: string;
  spaceId?: string | null;
  topic?: string | null;
  description?: string | null;
  memberIds?: string[];
  unreadCount?: number;
  lastMessage?: LastMessage;
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
}

export interface Attachment { id: string; name: string; size: number; mime: string; url?: string }
export interface Reaction { emoji: string; userIds: string[] }

export interface ConnectMessage {
  id: string;
  conversationId: string;
  authorId: string;
  content: string;
  kind: 'USER' | 'SYSTEM';
  parentId?: string;
  pinned: boolean;
  attachments: Attachment[];
  meetingId?: string;
  ts: number;
  editedTs?: number;
  deleted: boolean;
  reactions: Reaction[];
  forwarded?: boolean;
  forwardedFrom?: string;
  bookmarked?: boolean;
}

export interface Meeting { id: string; title: string; code: string; channelId?: string | null; active: boolean; startedAt: string }
export type RsvpStatus = 'accepted' | 'declined' | 'tentative' | 'pending';
export type RecurrenceRule = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export interface CalendarEvent {
  id: string; title: string; date: string; time: string; durationMins: number;
  meetingCode?: string | null; attendees: string[];
  description?: string; location?: string; color?: string; allDay?: boolean;
  recurrence?: RecurrenceRule; rsvpStatus?: RsvpStatus; endDate?: string;
}

export interface Workspace {
  me: Member;
  directory: Member[];
  spaces: Space[];
  channels: Conversation[];
  conversations: Conversation[];
}

/* ── formatting ── */

export function parseMarkdown(text: string): string {
  return text
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
}

/* ── helpers ── */

let idc = 0;
export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${(idc++).toString(36)}`;

export const initials = (name: string) =>
  (name || '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#0ea5e9', '#f97316', '#14b8a6', '#8b5cf6', '#10b981', '#f43f5e', '#eab308'];
export const avatarColor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
};

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;

export const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const formatDateSmart = (ts: number) => {
  const d = new Date(ts); const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (d.toDateString() === now.toDateString()) return formatTime(ts);
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday ${formatTime(ts)}`;
  if (diff < 7 * 86400000) return d.toLocaleDateString([], { weekday: 'short' }) + ' ' + formatTime(ts);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + formatTime(ts);
};

export const formatDateDivider = (ts: number) => {
  const d = new Date(ts); const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

export const isImageMime = (mime: string) => mime.startsWith('image/');

/* ── Keyboard shortcuts ── */
export const SHORTCUTS: { key: string; mod: string; label: string }[] = [
  { key: 'K', mod: 'Ctrl', label: 'Quick search / switch' },
  { key: 'N', mod: 'Ctrl', label: 'New message' },
  { key: 'Shift+N', mod: 'Ctrl', label: 'New channel' },
  { key: 'E', mod: 'Ctrl', label: 'Edit last message' },
  { key: '/', mod: 'Ctrl', label: 'Focus composer' },
];

/* ── API client ── */

const BASE = 'http://localhost:3001/api/v1/communication';

function headers(): Record<string, string> {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers(), ...(init?.headers || {}) } });
  if (!res.ok) {
    let detail = res.statusText;
    try { const body = await res.json(); detail = body.message || detail; } catch { /* ignore */ }
    throw new Error(typeof detail === 'string' ? detail : 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  workspace: () => req<Workspace>('/workspace'),
  directory: () => req<Member[]>('/directory'),
  messages: (channelId: string) => req<ConnectMessage[]>(`/channels/${channelId}/messages`),
  markRead: (channelId: string) => req<{ ok: boolean }>(`/channels/${channelId}/read`, { method: 'POST' }),
  send: (channelId: string, body: { content: string; parentId?: string; attachments?: Attachment[] }) =>
    req<ConnectMessage>(`/channels/${channelId}/messages`, { method: 'POST', body: JSON.stringify(body) }),
  edit: (id: string, content: string) => req<ConnectMessage>(`/messages/${id}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  remove: (id: string) => req<ConnectMessage>(`/messages/${id}`, { method: 'DELETE' }),
  pin: (id: string) => req<ConnectMessage>(`/messages/${id}/pin`, { method: 'POST' }),
  react: (id: string, emoji: string) => req<{ messageId: string; reactions: Reaction[] }>(`/messages/${id}/reactions`, { method: 'POST', body: JSON.stringify({ emoji }) }),
  bookmark: (id: string) => req<{ messageId: string; bookmarked: boolean }>(`/messages/${id}/bookmark`, { method: 'POST' }),
  getBookmarks: () => req<ConnectMessage[]>('/bookmarks'),
  createSpace: (name: string, emoji?: string) => req<Space>('/spaces', { method: 'POST', body: JSON.stringify({ name, emoji }) }),
  createChannel: (body: { name: string; spaceId?: string; topic?: string; description?: string }) => req<Conversation>('/channels', { method: 'POST', body: JSON.stringify(body) }),
  createDM: (userId: string) => req<Conversation>('/channels/dm', { method: 'POST', body: JSON.stringify({ userId }) }),
  createGroup: (name: string, memberIds: string[]) => req<Conversation>('/channels/group', { method: 'POST', body: JSON.stringify({ name, memberIds }) }),
  toggleStar: (channelId: string) => req<{ channelId: string; starred: boolean }>(`/channels/${channelId}/star`, { method: 'POST' }),
  toggleMute: (channelId: string) => req<{ channelId: string; muted: boolean }>(`/channels/${channelId}/mute`, { method: 'POST' }),
  setPresence: (presence: Presence, statusText?: string, statusEmoji?: string) => req('/presence', { method: 'PUT', body: JSON.stringify({ presence, statusText, statusEmoji }) }),
  meetings: () => req<Meeting[]>('/meetings'),
  createMeeting: (body: { title?: string; conversationId?: string }) => req<Meeting>('/meetings', { method: 'POST', body: JSON.stringify(body) }),
  endMeeting: (id: string) => req<Meeting>(`/meetings/${id}/end`, { method: 'PUT' }),
  events: () => req<CalendarEvent[]>('/events'),
  createEvent: (body: {
    title: string; date: string; time: string; durationMins?: number; withMeet?: boolean; attendeeIds?: string[];
    description?: string; location?: string; color?: string; allDay?: boolean; recurrence?: string;
  }) => req<CalendarEvent>('/events', { method: 'POST', body: JSON.stringify(body) }),
  deleteEvent: (id: string) => req<{ ok: boolean }>(`/events/${id}`, { method: 'DELETE' }),
};
