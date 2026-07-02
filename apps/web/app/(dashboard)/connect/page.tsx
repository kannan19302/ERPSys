'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import {
  Hash, Send, Smile, Reply, Pencil, Trash2, Pin, Paperclip, Search, Video,
  Calendar, Plus, X, ChevronDown, ChevronRight, MessageSquare, Users, Download,
  RefreshCw, AlertCircle, Star, Bell, BellOff, Settings, MoreHorizontal,
  Bold, Italic, Strikethrough, Code, List, ListOrdered, Link2, Image, AtSign,
  Phone, Share2, Bookmark, BookmarkCheck, Forward, Copy, Eye, EyeOff,
  Info, Lock, Globe, Archive, UserPlus, Mic, MicOff, PhoneOff, VideoOff,
  Maximize2, Minimize2, Monitor, Command, ArrowUp, ArrowDown,
  FileText, File, CheckSquare, Square, Hand, CircleDot, Layout, Grid3X3,
  Captions, Shield, Clock, ScreenShare, ScreenShareOff, Volume2, VolumeX,
  MessageCircle, Disc, MoreVertical, LogOut, PanelRightOpen, UserCheck,
} from 'lucide-react';
import {
  Modal as UiModal, ConfirmDialog, Drawer, Tabs, Badge, FormField, Input, Select,
  useToast, ProtectedComponent, EmptyState, Skeleton, Spinner, Button,
} from '@unerp/ui';
import {
  Workspace, Member, Conversation, ConnectMessage, Attachment, Meeting, CalendarEvent, Presence,
  StagedAttachment, ChannelMemberInfo, ChannelMemberRole, NotifyLevel, BrowseChannel, SearchResult,
  PRESENCE_META, PRESENCE_ORDER, EMOJI_CATEGORIES, ALL_EMOJIS, STATUS_SUGGESTIONS, SHORTCUTS,
  NOTIFY_LEVEL_LABELS, MAX_ATTACHMENT_BYTES, WS_BASE,
  api, uid, initials, avatarColor, formatBytes, formatTime, formatDateSmart, formatDateDivider,
  parseMarkdown, isImageMime, attachmentUrl, uploadAttachment, parseForwarded,
} from './connectData';
import ConnectCalendar from './Calendar';

/* ── presentational helpers ── */

function PresenceDot({ presence, size = 10, border = 'var(--color-bg-elevated)' }: { presence: Presence; size?: number; border?: string }) {
  const meta = PRESENCE_META[presence];
  return (
    <span title={meta.label} style={{
      width: size, height: size, borderRadius: '50%', background: meta.color,
      border: `2px solid ${border}`, display: 'inline-block', boxSizing: 'content-box',
      boxShadow: meta.ring ? `0 0 0 2px ${meta.color}55` : undefined,
    }} />
  );
}

function Avatar({ member, size = 36, showPresence = false, onClick }: { member: Member; size?: number; showPresence?: boolean; onClick?: () => void }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', flexShrink: 0, cursor: onClick ? 'pointer' : undefined }} onClick={onClick}>
      <span style={{
        width: size, height: size, borderRadius: 'var(--radius-lg)', background: avatarColor(member.id || member.name), color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700,
      }}>{initials(member.name)}</span>
      {showPresence && (
        <span style={{ position: 'absolute', right: -2, bottom: -2 }}>
          <PresenceDot presence={member.presence} size={Math.max(8, size * 0.22)} />
        </span>
      )}
    </span>
  );
}

function renderContent(text: string) {
  const html = parseMarkdown(text);
  if (html !== text) {
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return text.split(/(@\w+)/g).map((p, i) =>
    p.startsWith('@')
      ? <span key={i} style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)', borderRadius: 4, padding: '0 4px', fontWeight: 600 }}>{p}</span>
      : <span key={i}>{p}</span>
  );
}

/** Bold the matched substring in a search snippet using <mark> (semantically "this matched"),
 *  styled to inherit the app's own bold/primary treatment rather than the browser's yellow default. */
function highlightSnippet(snippet: string, query: string) {
  if (!query.trim()) return snippet;
  const idx = snippet.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return snippet;
  return (
    <>
      {snippet.slice(0, idx)}
      <mark style={{ background: 'transparent', color: 'var(--color-primary)', fontWeight: 700 }}>{snippet.slice(idx, idx + query.length)}</mark>
      {snippet.slice(idx + query.length)}
    </>
  );
}

const UNKNOWN: Member = { id: '?', name: 'Unknown', email: '', presence: 'INACTIVE' };

function Unread({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999, background: 'var(--color-primary)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

function DateDivider({ ts }: { ts: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 4px', userSelect: 'none' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', background: 'var(--color-bg-elevated)', padding: '2px 12px', borderRadius: 999, border: '1px solid var(--color-border)' }}>
        {formatDateDivider(ts)}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
    </div>
  );
}

/* ── page ── */

export default function ConnectPage() {
  const [ws, setWs] = useState<Workspace | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConnectMessage[]>([]);

  // Compose
  const [composer, setComposer] = useState('');
  const [staged, setStaged] = useState<StagedAttachment[]>([]);
  const [threadParent, setThreadParent] = useState<string | null>(null);
  const [threadComposer, setThreadComposer] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [emojiFor, setEmojiFor] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [showFormatBar, setShowFormatBar] = useState(false);

  // UI panels
  const [convSearch, setConvSearch] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [switcher, setSwitcher] = useState<string | null>(null);
  const [presenceOpen, setPresenceOpen] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [statusEmoji, setStatusEmoji] = useState('');
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [meetingState, setMeetingState] = useState({
    micOn: true, camOn: true, screenShare: false, recording: false, handRaised: false,
    showChat: false, showParticipants: false, showCaptions: false,
    layout: 'gallery' as 'gallery' | 'spotlight' | 'sidebar',
    meetingChat: [] as { author: string; text: string; ts: number }[],
    meetingChatDraft: '',
    elapsedSec: 0, noiseCancel: true, pip: false,
    reactions: [] as { id: string; emoji: string; name: string; ts: number }[],
    waitingRoom: [] as Member[],
    preJoin: true,
  });
  const meetingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [calendar, setCalendar] = useState<CalendarEvent[] | null>(null);
  const [people, setPeople] = useState<null | { mode: 'dm' | 'group'; selected: string[]; search: string }>(null);
  const [channelInfo, setChannelInfo] = useState(false);
  const [profileCard, setProfileCard] = useState<Member | null>(null);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [savedMessagesOpen, setSavedMessagesOpen] = useState(false);
  const [savedMessages, setSavedMessages] = useState<ConnectMessage[]>([]);
  const [directoryModalOpen, setDirectoryModalOpen] = useState(false);
  const [dirSearchQuery, setDirSearchQuery] = useState('');
  const [mutedConvs, setMutedConvs] = useState<Set<string>>(new Set());
  const [starredConvs, setStarredConvs] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [pinnedView, setPinnedView] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Real-time (Socket.IO)
  const [typingUsers, setTypingUsers] = useState<Map<string, number>>(new Map()); // userId -> last-typing timestamp, per active channel
  const socketRef = useRef<Socket | null>(null);
  const currentRoomRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search (US-A6 / spec §4)
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [flashMessageId, setFlashMessageId] = useState<string | null>(null);
  const [switcherMessages, setSwitcherMessages] = useState<SearchResult[]>([]);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const switcherDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Channel management drawer (spec §2)
  const [manageChannelOpen, setManageChannelOpen] = useState(false);
  const [manageTab, setManageTab] = useState<'general' | 'members'>('general');
  const [manageMembers, setManageMembers] = useState<ChannelMemberInfo[] | null>(null);
  const [manageName, setManageName] = useState('');
  const [manageTopic, setManageTopic] = useState('');
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState<Member | null>(null);

  // Browse channels modal (spec §3)
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseList, setBrowseList] = useState<BrowseChannel[] | null>(null);
  const [browseErr, setBrowseErr] = useState<string | null>(null);
  const [browseSearch, setBrowseSearch] = useState('');
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Forward dialog (spec §7a)
  const [forwardMsg, setForwardMsg] = useState<ConnectMessage | null>(null);
  const [forwardTarget, setForwardTarget] = useState<string | null>(null);
  const [forwardSearch, setForwardSearch] = useState('');
  const [forwarding, setForwarding] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastActivityRef = useRef(Date.now());
  const autoAwayRef = useRef(false);
  const toast = useToast();

  const loadWorkspace = useCallback(async () => {
    try {
      const data = await api.workspace();
      setWs(data);
      setLoadErr(null);
      setActiveId((cur) => cur ?? data.channels[0]?.id ?? data.conversations[0]?.id ?? null);
      // Sync starred/muted from server
      const allConvsList = [...data.channels, ...data.conversations];
      setStarredConvs(new Set(allConvsList.filter((c: any) => c.starred).map((c) => c.id)));
      setMutedConvs(new Set(allConvsList.filter((c: any) => c.muted).map((c) => c.id)));
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : 'Failed to load Connect');
    }
  }, []);

  const loadBookmarks = useCallback(async () => {
    try {
      const bms = await api.getBookmarks();
      setSavedMessages(bms);
      setBookmarks(new Set(bms.map((b) => b.id)));
    } catch {}
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try { setMessages(await api.messages(id)); } catch { /* keep prior */ }
  }, []);

  useEffect(() => { loadWorkspace(); loadBookmarks(); }, [loadWorkspace, loadBookmarks]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    api.markRead(activeId).catch(() => {});
    setWs((prev) => prev ? {
      ...prev,
      channels: prev.channels.map((c) => c.id === activeId ? { ...c, unreadCount: 0 } : c),
      conversations: prev.conversations.map((c) => c.id === activeId ? { ...c, unreadCount: 0 } : c),
    } : prev);
    const t = setInterval(() => loadMessages(activeId), 5000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  useEffect(() => {
    const t = setInterval(() => { loadWorkspace(); if (activeId) api.markRead(activeId).catch(() => {}); }, 15000);
    return () => clearInterval(t);
  }, [loadWorkspace, activeId]);

  /* ── Socket.IO (US-A3/A4/A5): connect once on mount, graceful fallback to existing polling ── */
  useEffect(() => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : null;
    if (!token) return;
    const socket = io(`${WS_BASE}/ws`, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('chat:message', (payload: any) => {
      const channelId = payload?.channelId;
      if (!channelId) return;
      // Live presence/typing come through separate events; this handles persisted messages only.
      const incoming: ConnectMessage | null = payload?.id
        ? {
            id: payload.id,
            conversationId: channelId,
            authorId: payload.userId ?? payload.authorId,
            content: payload.content ?? '',
            kind: payload.kind ?? 'USER',
            parentId: payload.parentId ?? undefined,
            pinned: !!payload.pinned,
            attachments: payload.attachments ?? [],
            meetingId: payload.meetingId ?? undefined,
            ts: payload.ts ?? (payload.createdAt ? new Date(payload.createdAt).getTime() : Date.now()),
            editedTs: payload.editedTs,
            deleted: !!payload.deleted,
            reactions: payload.reactions ?? [],
          }
        : null;
      if (!incoming) return;
      setMessages((prev) => {
        if (currentRoomRef.current !== channelId) return prev; // not the active conversation
        if (prev.some((m) => m.id === incoming.id)) return prev; // dedupe vs. optimistic/poll
        return [...prev, incoming].sort((a, b) => a.ts - b.ts);
      });
      // Bump unread/last-message preview for non-active conversations via a light workspace refresh.
      if (currentRoomRef.current !== channelId) loadWorkspace();
    });

    socket.on('typing', (payload: { userId: string; channelId: string }) => {
      if (!payload?.userId || payload.channelId !== currentRoomRef.current) return;
      setTypingUsers((prev) => { const next = new Map(prev); next.set(payload.userId, Date.now()); return next; });
    });

    socket.on('presence', (payload: { userId: string; status?: string; presence?: string; timestamp?: string }) => {
      const userId = payload?.userId;
      if (!userId) return;
      setWs((prev) => {
        if (!prev) return prev;
        // Connection-liveness ONLINE/OFFLINE events map to ACTIVE/INACTIVE; explicit `presence`
        // field (from setPresence's broadcastPresenceUpdate) carries the real chosen status.
        const mapped = (payload.presence as Presence | undefined)
          ?? (payload.status === 'ONLINE' ? 'ACTIVE' : payload.status === 'OFFLINE' ? 'INACTIVE' : undefined);
        if (!mapped) return prev;
        return { ...prev, directory: prev.directory.map((d) => d.id === userId ? { ...d, presence: mapped } : d) };
      });
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [loadWorkspace]);

  // Join/leave channel rooms on conversation switch; leave the previous room first.
  useEffect(() => {
    const socket = socketRef.current;
    currentRoomRef.current = activeId;
    if (!socket || !activeId) return;
    socket.emit('join:channel', { channelId: activeId });
    return () => { socket.emit('leave:channel', { channelId: activeId }); };
  }, [activeId, socketRef.current]);

  // Typing indicator: prune entries older than 3s of inactivity, tick every second.
  useEffect(() => {
    const t = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        let changed = false;
        const next = new Map(prev);
        for (const [uid_, ts] of prev) { if (now - ts > 3000) { next.delete(uid_); changed = true; } }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight; }, [messages.length, activeId]);

  // Auto-away
  useEffect(() => {
    const presence = ws?.me.presence;
    const setPres = (p: 'ACTIVE' | 'AWAY') => {
      api.setPresence(p, ws?.me.statusText ?? undefined).catch(() => {});
      setWs((prev) => prev ? { ...prev, me: { ...prev.me, presence: p }, directory: prev.directory.map((d) => d.id === prev.me.id ? { ...d, presence: p } : d) } : prev);
    };
    const bump = () => {
      lastActivityRef.current = Date.now();
      if (autoAwayRef.current && ws?.me.presence === 'AWAY') { autoAwayRef.current = false; setPres('ACTIVE'); }
    };
    window.addEventListener('mousemove', bump);
    window.addEventListener('keydown', bump);
    window.addEventListener('focus', bump);
    const t = setInterval(() => {
      if (presence === 'ACTIVE' && Date.now() - lastActivityRef.current > 5 * 60 * 1000) { autoAwayRef.current = true; setPres('AWAY'); }
    }, 30000);
    return () => { window.removeEventListener('mousemove', bump); window.removeEventListener('keydown', bump); window.removeEventListener('focus', bump); clearInterval(t); };
  }, [ws?.me.presence, ws?.me.statusText]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); setSwitcher(''); }
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); setPeople({ mode: 'dm', selected: [], search: '' }); }
      if (e.ctrlKey && e.key === '/') { e.preventDefault(); composerRef.current?.focus(); }
      if (e.key === 'Escape') { setSwitcher(null); setPeople(null); setChannelInfo(false); setProfileCard(null); setShowKeyboardShortcuts(false); setPinnedView(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* ── derived ── */
  const me = ws?.me ?? UNKNOWN;
  const directory = ws?.directory ?? [];
  const memberById = useCallback((id: string) => directory.find((d) => d.id === id) ?? { ...UNKNOWN, id }, [directory]);
  const allConvs = useMemo<Conversation[]>(() => [...(ws?.channels ?? []), ...(ws?.conversations ?? [])], [ws]);
  const activeConv = allConvs.find((c) => c.id === activeId) ?? null;
  const directs = useMemo(
    () => [...(ws?.conversations ?? [])].sort((a, b) => (b.lastMessage?.ts ?? 0) - (a.lastMessage?.ts ?? 0)),
    [ws]
  );
  const onlineCount = directory.filter((d) => d.presence === 'ACTIVE' || d.presence === 'BRB').length;
  const unreadOf = (c: Conversation) => (activeId === c.id ? 0 : c.unreadCount ?? 0);

  const topLevel = messages
    .filter((m) => !m.parentId)
    .filter((m) => !convSearch || (!m.deleted && m.content.toLowerCase().includes(convSearch.toLowerCase())));
  const repliesOf = (parentId: string) => messages.filter((m) => m.parentId === parentId).sort((a, b) => a.ts - b.ts);
  const pinned = messages.filter((m) => m.pinned && !m.deleted);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: ConnectMessage[] }[] = [];
    let currentDate = '';
    for (const m of topLevel) {
      const d = new Date(m.ts).toDateString();
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, messages: [m] });
      } else {
        groups[groups.length - 1]!.messages.push(m);
      }
    }
    return groups;
  }, [topLevel]);

  // Channel-scoped search (spec §4a): debounced 300ms, calls the real search endpoint.
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!convSearch.trim() || !activeId) { setSearchResults(null); setSearchErr(null); return; }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const all = await api.search(convSearch.trim());
        setSearchResults(all.filter((r) => r.channelId === activeId));
        setSearchErr(null);
      } catch (e) {
        setSearchErr(e instanceof Error ? e.message : 'Search failed. Try again.');
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [convSearch, activeId]);

  // Global switcher (Ctrl+K) message results (spec §4b), debounced.
  useEffect(() => {
    if (switcherDebounceRef.current) clearTimeout(switcherDebounceRef.current);
    if (switcher === null || !switcher.trim()) { setSwitcherMessages([]); return; }
    switcherDebounceRef.current = setTimeout(async () => {
      try { setSwitcherMessages(await api.search(switcher.trim())); } catch { setSwitcherMessages([]); }
    }, 300);
    return () => { if (switcherDebounceRef.current) clearTimeout(switcherDebounceRef.current); };
  }, [switcher]);

  /** Jump to a message: switch conversation if needed, then flash-highlight the row once loaded. */
  const jumpToMessage = async (channelId: string, messageId: string) => {
    if (activeId !== channelId) {
      setActiveId(channelId);
      setThreadParent(null); setConvSearch(''); setChannelInfo(false); setPinnedView(false);
      try { setMessages(await api.messages(channelId)); } catch { /* keep prior */ }
    }
    setFlashMessageId(messageId);
    setTimeout(() => {
      document.getElementById(`msg-${messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
    setTimeout(() => setFlashMessageId(null), 1200);
  };

  /* ── message mutations ── */
  const replaceMsg = (m: ConnectMessage) => setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));

  const handleSend = async () => {
    if (!activeId || (!composer.trim() && staged.length === 0)) return;
    if (staged.some((a) => a.status === 'uploading')) return; // block send while an upload is in flight
    const content = composer;
    const attachments: Attachment[] = staged.filter((a) => a.status === 'done' && a.documentId).map((a) => ({
      id: a.documentId!, name: a.name, size: a.size, mime: a.mime, url: a.url,
    }));
    setComposer(''); setStaged([]); setMentionQuery(null);
    try {
      await api.send(activeId, { content, attachments });
      await loadMessages(activeId);
      if (socketRef.current) socketRef.current.emit('leave:channel', { channelId: activeId }); // no-op placeholder to keep room fresh; server also broadcasts chat:message
    }
    catch (e) { alert(e instanceof Error ? e.message : 'Send failed'); setComposer(content); }
  };

  const onFiles = (files: FileList | null) => {
    if (!files || !activeId) return;
    const channelId = activeId;
    for (const file of Array.from(files)) {
      if (file.size > MAX_ATTACHMENT_BYTES) {
        const mb = Math.round(MAX_ATTACHMENT_BYTES / (1024 * 1024));
        const errItem: StagedAttachment = {
          localId: uid('a'), file, name: file.name, size: file.size, mime: file.type || 'application/octet-stream',
          status: 'error', progress: 0, errorMessage: `Exceeds ${mb} MB limit`,
        };
        setStaged((prev) => [...prev, errItem]);
        toast.error('Attachment rejected', `${file.name} exceeds the ${mb} MB limit.`);
        continue;
      }
      const localId = uid('a');
      const previewUrl = isImageMime(file.type) ? URL.createObjectURL(file) : undefined;
      const item: StagedAttachment = {
        localId, file, name: file.name, size: file.size, mime: file.type || 'application/octet-stream',
        status: 'uploading', progress: 0, previewUrl,
      };
      setStaged((prev) => [...prev, item]);
      const { promise } = uploadAttachment(channelId, file, (pct) => {
        setStaged((prev) => prev.map((a) => (a.localId === localId ? { ...a, progress: pct } : a)));
      });
      promise.then((res) => {
        setStaged((prev) => prev.map((a) => (a.localId === localId
          ? { ...a, status: 'done', progress: 100, documentId: res.documentId ?? res.attachment?.id, url: attachmentUrl(res.attachment?.url) }
          : a)));
      }).catch((e) => {
        const msg = e instanceof Error ? e.message : 'Upload failed';
        setStaged((prev) => prev.map((a) => (a.localId === localId ? { ...a, status: 'error', errorMessage: msg } : a)));
        toast.error('Upload failed', `${file.name}: ${msg}`);
      });
    }
  };

  const handleThreadSend = async () => {
    if (!activeId || !threadParent || !threadComposer.trim()) return;
    const content = threadComposer; setThreadComposer('');
    try { await api.send(activeId, { content, parentId: threadParent }); await loadMessages(activeId); }
    catch (e) { alert(e instanceof Error ? e.message : 'Reply failed'); setThreadComposer(content); }
  };

  const react = async (id: string, emoji: string) => {
    setEmojiFor(null);
    try { const r = await api.react(id, emoji); setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, reactions: r.reactions } : m))); }
    catch { /* ignore */ }
  };
  const saveEdit = async () => {
    if (!editingId) return;
    try { replaceMsg(await api.edit(editingId, editText)); } catch (e) { alert(e instanceof Error ? e.message : 'Edit failed'); }
    setEditingId(null); setEditText('');
  };
  const del = async (id: string) => { try { replaceMsg(await api.remove(id)); } catch (e) { alert(e instanceof Error ? e.message : 'Delete failed'); } };
  const pin = async (id: string) => { try { replaceMsg(await api.pin(id)); } catch { /* ignore */ } };

  const toggleBookmark = async (id: string) => {
    const isBookmarked = bookmarks.has(id);
    setBookmarks((prev) => { const next = new Set(prev); isBookmarked ? next.delete(id) : next.add(id); return next; });
    try {
      await api.bookmark(id);
      await loadBookmarks();
    } catch {
      setBookmarks((prev) => { const next = new Set(prev); isBookmarked ? next.add(id) : next.delete(id); return next; });
    }
  };
  const toggleMute = async (convId: string) => {
    try {
      const res = await api.toggleMute(convId);
      setMutedConvs((prev) => { const next = new Set(prev); res.muted ? next.add(convId) : next.delete(convId); return next; });
      await loadWorkspace();
    } catch { setMutedConvs((prev) => { const next = new Set(prev); next.has(convId) ? next.delete(convId) : next.add(convId); return next; }); }
  };
  const toggleStar = async (convId: string) => {
    try {
      const res = await api.toggleStar(convId);
      setStarredConvs((prev) => { const next = new Set(prev); res.starred ? next.add(convId) : next.delete(convId); return next; });
      await loadWorkspace();
    } catch { setStarredConvs((prev) => { const next = new Set(prev); next.has(convId) ? next.delete(convId) : next.add(convId); return next; }); }
  };
  const toggleSection = (id: string) => setCollapsedSections((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const insertMention = (m: Member) => {
    const first = m.name.split(' ')[0];
    setComposer((prev) => prev.replace(/(^|\s)@\w*$/, (_full, lead) => `${lead}@${first} `));
    setMentionQuery(null);
  };

  const insertFormat = (before: string, after: string) => {
    const ta = composerRef.current;
    if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const selected = composer.slice(start, end);
    const newText = composer.slice(0, start) + before + (selected || 'text') + after + composer.slice(end);
    setComposer(newText);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + before.length, start + before.length + (selected || 'text').length); }, 0);
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); };

  /* ── presence / meeting / calendar / conversations ── */
  const setMyPresence = async (presence: Presence, statusText?: string) => {
    try {
      await api.setPresence(presence, statusText ?? me.statusText ?? undefined);
      setWs((prev) => prev ? { ...prev, me: { ...prev.me, presence, statusText: statusText ?? prev.me.statusText }, directory: prev.directory.map((d) => d.id === prev.me.id ? { ...d, presence, statusText: statusText ?? d.statusText } : d) } : prev);
    } catch { /* ignore */ }
  };

  const startMeeting = async () => {
    if (!activeId) return;
    try {
      const m = await api.createMeeting({ title: `${activeConv?.name ?? 'Connect'} call`, conversationId: activeId });
      setActiveMeeting(m);
      setMeetingState((s) => ({ ...s, preJoin: true, micOn: true, camOn: true, screenShare: false, recording: false, handRaised: false, showChat: false, showParticipants: false, showCaptions: false, meetingChat: [], meetingChatDraft: '', elapsedSec: 0, reactions: [], pip: false }));
      await loadMessages(activeId);
    } catch (e) { alert(e instanceof Error ? e.message : 'Could not start meeting'); }
  };
  const joinMeeting = () => {
    setMeetingState((s) => ({ ...s, preJoin: false, elapsedSec: 0 }));
    if (meetingTimerRef.current) clearInterval(meetingTimerRef.current);
    meetingTimerRef.current = setInterval(() => setMeetingState((s) => ({ ...s, elapsedSec: s.elapsedSec + 1 })), 1000);
  };
  const endMeeting = async (id: string) => {
    try { await api.endMeeting(id); } catch { /* ignore */ }
    setActiveMeeting(null);
    if (meetingTimerRef.current) { clearInterval(meetingTimerRef.current); meetingTimerRef.current = null; }
  };
  const sendMeetingChat = () => {
    if (!meetingState.meetingChatDraft.trim()) return;
    setMeetingState((s) => ({ ...s, meetingChat: [...s.meetingChat, { author: me.name, text: s.meetingChatDraft, ts: Date.now() }], meetingChatDraft: '' }));
  };
  const sendMeetingReaction = (emoji: string) => {
    const r = { id: uid('r'), emoji, name: me.name, ts: Date.now() };
    setMeetingState((s) => ({ ...s, reactions: [...s.reactions, r] }));
    setTimeout(() => setMeetingState((s) => ({ ...s, reactions: s.reactions.filter((x) => x.id !== r.id) })), 3000);
  };
  const fmtElapsed = (s: number) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const openCalendar = async () => { setCalendar([]); try { setCalendar(await api.events()); } catch { setCalendar([]); } };
  const addEvent = async (ev: Parameters<typeof api.createEvent>[0]) => {
    try { await api.createEvent(ev); setCalendar(await api.events()); }
    catch (e) { alert(e instanceof Error ? e.message : 'Could not add event'); }
  };

  const startDM = async (userId: string) => {
    try { const conv = await api.createDM(userId); await loadWorkspace(); setActiveId(conv.id); setPeople(null); }
    catch (e) { alert(e instanceof Error ? e.message : 'Could not start DM'); }
  };
  const createGroup = async () => {
    if (!people || people.selected.length === 0) return;
    const name = prompt('Group name:') || 'Group';
    try { const conv = await api.createGroup(name, people.selected); await loadWorkspace(); setActiveId(conv.id); setPeople(null); }
    catch (e) { alert(e instanceof Error ? e.message : 'Could not create group'); }
  };
  const newChannel = async (spaceId?: string) => {
    const name = prompt('New channel name (e.g. design):'); if (!name) return;
    try { const c = await api.createChannel({ name, spaceId }); await loadWorkspace(); setActiveId(c.id); }
    catch (e) { alert(e instanceof Error ? e.message : 'Could not create channel'); }
  };
  const newSpace = async () => {
    const name = prompt('New space name:'); if (!name) return;
    try { await api.createSpace(name); await loadWorkspace(); } catch (e) { alert(e instanceof Error ? e.message : 'Could not create space'); }
  };

  const switchConv = (id: string) => { setActiveId(id); setThreadParent(null); setConvSearch(''); setChannelInfo(false); setPinnedView(false); };

  /* ── Notification level (US-B5, spec §5) ── */
  const changeNotifyLevel = async (channelId: string, level: NotifyLevel) => {
    const prevLevel = allConvs.find((c) => c.id === channelId)?.notifyLevel ?? 'ALL';
    setWs((prev) => prev ? {
      ...prev,
      channels: prev.channels.map((c) => c.id === channelId ? { ...c, notifyLevel: level } : c),
      conversations: prev.conversations.map((c) => c.id === channelId ? { ...c, notifyLevel: level } : c),
    } : prev);
    try { await api.setNotifyLevel(channelId, level); }
    catch (e) {
      setWs((prev) => prev ? {
        ...prev,
        channels: prev.channels.map((c) => c.id === channelId ? { ...c, notifyLevel: prevLevel } : c),
        conversations: prev.conversations.map((c) => c.id === channelId ? { ...c, notifyLevel: prevLevel } : c),
      } : prev);
      toast.error('Could not update notifications', e instanceof Error ? e.message : undefined);
    }
  };

  /* ── Channel management drawer (spec §2) ── */
  const openManageChannel = async () => {
    if (!activeConv) return;
    setManageName(activeConv.name); setManageTopic(activeConv.topic ?? ''); setManageTab('general');
    setManageChannelOpen(true); setManageMembers(null); setMemberSearch('');
    try { setManageMembers(await api.channelMembers(activeConv.id)); }
    catch { setManageMembers([]); } // gap-fill endpoint may not be deployed everywhere yet — degrade to empty roster
  };
  const saveChannelName = async () => {
    if (!activeConv || !manageName.trim() || manageName.trim() === activeConv.name) return;
    try { await api.updateChannel(activeConv.id, { name: manageName.trim() }); await loadWorkspace(); toast.success('Saved'); }
    catch (e) { toast.error('Could not rename channel', e instanceof Error ? e.message : undefined); setManageName(activeConv.name); }
  };
  const saveChannelTopic = async () => {
    if (!activeConv || manageTopic === (activeConv.topic ?? '')) return;
    try { await api.updateChannel(activeConv.id, { topic: manageTopic }); await loadWorkspace(); toast.success('Saved'); }
    catch (e) { toast.error('Could not update topic', e instanceof Error ? e.message : undefined); setManageTopic(activeConv.topic ?? ''); }
  };
  const archiveChannel = async () => {
    if (!activeConv) return;
    try {
      await api.updateChannel(activeConv.id, { archived: true });
      setArchiveConfirm(false); setManageChannelOpen(false);
      await loadWorkspace();
      setActiveId(null);
      toast.success(`#${activeConv.name} archived`);
    } catch (e) { toast.error('Could not archive channel', e instanceof Error ? e.message : undefined); }
  };
  const addMemberToChannel = async (userId: string) => {
    if (!activeConv) return;
    try {
      await api.addChannelMember(activeConv.id, userId);
      setManageMembers((prev) => [...(prev ?? []), { userId, role: 'MEMBER' }]);
      setMemberSearch('');
    } catch (e) { toast.error('Could not add member', e instanceof Error ? e.message : undefined); }
  };
  const removeMemberFromChannel = async (userId: string) => {
    if (!activeConv) return;
    try {
      await api.removeChannelMember(activeConv.id, userId);
      setManageMembers((prev) => (prev ?? []).filter((m) => m.userId !== userId));
      setRemoveConfirm(null);
    } catch (e) { toast.error('Could not remove member', e instanceof Error ? e.message : undefined); }
  };

  /* ── Browse channels modal (spec §3) ── */
  const openBrowseChannels = async () => {
    setBrowseOpen(true); setBrowseList(null); setBrowseErr(null); setBrowseSearch('');
    try { setBrowseList(await api.browseChannels()); }
    catch (e) { setBrowseErr(e instanceof Error ? e.message : 'Could not load channels'); }
  };
  const joinBrowsedChannel = async (channel: BrowseChannel) => {
    setJoiningId(channel.id);
    try {
      await api.joinChannel(channel.id);
      await loadWorkspace();
      setActiveId(channel.id);
      setBrowseOpen(false);
      toast.success(`Joined #${channel.name}`);
    } catch (e) { toast.error('Could not join channel', e instanceof Error ? e.message : undefined); }
    finally { setJoiningId(null); }
  };

  /* ── Forward dialog (spec §7a) ── */
  const openForward = (m: ConnectMessage) => { setForwardMsg(m); setForwardTarget(null); setForwardSearch(''); };
  const sendForward = async () => {
    if (!forwardMsg || !forwardTarget) return;
    setForwarding(true);
    try {
      const sourceConv = allConvs.find((c) => c.id === forwardMsg.conversationId);
      const originAuthor = memberById(forwardMsg.authorId).name;
      const marker = `[[forwarded:${forwardMsg.id}:${sourceConv?.kind === 'CHANNEL' ? `#${sourceConv.name}` : sourceConv?.name ?? 'a conversation'}:${originAuthor}:${forwardMsg.ts}]]`;
      await api.send(forwardTarget, { content: `${marker}\n${forwardMsg.content}` });
      if (activeId === forwardTarget) await loadMessages(forwardTarget);
      toast.success('Message forwarded');
      setForwardMsg(null);
    } catch (e) { toast.error('Could not forward message', e instanceof Error ? e.message : undefined); }
    finally { setForwarding(false); }
  };

  const mentionMatches = mentionQuery !== null ? directory.filter((m) => m.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 6) : [];
  const switcherResults = switcher !== null
    ? [...allConvs.map((c) => ({ type: 'conv' as const, c })), ...directory.filter((d) => d.id !== me.id).map((d) => ({ type: 'person' as const, d }))]
        .filter((r) => !switcher || (r.type === 'conv' ? r.c.name : r.d.name).toLowerCase().includes(switcher.toLowerCase()))
        .slice(0, 20)
    : [];

  // Sidebar filter
  const filteredChannels = (channels: Conversation[]) =>
    sidebarSearch ? channels.filter((c) => c.name.toLowerCase().includes(sidebarSearch.toLowerCase())) : channels;

  const starredList = allConvs.filter((c) => starredConvs.has(c.id));

  /* ── styles ── */
  const pill = (active: boolean, muted = false): React.CSSProperties => ({
    width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
    border: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'background .15s',
    background: active ? 'var(--color-primary-light)' : 'transparent',
    color: active ? 'var(--color-primary)' : muted ? 'var(--color-text-tertiary)' : 'var(--color-sidebar-text)',
    fontSize: 13, fontWeight: active ? 600 : 500,
  });
  const tbtn = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)', color: 'var(--color-text)', padding: '7px 14px',
    borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all .15s', ...extra,
  });
  const sectionHeader = (id: string, label: string, action?: () => void) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px', marginBottom: 2 }}>
      <button onClick={() => toggleSection(id)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <ChevronRight size={12} style={{ color: 'var(--color-text-tertiary)', transform: collapsedSections.has(id) ? 'rotate(0)' : 'rotate(90deg)', transition: 'transform .15s' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </button>
      {action && <button onClick={action} title={`New ${label.toLowerCase().replace(/s$/, '')}`} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 2 }}><Plus size={14} /></button>}
    </div>
  );

  if (loadErr) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, height: '60vh', color: 'var(--color-text-secondary)' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)' }} />
        <p style={{ margin: 0, fontSize: 15 }}>Couldn&apos;t load Connect: {loadErr}</p>
        <button onClick={loadWorkspace} style={tbtn({ background: 'var(--color-primary)', color: '#fff', border: 'none' })}><RefreshCw size={15} /> Retry</button>
      </div>
    );
  }
  if (!ws) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--color-text-secondary)', gap: 8 }}><RefreshCw className="animate-spin" size={26} /> Loading Connect...</div>;
  }

  const spaceIds = new Set(ws.spaces.map((s) => s.id));
  const channelsBySpace = (spaceId: string) => filteredChannels((ws.channels ?? []).filter((c) => c.spaceId === spaceId));
  const ungroupedChannels = filteredChannels((ws.channels ?? []).filter((c) => !c.spaceId || !spaceIds.has(c.spaceId)));
  const headerMembers = (activeConv?.memberIds ?? []).map(memberById);
  const activeOnline = headerMembers.filter((m) => m.presence === 'ACTIVE' || m.presence === 'BRB').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* ═══ Top bar ═══ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={22} style={{ color: 'var(--color-primary)' }} />
          <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Connect</h1>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {/* Status button */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => { setStatusDraft(me.statusText ?? ''); setStatusEmoji(''); setPresenceOpen((v) => !v); }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--color-border)',
              borderRadius: 8, background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer', fontSize: 13,
            }}>
              <PresenceDot presence={me.presence} size={8} border="var(--color-bg)" />
              <span style={{ fontWeight: 600, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {me.statusText || PRESENCE_META[me.presence].label}
              </span>
              <ChevronDown size={13} />
            </button>
            {presenceOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 50, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, width: 300, boxShadow: '0 12px 32px rgba(0,0,0,.15)', overflow: 'hidden' }}>
                <div style={{ padding: 12, borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Set a status</div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                    <input value={statusEmoji} onChange={(e) => setStatusEmoji(e.target.value)} placeholder="😊" style={{ width: 40, padding: '6px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', textAlign: 'center', fontSize: 16 }} />
                    <input value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} placeholder="What's your status?" style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13 }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {STATUS_SUGGESTIONS.map((s) => (
                      <button key={s.text} onClick={() => { setStatusEmoji(s.emoji); setStatusDraft(s.text); }} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', cursor: 'pointer', fontSize: 12, color: 'var(--color-text)' }}>
                        {s.emoji} {s.text}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setMyPresence(me.presence, statusDraft); setPresenceOpen(false); }} style={{ width: '100%', padding: '7px', border: 'none', borderRadius: 6, background: 'var(--color-primary)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Save status</button>
                </div>
                <div style={{ padding: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', padding: '4px 8px' }}>Presence</div>
                  {PRESENCE_ORDER.map((p) => (
                    <button key={p} onClick={() => { setMyPresence(p); setPresenceOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 6, border: 'none', width: '100%', background: me.presence === p ? 'var(--color-primary-light)' : 'transparent', cursor: 'pointer', color: me.presence === p ? 'var(--color-primary)' : 'var(--color-text)', fontSize: 13, textAlign: 'left' }}>
                      <PresenceDot presence={p} size={8} border={me.presence === p ? 'var(--color-primary-light)' : 'transparent'} />
                      {PRESENCE_META[p].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={() => setSwitcher('')} style={tbtn()} title="Ctrl+K"><Search size={15} /> Search</button>
          <button onClick={startMeeting} style={tbtn({ background: 'var(--color-primary)', color: '#fff', border: 'none' })}><Video size={15} /> Meet</button>
          <button onClick={openCalendar} style={tbtn()}><Calendar size={15} /> Calendar</button>
          <button onClick={() => setShowKeyboardShortcuts(true)} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: 6 }} title="Keyboard shortcuts"><Command size={16} /></button>
        </div>
      </div>

      {/* ═══ Body ═══ */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* ─── Left sidebar ─── */}
        <div style={{ width: 272, flexShrink: 0, background: 'var(--color-bg-elevated)', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Sidebar search */}
          <div style={{ padding: '10px 12px 6px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} placeholder="Filter conversations..." style={{ width: '100%', padding: '7px 8px 7px 28px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 12 }} />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Starred */}
            {starredList.length > 0 && (
              <div>
                {sectionHeader('starred', 'Starred')}
                {!collapsedSections.has('starred') && starredList.map((c) => (
                  <button key={c.id} onClick={() => switchConv(c.id)} style={pill(activeId === c.id)}>
                    <Star size={14} style={{ color: '#f6bf26', fill: '#f6bf26' }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.name}</span>
                    <Unread n={unreadOf(c)} />
                  </button>
                ))}
              </div>
            )}

            {/* Spaces & channels */}
            {ws.spaces.map((sp) => (
              <div key={sp.id}>
                {sectionHeader(sp.id, `${sp.emoji} ${sp.name}`, () => newChannel(sp.id))}
                {!collapsedSections.has(sp.id) && channelsBySpace(sp.id).map((c) => (
                  <button key={c.id} onClick={() => switchConv(c.id)} style={pill(activeId === c.id, mutedConvs.has(c.id))}>
                    <Hash size={14} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: unreadOf(c) ? 700 : undefined, color: unreadOf(c) ? 'var(--color-text)' : undefined }}>{c.name}</span>
                    {mutedConvs.has(c.id) && <BellOff size={11} style={{ color: 'var(--color-text-tertiary)' }} />}
                    <Unread n={unreadOf(c)} />
                  </button>
                ))}
              </div>
            ))}

            {ungroupedChannels.length > 0 && (
              <div>
                {sectionHeader('channels', 'Channels', () => newChannel())}
                {!collapsedSections.has('channels') && ungroupedChannels.map((c) => (
                  <button key={c.id} onClick={() => switchConv(c.id)} style={pill(activeId === c.id, mutedConvs.has(c.id))}>
                    <Hash size={14} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontWeight: unreadOf(c) ? 700 : undefined, color: unreadOf(c) ? 'var(--color-text)' : undefined }}>{c.name}</span>
                    {mutedConvs.has(c.id) && <BellOff size={11} style={{ color: 'var(--color-text-tertiary)' }} />}
                    <Unread n={unreadOf(c)} />
                  </button>
                ))}
                <button onClick={openBrowseChannels} style={{ ...pill(false), color: 'var(--color-text-tertiary)', fontSize: 12 }}><Search size={13} /> Browse channels</button>
              </div>
            )}

            {/* Direct messages */}
            <div>
              {sectionHeader('dms', 'Direct messages', () => setPeople({ mode: 'dm', selected: [], search: '' }))}
              {!collapsedSections.has('dms') && directs.map((c) => {
                const other = c.kind === 'DM' ? memberById((c.memberIds ?? []).find((i) => i !== me.id) ?? '') : undefined;
                const unread = unreadOf(c);
                return (
                  <button key={c.id} onClick={() => switchConv(c.id)} style={{ ...pill(activeId === c.id, mutedConvs.has(c.id)), gap: 8 }}>
                    {other ? <Avatar member={other} size={24} showPresence /> : <Users size={18} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: unread ? 700 : undefined, color: unread ? 'var(--color-text)' : undefined }}>{c.name}</span>
                      {c.lastMessage && (
                        <span style={{ display: 'block', fontSize: 11, color: unread ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '16px' }}>
                          {c.lastMessage.system ? '📹 ' : ''}{c.lastMessage.content}
                        </span>
                      )}
                    </div>
                    <Unread n={unread} />
                  </button>
                );
              })}
              <button onClick={() => setPeople({ mode: 'group', selected: [], search: '' })} style={{ ...pill(false), color: 'var(--color-text-tertiary)', fontSize: 12 }}><Plus size={13} /> New group</button>
            </div>
          </div>

          {/* Sidebar footer: online count */}
          {/* Sidebar footer: online count (US-D1) */}
          <button onClick={() => setDirectoryModalOpen(true)} style={{ width: '100%', border: 'none', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-secondary)', background: 'transparent', padding: '8px 14px', cursor: 'pointer', textAlign: 'left', outline: 'none' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
            <span style={{ textDecoration: 'underline' }}>{onlineCount} online of {directory.length} members</span>
          </button>
        </div>

        {/* ─── Main conversation ─── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

          {/* Drag overlay */}
          {dragOver && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 20, background: 'var(--color-primary-light)', border: '3px dashed var(--color-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ textAlign: 'center' }}>
                <Paperclip size={40} style={{ color: 'var(--color-primary)', marginBottom: 8 }} />
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>Drop files to upload</p>
              </div>
            </div>
          )}

          {!activeConv ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: 'var(--color-text-tertiary)' }}>
              <MessageSquare size={48} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: 16, fontWeight: 500, margin: 0 }}>Select a conversation to get started</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setPeople({ mode: 'dm', selected: [], search: '' })} style={tbtn()}><Plus size={14} /> New message</button>
                <button onClick={() => newChannel()} style={tbtn()}><Hash size={14} /> New channel</button>
              </div>
            </div>
          ) : (
            <>
              {/* ─ Channel header ─ */}
              <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--color-bg-elevated)', flexShrink: 0, minHeight: 52 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {activeConv.kind === 'CHANNEL' ? <Hash size={16} /> : activeConv.kind === 'GROUP' ? <Users size={16} /> : <MessageSquare size={16} />}
                      {activeConv.name}
                    </h3>
                    {activeConv.kind === 'CHANNEL' && <Globe size={13} style={{ color: 'var(--color-text-tertiary)' }} />}
                    <button onClick={() => toggleStar(activeConv.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: starredConvs.has(activeConv.id) ? '#f6bf26' : 'var(--color-text-tertiary)' }}>
                      <Star size={14} fill={starredConvs.has(activeConv.id) ? '#f6bf26' : 'none'} />
                    </button>
                  </div>
                  {activeConv.topic && <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeConv.topic}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {/* Members stack */}
                  <button onClick={() => setChannelInfo(true)} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 12 }}>
                    <div style={{ display: 'flex' }}>
                      {headerMembers.slice(0, 3).map((m, i) => <span key={m.id} style={{ marginLeft: i ? -6 : 0 }}><Avatar member={m} size={20} /></span>)}
                    </div>
                    {headerMembers.length} <ChevronDown size={12} />
                  </button>

                  <div style={{ position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                    <input value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search in chat" aria-label="Search in chat" style={{ padding: '5px 8px 5px 26px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 12, width: 140 }} />
                    {convSearch.trim() && (
                      <div role="region" aria-live="polite" style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, width: 320, maxHeight: 360, overflowY: 'auto', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,.15)', zIndex: 30 }}>
                        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', fontSize: 12, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {searchLoading ? (<><Spinner size="sm" /> Searching…</>) : searchErr ? (
                            <span style={{ color: 'var(--color-danger)' }}>Search failed. Try again.</span>
                          ) : (
                            <span>{searchResults?.length ?? 0} result{(searchResults?.length ?? 0) === 1 ? '' : 's'} in {activeConv.kind === 'CHANNEL' ? `#${activeConv.name}` : activeConv.name}</span>
                          )}
                        </div>
                        {!searchLoading && !searchErr && (searchResults?.length ?? 0) === 0 && (
                          <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 13, color: 'var(--color-text-tertiary)' }}>No messages match &quot;{convSearch}&quot;</div>
                        )}
                        {!searchLoading && searchResults?.map((r) => (
                          <button key={r.messageId} onClick={() => { jumpToMessage(r.channelId, r.messageId); setConvSearch(''); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12 }}>
                              <strong style={{ color: 'var(--color-text)' }}>{r.authorName}</strong>
                              <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDateSmart(r.ts)}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{highlightSnippet(r.snippet, convSearch)}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {pinned.length > 0 && (
                    <button onClick={() => setPinnedView(!pinnedView)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-secondary)', fontSize: 12 }}>
                      <Pin size={13} style={{ color: 'var(--color-warning)' }} /> {pinned.length}
                    </button>
                  )}

                  <Select
                    aria-label={`Notification level for ${activeConv.kind === 'CHANNEL' ? '#' : ''}${activeConv.name}`}
                    value={activeConv.notifyLevel ?? 'ALL'}
                    onChange={(e) => changeNotifyLevel(activeConv.id, e.target.value as NotifyLevel)}
                    style={{ width: 140, minHeight: 30, fontSize: 12, padding: '0 6px' }}
                  >
                    {(['ALL', 'MENTIONS', 'NONE'] as NotifyLevel[]).map((lvl) => (
                      <option key={lvl} value={lvl}>{NOTIFY_LEVEL_LABELS[lvl]}</option>
                    ))}
                  </Select>
                  <button onClick={startMeeting} title="Start meeting" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 6 }}><Video size={16} /></button>
                  <button onClick={() => { setSavedMessagesOpen(!savedMessagesOpen); setChannelInfo(false); setThreadParent(null); }} title="Saved messages" style={{ background: 'none', border: 'none', cursor: 'pointer', color: savedMessagesOpen ? 'var(--color-primary)' : 'var(--color-text-tertiary)', padding: 6 }}>
                    <BookmarkCheck size={16} />
                  </button>
                  <button onClick={() => { setChannelInfo(!channelInfo); setSavedMessagesOpen(false); setThreadParent(null); }} title="Channel info" style={{ background: 'none', border: 'none', cursor: 'pointer', color: channelInfo ? 'var(--color-primary)' : 'var(--color-text-tertiary)', padding: 6 }}>
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {/* ─ Pinned messages bar ─ */}
              {pinned.length > 0 && !pinnedView && (
                <button onClick={() => setPinnedView(true)} style={{ padding: '6px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                  <Pin size={12} style={{ color: 'var(--color-warning)' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}><strong>{memberById(pinned[0]!.authorId).name}:</strong> {pinned[0]!.content}</span>
                  {pinned.length > 1 && <span style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{pinned.length} pinned</span>}
                </button>
              )}

              {/* ─ Messages feed ─ */}
              <div ref={feedRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {groupedMessages.map((group) => (
                  <React.Fragment key={group.date}>
                    <DateDivider ts={group.messages[0]!.ts} />
                    {group.messages.map((m, i) => {
                      const prevMsg = i > 0 ? group.messages[i - 1] : null;
                      const compact = prevMsg && !prevMsg.deleted && prevMsg.authorId === m.authorId && prevMsg.kind === 'USER' && m.kind === 'USER' && (m.ts - prevMsg.ts) < 300000;
                      return (
                        <MessageRow key={m.id} m={m} author={memberById(m.authorId)} me={me.id} replyCount={repliesOf(m.id).length}
                          compact={!!compact}
                          emojiOpen={emojiFor === m.id} onEmojiToggle={() => setEmojiFor(emojiFor === m.id ? null : m.id)} onReact={(e) => react(m.id, e)}
                          onOpenThread={() => setThreadParent(m.id)} onEdit={() => { setEditingId(m.id); setEditText(m.content); }} onDelete={() => del(m.id)} onPin={() => pin(m.id)}
                          editing={editingId === m.id} editText={editText} setEditText={setEditText} onSaveEdit={saveEdit} onCancelEdit={() => setEditingId(null)}
                          onJoinMeeting={() => api.meetings().then((ms) => { const mt = ms.find((x) => x.id === m.meetingId); if (mt) setActiveMeeting(mt); })}
                          isBookmarked={bookmarks.has(m.id)} onToggleBookmark={() => toggleBookmark(m.id)}
                          onProfileClick={(member) => setProfileCard(member)} memberById={memberById}
                          onForward={() => openForward(m)} flashing={flashMessageId === m.id}
                          isSmallGroup={!!activeConv && (activeConv.kind === 'DM' || activeConv.kind === 'GROUP' || headerMembers.length <= 8)} />
                      );
                    })}
                  </React.Fragment>
                ))}
                {topLevel.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-text-tertiary)' }}>
                    {convSearch ? (
                      <><Search size={32} style={{ opacity: 0.3 }} /><span style={{ fontSize: 14 }}>No messages match &quot;{convSearch}&quot;</span></>
                    ) : (
                      <>
                        <span style={{ fontSize: 36 }}>👋</span>
                        <span style={{ fontSize: 15, fontWeight: 500 }}>No messages yet</span>
                        <span style={{ fontSize: 13 }}>Be the first to say hello!</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ─ Composer ─ */}
              <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', flexShrink: 0, position: 'relative' }}>
                {mentionMatches.length > 0 && (
                  <div style={{ position: 'absolute', bottom: '100%', left: 16, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 10, boxShadow: '0 -4px 16px rgba(0,0,0,.1)', overflow: 'hidden', width: 260, marginBottom: 4 }}>
                    <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Mention someone</div>
                    {mentionMatches.map((m) => (
                      <button key={m.id} onClick={() => insertMention(m)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-text)', textAlign: 'left' }}>
                        <Avatar member={m} size={24} showPresence /> <span style={{ fontSize: 13 }}>{m.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-tertiary)' }}>{m.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {staged.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '8px 16px 0' }}>
                    {staged.map((a) => <StagedChip key={a.localId} a={a} onRemove={() => setStaged((p) => p.filter((x) => x.localId !== a.localId))} />)}
                  </div>
                )}

                {/* Typing indicator strip — fixed-height slot, never shifts the composer */}
                <div style={{ height: 20, padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: 12, fontStyle: 'italic', color: 'var(--color-text-tertiary)' }}>
                  {(() => {
                    const names = [...typingUsers.keys()].filter((uid_) => uid_ !== me.id).map((uid_) => memberById(uid_).name);
                    if (names.length === 0) return null;
                    const label = names.length === 1 ? `${names[0]} is typing…`
                      : names.length === 2 ? `${names[0]} and ${names[1]} are typing…`
                      : `${names[0]}, ${names[1]}, and ${names.length - 2} others are typing…`;
                    return <span>{label}</span>;
                  })()}
                </div>

                {/* Format bar */}
                {showFormatBar && (
                  <div style={{ display: 'flex', gap: 2, padding: '4px 16px', borderBottom: '1px solid var(--color-border)' }}>
                    {[
                      { icon: <Bold size={15} />, before: '**', after: '**', tip: 'Bold' },
                      { icon: <Italic size={15} />, before: '*', after: '*', tip: 'Italic' },
                      { icon: <Strikethrough size={15} />, before: '~~', after: '~~', tip: 'Strikethrough' },
                      { icon: <Code size={15} />, before: '`', after: '`', tip: 'Code' },
                      { icon: <Link2 size={15} />, before: '[', after: '](url)', tip: 'Link' },
                      { icon: <List size={15} />, before: '- ', after: '', tip: 'Bullet list' },
                      { icon: <ListOrdered size={15} />, before: '1. ', after: '', tip: 'Numbered list' },
                    ].map((f) => (
                      <button key={f.tip} onClick={() => insertFormat(f.before, f.after)} title={f.tip} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 5, borderRadius: 4, display: 'flex' }}>{f.icon}</button>
                    ))}
                  </div>
                )}

                <div style={{ padding: '8px 16px 10px' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '4px 6px' }}>
                    <button onClick={() => setShowFormatBar(!showFormatBar)} title="Formatting" style={{ background: 'none', border: 'none', cursor: 'pointer', color: showFormatBar ? 'var(--color-primary)' : 'var(--color-text-secondary)', padding: 6 }}><Bold size={16} /></button>
                    <button onClick={() => fileRef.current?.click()} title="Attach" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 6 }}><Paperclip size={16} /></button>
                    <input ref={fileRef} type="file" multiple hidden onChange={(e) => { onFiles(e.target.files); if (fileRef.current) fileRef.current.value = ''; }} />
                    <textarea ref={composerRef} value={composer}
                      onChange={(e) => {
                        setComposer(e.target.value);
                        const mt = /(?:^|\s)@(\w*)$/.exec(e.target.value); setMentionQuery(mt ? (mt[1] ?? '') : null);
                        if (socketRef.current && activeId) socketRef.current.emit('typing', { channelId: activeId });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={`Message ${activeConv.kind === 'CHANNEL' ? '#' + activeConv.name : activeConv.name}...`}
                      rows={1} style={{ flex: 1, resize: 'none', padding: '7px 4px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-text)', fontSize: 13, fontFamily: 'inherit', maxHeight: 120, lineHeight: 1.5 }} />
                    <button onClick={() => setEmojiFor('composer')} aria-label="Add emoji" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 6 }}><Smile size={16} /></button>
                    <button onClick={handleSend} disabled={(!composer.trim() && staged.length === 0) || staged.some((a) => a.status === 'uploading')} aria-label="Send message" style={{ background: (composer.trim() || staged.length) ? 'var(--color-primary)' : 'var(--color-border)', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', transition: 'background .15s' }}><Send size={16} /></button>
                  </div>
                  {emojiFor === 'composer' && (
                    <div style={{ position: 'absolute', bottom: '100%', right: 16, marginBottom: 4, zIndex: 20 }}>
                      <EmojiPicker onPick={(e) => { setComposer((p) => p + e); setEmojiFor(null); }} />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Saved messages panel (repurposed bookmarks, US-D2) ─── */}
        {savedMessagesOpen && (() => {
          return (
            <div style={{ width: 360, flexShrink: 0, borderLeft: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><BookmarkCheck size={15} /> Saved messages</h3>
                <button onClick={() => setSavedMessagesOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}><X size={16} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {savedMessages.length === 0 ? (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, textAlign: 'center', padding: 20 }}>No saved messages yet.</p>
                ) : (
                  savedMessages.map((m) => (
                    <div key={m.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10, background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{memberById(m.authorId).name}</span>
                        <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{formatDateSmart(m.ts)}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{renderContent(m.content)}</div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: 6, marginTop: 2 }}>
                        <button onClick={() => jumpToMessage(m.conversationId, m.id)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: 11, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> Go to message</button>
                        <button onClick={() => toggleBookmark(m.id)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Trash2 size={12} /> Unsave</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* ─── Thread panel ─── */}
        {threadParent && (() => {
          const parent = messages.find((m) => m.id === threadParent);
          if (!parent) return null;
          const reps = repliesOf(parent.id);
          return (
            <div style={{ width: 360, flexShrink: 0, borderLeft: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Reply size={15} /> Thread</h3>
                <button onClick={() => setThreadParent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}><X size={16} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <ThreadMsg m={parent} author={memberById(parent.authorId)} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--color-text-tertiary)', padding: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  <span>{reps.length} repl{reps.length === 1 ? 'y' : 'ies'}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>
                {reps.map((r) => <ThreadMsg key={r.id} m={r} author={memberById(r.authorId)} />)}
              </div>
              <div style={{ borderTop: '1px solid var(--color-border)', padding: 10, display: 'flex', gap: 8 }}>
                <textarea value={threadComposer} onChange={(e) => setThreadComposer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleThreadSend(); } }} placeholder="Reply..." rows={1} style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13, resize: 'none', fontFamily: 'inherit' }} />
                <button onClick={handleThreadSend} disabled={!threadComposer.trim()} style={{ background: threadComposer.trim() ? 'var(--color-primary)' : 'var(--color-border)', color: '#fff', border: 'none', padding: '0 14px', borderRadius: 8, cursor: 'pointer' }}><Send size={16} /></button>
              </div>
            </div>
          );
        })()}

        {/* ─── Channel info panel ─── */}
        {channelInfo && activeConv && (
          <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Details</h3>
              <button onClick={() => setChannelInfo(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: 12, background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                  {activeConv.kind === 'CHANNEL' ? <Hash size={28} style={{ color: 'var(--color-primary)' }} /> : <Users size={28} style={{ color: 'var(--color-primary)' }} />}
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{activeConv.name}</h4>
                {activeConv.topic && <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>{activeConv.topic}</p>}
              </div>

              {activeConv.kind === 'CHANNEL' && (
                <ProtectedComponent permission="communication.channel.manage">
                  <Button variant="secondary" onClick={openManageChannel} style={{ width: '100%', justifyContent: 'center' }}>
                    <Settings size={14} /> Manage channel
                  </Button>
                </ProtectedComponent>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleStar(activeConv.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg)', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 11 }}>
                  <Star size={18} fill={starredConvs.has(activeConv.id) ? '#f6bf26' : 'none'} style={{ color: starredConvs.has(activeConv.id) ? '#f6bf26' : 'var(--color-text-secondary)' }} />
                  {starredConvs.has(activeConv.id) ? 'Unstar' : 'Star'}
                </button>
                <button style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg)', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 11 }}>
                  <Share2 size={18} />
                  Share
                </button>
              </div>

              {/* Members */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)' }}>Members ({headerMembers.length})</span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{activeOnline} online</span>
                </div>
                {headerMembers.map((m) => (
                  <button key={m.id} onClick={() => setProfileCard(m)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                    <Avatar member={m} size={28} showPresence />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>{m.name} {m.id === me.id && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>(you)</span>}</div>
                      {m.statusText && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{m.statusText}</div>}
                    </div>
                  </button>
                ))}
              </div>

              {/* Shared files */}
              {(() => {
                const allFiles = messages.flatMap((m) => m.attachments.map((a) => ({ ...a, ts: m.ts, author: memberById(m.authorId).name }))).slice(-10).reverse();
                if (allFiles.length === 0) return null;
                return (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Shared files</div>
                    {allFiles.map((f) => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', fontSize: 12 }}>
                        <File size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text)' }}>{f.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{f.author} · {formatBytes(f.size)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Pinned messages */}
              {pinned.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Pinned messages ({pinned.length})</div>
                  {pinned.slice(0, 5).map((m) => (
                    <div key={m.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-border)', fontSize: 12 }}>
                      <div style={{ fontWeight: 600, marginBottom: 2, color: 'var(--color-text)' }}>{memberById(m.authorId).name}</div>
                      <div style={{ color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Pinned messages panel ─── */}
        {pinnedView && activeConv && (
          <div style={{ width: 320, flexShrink: 0, borderLeft: '1px solid var(--color-border)', background: 'var(--color-bg-elevated)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Pin size={14} style={{ color: 'var(--color-warning)' }} /> Pinned messages</h3>
              <button onClick={() => setPinnedView(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}><X size={16} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {pinned.map((m) => (
                <div key={m.id} style={{ padding: '10px', borderRadius: 8, border: '1px solid var(--color-border)', marginBottom: 8, background: 'var(--color-bg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Avatar member={memberById(m.authorId)} size={22} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{memberById(m.authorId).name}</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 'auto' }}>{formatDateSmart(m.ts)}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                  <button onClick={() => pin(m.id)} style={{ marginTop: 6, fontSize: 11, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>Unpin</button>
                </div>
              ))}
              {pinned.length === 0 && <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>No pinned messages</p>}
            </div>
          </div>
        )}
      </div>

      {/* ═══ Modals ═══ */}

      {/* ═══ Full-screen Meeting (Google Meet style) ═══ */}
      {activeMeeting && (() => {
        const ms = meetingState;
        const participants = [me, ...directory.filter((x) => x.id !== me.id).slice(0, 5)];
        const meetCtrl = (icon: React.ReactNode, label: string, on: boolean, onClick: () => void, danger = false) => (
          <button onClick={onClick} title={label} style={{
            width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s',
            background: danger ? '#ea4335' : !on ? 'rgba(234,67,53,.85)' : 'rgba(255,255,255,.12)',
            color: '#fff',
          }}>{icon}</button>
        );

        // ─── Pre-join screen ───
        if (ms.preJoin) {
          return (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#202124', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 48, alignItems: 'center', maxWidth: 960 }}>
                {/* Preview */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <div style={{
                    width: 440, height: 330, borderRadius: 12, background: '#3c4043',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
                  }}>
                    {ms.camOn ? (
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Avatar member={me} size={100} />
                        </div>
                        <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.5)', borderRadius: 6, padding: '4px 10px' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                          <span style={{ color: '#fff', fontSize: 13 }}>{me.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Avatar member={me} size={80} />
                        <p style={{ color: '#9aa0a6', fontSize: 14, marginTop: 12 }}>Camera is off</p>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {meetCtrl(ms.micOn ? <Mic size={20} /> : <MicOff size={20} />, ms.micOn ? 'Mute' : 'Unmute', ms.micOn, () => setMeetingState((s) => ({ ...s, micOn: !s.micOn })))}
                    {meetCtrl(ms.camOn ? <Video size={20} /> : <VideoOff size={20} />, ms.camOn ? 'Stop video' : 'Start video', ms.camOn, () => setMeetingState((s) => ({ ...s, camOn: !s.camOn })))}
                  </div>
                </div>
                {/* Join panel */}
                <div style={{ width: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <h2 style={{ color: '#e8eaed', fontSize: 24, fontWeight: 400, margin: 0 }}>Ready to join?</h2>
                  <p style={{ color: '#9aa0a6', fontSize: 14, margin: 0, textAlign: 'center' }}>{activeMeeting.title}</p>
                  <code style={{ color: '#9aa0a6', fontSize: 13, background: 'rgba(255,255,255,.08)', padding: '6px 14px', borderRadius: 6 }}>connect.meet/{activeMeeting.code}</code>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    {participants.slice(0, 4).map((p, i) => <span key={p.id} style={{ marginLeft: i ? -8 : 0 }}><Avatar member={p} size={28} /></span>)}
                    <span style={{ color: '#9aa0a6', fontSize: 13 }}>{participants.length} in this call</span>
                  </div>
                  <button onClick={joinMeeting} style={{
                    padding: '14px 48px', borderRadius: 24, border: 'none', background: '#1a73e8', color: '#fff',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, letterSpacing: '0.25px',
                  }}>Join now</button>
                  <button onClick={() => { navigator.clipboard?.writeText(`connect.meet/${activeMeeting.code}`); }} style={{
                    padding: '10px 24px', borderRadius: 24, border: '1px solid #5f6368', background: 'transparent', color: '#8ab4f8',
                    fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                  }}><Copy size={15} /> Copy joining info</button>
                  <button onClick={() => { setActiveMeeting(null); if (meetingTimerRef.current) clearInterval(meetingTimerRef.current); }} style={{ background: 'none', border: 'none', color: '#9aa0a6', fontSize: 14, cursor: 'pointer', marginTop: 8 }}>Cancel</button>
                </div>
              </div>
            </div>
          );
        }

        // ─── Active meeting screen ───
        const sidePanel = ms.showChat || ms.showParticipants;
        return (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: '#202124', display: 'flex', flexDirection: 'column' }}>
            {/* Top bar */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 12, flexShrink: 0, minHeight: 48 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Video size={20} style={{ color: '#8ab4f8' }} />
                <span style={{ color: '#e8eaed', fontSize: 15, fontWeight: 500 }}>{activeMeeting.title}</span>
              </div>
              <span style={{ color: '#9aa0a6', fontSize: 13 }}>|</span>
              <span style={{ color: '#9aa0a6', fontSize: 13, fontFamily: 'monospace' }}>{fmtElapsed(ms.elapsedSec)}</span>
              {ms.recording && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ea4335', fontSize: 13, fontWeight: 600 }}>
                  <CircleDot size={14} /> REC
                </span>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <code style={{ color: '#9aa0a6', fontSize: 12, background: 'rgba(255,255,255,.06)', padding: '4px 10px', borderRadius: 4 }}>connect.meet/{activeMeeting.code}</code>
                <button onClick={() => navigator.clipboard?.writeText(`connect.meet/${activeMeeting.code}`)} style={{ background: 'none', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: 4 }}><Copy size={14} /></button>
              </div>
            </div>

            {/* Main area */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              {/* Video grid */}
              <div style={{ flex: 1, padding: 8, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                {/* Floating reactions */}
                {ms.reactions.map((r) => (
                  <div key={r.id} style={{
                    position: 'absolute', bottom: 100, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,.6)', borderRadius: 20, padding: '6px 14px', display: 'flex',
                    alignItems: 'center', gap: 8, zIndex: 5, animation: 'fadeUp 3s ease-out forwards',
                  }}>
                    <span style={{ fontSize: 24 }}>{r.emoji}</span>
                    <span style={{ color: '#e8eaed', fontSize: 13 }}>{r.name}</span>
                  </div>
                ))}

                {/* Captions bar */}
                {ms.showCaptions && (
                  <div style={{ position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,.75)', borderRadius: 8, padding: '8px 20px', zIndex: 5, maxWidth: '70%' }}>
                    <p style={{ color: '#fff', fontSize: 15, margin: 0, textAlign: 'center' }}>
                      <span style={{ color: '#8ab4f8' }}>{me.name}: </span>Captions will appear here when speaking...
                    </p>
                  </div>
                )}

                {/* Video tiles */}
                <div style={{
                  flex: 1, display: 'grid', gap: 8, padding: 4,
                  gridTemplateColumns: ms.layout === 'gallery'
                    ? `repeat(${Math.min(participants.length, 3)}, 1fr)`
                    : ms.layout === 'spotlight' ? '1fr' : '1fr 280px',
                  gridAutoRows: ms.layout === 'spotlight' ? '1fr' : undefined,
                }}>
                  {(ms.layout === 'spotlight' ? [participants[0]!] : participants).map((p, i) => (
                    <div key={p.id} style={{
                      background: '#3c4043', borderRadius: 8, position: 'relative', overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120,
                      border: p.id === me.id && ms.handRaised ? '2px solid #f6bf26' : '2px solid transparent',
                    }}>
                      {/* Simulated video — gradient bg + avatar */}
                      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${135 + i * 30}deg, #1a1a2e, #16213e, #0f3460)`, opacity: (p.id === me.id && !ms.camOn) ? 0 : 0.8 }} />
                      <Avatar member={p} size={ms.layout === 'spotlight' && i === 0 ? 96 : 56} />

                      {/* Name tag */}
                      <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.55)', borderRadius: 6, padding: '3px 10px' }}>
                        {p.id === me.id && !ms.micOn && <MicOff size={12} style={{ color: '#ea4335' }} />}
                        <span style={{ color: '#e8eaed', fontSize: 12 }}>{p.name}{p.id === me.id ? ' (You)' : ''}</span>
                        {p.id === me.id && ms.handRaised && <span style={{ fontSize: 14 }}>✋</span>}
                      </div>

                      {/* Pin / menu on hover */}
                      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
                        <button style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,.4)', border: 'none', color: '#e8eaed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="More"><MoreVertical size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Self-view PiP */}
                {ms.layout === 'spotlight' && participants.length > 1 && (
                  <div style={{ position: 'absolute', bottom: 80, right: 16, width: 180, height: 120, borderRadius: 8, overflow: 'hidden', background: '#3c4043', boxShadow: '0 4px 12px rgba(0,0,0,.4)', zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,.1)' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a2e, #16213e)', opacity: ms.camOn ? 0.8 : 0 }} />
                    <Avatar member={me} size={40} />
                    <div style={{ position: 'absolute', bottom: 4, left: 6, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,.5)', borderRadius: 4, padding: '2px 6px' }}>
                      {!ms.micOn && <MicOff size={10} style={{ color: '#ea4335' }} />}
                      <span style={{ color: '#e8eaed', fontSize: 10 }}>You</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Side panel — Chat / Participants */}
              {sidePanel && (
                <div style={{ width: 320, borderLeft: '1px solid #3c4043', display: 'flex', flexDirection: 'column', background: '#292a2d' }}>
                  <div style={{ display: 'flex', borderBottom: '1px solid #3c4043' }}>
                    <button onClick={() => setMeetingState((s) => ({ ...s, showParticipants: true, showChat: false }))} style={{
                      flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      color: ms.showParticipants ? '#8ab4f8' : '#9aa0a6', borderBottom: ms.showParticipants ? '2px solid #8ab4f8' : '2px solid transparent',
                    }}>People ({participants.length})</button>
                    <button onClick={() => setMeetingState((s) => ({ ...s, showChat: true, showParticipants: false }))} style={{
                      flex: 1, padding: '12px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      color: ms.showChat ? '#8ab4f8' : '#9aa0a6', borderBottom: ms.showChat ? '2px solid #8ab4f8' : '2px solid transparent',
                    }}>Chat</button>
                    <button onClick={() => setMeetingState((s) => ({ ...s, showChat: false, showParticipants: false }))} style={{ background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '0 12px' }}><X size={16} /></button>
                  </div>

                  {ms.showParticipants && (
                    <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
                      {/* Waiting room */}
                      {ms.waitingRoom.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#f6bf26', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={13} /> Waiting room ({ms.waitingRoom.length})</div>
                          {ms.waitingRoom.map((w) => (
                            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                              <Avatar member={w} size={28} />
                              <span style={{ flex: 1, color: '#e8eaed', fontSize: 13 }}>{w.name}</span>
                              <button style={{ background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Admit</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* In call */}
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#9aa0a6', marginBottom: 8 }}>In this call ({participants.length})</div>
                      {participants.map((p) => (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', borderRadius: 6 }}>
                          <Avatar member={p} size={30} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: '#e8eaed', fontSize: 13 }}>{p.name}{p.id === me.id ? ' (You)' : ''}</div>
                            <div style={{ color: '#9aa0a6', fontSize: 11 }}>{p.email}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>
                            {p.id === me.id && ms.handRaised && <span style={{ fontSize: 14 }}>✋</span>}
                            <Mic size={14} style={{ color: '#9aa0a6' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {ms.showChat && (
                    <>
                      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {ms.meetingChat.length === 0 && (
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                            <MessageCircle size={32} style={{ color: '#5f6368' }} />
                            <p style={{ color: '#9aa0a6', fontSize: 13, textAlign: 'center', margin: 0 }}>Messages can only be seen by people in the call and are deleted when the call ends.</p>
                          </div>
                        )}
                        {ms.meetingChat.map((msg, i) => (
                          <div key={i}>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: '#8ab4f8' }}>{msg.author}</span>
                              <span style={{ fontSize: 10, color: '#9aa0a6' }}>{new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#e8eaed' }}>{msg.text}</p>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: 10, borderTop: '1px solid #3c4043', display: 'flex', gap: 6 }}>
                        <input value={ms.meetingChatDraft} onChange={(e) => setMeetingState((s) => ({ ...s, meetingChatDraft: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendMeetingChat(); }}
                          placeholder="Send a message to everyone" style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid #5f6368', background: 'transparent', color: '#e8eaed', fontSize: 13, outline: 'none' }} />
                        <button onClick={sendMeetingChat} disabled={!ms.meetingChatDraft.trim()} style={{ background: ms.meetingChatDraft.trim() ? '#8ab4f8' : 'transparent', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ms.meetingChatDraft.trim() ? '#202124' : '#5f6368' }}><Send size={16} /></button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ─ Bottom control bar ─ */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', gap: 8, flexShrink: 0, position: 'relative' }}>
              {/* Left: meeting info */}
              <div style={{ position: 'absolute', left: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#9aa0a6', fontSize: 13, fontFamily: 'monospace' }}>{fmtElapsed(ms.elapsedSec)}</span>
                <span style={{ color: '#5f6368' }}>|</span>
                <code style={{ color: '#9aa0a6', fontSize: 12 }}>{activeMeeting.code}</code>
              </div>

              {/* Center controls */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {meetCtrl(ms.micOn ? <Mic size={20} /> : <MicOff size={20} />, ms.micOn ? 'Mute microphone' : 'Unmute microphone', ms.micOn, () => setMeetingState((s) => ({ ...s, micOn: !s.micOn })))}
                {meetCtrl(ms.camOn ? <Video size={20} /> : <VideoOff size={20} />, ms.camOn ? 'Turn off camera' : 'Turn on camera', ms.camOn, () => setMeetingState((s) => ({ ...s, camOn: !s.camOn })))}
                {meetCtrl(ms.screenShare ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />, ms.screenShare ? 'Stop sharing' : 'Share screen', !ms.screenShare, () => setMeetingState((s) => ({ ...s, screenShare: !s.screenShare })))}
                {meetCtrl(<Hand size={20} style={ms.handRaised ? { color: '#f6bf26' } : undefined} />, ms.handRaised ? 'Lower hand' : 'Raise hand', !ms.handRaised, () => setMeetingState((s) => ({ ...s, handRaised: !s.handRaised })))}

                {/* Reactions */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => {}} style={{
                    width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'rgba(255,255,255,.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }} title="Reactions"><Smile size={20} /></button>
                  <div className="meet-reactions" style={{
                    position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8,
                    display: 'flex', gap: 4, background: '#3c4043', borderRadius: 24, padding: '4px 8px', whiteSpace: 'nowrap',
                  }}>
                    {['👍', '❤️', '😂', '🎉', '👏', '🤔'].map((e) => (
                      <button key={e} onClick={() => sendMeetingReaction(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: '4px', borderRadius: 8 }}>{e}</button>
                    ))}
                  </div>
                </div>

                {/* More options */}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => {}} style={{
                    width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: 'rgba(255,255,255,.12)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }} title="More options"><MoreVertical size={20} /></button>
                  <div style={{
                    position: 'absolute', bottom: '100%', right: 0, marginBottom: 8, width: 240,
                    background: '#2d2e31', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.4)', overflow: 'hidden',
                  }}>
                    {[
                      { icon: <Disc size={16} />, label: ms.recording ? 'Stop recording' : 'Start recording', active: ms.recording, action: () => setMeetingState((s) => ({ ...s, recording: !s.recording })) },
                      { icon: <Captions size={16} />, label: ms.showCaptions ? 'Turn off captions' : 'Turn on captions', active: ms.showCaptions, action: () => setMeetingState((s) => ({ ...s, showCaptions: !s.showCaptions })) },
                      { icon: ms.noiseCancel ? <Volume2 size={16} /> : <VolumeX size={16} />, label: ms.noiseCancel ? 'Noise cancellation: On' : 'Noise cancellation: Off', active: ms.noiseCancel, action: () => setMeetingState((s) => ({ ...s, noiseCancel: !s.noiseCancel })) },
                      { icon: ms.layout === 'gallery' ? <Grid3X3 size={16} /> : ms.layout === 'spotlight' ? <Maximize2 size={16} /> : <Layout size={16} />, label: `Layout: ${ms.layout}`, active: false, action: () => setMeetingState((s) => ({ ...s, layout: s.layout === 'gallery' ? 'spotlight' : s.layout === 'spotlight' ? 'sidebar' : 'gallery' })) },
                      { icon: <Shield size={16} />, label: 'Security', active: false, action: () => {} },
                      { icon: <Settings size={16} />, label: 'Settings', active: false, action: () => {} },
                    ].map((opt) => (
                      <button key={opt.label} onClick={opt.action} style={{
                        display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px',
                        border: 'none', background: 'transparent', color: opt.active ? '#8ab4f8' : '#e8eaed',
                        cursor: 'pointer', fontSize: 13, textAlign: 'left',
                      }}>{opt.icon} {opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* Separator */}
                <div style={{ width: 1, height: 32, background: '#5f6368', margin: '0 4px' }} />

                {/* End call */}
                {meetCtrl(<PhoneOff size={20} />, 'Leave call', false, () => endMeeting(activeMeeting.id), true)}
              </div>

              {/* Right: side panel toggles */}
              <div style={{ position: 'absolute', right: 16, display: 'flex', gap: 4 }}>
                <button onClick={() => setMeetingState((s) => ({ ...s, showChat: !s.showChat, showParticipants: false }))} title="Chat" style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: ms.showChat ? 'rgba(138,180,248,.2)' : 'transparent', color: ms.showChat ? '#8ab4f8' : '#e8eaed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <MessageCircle size={18} />
                  {ms.meetingChat.length > 0 && (
                    <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: '#8ab4f8' }} />
                  )}
                </button>
                <button onClick={() => setMeetingState((s) => ({ ...s, showParticipants: !s.showParticipants, showChat: false }))} title="People" style={{
                  width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: ms.showParticipants ? 'rgba(138,180,248,.2)' : 'transparent', color: ms.showParticipants ? '#8ab4f8' : '#e8eaed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><Users size={18} /></button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Calendar */}
      {calendar !== null && (
        <ConnectCalendar
          events={calendar}
          directory={ws?.directory ?? []}
          onCreate={async (ev) => { await addEvent({ title: ev.title, date: ev.date, time: ev.time, durationMins: ev.durationMins, withMeet: ev.withMeet, attendeeIds: ev.attendeeIds, description: ev.description, location: ev.location, color: ev.color, allDay: ev.allDay, recurrence: ev.recurrence }); }}
          onDelete={async (id) => { try { await api.deleteEvent(id); setCalendar(await api.events()); } catch {} }}
          onJoin={(ev) => { if (ev.meetingCode) setActiveMeeting({ id: ev.id, title: ev.title, code: ev.meetingCode, channelId: null, active: true, startedAt: new Date().toISOString() }); }}
          onClose={() => setCalendar(null)}
        />
      )}

      {/* People picker */}
      {people && (
        <Modal onClose={() => setPeople(null)} width={480}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{people.mode === 'dm' ? 'New message' : 'New group'}</h2>
              <button onClick={() => setPeople(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input autoFocus value={people.search} onChange={(e) => setPeople({ ...people, search: e.target.value })} placeholder="Search people..." style={{ width: '100%', padding: '9px 10px 9px 32px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13 }} />
            </div>
            {people.mode === 'group' && people.selected.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {people.selected.map((id) => {
                  const m = memberById(id);
                  return (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 4px', borderRadius: 16, background: 'var(--color-primary-light)', border: '1px solid var(--color-primary)', fontSize: 12, color: 'var(--color-primary)' }}>
                      <Avatar member={m} size={18} /> {m.name}
                      <button onClick={() => setPeople({ ...people, selected: people.selected.filter((x) => x !== id) })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 0 }}><X size={12} /></button>
                    </span>
                  );
                })}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 340, overflowY: 'auto' }}>
              {directory.filter((d) => d.id !== me.id).filter((d) => !people.search || d.name.toLowerCase().includes(people.search.toLowerCase()) || d.email.toLowerCase().includes(people.search.toLowerCase())).map((d) => {
                const checked = people.selected.includes(d.id);
                return (
                  <button key={d.id} onClick={() => people.mode === 'dm' ? startDM(d.id) : setPeople({ ...people, selected: checked ? people.selected.filter((x) => x !== d.id) : [...people.selected, d.id] })}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', background: checked ? 'var(--color-primary-light)' : 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                    {people.mode === 'group' && (checked ? <CheckSquare size={16} style={{ color: 'var(--color-primary)' }} /> : <Square size={16} style={{ color: 'var(--color-text-tertiary)' }} />)}
                    <Avatar member={d} size={32} showPresence />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{d.email}</div>
                    </div>
                    <PresenceDot presence={d.presence} size={8} border="transparent" />
                  </button>
                );
              })}
              {directory.filter((d) => d.id !== me.id).length === 0 && <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, textAlign: 'center', padding: 20 }}>No other people in this workspace yet.</p>}
            </div>
            {people.mode === 'group' && <button onClick={createGroup} disabled={people.selected.length === 0} style={tbtn({ background: 'var(--color-primary)', color: '#fff', border: 'none', justifyContent: 'center', opacity: people.selected.length ? 1 : 0.6, width: '100%' })}>Create group ({people.selected.length})</button>}
          </div>
        </Modal>
      )}

      {/* Quick switcher / global search */}
      {switcher !== null && (
        <Modal onClose={() => setSwitcher(null)} width={580}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
              <input autoFocus value={switcher} onChange={(e) => setSwitcher(e.target.value)} placeholder="Search conversations, channels, people..." style={{ width: '100%', padding: '13px 14px 13px 42px', borderRadius: 10, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 15 }} />
              <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
                <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: 10, color: 'var(--color-text-tertiary)' }}>ESC</kbd>
              </div>
            </div>
            {!switcher && (
              <div style={{ padding: '8px 4px', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                <span style={{ fontWeight: 600 }}>Tip:</span> Use Ctrl+K anytime to open this search
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 400, overflowY: 'auto' }}>
              {switcherResults.length > 0 && (
                <>
                  {switcherResults.filter((r) => r.type === 'conv').length > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', padding: '6px 10px', textTransform: 'uppercase' }}>Conversations</div>
                  )}
                  {switcherResults.filter((r) => r.type === 'conv').map((r) => r.type === 'conv' && (
                    <button key={`c-${r.c.id}`} onClick={() => { switchConv(r.c.id); setSwitcher(null); }} style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text)', width: '100%' }}>
                      {r.c.kind === 'CHANNEL' ? <Hash size={16} style={{ color: 'var(--color-text-secondary)' }} /> : r.c.kind === 'GROUP' ? <Users size={16} style={{ color: 'var(--color-text-secondary)' }} /> : <MessageSquare size={16} style={{ color: 'var(--color-text-secondary)' }} />}
                      <span style={{ fontSize: 14 }}>{r.c.name}</span>
                      {r.c.topic && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.c.topic}</span>}
                      {(r.c.unreadCount ?? 0) > 0 && <Unread n={r.c.unreadCount ?? 0} />}
                    </button>
                  ))}
                  {switcherResults.filter((r) => r.type === 'person').length > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', padding: '6px 10px', textTransform: 'uppercase' }}>People</div>
                  )}
                  {switcherResults.filter((r) => r.type === 'person').map((r) => r.type === 'person' && (
                    <button key={`p-${r.d.id}`} onClick={() => { setSwitcher(null); startDM(r.d.id); }} style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text)', width: '100%' }}>
                      <Avatar member={r.d} size={28} showPresence /> <span style={{ fontSize: 14 }}>{r.d.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{r.d.email}</span>
                    </button>
                  ))}
                </>
              )}
              {switcherMessages.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', padding: '6px 10px', textTransform: 'uppercase' }}>Messages</div>
                  {switcherMessages.map((r) => (
                    <button key={`m-${r.messageId}`} onClick={() => { setSwitcher(null); jumpToMessage(r.channelId, r.messageId); }} style={{ textAlign: 'left', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10, color: 'var(--color-text)', width: '100%' }}>
                      <MessageSquare size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, display: 'flex', gap: 6 }}>
                          <span>{r.channelName} › {r.authorName}</span>
                          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDateSmart(r.ts)}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{highlightSnippet(r.snippet, switcher)}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {switcher && switcherResults.length === 0 && switcherMessages.length === 0 && <p style={{ color: 'var(--color-text-tertiary)', fontSize: 14, textAlign: 'center', padding: 20 }}>No results found</p>}
            </div>
          </div>
        </Modal>
      )}

      {/* Profile card */}
      {profileCard && (
        <Modal onClose={() => setProfileCard(null)} width={360}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setProfileCard(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Avatar member={profileCard} size={72} showPresence />
              <h3 style={{ margin: '12px 0 2px', fontSize: 18, fontWeight: 700 }}>{profileCard.name}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>{profileCard.email}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8 }}>
                <PresenceDot presence={profileCard.presence} size={8} border="transparent" />
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{PRESENCE_META[profileCard.presence].label}</span>
              </div>
              {profileCard.statusText && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-tertiary)' }}>{profileCard.statusText}</p>}
              {(profileCard.designation || profileCard.department) && (
                <p style={{ margin: '8px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                  {profileCard.designation || 'Staff'} {profileCard.department ? `(${profileCard.department})` : ''}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setProfileCard(null); startDM(profileCard.id); }} style={{ flex: 1, ...tbtn({ justifyContent: 'center' }) }}><MessageSquare size={15} /> Message</button>
              <button style={{ flex: 1, ...tbtn({ justifyContent: 'center', background: 'var(--color-primary)', color: '#fff', border: 'none' }) }}><Video size={15} /> Call</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Directory Modal (US-D1) */}
      {directoryModalOpen && (() => {
        const filteredDir = directory.filter((d) => {
          const q = dirSearchQuery.trim().toLowerCase();
          if (!q) return true;
          return d.name.toLowerCase().includes(q) ||
                 d.email.toLowerCase().includes(q) ||
                 (d.designation && d.designation.toLowerCase().includes(q)) ||
                 (d.department && d.department.toLowerCase().includes(q));
        });
        return (
          <Modal onClose={() => setDirectoryModalOpen(false)} width={500}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Workspace Directory</h3>
                <button onClick={() => setDirectoryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
              </div>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                <input
                  value={dirSearchQuery}
                  onChange={(e) => setDirSearchQuery(e.target.value)}
                  placeholder="Search by name, department, or designation/title..."
                  style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13 }}
                />
              </div>
              <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filteredDir.length === 0 ? (
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, textAlign: 'center', padding: 20 }}>No matches found</p>
                ) : (
                  filteredDir.map((d) => (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                      <Avatar member={d} size={36} showPresence />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                          <span>{d.email}</span>
                          {(d.designation || d.department) && <span>•</span>}
                          {d.designation && <span style={{ fontWeight: 600 }}>{d.designation}</span>}
                          {d.department && <span>({d.department})</span>}
                        </div>
                      </div>
                      {d.id !== me.id && (
                        <button
                          onClick={() => {
                            setDirectoryModalOpen(false);
                            startDM(d.id);
                          }}
                          style={{
                            background: 'var(--color-primary-light)',
                            color: 'var(--color-primary)',
                            border: 'none',
                            borderRadius: 6,
                            padding: '4px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <MessageSquare size={13} /> Message
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* Keyboard shortcuts */}
      {showKeyboardShortcuts && (
        <Modal onClose={() => setShowKeyboardShortcuts(false)} width={420}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Keyboard shortcuts</h2>
              <button onClick={() => setShowKeyboardShortcuts(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={18} /></button>
            </div>
            {SHORTCUTS.map((s) => (
              <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{s.label}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <kbd style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{s.mod}</kbd>
                  <kbd style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{s.key}</kbd>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ═══ Manage channel drawer (spec §2) ═══ */}
      <Drawer open={manageChannelOpen} onClose={() => setManageChannelOpen(false)} title={activeConv ? `Manage #${activeConv.name}` : 'Manage channel'} width={440}>
        <ProtectedComponent permission="communication.channel.manage" fallback={<p style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>You don&apos;t have permission to manage this channel.</p>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Tabs tabs={[{ key: 'general', label: 'General' }, { key: 'members', label: `Members (${manageMembers?.length ?? 0})` }]} value={manageTab} onChange={(k) => setManageTab(k as 'general' | 'members')} />

            {manageTab === 'general' && activeConv && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <FormField label="Channel name">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Hash size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                    <Input value={manageName} onChange={(e) => setManageName(e.target.value)} onBlur={saveChannelName} />
                  </div>
                </FormField>
                <FormField label="Topic" hint="Optional">
                  <Input value={manageTopic} onChange={(e) => setManageTopic(e.target.value)} onBlur={saveChannelTopic} placeholder="What's this channel about?" />
                </FormField>
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>Danger zone</div>
                  <Button variant="danger" onClick={() => setArchiveConfirm(true)} style={{ width: '100%', justifyContent: 'center' }}>
                    <Archive size={14} /> Archive this channel
                  </Button>
                </div>
              </div>
            )}

            {manageTab === 'members' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ProtectedComponent permission="communication.channel.member.manage">
                  <div style={{ position: 'relative' }}>
                    <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Add people…" aria-label="Add people to channel" />
                    {memberSearch.trim() && (() => {
                      const existingIds = new Set(manageMembers?.map((m) => m.userId) ?? []);
                      const results = directory.filter((d) => !existingIds.has(d.id) && d.name.toLowerCase().includes(memberSearch.trim().toLowerCase()));
                      return (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.12)', maxHeight: 220, overflowY: 'auto', zIndex: 10 }}>
                          {results.length === 0 && (
                            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)' }}>No matching people</div>
                          )}
                          {results.map((d) => (
                            <button key={d.id} onClick={() => addMemberToChannel(d.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                              <Avatar member={d} size={24} /> <span style={{ fontSize: 13 }}>{d.name}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </ProtectedComponent>

                {manageMembers === null ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Skeleton width={28} height={28} radius="var(--radius-lg)" />
                        <Skeleton width={120} height={12} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {manageMembers.map((mem) => {
                      const person = memberById(mem.userId);
                      const soleOwner = mem.role === 'OWNER' && manageMembers.filter((x) => x.role === 'OWNER').length <= 1;
                      return (
                        <div key={mem.userId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                          <Avatar member={person} size={28} showPresence />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{person.name} {person.id === me.id && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>(you)</span>}</div>
                          </div>
                          {mem.role === 'OWNER' && <Badge variant="primary" size="sm">Owner</Badge>}
                          {mem.role === 'ADMIN' && <Badge variant="default" size="sm">Admin</Badge>}
                          <ProtectedComponent permission="communication.channel.member.manage">
                            {!soleOwner && (
                              <button onClick={() => setRemoveConfirm(person)} aria-label={`Remove ${person.name} from channel`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4 }}>
                                <X size={15} />
                              </button>
                            )}
                          </ProtectedComponent>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </ProtectedComponent>
      </Drawer>

      <ConfirmDialog
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        onConfirm={archiveChannel}
        title={`Archive #${activeConv?.name ?? ''}?`}
        message="Members will no longer see this channel in their sidebar. Message history is kept and remains searchable. This can be undone by an owner later."
        confirmLabel="Archive channel"
        variant="danger"
      />

      <ConfirmDialog
        open={!!removeConfirm}
        onClose={() => setRemoveConfirm(null)}
        onConfirm={() => removeConfirm && removeMemberFromChannel(removeConfirm.id)}
        title={`Remove ${removeConfirm?.name ?? ''} from #${activeConv?.name ?? ''}?`}
        confirmLabel="Remove"
        variant="primary"
      />

      {/* ═══ Browse channels modal (spec §3) ═══ */}
      <UiModal open={browseOpen} onClose={() => setBrowseOpen(false)} title="Browse channels" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input value={browseSearch} onChange={(e) => setBrowseSearch(e.target.value)} placeholder="Search channels by name or topic…" aria-label="Search public channels" />
          {browseList === null && !browseErr && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Skeleton width={28} height={28} radius="var(--radius-md)" />
                  <Skeleton width={200} height={14} />
                </div>
              ))}
            </div>
          )}
          {browseErr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, color: 'var(--color-danger)', fontSize: 13 }}>
              <AlertCircle size={16} /> {browseErr}
              <button onClick={openBrowseChannels} style={{ marginLeft: 'auto', background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Retry</button>
            </div>
          )}
          {browseList && (() => {
            const filtered = browseList.filter((c) => !browseSearch.trim()
              || c.name.toLowerCase().includes(browseSearch.trim().toLowerCase())
              || (c.topic ?? '').toLowerCase().includes(browseSearch.trim().toLowerCase()));
            if (filtered.length === 0) {
              return (
                <EmptyState
                  icon={<Hash size={40} />}
                  title={browseSearch.trim() ? 'No channels match your search' : 'No channels to join'}
                  description="You're already in every public channel, or none exist yet."
                  action={<Button variant="secondary" onClick={() => { setBrowseOpen(false); newChannel(); }}>Create a channel instead</Button>}
                />
              );
            }
            return (
              <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {filtered.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <Hash size={18} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                      {c.topic && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.topic}</div>}
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{c.memberCount} member{c.memberCount === 1 ? '' : 's'} · Public</div>
                    </div>
                    <Button variant="secondary" size="sm" disabled={joiningId === c.id} onClick={() => joinBrowsedChannel(c)}>
                      {joiningId === c.id ? <Spinner size="sm" /> : 'Join'}
                    </Button>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </UiModal>

      {/* ═══ Forward message dialog (spec §7a) ═══ */}
      <UiModal
        open={!!forwardMsg}
        onClose={() => setForwardMsg(null)}
        title="Forward message"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setForwardMsg(null)}>Cancel</Button>
            <Button variant="primary" disabled={!forwardTarget || forwarding} onClick={sendForward}>
              {forwarding ? <Spinner size="sm" /> : 'Forward'}
            </Button>
          </>
        }
      >
        {forwardMsg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 10, background: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Avatar member={memberById(forwardMsg.authorId)} size={24} />
                <strong style={{ fontSize: 13 }}>{memberById(forwardMsg.authorId).name}</strong>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{formatDateSmart(forwardMsg.ts)}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{forwardMsg.content}</div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-border)' }} />
            <Input value={forwardSearch} onChange={(e) => setForwardSearch(e.target.value)} placeholder="Search conversations or people…" aria-label="Search conversations or people" />
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {allConvs.filter((c) => !forwardSearch.trim() || c.name.toLowerCase().includes(forwardSearch.trim().toLowerCase())).map((c) => (
                <button key={c.id} onClick={() => setForwardTarget(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', background: forwardTarget === c.id ? 'var(--color-primary-light)' : 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
                  {c.kind === 'CHANNEL' ? <Hash size={16} /> : c.kind === 'GROUP' ? <Users size={16} /> : <MessageSquare size={16} />}
                  <span style={{ fontSize: 13 }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </UiModal>
    </div>
  );
}

/* ═══ Sub-components ═══ */

function ThreadMsg({ m, author }: { m: ConnectMessage; author: Member }) {
  return (
    <div style={{ display: 'flex', gap: 10, padding: '6px 0' }}>
      <Avatar member={author} size={28} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{author.name}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{formatDateSmart(m.ts)}</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.deleted ? <em style={{ color: 'var(--color-text-tertiary)' }}>message deleted</em> : renderContent(m.content)}</div>
        {!m.deleted && m.attachments.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
            {m.attachments.map((a) => (
              <a key={a.id} href={a.url ?? '#'} download={a.name} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: 11, textDecoration: 'none', color: 'var(--color-text)' }}>
                <Paperclip size={11} /> {a.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface RowProps {
  m: ConnectMessage; author: Member; me: string; replyCount: number; compact: boolean;
  emojiOpen: boolean; onEmojiToggle: () => void; onReact: (e: string) => void;
  onOpenThread: () => void; onEdit: () => void; onDelete: () => void; onPin: () => void;
  editing: boolean; editText: string; setEditText: (s: string) => void; onSaveEdit: () => void; onCancelEdit: () => void;
  onJoinMeeting: () => void;
  isBookmarked: boolean; onToggleBookmark: () => void;
  onProfileClick: (m: Member) => void; memberById: (id: string) => Member;
  onForward: () => void; flashing: boolean;
  isSmallGroup: boolean;
}

function AttachmentImage({ url, name }: { url: string; name: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div style={{ position: 'relative', minHeight: loaded ? undefined : 120, minWidth: loaded ? undefined : 160 }}>
      {!loaded && <Skeleton width={160} height={120} radius="8px" />}
      <img src={url} alt={name} onLoad={() => setLoaded(true)} style={{ maxWidth: '100%', maxHeight: 200, display: loaded ? 'block' : 'none' }} />
    </div>
  );
}

function MessageRow(p: RowProps) {
  const { m, author, isSmallGroup } = p;
  const [hover, setHover] = useState(false);
  const forwardedInfo = m.deleted ? null : parseForwarded(m.content);

  if (m.kind === 'SYSTEM') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', margin: '4px 0', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, fontSize: 13 }}>
        <Video size={16} style={{ color: 'var(--color-primary)' }} />
        <span style={{ color: 'var(--color-text-secondary)', flex: 1 }}><strong style={{ color: 'var(--color-text)' }}>{author.name}</strong> {m.content}</span>
        {m.meetingId && <button onClick={p.onJoinMeeting} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '4px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Join</button>}
      </div>
    );
  }

  return (
    <div id={`msg-${m.id}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', gap: p.compact ? 0 : 10, padding: p.compact ? '1px 8px 1px 54px' : '6px 8px', borderRadius: 8, position: 'relative', background: p.flashing ? 'var(--color-primary-light)' : hover ? 'var(--color-bg-hover)' : 'transparent', transition: p.flashing ? 'background 1.2s ease-out' : 'background .1s' }}>
      {!p.compact && <Avatar member={author} size={36} showPresence onClick={() => p.onProfileClick(author)} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        {!p.compact && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => p.onProfileClick(author)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>{author.name}</button>
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{formatDateSmart(m.ts)}</span>
            {m.editedTs && !m.deleted && <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>(edited)</span>}
            {m.pinned && <Pin size={11} style={{ color: 'var(--color-warning)' }} />}
            {p.isBookmarked && <Bookmark size={11} style={{ color: 'var(--color-primary)', fill: 'var(--color-primary)' }} />}
          </div>
        )}

        {m.deleted ? (
          <em style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>This message was deleted</em>
        ) : p.editing ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input value={p.editText} onChange={(e) => p.setEditText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') p.onSaveEdit(); if (e.key === 'Escape') p.onCancelEdit(); }} autoFocus style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '2px solid var(--color-primary)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 13 }} />
            <button onClick={p.onSaveEdit} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 6, padding: '0 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Save</button>
            <button onClick={p.onCancelEdit} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-secondary)' }}>Cancel</button>
          </div>
        ) : forwardedInfo ? (
          <div>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)', background: 'var(--color-bg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 6 }}>
                <Forward size={12} /> Forwarded from {forwardedInfo.sourceLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                <strong style={{ fontSize: 13 }}>{forwardedInfo.originAuthor}</strong>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{formatDateSmart(forwardedInfo.originTs)}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{renderContent(forwardedInfo.body)}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>{renderContent(m.content)}</div>
        )}

        {/* Inline image previews */}
        {!m.deleted && m.attachments.filter((a) => isImageMime(a.mime) && a.url).length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {m.attachments.filter((a) => isImageMime(a.mime) && a.url).map((a) => (
              <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', maxWidth: 300 }}>
                <AttachmentImage url={a.url!} name={a.name} />
              </a>
            ))}
          </div>
        )}

        {/* File attachments */}
        {!m.deleted && m.attachments.filter((a) => !isImageMime(a.mime)).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {m.attachments.filter((a) => !isImageMime(a.mime)).map((a) => (
              <a key={a.id} href={a.url ?? '#'} download={a.name} onClick={(e) => { if (!a.url) e.preventDefault(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: 12, textDecoration: 'none', color: 'var(--color-text)', maxWidth: 280, opacity: a.url ? 1 : 0.6 }}>
                {a.url ? <FileText size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} /> : <Spinner size="sm" />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{formatBytes(a.size)}</div>
                </div>
                {a.url && <Download size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />}
              </a>
            ))}
          </div>
        )}

        {/* Reactions & reply count */}
        {!m.deleted && (m.reactions.length > 0 || p.replyCount > 0) && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {m.reactions.map((r) => {
              const mine = r.userIds.includes(p.me);
              return (
                <button key={r.emoji} onClick={() => p.onReact(r.emoji)} title={r.userIds.map((id) => p.memberById(id).name).join(', ')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 999, cursor: 'pointer', fontSize: 12, border: '1px solid', borderColor: mine ? 'var(--color-primary)' : 'var(--color-border)', background: mine ? 'var(--color-primary-light)' : 'var(--color-bg)', color: 'var(--color-text)', transition: 'all .15s' }}>
                  <span>{r.emoji}</span><span style={{ fontWeight: 600 }}>{r.userIds.length}</span>
                </button>
              );
            })}
            {p.replyCount > 0 && (
              <button onClick={p.onOpenThread} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-primary)', fontWeight: 600 }}>
                <Reply size={12} /> {p.replyCount} repl{p.replyCount === 1 ? 'y' : 'ies'}
              </button>
            )}
          </div>
        )}

        {/* Link previews (US-C2) */}
        {!m.deleted && extractUrls(m.content).map((url, idx) => (
          <LinkPreview key={idx} url={url} />
        ))}

        {/* Read receipts seen by indicators (US-B4) */}
        {!m.deleted && isSmallGroup && m.authorId === p.me && (
          <div style={{ marginTop: 2 }}>
            <SeenReceipts messageId={m.id} memberById={p.memberById} />
          </div>
        )}
      </div>

      {/* Hover actions */}
      {(hover || p.emojiOpen) && !m.deleted && !p.editing && (
        <div style={{ position: 'absolute', top: -6, right: 8, display: 'flex', gap: 1, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 2, boxShadow: '0 2px 8px rgba(0,0,0,.1)', zIndex: 10 }}>
          <IconBtn title="React" onClick={p.onEmojiToggle}><Smile size={15} /></IconBtn>
          <IconBtn title="Reply" onClick={p.onOpenThread}><Reply size={15} /></IconBtn>
          <IconBtn title="Forward" onClick={p.onForward}><Forward size={15} /></IconBtn>
          <IconBtn title={m.pinned ? 'Unpin' : 'Pin'} onClick={p.onPin}><Pin size={15} /></IconBtn>
          <IconBtn title={p.isBookmarked ? 'Remove bookmark' : 'Bookmark'} onClick={p.onToggleBookmark}>{p.isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</IconBtn>
          {m.authorId === p.me && <IconBtn title="Edit" onClick={p.onEdit}><Pencil size={15} /></IconBtn>}
          {m.authorId === p.me && <IconBtn title="Delete" onClick={p.onDelete}><Trash2 size={15} /></IconBtn>}
          {p.emojiOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 20 }}>
              <EmojiPicker onPick={p.onReact} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return <button onClick={onClick} title={title} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 5, borderRadius: 6, display: 'flex' }}>{children}</button>;
}

/** Staged-attachment chip (spec §1) — 2-line card while uploading, single-line pill when done,
 *  red-bordered card with a reason on error. */
function StagedChip({ a, onRemove }: { a: StagedAttachment; onRemove: () => void }) {
  if (a.status === 'uploading') {
    return (
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 168, padding: '6px 10px', borderRadius: 8, background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isImageMime(a.mime) ? <Image size={14} style={{ color: 'var(--color-primary)' }} /> : <FileText size={14} style={{ color: 'var(--color-text-secondary)' }} />}
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
          <button disabled aria-label={`Remove ${a.name}`} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', padding: 0, cursor: 'default', opacity: 0.4 }}><X size={13} /></button>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            role="progressbar" aria-valuenow={a.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${a.name}`}
            style={{ flex: 1, height: 3, borderRadius: 999, background: 'var(--color-border)', overflow: 'hidden' }}
          >
            <span style={{ display: 'block', height: '100%', width: `${a.progress}%`, background: 'var(--color-primary)', transition: 'width var(--duration-fast) var(--ease-default)' }} />
          </span>
          <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}>{a.progress}%</span>
        </span>
      </span>
    );
  }
  if (a.status === 'error') {
    return (
      <span aria-label={`${a.name}: ${a.errorMessage}`} style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 168, padding: '6px 10px', borderRadius: 8, background: 'var(--color-bg)', border: '1px solid var(--color-danger)', fontSize: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertCircle size={14} style={{ color: 'var(--color-danger)' }} />
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
          <button onClick={onRemove} aria-label={`Remove ${a.name}`} style={{ background: 'none', border: 'none', color: 'var(--color-text-tertiary)', padding: 0, cursor: 'pointer' }}><X size={13} /></button>
        </span>
        <span style={{ color: 'var(--color-danger)', fontSize: 11 }}>{a.errorMessage}</span>
      </span>
    );
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: 12, animation: 'toastSlideIn var(--duration-fast) var(--ease-out)' }}>
      {isImageMime(a.mime) ? <Image size={14} style={{ color: 'var(--color-primary)' }} /> : <FileText size={14} style={{ color: 'var(--color-text-secondary)' }} />}
      <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
      <span style={{ color: 'var(--color-text-tertiary)' }}>{formatBytes(a.size)}</span>
      <button onClick={onRemove} aria-label={`Remove ${a.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 0 }}><X size={14} /></button>
    </span>
  );
}

const RECENT_EMOJI_KEY = 'connect:recentEmoji';

/** Shared emoji picker (spec §7c) — consolidates the 3 duplicated inline EMOJI_PALETTE grids into
 *  one component: search + category tabs + a localStorage-backed "Recent" category. */
function EmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('recent');
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try { setRecent(JSON.parse(window.localStorage.getItem(RECENT_EMOJI_KEY) || '[]')); } catch { setRecent([]); }
  }, []);

  const pick = (emoji: string) => {
    try {
      const next = [emoji, ...recent.filter((e) => e !== emoji)].slice(0, 24);
      window.localStorage.setItem(RECENT_EMOJI_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
    onPick(emoji);
  };

  const results = query.trim()
    ? ALL_EMOJIS.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    : category === 'recent'
      ? recent.map((emoji) => ALL_EMOJIS.find((e) => e.emoji === emoji) ?? { emoji, name: 'recently used' })
      : (EMOJI_CATEGORIES.find((c) => c.key === category)?.emojis ?? []);

  return (
    <div style={{ width: 260, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,.1)', overflow: 'hidden' }}>
      <div style={{ padding: 8, borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search emoji…" aria-label="Search emoji"
            style={{ width: '100%', padding: '6px 8px 6px 26px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 12 }} />
        </div>
      </div>
      {!query.trim() && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '4px 6px', gap: 2, overflowX: 'auto' }}>
          {[{ key: 'recent', icon: '🕐', label: 'Recently used' }, ...EMOJI_CATEGORIES.map((c) => ({ key: c.key, icon: c.icon, label: c.label }))].map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)} aria-label={`${c.label} category`} title={c.label}
              style={{ background: category === c.key ? 'var(--color-primary-light)' : 'none', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16, padding: '4px 6px' }}>
              {c.icon}
            </button>
          ))}
        </div>
      )}
      <div style={{ maxHeight: 220, overflowY: 'auto', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2 }}>
        {results.length === 0 && <span style={{ gridColumn: 'span 6', textAlign: 'center', fontSize: 12, color: 'var(--color-text-tertiary)', padding: '12px 0' }}>
          {category === 'recent' && !query.trim() ? 'No recently used emoji yet' : 'No emoji found'}
        </span>}
        {results.map((e) => (
          <button key={e.emoji} onClick={() => pick(e.emoji)} aria-label={e.name} title={e.name}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, borderRadius: 6 }}>{e.emoji}</button>
        ))}
      </div>
    </div>
  );
}

function Modal({ children, onClose, width = 480 }: { children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, width: `min(${width}px, 100%)`, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,.2)' }}>
        {children}
      </div>
    </div>
  );
}

/* ── Additional helper utilities & components (US-B4 / US-C2) ── */

function extractUrls(text: string): string[] {
  const regex = /https?:\/\/[^\s$.?#].[^\s]*/gi;
  const matches = text.match(regex);
  return matches ? Array.from(new Set(matches)) : [];
}

function LinkPreview({ url }: { url: string }) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.getLinkPreview(url)
      .then((res) => {
        if (active) {
          setPreview(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [url]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', border: '1px solid var(--color-border)', borderRadius: 8, marginTop: 6, background: 'var(--color-bg)', maxWidth: 420 }}>
        <Spinner size="sm" />
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>Fetching preview…</span>
      </div>
    );
  }

  if (!preview || (!preview.title && !preview.description)) {
    return null;
  }

  return (
    <a href={preview.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden', marginTop: 6, background: 'var(--color-bg)', textDecoration: 'none', color: 'inherit', maxWidth: 480, transition: 'border-color .15s' }}>
      {preview.image && (
        <div style={{ width: 100, minWidth: 100, height: 100, position: 'relative', borderRight: '1px solid var(--color-border)' }}>
          <img src={preview.image} alt={preview.title || 'Preview'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0, flex: 1 }}>
        {preview.siteName && <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-primary)', fontWeight: 700, marginBottom: 2 }}>{preview.siteName}</div>}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{preview.title}</div>
        {preview.description && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 2, lineHeight: '14px' }}>{preview.description}</div>}
        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>{preview.url}</div>
      </div>
    </a>
  );
}

function SeenReceipts({ messageId, memberById }: { messageId: string; memberById: (id: string) => Member }) {
  const [seenList, setSeenList] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const fetchSeen = async () => {
    if (seenList !== null) return;
    setLoading(true);
    try {
      const res = await api.getReadReceipts(messageId);
      setSeenList(res);
    } catch {
      setSeenList([]);
    } finally {
      setLoading(false);
    }
  };

  const initials = (nameStr: string) => {
    return nameStr.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <div
      onMouseEnter={() => { setShowTooltip(true); fetchSeen(); }}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4, position: 'relative', cursor: 'pointer', userSelect: 'none' }}
    >
      <Eye size={12} style={{ color: 'var(--color-text-tertiary)' }} />
      {seenList && seenList.length > 0 ? (
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          Seen by {seenList.length}
        </span>
      ) : (
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
          {loading ? '...' : 'Sent'}
        </span>
      )}

      {showTooltip && seenList && seenList.length > 0 && (
        <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, padding: '8px 10px', background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.15)', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6, width: 150 }}>
          <strong style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--color-text-tertiary)', letterSpacing: '0.5px' }}>Seen by</strong>
          {seenList.map((s) => (
            <div key={s.userId} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text)' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {initials(s.name)}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
