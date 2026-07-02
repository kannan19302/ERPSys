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

/** Curated (not full-Unicode) emoji dataset for the upgraded picker (spec §7c) — categorized +
 *  named for search/accessibility. Deliberately a workplace-chat-scoped subset, not all ~5000
 *  Unicode emoji, to keep the picker fast and the bundle light (same philosophy as EMOJI_PALETTE). */
export interface EmojiEntry { emoji: string; name: string }
export interface EmojiCategory { key: string; icon: string; label: string; emojis: EmojiEntry[] }

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    key: 'smileys', icon: '😀', label: 'Smileys & emotion',
    emojis: [
      { emoji: '😀', name: 'grinning face' }, { emoji: '😃', name: 'smiling face with big eyes' },
      { emoji: '😄', name: 'smiling face with smiling eyes' }, { emoji: '😁', name: 'beaming face' },
      { emoji: '😆', name: 'grinning squinting face' }, { emoji: '😅', name: 'grinning sweat' },
      { emoji: '🤣', name: 'rolling on the floor laughing' }, { emoji: '😂', name: 'face with tears of joy' },
      { emoji: '🙂', name: 'slightly smiling face' }, { emoji: '🙃', name: 'upside-down face' },
      { emoji: '😉', name: 'winking face' }, { emoji: '😊', name: 'smiling face' },
      { emoji: '😍', name: 'heart eyes' }, { emoji: '😘', name: 'face blowing a kiss' },
      { emoji: '😎', name: 'smiling face with sunglasses' }, { emoji: '🤔', name: 'thinking face' },
      { emoji: '😐', name: 'neutral face' }, { emoji: '😴', name: 'sleeping face' },
      { emoji: '😢', name: 'crying face' }, { emoji: '😭', name: 'loudly crying face' },
      { emoji: '😡', name: 'pouting face' }, { emoji: '🥳', name: 'partying face' },
      { emoji: '😱', name: 'face screaming in fear' }, { emoji: '🤯', name: 'exploding head' },
    ],
  },
  {
    key: 'people', icon: '👍', label: 'People & gestures',
    emojis: [
      { emoji: '👍', name: 'thumbs up' }, { emoji: '👎', name: 'thumbs down' },
      { emoji: '👏', name: 'clapping hands' }, { emoji: '🙌', name: 'raising hands' },
      { emoji: '🤝', name: 'handshake' }, { emoji: '👋', name: 'waving hand' },
      { emoji: '✋', name: 'raised hand' }, { emoji: '👀', name: 'eyes' },
      { emoji: '🙏', name: 'folded hands' }, { emoji: '💪', name: 'flexed biceps' },
      { emoji: '🤷', name: 'shrug' }, { emoji: '🖖', name: 'vulcan salute' },
    ],
  },
  {
    key: 'animals', icon: '🐻', label: 'Animals & nature',
    emojis: [
      { emoji: '🐻', name: 'bear' }, { emoji: '🐶', name: 'dog face' }, { emoji: '🐱', name: 'cat face' },
      { emoji: '🦁', name: 'lion' }, { emoji: '🐼', name: 'panda' }, { emoji: '🦄', name: 'unicorn' },
      { emoji: '🐢', name: 'turtle' }, { emoji: '🌟', name: 'glowing star' }, { emoji: '🌈', name: 'rainbow' },
      { emoji: '🔥', name: 'fire' }, { emoji: '⭐', name: 'star' }, { emoji: '🌙', name: 'crescent moon' },
    ],
  },
  {
    key: 'food', icon: '🍔', label: 'Food & drink',
    emojis: [
      { emoji: '🍔', name: 'hamburger' }, { emoji: '🍕', name: 'pizza' }, { emoji: '🍟', name: 'french fries' },
      { emoji: '🍩', name: 'doughnut' }, { emoji: '🍰', name: 'cake slice' }, { emoji: '☕', name: 'coffee' },
      { emoji: '🍺', name: 'beer mug' }, { emoji: '🍎', name: 'red apple' }, { emoji: '🥗', name: 'salad' },
      { emoji: '🍫', name: 'chocolate bar' },
    ],
  },
  {
    key: 'activities', icon: '⚽', label: 'Activities',
    emojis: [
      { emoji: '⚽', name: 'soccer ball' }, { emoji: '🏀', name: 'basketball' }, { emoji: '🎉', name: 'party popper' },
      { emoji: '🎂', name: 'birthday cake' }, { emoji: '🏆', name: 'trophy' }, { emoji: '🎮', name: 'video game' },
      { emoji: '🎯', name: 'direct hit' }, { emoji: '🎸', name: 'guitar' },
    ],
  },
  {
    key: 'travel', icon: '🚗', label: 'Travel & places',
    emojis: [
      { emoji: '🚗', name: 'car' }, { emoji: '✈️', name: 'airplane' }, { emoji: '🚀', name: 'rocket' },
      { emoji: '🏠', name: 'house' }, { emoji: '🏢', name: 'office building' }, { emoji: '🌍', name: 'globe' },
      { emoji: '🗺️', name: 'world map' }, { emoji: '🚌', name: 'bus' },
    ],
  },
  {
    key: 'objects', icon: '💡', label: 'Objects',
    emojis: [
      { emoji: '💡', name: 'light bulb' }, { emoji: '💻', name: 'laptop' }, { emoji: '📱', name: 'mobile phone' },
      { emoji: '📅', name: 'calendar' }, { emoji: '📌', name: 'pushpin' }, { emoji: '🔒', name: 'locked' },
      { emoji: '📎', name: 'paperclip' }, { emoji: '🔧', name: 'wrench' }, { emoji: '⏰', name: 'alarm clock' },
    ],
  },
  {
    key: 'symbols', icon: '🚩', label: 'Symbols',
    emojis: [
      { emoji: '✅', name: 'check mark' }, { emoji: '❌', name: 'cross mark' }, { emoji: '⚠️', name: 'warning' },
      { emoji: '❤️', name: 'red heart' }, { emoji: '💯', name: 'hundred points' }, { emoji: '🚩', name: 'triangular flag' },
      { emoji: '❓', name: 'question mark' }, { emoji: '➕', name: 'plus' }, { emoji: '➖', name: 'minus' },
    ],
  },
];

export const ALL_EMOJIS: EmojiEntry[] = EMOJI_CATEGORIES.flatMap((c) => c.emojis);

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
  designation?: string | null;
  department?: string | null;
}

export type ChannelMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type NotifyLevel = 'ALL' | 'MENTIONS' | 'NONE';

export const NOTIFY_LEVEL_LABELS: Record<NotifyLevel, string> = {
  ALL: 'All messages',
  MENTIONS: 'Mentions only',
  NONE: 'Nothing',
};

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
  notifyLevel?: NotifyLevel;
}

export interface Attachment { id: string; name: string; size: number; mime: string; url?: string }

/** Client-side upload lifecycle tracking for the composer's staged-attachment chips (spec §1). */
export interface StagedAttachment {
  localId: string;
  file: File;
  name: string;
  size: number;
  mime: string;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  previewUrl?: string;
  documentId?: string;
  url?: string;
  errorMessage?: string;
}

export interface ChannelMemberInfo {
  userId: string;
  role: ChannelMemberRole;
}

export interface BrowseChannel {
  id: string;
  name: string;
  topic?: string | null;
  description?: string | null;
  memberCount: number;
}

export interface SearchResult {
  messageId: string;
  channelId: string;
  channelName: string;
  authorId: string;
  authorName: string;
  snippet: string;
  ts: number;
}
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

/**
 * Client-only "forwarded message" marker (US-C1). The backend has no `forwarded`/`forwardedFrom`
 * field on Message (confirmed by grep — zero matches in communication.service.ts) and this pass's
 * backend scope didn't include one, so forwarding is implemented by prefixing the new message's
 * content with a parseable marker line, stripped back out for display. This is a pragmatic
 * client-side stand-in, not a real "references the original message" relational link — flagged as
 * follow-up debt for backend-developer to add a proper `forwardedFromMessageId` field later.
 */
const FORWARD_MARKER_RE = /^\[\[forwarded:([^:]*):([^:]*):([^:]*):(\d+)\]\]\n([\s\S]*)$/;
export interface ForwardedInfo { sourceLabel: string; originAuthor: string; originTs: number; body: string }
export function parseForwarded(content: string): ForwardedInfo | null {
  const m = FORWARD_MARKER_RE.exec(content);
  if (!m) return null;
  return { sourceLabel: m[2] || '', originAuthor: m[3] || '', originTs: Number(m[4]), body: m[5] || '' };
}

/**
 * Max attachment size, mirroring `MAX_ATTACHMENT_BYTES` in
 * `apps/api/src/modules/communication/communication.service.ts` (25MB). There is no shared
 * constant to import from `packages/shared` for this — the backend service comment confirms
 * Drive itself has no size/type limits and this cap is enforced only in the Connect service, not
 * exposed as a shared config value. Flagged as follow-up debt: this number must be kept in sync
 * by hand until backend-developer exports it from `packages/shared`.
 */
export const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

/** Full URL for a Connect attachment's durable download link. The service returns a path like
 *  `/drive/documents/versions/:id/download` (no `/api/v1` prefix) — prepend it here, matching
 *  the pattern already used by `apps/web/app/(dashboard)/drive/page.tsx` for the same endpoint. */
export function attachmentUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http') || url.startsWith('/api/')) return url;
  return `/api/v1${url}`;
}

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

/**
 * Reads the CSRF token from the `csrf_token` cookie set by `csrfMiddleware`
 * (`apps/api/src/common/middleware/csrf.middleware.ts`). All non-GET requests must echo it back
 * via the `x-csrf-token` header or the middleware rejects with 403 "Invalid or missing CSRF
 * token" — mirrors the pattern already established in `apps/web/src/lib/api.ts`. Pre-existing
 * bug fixed in this pass: `connectData.ts`'s `req()` never sent this header, so every mutating
 * Connect endpoint (mark-read, mute, star, send, etc.) was silently 403ing against a real API,
 * not just the new endpoints added in this feature pass.
 */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1] ?? '') : null;
}

function headers(method = 'GET'): Record<string, string> {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
  const csrf = !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase()) ? getCsrfToken() : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(csrf ? { 'x-csrf-token': csrf } : {}),
  };
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  // `credentials: 'include'` is required because BASE is an absolute cross-origin URL
  // (http://localhost:3001) from the browser's perspective (the page is served from :3000) —
  // without it, the browser never attaches the `csrf_token` cookie to the request, so
  // `csrfMiddleware` (apps/api/src/common/middleware/csrf.middleware.ts) always sees it as
  // missing and 403s every mutating (non-GET) call, regardless of the x-csrf-token header value.
  const res = await fetch(`${BASE}${path}`, { ...init, credentials: 'include', headers: { ...headers(init?.method), ...(init?.headers || {}) } });
  if (!res.ok) {
    let detail = res.statusText;
    try { const body = await res.json(); detail = body.message || detail; } catch { /* ignore */ }
    throw new Error(typeof detail === 'string' ? detail : 'Request failed');
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** WebSocket base — same host:port as the REST API (`notifications.gateway.ts`'s `/ws` namespace). */
export const WS_BASE = 'http://localhost:3001';

/**
 * Real multipart upload with progress events, via XMLHttpRequest (fetch has no upload-progress
 * API). No prior xhr.upload precedent exists elsewhere in apps/web (grepped, zero matches), so
 * this is the first use of this pattern in the app.
 */
export function uploadAttachment(
  channelId: string,
  file: File,
  onProgress: (pct: number) => void
): { promise: Promise<{ documentId: string; attachment: Attachment }>; xhr: XMLHttpRequest } {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<{ documentId: string; attachment: Attachment }>((resolve, reject) => {
    xhr.open('POST', `${BASE}/channels/${channelId}/attachments`);
    xhr.withCredentials = true; // send the csrf_token cookie cross-origin — see req()'s comment above
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    const csrf = getCsrfToken();
    if (csrf) xhr.setRequestHeader('x-csrf-token', csrf);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('Invalid server response')); }
      } else {
        let msg = xhr.statusText || 'Upload failed';
        try { const body = JSON.parse(xhr.responseText); msg = body.message || msg; } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error('Upload failed — network error'));
    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
  return { promise, xhr };
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

  /* ── Search (US-A6) ── */
  search: (q: string) => req<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`),

  /* ── Channel management & roles (US-B1/B2/B3) ── */
  browseChannels: () => req<BrowseChannel[]>('/channels/browse'),
  updateChannel: (id: string, body: { name?: string; archived?: boolean; topic?: string; description?: string }) =>
    req<Conversation>(`/channels/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  joinChannel: (id: string) => req<{ id: string }>(`/channels/${id}/join`, { method: 'POST' }),
  // NOTE: GET /channels/:id/members is a backend gap-fill requested in this same pass (returns
  // { userId, role }[]) — if the endpoint 404s because that backend work hasn't landed yet, the
  // Manage Channel drawer degrades to showing members without role badges (see page.tsx).
  channelMembers: (channelId: string) => req<ChannelMemberInfo[]>(`/channels/${channelId}/members`),
  addChannelMember: (channelId: string, userId: string) =>
    req<{ userId: string }>(`/channels/${channelId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  removeChannelMember: (channelId: string, userId: string) =>
    req<{ ok: boolean }>(`/channels/${channelId}/members/${userId}`, { method: 'DELETE' }),

  /* ── Notification level (US-B5) ── */
  setNotifyLevel: (channelId: string, notifyLevel: NotifyLevel) =>
    req<{ channelId: string; notifyLevel: NotifyLevel }>(`/channels/${channelId}/notify-level`, { method: 'PUT', body: JSON.stringify({ notifyLevel }) }),

  /* ── Read receipts & link previews (US-B4 / US-C2) ── */
  getReadReceipts: (messageId: string) =>
    req<Array<{ userId: string; name: string; avatar: string | null; seenAt: string }>>(`/messages/${messageId}/read-receipts`),
  getLinkPreview: (url: string) =>
    req<{ url: string; title?: string; description?: string; image?: string; siteName?: string }>(`/communication/link-preview?url=${encodeURIComponent(url)}`),
};
