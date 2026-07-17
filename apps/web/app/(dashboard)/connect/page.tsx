'use client';
import styles from './page.module.css';
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
import { RouteGuard, useApiClient } from '@unerp/framework';
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
    <span title={meta.label} style={{ width: size, height: size, background: meta.color, border: `2px solid ${border}`, boxShadow: meta.ring ? `0 0 0 2px ${meta.color}55` : undefined }} className={styles.s1} />
  );
}

function Avatar({ member, size = 36, showPresence = false, onClick }: { member: Member; size?: number; showPresence?: boolean; onClick?: () => void }) {
  return (
    <span style={{ cursor: onClick ? 'pointer' : undefined }} className={styles.s2} onClick={onClick}>
      <span style={{ width: size, height: size, background: avatarColor(member.id || member.name), fontSize: size * 0.36 }} className={styles.s3}>{initials(member.name)}</span>
      {showPresence && (
        <span className={styles.s4}>
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
      ? <span key={i} className={styles.s5}>{p}</span>
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
      <mark className={styles.s6}>{snippet.slice(idx, idx + query.length)}</mark>
      {snippet.slice(idx + query.length)}
    </>
  );
}

const UNKNOWN: Member = { id: '?', name: 'Unknown', email: '', presence: 'INACTIVE' };

function Unread({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className={styles.s7}>
      {n > 99 ? '99+' : n}
    </span>
  );
}

function DateDivider({ ts }: { ts: number }) {
  return (
    <div className={styles.s8}>
      <div className={styles.s9} />
      <span className={styles.s10}>
        {formatDateDivider(ts)}
      </span>
      <div className={styles.s9} />
    </div>
  );
}

/* ── page ── */

export default function ConnectPage() {
  const client = useApiClient();
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
    // Socket.IO reuses the authenticated browser session managed by the API gateway.
    const socket = io(`${WS_BASE}/ws`, { withCredentials: true, transports: ['websocket', 'polling'] });
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
  }, [client, loadWorkspace]);

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
    <div className={styles.s11}>
      <button onClick={() => toggleSection(id)} className={styles.s12}>
        <ChevronRight size={12} style={{ transform: collapsedSections.has(id) ? 'rotate(0)' : 'rotate(90deg)' }} className={styles.s13} />
        <span className={styles.s14}>{label}</span>
      </button>
      {action && <button onClick={action} title={`New ${label.toLowerCase().replace(/s$/, '')}`} className={styles.s15}><Plus size={14} /></button>}
    </div>
  );

  if (loadErr) {
    return (
      <RouteGuard permission="communication.read">
      <div className={styles.s16}>
        <AlertCircle size={48} className="ui-text-danger" />
        <p className={styles.s17}>Couldn&apos;t load Connect: {loadErr}</p>
        <button onClick={loadWorkspace} style={tbtn({ background: 'var(--color-primary)', color: '#fff', border: 'none' })}><RefreshCw size={15} /> Retry</button>
      </div>
      </RouteGuard>
    );
  }
  if (!ws) {
    return <RouteGuard permission="communication.read"><div className={styles.s18}><RefreshCw className="animate-spin" size={26} /> Loading Connect...</div></RouteGuard>;
  }

  const spaceIds = new Set(ws.spaces.map((s) => s.id));
  const channelsBySpace = (spaceId: string) => filteredChannels((ws.channels ?? []).filter((c) => c.spaceId === spaceId));
  const ungroupedChannels = filteredChannels((ws.channels ?? []).filter((c) => !c.spaceId || !spaceIds.has(c.spaceId)));
  const headerMembers = (activeConv?.memberIds ?? []).map(memberById);
  const activeOnline = headerMembers.filter((m) => m.presence === 'ACTIVE' || m.presence === 'BRB').length;

  return (
    <RouteGuard permission="communication.read">
    <div className={styles.s19}>
      {/* ═══ Top bar ═══ */}
      <div className={styles.s20}>
        <div className={styles.s21}>
          <MessageSquare size={22} className="ui-text-primary" />
          <h1 className={styles.s22}>Connect</h1>
        </div>

        <div className={styles.s23}>
          {/* Status button */}
          <div className="relative">
            <button onClick={() => { setStatusDraft(me.statusText ?? ''); setStatusEmoji(''); setPresenceOpen((v) => !v); }} className={styles.s24}>
              <PresenceDot presence={me.presence} size={8} border="var(--color-bg)" />
              <span className={styles.s25}>
                {me.statusText || PRESENCE_META[me.presence].label}
              </span>
              <ChevronDown size={13} />
            </button>
            {presenceOpen && (
              <div className={styles.s26}>
                <div className={styles.s27}>
                  <div className={styles.s28}>Set a status</div>
                  <div className={styles.s29}>
                    <input value={statusEmoji} onChange={(e) => setStatusEmoji(e.target.value)} placeholder="😊" className={styles.s30} />
                    <input value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} placeholder="What's your status?" className={styles.s31} />
                  </div>
                  <div className={styles.s32}>
                    {STATUS_SUGGESTIONS.map((s) => (
                      <button key={s.text} onClick={() => { setStatusEmoji(s.emoji); setStatusDraft(s.text); }} className={styles.s33}>
                        {s.emoji} {s.text}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setMyPresence(me.presence, statusDraft); setPresenceOpen(false); }} className={styles.s34}>Save status</button>
                </div>
                <div className={styles.s35}>
                  <div className={styles.s36}>Presence</div>
                  {PRESENCE_ORDER.map((p) => (
                    <button key={p} onClick={() => { setMyPresence(p); setPresenceOpen(false); }} style={{ background: me.presence === p ? 'var(--color-primary-light)' : 'transparent', color: me.presence === p ? 'var(--color-primary)' : 'var(--color-text)' }} className={styles.s37}>
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
          <button onClick={() => setShowKeyboardShortcuts(true)} className={styles.s38} title="Keyboard shortcuts"><Command size={16} /></button>
        </div>
      </div>

      {/* ═══ Body ═══ */}
      <div className={styles.s39}>
        {/* ─── Left sidebar ─── */}
        <div className={styles.s40}>
          {/* Sidebar search */}
          <div className={styles.s41}>
            <div className="relative">
              <Search size={14} className={styles.s42} />
              <input value={sidebarSearch} onChange={(e) => setSidebarSearch(e.target.value)} placeholder="Filter conversations..." className={styles.s43} />
            </div>
          </div>

          <div className={styles.s44}>
            {/* Starred */}
            {starredList.length > 0 && (
              <div>
                {sectionHeader('starred', 'Starred')}
                {!collapsedSections.has('starred') && starredList.map((c) => (
                  <button key={c.id} onClick={() => switchConv(c.id)} style={pill(activeId === c.id)}>
                    <Star size={14} className={styles.s45} />
                    <span className={styles.s46}>{c.name}</span>
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
                    <span style={{ fontWeight: unreadOf(c) ? 700 : undefined, color: unreadOf(c) ? 'var(--color-text)' : undefined }} className={styles.s46}>{c.name}</span>
                    {mutedConvs.has(c.id) && <BellOff size={11} className="ui-text-tertiary" />}
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
                    <span style={{ fontWeight: unreadOf(c) ? 700 : undefined, color: unreadOf(c) ? 'var(--color-text)' : undefined }} className={styles.s46}>{c.name}</span>
                    {mutedConvs.has(c.id) && <BellOff size={11} className="ui-text-tertiary" />}
                    <Unread n={unreadOf(c)} />
                  </button>
                ))}
                <button onClick={openBrowseChannels} style={{ ...pill(false) }} className={styles.s47}><Search size={13} /> Browse channels</button>
              </div>
            )}

            {/* Direct messages */}
            <div>
              {sectionHeader('dms', 'Direct messages', () => setPeople({ mode: 'dm', selected: [], search: '' }))}
              {!collapsedSections.has('dms') && directs.map((c) => {
                const other = c.kind === 'DM' ? memberById((c.memberIds ?? []).find((i) => i !== me.id) ?? '') : undefined;
                const unread = unreadOf(c);
                return (
                  <button key={c.id} onClick={() => switchConv(c.id)} style={{ ...pill(activeId === c.id, mutedConvs.has(c.id)) }} className={styles.s48}>
                    {other ? <Avatar member={other} size={24} showPresence /> : <Users size={18} />}
                    <div className="flex-1 overflow-hidden">
                      <span style={{ fontWeight: unread ? 700 : undefined, color: unread ? 'var(--color-text)' : undefined }} className={styles.s49}>{c.name}</span>
                      {c.lastMessage && (
                        <span style={{ color: unread ? 'var(--color-text-secondary)' : 'var(--color-text-tertiary)' }} className={styles.s50}>
                          {c.lastMessage.system ? '📹 ' : ''}{c.lastMessage.content}
                        </span>
                      )}
                    </div>
                    <Unread n={unread} />
                  </button>
                );
              })}
              <button onClick={() => setPeople({ mode: 'group', selected: [], search: '' })} style={{ ...pill(false) }} className={styles.s47}><Plus size={13} /> New group</button>
            </div>
          </div>

          {/* Sidebar footer: online count */}
          {/* Sidebar footer: online count (US-D1) */}
          <button onClick={() => setDirectoryModalOpen(true)} className={styles.s51}>
            <span className={styles.s52} />
            <span className={styles.s53}>{onlineCount} online of {directory.length} members</span>
          </button>
        </div>

        {/* ─── Main conversation ─── */}
        <div className={styles.s54}
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>

          {/* Drag overlay */}
          {dragOver && (
            <div className={styles.s55}>
              <div className={styles.s56}>
                <Paperclip size={40} className={styles.s57} />
                <p className={styles.s58}>Drop files to upload</p>
              </div>
            </div>
          )}

          {!activeConv ? (
            <div className={styles.s59}>
              <MessageSquare size={48} className={styles.s60} />
              <p className={styles.s61}>Select a conversation to get started</p>
              <div className={styles.s62}>
                <button onClick={() => setPeople({ mode: 'dm', selected: [], search: '' })} style={tbtn()}><Plus size={14} /> New message</button>
                <button onClick={() => newChannel()} style={tbtn()}><Hash size={14} /> New channel</button>
              </div>
            </div>
          ) : (
            <>
              {/* ─ Channel header ─ */}
              <div className={styles.s63}>
                <div className="flex-1 overflow-hidden">
                  <div className={styles.s64}>
                    <h3 className={styles.s65}>
                      {activeConv.kind === 'CHANNEL' ? <Hash size={16} /> : activeConv.kind === 'GROUP' ? <Users size={16} /> : <MessageSquare size={16} />}
                      {activeConv.name}
                    </h3>
                    {activeConv.kind === 'CHANNEL' && <Globe size={13} className="ui-text-tertiary" />}
                    <button onClick={() => toggleStar(activeConv.id)} style={{ color: starredConvs.has(activeConv.id) ? '#f6bf26' : 'var(--color-text-tertiary)' }} className={styles.s66}>
                      <Star size={14} fill={starredConvs.has(activeConv.id) ? '#f6bf26' : 'none'} />
                    </button>
                  </div>
                  {activeConv.topic && <p className={styles.s67}>{activeConv.topic}</p>}
                </div>
                <div className="ui-flex ui-items-center ui-gap-1">
                  {/* Members stack */}
                  <button onClick={() => setChannelInfo(true)} className={styles.s68}>
                    <div className={styles.s69}>
                      {headerMembers.slice(0, 3).map((m, i) => <span key={m.id} style={{ marginLeft: i ? -6 : 0 }}><Avatar member={m} size={20} /></span>)}
                    </div>
                    {headerMembers.length} <ChevronDown size={12} />
                  </button>

                  <div className="relative">
                    <Search size={13} className={styles.s42} />
                    <input value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search in chat" aria-label="Search in chat" className={styles.s70} />
                    {convSearch.trim() && (
                      <div role="region" aria-live="polite" className={styles.s71}>
                        <div className={styles.s72}>
                          {searchLoading ? (<><Spinner size="sm" /> Searching…</>) : searchErr ? (
                            <span className="ui-text-danger">Search failed. Try again.</span>
                          ) : (
                            <span>{searchResults?.length ?? 0} result{(searchResults?.length ?? 0) === 1 ? '' : 's'} in {activeConv.kind === 'CHANNEL' ? `#${activeConv.name}` : activeConv.name}</span>
                          )}
                        </div>
                        {!searchLoading && !searchErr && (searchResults?.length ?? 0) === 0 && (
                          <div className={styles.s73}>No messages match &quot;{convSearch}&quot;</div>
                        )}
                        {!searchLoading && searchResults?.map((r) => (
                          <button key={r.messageId} onClick={() => { jumpToMessage(r.channelId, r.messageId); setConvSearch(''); }} className={styles.s74}>
                            <div className={styles.s75}>
                              <strong className={styles.s76}>{r.authorName}</strong>
                              <span className={styles.s77}>{formatDateSmart(r.ts)}</span>
                            </div>
                            <div className={styles.s78}>{highlightSnippet(r.snippet, convSearch)}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {pinned.length > 0 && (
                    <button onClick={() => setPinnedView(!pinnedView)} className={styles.s79}>
                      <Pin size={13} className="ui-text-warning" /> {pinned.length}
                    </button>
                  )}

                  <Select
                    aria-label={`Notification level for ${activeConv.kind === 'CHANNEL' ? '#' : ''}${activeConv.name}`}
                    value={activeConv.notifyLevel ?? 'ALL'}
                    onChange={(e) => changeNotifyLevel(activeConv.id, e.target.value as NotifyLevel)}
                    className={styles.s80}
                  >
                    {(['ALL', 'MENTIONS', 'NONE'] as NotifyLevel[]).map((lvl) => (
                      <option key={lvl} value={lvl}>{NOTIFY_LEVEL_LABELS[lvl]}</option>
                    ))}
                  </Select>
                  <button onClick={startMeeting} title="Start meeting" className={styles.s81}><Video size={16} /></button>
                  <button onClick={() => { setSavedMessagesOpen(!savedMessagesOpen); setChannelInfo(false); setThreadParent(null); }} title="Saved messages" style={{ color: savedMessagesOpen ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} className={styles.s82}>
                    <BookmarkCheck size={16} />
                  </button>
                  <button onClick={() => { setChannelInfo(!channelInfo); setSavedMessagesOpen(false); setThreadParent(null); }} title="Channel info" style={{ color: channelInfo ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} className={styles.s82}>
                    <Info size={16} />
                  </button>
                </div>
              </div>

              {/* ─ Pinned messages bar ─ */}
              {pinned.length > 0 && !pinnedView && (
                <button onClick={() => setPinnedView(true)} className={styles.s83}>
                  <Pin size={12} className="ui-text-warning" />
                  <span className={styles.s46}><strong>{memberById(pinned[0]!.authorId).name}:</strong> {pinned[0]!.content}</span>
                  {pinned.length > 1 && <span className={styles.s77}>{pinned.length} pinned</span>}
                </button>
              )}

              {/* ─ Messages feed ─ */}
              <div ref={feedRef} className={styles.s84}>
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
                  <div className={styles.s85}>
                    {convSearch ? (
                      <><Search size={32} className={styles.s60} /><span className={styles.s86}>No messages match &quot;{convSearch}&quot;</span></>
                    ) : (
                      <>
                        <span className={styles.s87}>👋</span>
                        <span className={styles.s88}>No messages yet</span>
                        <span className={styles.s89}>Be the first to say hello!</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* ─ Composer ─ */}
              <div className={styles.s90}>
                {mentionMatches.length > 0 && (
                  <div className={styles.s91}>
                    <div className={styles.s92}>Mention someone</div>
                    {mentionMatches.map((m) => (
                      <button key={m.id} onClick={() => insertMention(m)} className={styles.s93}>
                        <Avatar member={m} size={24} showPresence /> <span className={styles.s89}>{m.name}</span>
                        <span className={styles.s94}>{m.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {staged.length > 0 && (
                  <div className={styles.s95}>
                    {staged.map((a) => <StagedChip key={a.localId} a={a} onRemove={() => setStaged((p) => p.filter((x) => x.localId !== a.localId))} />)}
                  </div>
                )}

                {/* Typing indicator strip — fixed-height slot, never shifts the composer */}
                <div className={styles.s96}>
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
                  <div className={styles.s97}>
                    {[
                      { icon: <Bold size={15} />, before: '**', after: '**', tip: 'Bold' },
                      { icon: <Italic size={15} />, before: '*', after: '*', tip: 'Italic' },
                      { icon: <Strikethrough size={15} />, before: '~~', after: '~~', tip: 'Strikethrough' },
                      { icon: <Code size={15} />, before: '`', after: '`', tip: 'Code' },
                      { icon: <Link2 size={15} />, before: '[', after: '](url)', tip: 'Link' },
                      { icon: <List size={15} />, before: '- ', after: '', tip: 'Bullet list' },
                      { icon: <ListOrdered size={15} />, before: '1. ', after: '', tip: 'Numbered list' },
                    ].map((f) => (
                      <button key={f.tip} onClick={() => insertFormat(f.before, f.after)} title={f.tip} className={styles.s98}>{f.icon}</button>
                    ))}
                  </div>
                )}

                <div className={styles.s99}>
                  <div className={styles.s100}>
                    <button onClick={() => setShowFormatBar(!showFormatBar)} title="Formatting" style={{ color: showFormatBar ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s82}><Bold size={16} /></button>
                    <button onClick={() => fileRef.current?.click()} title="Attach" className={styles.s101}><Paperclip size={16} /></button>
                    <input ref={fileRef} type="file" multiple hidden onChange={(e) => { onFiles(e.target.files); if (fileRef.current) fileRef.current.value = ''; }} />
                    <textarea ref={composerRef} value={composer}
                      onChange={(e) => {
                        setComposer(e.target.value);
                        const mt = /(?:^|\s)@(\w*)$/.exec(e.target.value); setMentionQuery(mt ? (mt[1] ?? '') : null);
                        if (socketRef.current && activeId) socketRef.current.emit('typing', { channelId: activeId });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={`Message ${activeConv.kind === 'CHANNEL' ? '#' + activeConv.name : activeConv.name}...`}
                      rows={1} className={styles.s102} />
                    <button onClick={() => setEmojiFor('composer')} aria-label="Add emoji" className={styles.s101}><Smile size={16} /></button>
                    <button onClick={handleSend} disabled={(!composer.trim() && staged.length === 0) || staged.some((a) => a.status === 'uploading')} aria-label="Send message" style={{ background: (composer.trim() || staged.length) ? 'var(--color-primary)' : 'var(--color-border)' }} className={styles.s103}><Send size={16} /></button>
                  </div>
                  {emojiFor === 'composer' && (
                    <div className={styles.s104}>
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
            <div className={styles.s105}>
              <div className={styles.s106}>
                <h3 className={styles.s107}><BookmarkCheck size={15} /> Saved messages</h3>
                <button onClick={() => setSavedMessagesOpen(false)} className={styles.s108}><X size={16} /></button>
              </div>
              <div className={styles.s109}>
                {savedMessages.length === 0 ? (
                  <p className={styles.s110}>No saved messages yet.</p>
                ) : (
                  savedMessages.map((m) => (
                    <div key={m.id} className={styles.s111}>
                      <div className={styles.s112}>
                        <span className={styles.s113}>{memberById(m.authorId).name}</span>
                        <span className={styles.s114}>{formatDateSmart(m.ts)}</span>
                      </div>
                      <div className={styles.s115}>{renderContent(m.content)}</div>
                      <div className={styles.s116}>
                        <button onClick={() => jumpToMessage(m.conversationId, m.id)} className={styles.s117}><Eye size={12} /> Go to message</button>
                        <button onClick={() => toggleBookmark(m.id)} className={styles.s118}><Trash2 size={12} /> Unsave</button>
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
            <div className={styles.s105}>
              <div className={styles.s106}>
                <h3 className={styles.s107}><Reply size={15} /> Thread</h3>
                <button onClick={() => setThreadParent(null)} className={styles.s108}><X size={16} /></button>
              </div>
              <div className={styles.s119}>
                <ThreadMsg m={parent} author={memberById(parent.authorId)} />
                <div className={styles.s120}>
                  <div className={styles.s9} />
                  <span>{reps.length} repl{reps.length === 1 ? 'y' : 'ies'}</span>
                  <div className={styles.s9} />
                </div>
                {reps.map((r) => <ThreadMsg key={r.id} m={r} author={memberById(r.authorId)} />)}
              </div>
              <div className={styles.s121}>
                <textarea value={threadComposer} onChange={(e) => setThreadComposer(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleThreadSend(); } }} placeholder="Reply..." rows={1} className={styles.s122} />
                <button onClick={handleThreadSend} disabled={!threadComposer.trim()} style={{ background: threadComposer.trim() ? 'var(--color-primary)' : 'var(--color-border)' }} className={styles.s123}><Send size={16} /></button>
              </div>
            </div>
          );
        })()}

        {/* ─── Channel info panel ─── */}
        {channelInfo && activeConv && (
          <div className={styles.s124}>
            <div className={styles.s106}>
              <h3 className={styles.s125}>Details</h3>
              <button onClick={() => setChannelInfo(false)} className={styles.s108}><X size={16} /></button>
            </div>
            <div className={styles.s126}>
              <div className={styles.s127}>
                <div className={styles.s128}>
                  {activeConv.kind === 'CHANNEL' ? <Hash size={28} className="ui-text-primary" /> : <Users size={28} className="ui-text-primary" />}
                </div>
                <h4 className={styles.s129}>{activeConv.name}</h4>
                {activeConv.topic && <p className={styles.s130}>{activeConv.topic}</p>}
              </div>

              {activeConv.kind === 'CHANNEL' && (
                <ProtectedComponent permission="communication.channel.manage">
                  <Button variant="secondary" onClick={openManageChannel} className={styles.s131}>
                    <Settings size={14} /> Manage channel
                  </Button>
                </ProtectedComponent>
              )}

              <div className={styles.s62}>
                <button onClick={() => toggleStar(activeConv.id)} className={styles.s132}>
                  <Star size={18} fill={starredConvs.has(activeConv.id) ? '#f6bf26' : 'none'} style={{ color: starredConvs.has(activeConv.id) ? '#f6bf26' : 'var(--color-text-secondary)' }} />
                  {starredConvs.has(activeConv.id) ? 'Unstar' : 'Star'}
                </button>
                <button className={styles.s132}>
                  <Share2 size={18} />
                  Share
                </button>
              </div>

              {/* Members */}
              <div>
                <div className={styles.s133}>
                  <span className={styles.s134}>Members ({headerMembers.length})</span>
                  <span className="ui-text-caption ui-text-tertiary">{activeOnline} online</span>
                </div>
                {headerMembers.map((m) => (
                  <button key={m.id} onClick={() => setProfileCard(m)} className={styles.s135}>
                    <Avatar member={m} size={28} showPresence />
                    <div className="flex-1 overflow-hidden">
                      <div className={styles.s136}>{m.name} {m.id === me.id && <span className="ui-text-caption ui-text-tertiary">(you)</span>}</div>
                      {m.statusText && <div className="ui-text-caption ui-text-tertiary">{m.statusText}</div>}
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
                    <div className={styles.s137}>Shared files</div>
                    {allFiles.map((f) => (
                      <div key={f.id} className={styles.s138}>
                        <File size={16} className={styles.s139} />
                        <div className="flex-1 overflow-hidden">
                          <div className={styles.s140}>{f.name}</div>
                          <div className="ui-text-caption ui-text-tertiary">{f.author} · {formatBytes(f.size)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Pinned messages */}
              {pinned.length > 0 && (
                <div>
                  <div className={styles.s137}>Pinned messages ({pinned.length})</div>
                  {pinned.slice(0, 5).map((m) => (
                    <div key={m.id} className={styles.s141}>
                      <div className={styles.s142}>{memberById(m.authorId).name}</div>
                      <div className={styles.s143}>{m.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Pinned messages panel ─── */}
        {pinnedView && activeConv && (
          <div className={styles.s144}>
            <div className={styles.s106}>
              <h3 className={styles.s107}><Pin size={14} className="ui-text-warning" /> Pinned messages</h3>
              <button onClick={() => setPinnedView(false)} className={styles.s108}><X size={16} /></button>
            </div>
            <div className={styles.s145}>
              {pinned.map((m) => (
                <div key={m.id} className={styles.s146}>
                  <div className={styles.s147}>
                    <Avatar member={memberById(m.authorId)} size={22} />
                    <span className={styles.s148}>{memberById(m.authorId).name}</span>
                    <span className={styles.s94}>{formatDateSmart(m.ts)}</span>
                  </div>
                  <div className={styles.s149}>{m.content}</div>
                  <button onClick={() => pin(m.id)} className={styles.s150}>Unpin</button>
                </div>
              ))}
              {pinned.length === 0 && <p className={styles.s151}>No pinned messages</p>}
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
          <button onClick={onClick} title={label} style={{ background: danger ? '#ea4335' : !on ? 'rgba(234,67,53,.85)' : 'rgba(255,255,255,.12)' }} className={styles.s152}>{icon}</button>
        );

        // ─── Pre-join screen ───
        if (ms.preJoin) {
          return (
            <div className={styles.s153}>
              <div className={styles.s154}>
                {/* Preview */}
                <div className={styles.s155}>
                  <div className={styles.s156}>
                    {ms.camOn ? (
                      <div className={styles.s157}>
                        <div className={styles.s158}>
                          <Avatar member={me} size={100} />
                        </div>
                        <div className={styles.s159}>
                          <span className={styles.s160} />
                          <span className={styles.s161}>{me.name}</span>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.s56}>
                        <Avatar member={me} size={80} />
                        <p className={styles.s162}>Camera is off</p>
                      </div>
                    )}
                  </div>
                  <div className={styles.s163}>
                    {meetCtrl(ms.micOn ? <Mic size={20} /> : <MicOff size={20} />, ms.micOn ? 'Mute' : 'Unmute', ms.micOn, () => setMeetingState((s) => ({ ...s, micOn: !s.micOn })))}
                    {meetCtrl(ms.camOn ? <Video size={20} /> : <VideoOff size={20} />, ms.camOn ? 'Stop video' : 'Start video', ms.camOn, () => setMeetingState((s) => ({ ...s, camOn: !s.camOn })))}
                  </div>
                </div>
                {/* Join panel */}
                <div className={styles.s164}>
                  <h2 className={styles.s165}>Ready to join?</h2>
                  <p className={styles.s166}>{activeMeeting.title}</p>
                  <code className={styles.s167}>connect.meet/{activeMeeting.code}</code>
                  <div className={styles.s168}>
                    {participants.slice(0, 4).map((p, i) => <span key={p.id} style={{ marginLeft: i ? -8 : 0 }}><Avatar member={p} size={28} /></span>)}
                    <span className={styles.s169}>{participants.length} in this call</span>
                  </div>
                  <button onClick={joinMeeting} className={styles.s170}>Join now</button>
                  <button onClick={() => { navigator.clipboard?.writeText(`connect.meet/${activeMeeting.code}`); }} className={styles.s171}><Copy size={15} /> Copy joining info</button>
                  <button onClick={() => { setActiveMeeting(null); if (meetingTimerRef.current) clearInterval(meetingTimerRef.current); }} className={styles.s172}>Cancel</button>
                </div>
              </div>
            </div>
          );
        }

        // ─── Active meeting screen ───
        const sidePanel = ms.showChat || ms.showParticipants;
        return (
          <div className={styles.s173}>
            {/* Top bar */}
            <div className={styles.s174}>
              <div className={styles.s21}>
                <Video size={20} className={styles.s175} />
                <span className={styles.s176}>{activeMeeting.title}</span>
              </div>
              <span className={styles.s169}>|</span>
              <span className={styles.s177}>{fmtElapsed(ms.elapsedSec)}</span>
              {ms.recording && (
                <span className={styles.s178}>
                  <CircleDot size={14} /> REC
                </span>
              )}
              <div className={styles.s179}>
                <code className={styles.s180}>connect.meet/{activeMeeting.code}</code>
                <button onClick={() => navigator.clipboard?.writeText(`connect.meet/${activeMeeting.code}`)} className={styles.s181}><Copy size={14} /></button>
              </div>
            </div>

            {/* Main area */}
            <div className={styles.s39}>
              {/* Video grid */}
              <div className={styles.s182}>
                {/* Floating reactions */}
                {ms.reactions.map((r) => (
                  <div key={r.id} className={styles.s183}>
                    <span className={styles.s184}>{r.emoji}</span>
                    <span className={styles.s185}>{r.name}</span>
                  </div>
                ))}

                {/* Captions bar */}
                {ms.showCaptions && (
                  <div className={styles.s186}>
                    <p className={styles.s187}>
                      <span className={styles.s175}>{me.name}: </span>Captions will appear here when speaking...
                    </p>
                  </div>
                )}

                {/* Video tiles */}
                <div style={{ gridTemplateColumns: ms.layout === 'gallery'
                    ? `repeat(${Math.min(participants.length, 3)}, 1fr)`
                    : ms.layout === 'spotlight' ? '1fr' : '1fr 280px', gridAutoRows: ms.layout === 'spotlight' ? '1fr' : undefined }} className={styles.s188}>
                  {(ms.layout === 'spotlight' ? [participants[0]!] : participants).map((p, i) => (
                    <div key={p.id} style={{ border: p.id === me.id && ms.handRaised ? '2px solid #f6bf26' : '2px solid transparent' }} className={styles.s189}>
                      {/* Simulated video — gradient bg + avatar */}
                      <div style={{ background: `linear-gradient(${135 + i * 30}deg, #1a1a2e, #16213e, #0f3460)`, opacity: (p.id === me.id && !ms.camOn) ? 0 : 0.8 }} className={styles.s190} />
                      <Avatar member={p} size={ms.layout === 'spotlight' && i === 0 ? 96 : 56} />

                      {/* Name tag */}
                      <div className={styles.s191}>
                        {p.id === me.id && !ms.micOn && <MicOff size={12} className={styles.s192} />}
                        <span className={styles.s193}>{p.name}{p.id === me.id ? ' (You)' : ''}</span>
                        {p.id === me.id && ms.handRaised && <span className={styles.s86}>✋</span>}
                      </div>

                      {/* Pin / menu on hover */}
                      <div className={styles.s194}>
                        <button className={styles.s195} title="More"><MoreVertical size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Self-view PiP */}
                {ms.layout === 'spotlight' && participants.length > 1 && (
                  <div className={styles.s196}>
                    <div style={{ opacity: ms.camOn ? 0.8 : 0 }} className={styles.s197} />
                    <Avatar member={me} size={40} />
                    <div className={styles.s198}>
                      {!ms.micOn && <MicOff size={10} className={styles.s192} />}
                      <span className={styles.s199}>You</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Side panel — Chat / Participants */}
              {sidePanel && (
                <div className={styles.s200}>
                  <div className={styles.s201}>
                    <button onClick={() => setMeetingState((s) => ({ ...s, showParticipants: true, showChat: false }))} style={{ color: ms.showParticipants ? '#8ab4f8' : '#9aa0a6', borderBottom: ms.showParticipants ? '2px solid #8ab4f8' : '2px solid transparent' }} className={styles.s202}>People ({participants.length})</button>
                    <button onClick={() => setMeetingState((s) => ({ ...s, showChat: true, showParticipants: false }))} style={{ color: ms.showChat ? '#8ab4f8' : '#9aa0a6', borderBottom: ms.showChat ? '2px solid #8ab4f8' : '2px solid transparent' }} className={styles.s202}>Chat</button>
                    <button onClick={() => setMeetingState((s) => ({ ...s, showChat: false, showParticipants: false }))} className={styles.s203}><X size={16} /></button>
                  </div>

                  {ms.showParticipants && (
                    <div className={styles.s145}>
                      {/* Waiting room */}
                      {ms.waitingRoom.length > 0 && (
                        <div className={styles.s204}>
                          <div className={styles.s205}><Clock size={13} /> Waiting room ({ms.waitingRoom.length})</div>
                          {ms.waitingRoom.map((w) => (
                            <div key={w.id} className={styles.s206}>
                              <Avatar member={w} size={28} />
                              <span className={styles.s207}>{w.name}</span>
                              <button className={styles.s208}>Admit</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* In call */}
                      <div className={styles.s209}>In this call ({participants.length})</div>
                      {participants.map((p) => (
                        <div key={p.id} className={styles.s210}>
                          <Avatar member={p} size={30} />
                          <div className="flex-1">
                            <div className={styles.s185}>{p.name}{p.id === me.id ? ' (You)' : ''}</div>
                            <div className={styles.s211}>{p.email}</div>
                          </div>
                          <div className={styles.s212}>
                            {p.id === me.id && ms.handRaised && <span className={styles.s86}>✋</span>}
                            <Mic size={14} className={styles.s213} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {ms.showChat && (
                    <>
                      <div className={styles.s119}>
                        {ms.meetingChat.length === 0 && (
                          <div className={styles.s214}>
                            <MessageCircle size={32} className={styles.s215} />
                            <p className={styles.s216}>Messages can only be seen by people in the call and are deleted when the call ends.</p>
                          </div>
                        )}
                        {ms.meetingChat.map((msg, i) => (
                          <div key={i}>
                            <div className={styles.s217}>
                              <span className={styles.s218}>{msg.author}</span>
                              <span className={styles.s219}>{new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className={styles.s220}>{msg.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className={styles.s221}>
                        <input value={ms.meetingChatDraft} onChange={(e) => setMeetingState((s) => ({ ...s, meetingChatDraft: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === 'Enter') sendMeetingChat(); }}
                          placeholder="Send a message to everyone" className={styles.s222} />
                        <button onClick={sendMeetingChat} disabled={!ms.meetingChatDraft.trim()} style={{ background: ms.meetingChatDraft.trim() ? '#8ab4f8' : 'transparent', color: ms.meetingChatDraft.trim() ? '#202124' : '#5f6368' }} className={styles.s223}><Send size={16} /></button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ─ Bottom control bar ─ */}
            <div className={styles.s224}>
              {/* Left: meeting info */}
              <div className={styles.s225}>
                <span className={styles.s177}>{fmtElapsed(ms.elapsedSec)}</span>
                <span className={styles.s215}>|</span>
                <code className={styles.s226}>{activeMeeting.code}</code>
              </div>

              {/* Center controls */}
              <div className={styles.s21}>
                {meetCtrl(ms.micOn ? <Mic size={20} /> : <MicOff size={20} />, ms.micOn ? 'Mute microphone' : 'Unmute microphone', ms.micOn, () => setMeetingState((s) => ({ ...s, micOn: !s.micOn })))}
                {meetCtrl(ms.camOn ? <Video size={20} /> : <VideoOff size={20} />, ms.camOn ? 'Turn off camera' : 'Turn on camera', ms.camOn, () => setMeetingState((s) => ({ ...s, camOn: !s.camOn })))}
                {meetCtrl(ms.screenShare ? <ScreenShareOff size={20} /> : <ScreenShare size={20} />, ms.screenShare ? 'Stop sharing' : 'Share screen', !ms.screenShare, () => setMeetingState((s) => ({ ...s, screenShare: !s.screenShare })))}
                {meetCtrl(<Hand size={20} style={ms.handRaised ? { color: '#f6bf26' } : undefined} />, ms.handRaised ? 'Lower hand' : 'Raise hand', !ms.handRaised, () => setMeetingState((s) => ({ ...s, handRaised: !s.handRaised })))}

                {/* Reactions */}
                <div className="relative">
                  <button onClick={() => {}} className={styles.s227} title="Reactions"><Smile size={20} /></button>
                  <div className={`meet-reactions ${styles.s228}`} >
                    {['👍', '❤️', '😂', '🎉', '👏', '🤔'].map((e) => (
                      <button key={e} onClick={() => sendMeetingReaction(e)} className={styles.s229}>{e}</button>
                    ))}
                  </div>
                </div>

                {/* More options */}
                <div className="relative">
                  <button onClick={() => {}} className={styles.s227} title="More options"><MoreVertical size={20} /></button>
                  <div className={styles.s230}>
                    {[
                      { icon: <Disc size={16} />, label: ms.recording ? 'Stop recording' : 'Start recording', active: ms.recording, action: () => setMeetingState((s) => ({ ...s, recording: !s.recording })) },
                      { icon: <Captions size={16} />, label: ms.showCaptions ? 'Turn off captions' : 'Turn on captions', active: ms.showCaptions, action: () => setMeetingState((s) => ({ ...s, showCaptions: !s.showCaptions })) },
                      { icon: ms.noiseCancel ? <Volume2 size={16} /> : <VolumeX size={16} />, label: ms.noiseCancel ? 'Noise cancellation: On' : 'Noise cancellation: Off', active: ms.noiseCancel, action: () => setMeetingState((s) => ({ ...s, noiseCancel: !s.noiseCancel })) },
                      { icon: ms.layout === 'gallery' ? <Grid3X3 size={16} /> : ms.layout === 'spotlight' ? <Maximize2 size={16} /> : <Layout size={16} />, label: `Layout: ${ms.layout}`, active: false, action: () => setMeetingState((s) => ({ ...s, layout: s.layout === 'gallery' ? 'spotlight' : s.layout === 'spotlight' ? 'sidebar' : 'gallery' })) },
                      { icon: <Shield size={16} />, label: 'Security', active: false, action: () => {} },
                      { icon: <Settings size={16} />, label: 'Settings', active: false, action: () => {} },
                    ].map((opt) => (
                      <button key={opt.label} onClick={opt.action} style={{ color: opt.active ? '#8ab4f8' : '#e8eaed' }} className={styles.s231}>{opt.icon} {opt.label}</button>
                    ))}
                  </div>
                </div>

                {/* Separator */}
                <div className={styles.s232} />

                {/* End call */}
                {meetCtrl(<PhoneOff size={20} />, 'Leave call', false, () => endMeeting(activeMeeting.id), true)}
              </div>

              {/* Right: side panel toggles */}
              <div className={styles.s233}>
                <button onClick={() => setMeetingState((s) => ({ ...s, showChat: !s.showChat, showParticipants: false }))} title="Chat" style={{ background: ms.showChat ? 'rgba(138,180,248,.2)' : 'transparent', color: ms.showChat ? '#8ab4f8' : '#e8eaed' }} className={styles.s234}>
                  <MessageCircle size={18} />
                  {ms.meetingChat.length > 0 && (
                    <span className={styles.s235} />
                  )}
                </button>
                <button onClick={() => setMeetingState((s) => ({ ...s, showParticipants: !s.showParticipants, showChat: false }))} title="People" style={{ background: ms.showParticipants ? 'rgba(138,180,248,.2)' : 'transparent', color: ms.showParticipants ? '#8ab4f8' : '#e8eaed' }} className={styles.s234}><Users size={18} /></button>
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
          <div className={styles.s236}>
            <div className="ui-flex-between">
              <h2 className={styles.s22}>{people.mode === 'dm' ? 'New message' : 'New group'}</h2>
              <button onClick={() => setPeople(null)} className="ui-btn-icon ui-text-muted"><X size={20} /></button>
            </div>
            <div className="relative">
              <Search size={14} className={styles.s237} />
              <input autoFocus value={people.search} onChange={(e) => setPeople({ ...people, search: e.target.value })} placeholder="Search people..." className={styles.s238} />
            </div>
            {people.mode === 'group' && people.selected.length > 0 && (
              <div className={styles.s239}>
                {people.selected.map((id) => {
                  const m = memberById(id);
                  return (
                    <span key={id} className={styles.s240}>
                      <Avatar member={m} size={18} /> {m.name}
                      <button onClick={() => setPeople({ ...people, selected: people.selected.filter((x) => x !== id) })} className={styles.s241}><X size={12} /></button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className={styles.s242}>
              {directory.filter((d) => d.id !== me.id).filter((d) => !people.search || d.name.toLowerCase().includes(people.search.toLowerCase()) || d.email.toLowerCase().includes(people.search.toLowerCase())).map((d) => {
                const checked = people.selected.includes(d.id);
                return (
                  <button key={d.id} onClick={() => people.mode === 'dm' ? startDM(d.id) : setPeople({ ...people, selected: checked ? people.selected.filter((x) => x !== d.id) : [...people.selected, d.id] })}
                    style={{ background: checked ? 'var(--color-primary-light)' : 'transparent' }} className={styles.s243}>
                    {people.mode === 'group' && (checked ? <CheckSquare size={16} className="ui-text-primary" /> : <Square size={16} className="ui-text-tertiary" />)}
                    <Avatar member={d} size={32} showPresence />
                    <div className="flex-1">
                      <div className={styles.s244}>{d.name}</div>
                      <div className={styles.s47}>{d.email}</div>
                    </div>
                    <PresenceDot presence={d.presence} size={8} border="transparent" />
                  </button>
                );
              })}
              {directory.filter((d) => d.id !== me.id).length === 0 && <p className={styles.s110}>No other people in this workspace yet.</p>}
            </div>
            {people.mode === 'group' && <button onClick={createGroup} disabled={people.selected.length === 0} style={tbtn({ background: 'var(--color-primary)', color: '#fff', border: 'none', justifyContent: 'center', opacity: people.selected.length ? 1 : 0.6, width: '100%' })}>Create group ({people.selected.length})</button>}
          </div>
        </Modal>
      )}

      {/* Quick switcher / global search */}
      {switcher !== null && (
        <Modal onClose={() => setSwitcher(null)} width={580}>
          <div className={styles.s245}>
            <div className="relative">
              <Search size={18} className={styles.s246} />
              <input autoFocus value={switcher} onChange={(e) => setSwitcher(e.target.value)} placeholder="Search conversations, channels, people..." className={styles.s247} />
              <div className={styles.s248}>
                <kbd className={styles.s249}>ESC</kbd>
              </div>
            </div>
            {!switcher && (
              <div className={styles.s250}>
                <span className="font-semibold">Tip:</span> Use Ctrl+K anytime to open this search
              </div>
            )}
            <div className={styles.s251}>
              {switcherResults.length > 0 && (
                <>
                  {switcherResults.filter((r) => r.type === 'conv').length > 0 && (
                    <div className={styles.s252}>Conversations</div>
                  )}
                  {switcherResults.filter((r) => r.type === 'conv').map((r) => r.type === 'conv' && (
                    <button key={`c-${r.c.id}`} onClick={() => { switchConv(r.c.id); setSwitcher(null); }} className={styles.s253}>
                      {r.c.kind === 'CHANNEL' ? <Hash size={16} className="ui-text-muted" /> : r.c.kind === 'GROUP' ? <Users size={16} className="ui-text-muted" /> : <MessageSquare size={16} className="ui-text-muted" />}
                      <span className={styles.s86}>{r.c.name}</span>
                      {r.c.topic && <span className={styles.s254}>{r.c.topic}</span>}
                      {(r.c.unreadCount ?? 0) > 0 && <Unread n={r.c.unreadCount ?? 0} />}
                    </button>
                  ))}
                  {switcherResults.filter((r) => r.type === 'person').length > 0 && (
                    <div className={styles.s252}>People</div>
                  )}
                  {switcherResults.filter((r) => r.type === 'person').map((r) => r.type === 'person' && (
                    <button key={`p-${r.d.id}`} onClick={() => { setSwitcher(null); startDM(r.d.id); }} className={styles.s253}>
                      <Avatar member={r.d} size={28} showPresence /> <span className={styles.s86}>{r.d.name}</span>
                      <span className={styles.s47}>{r.d.email}</span>
                    </button>
                  ))}
                </>
              )}
              {switcherMessages.length > 0 && (
                <>
                  <div className={styles.s252}>Messages</div>
                  {switcherMessages.map((r) => (
                    <button key={`m-${r.messageId}`} onClick={() => { setSwitcher(null); jumpToMessage(r.channelId, r.messageId); }} className={styles.s255}>
                      <MessageSquare size={16} className={styles.s256} />
                      <div className="flex-1 overflow-hidden">
                        <div className={styles.s257}>
                          <span>{r.channelName} › {r.authorName}</span>
                          <span className={styles.s258}>{formatDateSmart(r.ts)}</span>
                        </div>
                        <div className={styles.s259}>{highlightSnippet(r.snippet, switcher)}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {switcher && switcherResults.length === 0 && switcherMessages.length === 0 && <p className={styles.s260}>No results found</p>}
            </div>
          </div>
        </Modal>
      )}

      {/* Profile card */}
      {profileCard && (
        <Modal onClose={() => setProfileCard(null)} width={360}>
          <div className={styles.s261}>
            <div className="ui-flex-end">
              <button onClick={() => setProfileCard(null)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
            </div>
            <div className={styles.s56}>
              <Avatar member={profileCard} size={72} showPresence />
              <h3 className={styles.s262}>{profileCard.name}</h3>
              <p className={styles.s130}>{profileCard.email}</p>
              <div className={styles.s263}>
                <PresenceDot presence={profileCard.presence} size={8} border="transparent" />
                <span className={styles.s264}>{PRESENCE_META[profileCard.presence].label}</span>
              </div>
              {profileCard.statusText && <p className={styles.s265}>{profileCard.statusText}</p>}
              {(profileCard.designation || profileCard.department) && (
                <p className={styles.s266}>
                  {profileCard.designation || 'Staff'} {profileCard.department ? `(${profileCard.department})` : ''}
                </p>
              )}
            </div>
            <div className={styles.s62}>
              <button onClick={() => { setProfileCard(null); startDM(profileCard.id); }} style={{ ...tbtn({ justifyContent: 'center' }) }} className={styles.s267}><MessageSquare size={15} /> Message</button>
              <button style={{ ...tbtn({ justifyContent: 'center', background: 'var(--color-primary)', color: '#fff', border: 'none' }) }} className={styles.s267}><Video size={15} /> Call</button>
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
            <div className={styles.s261}>
              <div className="ui-flex-between">
                <h3 className={styles.s268}>Workspace Directory</h3>
                <button onClick={() => setDirectoryModalOpen(false)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
              </div>
              <div className="relative">
                <Search size={14} className={styles.s237} />
                <input
                  value={dirSearchQuery}
                  onChange={(e) => setDirSearchQuery(e.target.value)}
                  placeholder="Search by name, department, or designation/title..."
                  className={styles.s269}
                />
              </div>
              <div className={styles.s270}>
                {filteredDir.length === 0 ? (
                  <p className={styles.s110}>No matches found</p>
                ) : (
                  filteredDir.map((d) => (
                    <div key={d.id} className={styles.s271}>
                      <Avatar member={d} size={36} showPresence />
                      <div className="flex-1 overflow-hidden">
                        <div className={styles.s272}>{d.name}</div>
                        <div className={styles.s273}>
                          <span>{d.email}</span>
                          {(d.designation || d.department) && <span>•</span>}
                          {d.designation && <span className="font-semibold">{d.designation}</span>}
                          {d.department && <span>({d.department})</span>}
                        </div>
                      </div>
                      {d.id !== me.id && (
                        <button
                          onClick={() => {
                            setDirectoryModalOpen(false);
                            startDM(d.id);
                          }}
                          className={styles.s274}
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
          <div className={styles.s236}>
            <div className="ui-flex-between">
              <h2 className={styles.s22}>Keyboard shortcuts</h2>
              <button onClick={() => setShowKeyboardShortcuts(false)} className="ui-btn-icon ui-text-muted"><X size={18} /></button>
            </div>
            {SHORTCUTS.map((s) => (
              <div key={s.key} className={styles.s275}>
                <span className={styles.s276}>{s.label}</span>
                <div className={styles.s212}>
                  <kbd className={styles.s277}>{s.mod}</kbd>
                  <kbd className={styles.s277}>{s.key}</kbd>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ═══ Manage channel drawer (spec §2) ═══ */}
      <Drawer open={manageChannelOpen} onClose={() => setManageChannelOpen(false)} title={activeConv ? `Manage #${activeConv.name}` : 'Manage channel'} width={440}>
        <ProtectedComponent permission="communication.channel.manage" fallback={<p className={styles.s278}>You don&apos;t have permission to manage this channel.</p>}>
          <div className={styles.s261}>
            <Tabs tabs={[{ key: 'general', label: 'General' }, { key: 'members', label: `Members (${manageMembers?.length ?? 0})` }]} value={manageTab} onChange={(k) => setManageTab(k as 'general' | 'members')} />

            {manageTab === 'general' && activeConv && (
              <div className={styles.s261}>
                <FormField label="Channel name">
                  <div className={styles.s64}>
                    <Hash size={14} className="ui-text-tertiary" />
                    <Input value={manageName} onChange={(e) => setManageName(e.target.value)} onBlur={saveChannelName} />
                  </div>
                </FormField>
                <FormField label="Topic" hint="Optional">
                  <Input value={manageTopic} onChange={(e) => setManageTopic(e.target.value)} onBlur={saveChannelTopic} placeholder="What's this channel about?" />
                </FormField>
                <div className={styles.s279}>
                  <div className={styles.s280}>Danger zone</div>
                  <Button variant="danger" onClick={() => setArchiveConfirm(true)} className={styles.s131}>
                    <Archive size={14} /> Archive this channel
                  </Button>
                </div>
              </div>
            )}

            {manageTab === 'members' && (
              <div className={styles.s236}>
                <ProtectedComponent permission="communication.channel.member.manage">
                  <div className="relative">
                    <Input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Add people…" aria-label="Add people to channel" />
                    {memberSearch.trim() && (() => {
                      const existingIds = new Set(manageMembers?.map((m) => m.userId) ?? []);
                      const results = directory.filter((d) => !existingIds.has(d.id) && d.name.toLowerCase().includes(memberSearch.trim().toLowerCase()));
                      return (
                        <div className={styles.s281}>
                          {results.length === 0 && (
                            <div className={styles.s282}>No matching people</div>
                          )}
                          {results.map((d) => (
                            <button key={d.id} onClick={() => addMemberToChannel(d.id)} className={styles.s283}>
                              <Avatar member={d} size={24} /> <span className={styles.s89}>{d.name}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </ProtectedComponent>

                {manageMembers === null ? (
                  <div className={styles.s236}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className={styles.s284}>
                        <Skeleton width={28} height={28} radius="var(--radius-lg)" />
                        <Skeleton width={120} height={12} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ui-flex-col">
                    {manageMembers.map((mem) => {
                      const person = memberById(mem.userId);
                      const soleOwner = mem.role === 'OWNER' && manageMembers.filter((x) => x.role === 'OWNER').length <= 1;
                      return (
                        <div key={mem.userId} className={styles.s206}>
                          <Avatar member={person} size={28} showPresence />
                          <div className="flex-1 overflow-hidden">
                            <div className={styles.s285}>{person.name} {person.id === me.id && <span className="ui-text-caption ui-text-tertiary">(you)</span>}</div>
                          </div>
                          {mem.role === 'OWNER' && <Badge variant="primary" size="sm">Owner</Badge>}
                          {mem.role === 'ADMIN' && <Badge variant="default" size="sm">Admin</Badge>}
                          <ProtectedComponent permission="communication.channel.member.manage">
                            {!soleOwner && (
                              <button onClick={() => setRemoveConfirm(person)} aria-label={`Remove ${person.name} from channel`} className={styles.s286}>
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
        <div className={styles.s236}>
          <Input value={browseSearch} onChange={(e) => setBrowseSearch(e.target.value)} placeholder="Search channels by name or topic…" aria-label="Search public channels" />
          {browseList === null && !browseErr && (
            <div className={styles.s236}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.s284}>
                  <Skeleton width={28} height={28} radius="var(--radius-md)" />
                  <Skeleton width={200} height={14} />
                </div>
              ))}
            </div>
          )}
          {browseErr && (
            <div className={styles.s287}>
              <AlertCircle size={16} /> {browseErr}
              <button onClick={openBrowseChannels} className={styles.s288}>Retry</button>
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
              <div className={styles.s289}>
                {filtered.map((c) => (
                  <div key={c.id} className={styles.s290}>
                    <Hash size={18} className={styles.s139} />
                    <div className="flex-1 overflow-hidden">
                      <div className={styles.s148}>{c.name}</div>
                      {c.topic && <div className={styles.s259}>{c.topic}</div>}
                      <div className="ui-text-caption ui-text-tertiary">{c.memberCount} member{c.memberCount === 1 ? '' : 's'} · Public</div>
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
          <div className={styles.s236}>
            <div className={styles.s291}>
              <div className={styles.s292}>
                <Avatar member={memberById(forwardMsg.authorId)} size={24} />
                <strong className={styles.s89}>{memberById(forwardMsg.authorId).name}</strong>
                <span className="ui-text-caption ui-text-tertiary">{formatDateSmart(forwardMsg.ts)}</span>
              </div>
              <div className={styles.s293}>{forwardMsg.content}</div>
            </div>
            <div className={styles.s294} />
            <Input value={forwardSearch} onChange={(e) => setForwardSearch(e.target.value)} placeholder="Search conversations or people…" aria-label="Search conversations or people" />
            <div className={styles.s295}>
              {allConvs.filter((c) => !forwardSearch.trim() || c.name.toLowerCase().includes(forwardSearch.trim().toLowerCase())).map((c) => (
                <button key={c.id} onClick={() => setForwardTarget(c.id)} style={{ background: forwardTarget === c.id ? 'var(--color-primary-light)' : 'transparent' }} className={styles.s243}>
                  {c.kind === 'CHANNEL' ? <Hash size={16} /> : c.kind === 'GROUP' ? <Users size={16} /> : <MessageSquare size={16} />}
                  <span className={styles.s89}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </UiModal>
    </div>
    </RouteGuard>
  );
}

/* ═══ Sub-components ═══ */

function ThreadMsg({ m, author }: { m: ConnectMessage; author: Member }) {
  return (
    <div className={styles.s296}>
      <Avatar member={author} size={28} />
      <div className={styles.s297}>
        <div className={styles.s217}>
          <span className={styles.s298}>{author.name}</span>
          <span className="ui-text-caption ui-text-tertiary">{formatDateSmart(m.ts)}</span>
        </div>
        <div className={styles.s299}>{m.deleted ? <em className="ui-text-tertiary">message deleted</em> : renderContent(m.content)}</div>
        {!m.deleted && m.attachments.length > 0 && (
          <div className={styles.s300}>
            {m.attachments.map((a) => (
              <a key={a.id} href={a.url ?? '#'} download={a.name} className={styles.s301}>
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
    <div style={{ minHeight: loaded ? undefined : 120, minWidth: loaded ? undefined : 160 }} className={styles.s302}>
      {!loaded && <Skeleton width={160} height={120} radius="8px" />}
      <img src={url} alt={name} onLoad={() => setLoaded(true)} style={{ display: loaded ? 'block' : 'none' }} className={styles.s303} />
    </div>
  );
}

function MessageRow(p: RowProps) {
  const { m, author, isSmallGroup } = p;
  const [hover, setHover] = useState(false);
  const forwardedInfo = m.deleted ? null : parseForwarded(m.content);

  if (m.kind === 'SYSTEM') {
    return (
      <div className={styles.s304}>
        <Video size={16} className="ui-text-primary" />
        <span className={styles.s305}><strong className={styles.s76}>{author.name}</strong> {m.content}</span>
        {m.meetingId && <button onClick={p.onJoinMeeting} className={styles.s306}>Join</button>}
      </div>
    );
  }

  return (
    <div id={`msg-${m.id}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ gap: p.compact ? 0 : 10, padding: p.compact ? '1px 8px 1px 54px' : '6px 8px', background: p.flashing ? 'var(--color-primary-light)' : hover ? 'var(--color-bg-hover)' : 'transparent', transition: p.flashing ? 'background 1.2s ease-out' : 'background .1s' }} className={styles.s307}>
      {!p.compact && <Avatar member={author} size={36} showPresence onClick={() => p.onProfileClick(author)} />}
      <div className="flex-1 overflow-hidden">
        {!p.compact && (
          <div className={styles.s64}>
            <button onClick={() => p.onProfileClick(author)} className={styles.s308}>{author.name}</button>
            <span className="ui-text-caption ui-text-tertiary">{formatDateSmart(m.ts)}</span>
            {m.editedTs && !m.deleted && <span className={styles.s114}>(edited)</span>}
            {m.pinned && <Pin size={11} className="ui-text-warning" />}
            {p.isBookmarked && <Bookmark size={11} className={styles.s309} />}
          </div>
        )}

        {m.deleted ? (
          <em className={styles.s278}>This message was deleted</em>
        ) : p.editing ? (
          <div className={styles.s310}>
            <input value={p.editText} onChange={(e) => p.setEditText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') p.onSaveEdit(); if (e.key === 'Escape') p.onCancelEdit(); }} autoFocus className={styles.s311} />
            <button onClick={p.onSaveEdit} className={styles.s312}>Save</button>
            <button onClick={p.onCancelEdit} className={styles.s313}>Cancel</button>
          </div>
        ) : forwardedInfo ? (
          <div>
            <div className={styles.s314}>
              <div className={styles.s315}>
                <Forward size={12} /> Forwarded from {forwardedInfo.sourceLabel}
              </div>
              <div className={styles.s316}>
                <strong className={styles.s89}>{forwardedInfo.originAuthor}</strong>
                <span className="ui-text-caption ui-text-tertiary">{formatDateSmart(forwardedInfo.originTs)}</span>
              </div>
              <div className={styles.s299}>{renderContent(forwardedInfo.body)}</div>
            </div>
          </div>
        ) : (
          <div className={styles.s317}>{renderContent(m.content)}</div>
        )}

        {/* Inline image previews */}
        {!m.deleted && m.attachments.filter((a) => isImageMime(a.mime) && a.url).length > 0 && (
          <div className={styles.s318}>
            {m.attachments.filter((a) => isImageMime(a.mime) && a.url).map((a) => (
              <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className={styles.s319}>
                <AttachmentImage url={a.url!} name={a.name} />
              </a>
            ))}
          </div>
        )}

        {/* File attachments */}
        {!m.deleted && m.attachments.filter((a) => !isImageMime(a.mime)).length > 0 && (
          <div className={styles.s320}>
            {m.attachments.filter((a) => !isImageMime(a.mime)).map((a) => (
              <a key={a.id} href={a.url ?? '#'} download={a.name} onClick={(e) => { if (!a.url) e.preventDefault(); }} style={{ opacity: a.url ? 1 : 0.6 }} className={styles.s321}>
                {a.url ? <FileText size={18} className={styles.s322} /> : <Spinner size="sm" />}
                <div className="flex-1 overflow-hidden">
                  <div className={styles.s323}>{a.name}</div>
                  <div className="ui-text-caption ui-text-tertiary">{formatBytes(a.size)}</div>
                </div>
                {a.url && <Download size={14} className={styles.s139} />}
              </a>
            ))}
          </div>
        )}

        {/* Reactions & reply count */}
        {!m.deleted && (m.reactions.length > 0 || p.replyCount > 0) && (
          <div className={styles.s324}>
            {m.reactions.map((r) => {
              const mine = r.userIds.includes(p.me);
              return (
                <button key={r.emoji} onClick={() => p.onReact(r.emoji)} title={r.userIds.map((id) => p.memberById(id).name).join(', ')} style={{ borderColor: mine ? 'var(--color-primary)' : 'var(--color-border)', background: mine ? 'var(--color-primary-light)' : 'var(--color-bg)' }} className={styles.s325}>
                  <span>{r.emoji}</span><span className="font-semibold">{r.userIds.length}</span>
                </button>
              );
            })}
            {p.replyCount > 0 && (
              <button onClick={p.onOpenThread} className={styles.s326}>
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
          <div className={styles.s327}>
            <SeenReceipts messageId={m.id} memberById={p.memberById} />
          </div>
        )}
      </div>

      {/* Hover actions */}
      {(hover || p.emojiOpen) && !m.deleted && !p.editing && (
        <div className={styles.s328}>
          <IconBtn title="React" onClick={p.onEmojiToggle}><Smile size={15} /></IconBtn>
          <IconBtn title="Reply" onClick={p.onOpenThread}><Reply size={15} /></IconBtn>
          <IconBtn title="Forward" onClick={p.onForward}><Forward size={15} /></IconBtn>
          <IconBtn title={m.pinned ? 'Unpin' : 'Pin'} onClick={p.onPin}><Pin size={15} /></IconBtn>
          <IconBtn title={p.isBookmarked ? 'Remove bookmark' : 'Bookmark'} onClick={p.onToggleBookmark}>{p.isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</IconBtn>
          {m.authorId === p.me && <IconBtn title="Edit" onClick={p.onEdit}><Pencil size={15} /></IconBtn>}
          {m.authorId === p.me && <IconBtn title="Delete" onClick={p.onDelete}><Trash2 size={15} /></IconBtn>}
          {p.emojiOpen && (
            <div className={styles.s329}>
              <EmojiPicker onPick={p.onReact} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return <button onClick={onClick} title={title} className={styles.s330}>{children}</button>;
}

/** Staged-attachment chip (spec §1) — 2-line card while uploading, single-line pill when done,
 *  red-bordered card with a reason on error. */
function StagedChip({ a, onRemove }: { a: StagedAttachment; onRemove: () => void }) {
  if (a.status === 'uploading') {
    return (
      <span className={styles.s331}>
        <span className={styles.s64}>
          {isImageMime(a.mime) ? <Image size={14} className="ui-text-primary" /> : <FileText size={14} className="ui-text-muted" />}
          <span className={styles.s46}>{a.name}</span>
          <button disabled aria-label={`Remove ${a.name}`} className={styles.s332}><X size={13} /></button>
        </span>
        <span className={styles.s64}>
          <span
            role="progressbar" aria-valuenow={a.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${a.name}`}
            className={styles.s333}
          >
            <span style={{ width: `${a.progress}%` }} className={styles.s334} />
          </span>
          <span className={styles.s335}>{a.progress}%</span>
        </span>
      </span>
    );
  }
  if (a.status === 'error') {
    return (
      <span aria-label={`${a.name}: ${a.errorMessage}`} className={styles.s336}>
        <span className={styles.s64}>
          <AlertCircle size={14} className="ui-text-danger" />
          <span className={styles.s46}>{a.name}</span>
          <button onClick={onRemove} aria-label={`Remove ${a.name}`} className={styles.s337}><X size={13} /></button>
        </span>
        <span className={styles.s338}>{a.errorMessage}</span>
      </span>
    );
  }
  return (
    <span className={styles.s339}>
      {isImageMime(a.mime) ? <Image size={14} className="ui-text-primary" /> : <FileText size={14} className="ui-text-muted" />}
      <span className={styles.s340}>{a.name}</span>
      <span className="ui-text-tertiary">{formatBytes(a.size)}</span>
      <button onClick={onRemove} aria-label={`Remove ${a.name}`} className={styles.s337}><X size={14} /></button>
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
    try { setRecent(JSON.parse(window.sessionStorage.getItem(RECENT_EMOJI_KEY) || '[]')); } catch { setRecent([]); }
  }, []);

  const pick = (emoji: string) => {
    try {
      const next = [emoji, ...recent.filter((e) => e !== emoji)].slice(0, 24);
      window.sessionStorage.setItem(RECENT_EMOJI_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
    onPick(emoji);
  };

  const results = query.trim()
    ? ALL_EMOJIS.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase()))
    : category === 'recent'
      ? recent.map((emoji) => ALL_EMOJIS.find((e) => e.emoji === emoji) ?? { emoji, name: 'recently used' })
      : (EMOJI_CATEGORIES.find((c) => c.key === category)?.emojis ?? []);

  return (
    <div className={styles.s341}>
      <div className={styles.s342}>
        <div className="relative">
          <Search size={13} className={styles.s42} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search emoji…" aria-label="Search emoji"
            className={styles.s343} />
        </div>
      </div>
      {!query.trim() && (
        <div className={styles.s344}>
          {[{ key: 'recent', icon: '🕐', label: 'Recently used' }, ...EMOJI_CATEGORIES.map((c) => ({ key: c.key, icon: c.icon, label: c.label }))].map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)} aria-label={`${c.label} category`} title={c.label}
              style={{ background: category === c.key ? 'var(--color-primary-light)' : 'none' }} className={styles.s345}>
              {c.icon}
            </button>
          ))}
        </div>
      )}
      <div className={styles.s346}>
        {results.length === 0 && <span className={styles.s347}>
          {category === 'recent' && !query.trim() ? 'No recently used emoji yet' : 'No emoji found'}
        </span>}
        {results.map((e) => (
          <button key={e.emoji} onClick={() => pick(e.emoji)} aria-label={e.name} title={e.name}
            className={styles.s348}>{e.emoji}</button>
        ))}
      </div>
    </div>
  );
}

function Modal({ children, onClose, width = 480 }: { children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <div onClick={onClose} className={styles.s349}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: `min(${width}px, 100%)` }} className={styles.s350}>
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
      <div className={styles.s351}>
        <Spinner size="sm" />
        <span className="ui-text-caption ui-text-tertiary">Fetching preview…</span>
      </div>
    );
  }

  if (!preview || (!preview.title && !preview.description)) {
    return null;
  }

  return (
    <a href={preview.url} target="_blank" rel="noopener noreferrer" className={styles.s352}>
      {preview.image && (
        <div className={styles.s353}>
          <img src={preview.image} alt={preview.title || 'Preview'} className={styles.s354} />
        </div>
      )}
      <div className={styles.s355}>
        {preview.siteName && <div className={styles.s356}>{preview.siteName}</div>}
        <div className={styles.s272}>{preview.title}</div>
        {preview.description && <div className={styles.s357}>{preview.description}</div>}
        <div className={styles.s358}>{preview.url}</div>
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
      className={styles.s359}
    >
      <Eye size={12} className="ui-text-tertiary" />
      {seenList && seenList.length > 0 ? (
        <span className="ui-text-caption ui-text-tertiary">
          Seen by {seenList.length}
        </span>
      ) : (
        <span className="ui-text-caption ui-text-tertiary">
          {loading ? '...' : 'Sent'}
        </span>
      )}

      {showTooltip && seenList && seenList.length > 0 && (
        <div className={styles.s360}>
          <strong className={styles.s361}>Seen by</strong>
          {seenList.map((s) => (
            <div key={s.userId} className={styles.s362}>
              <span className={styles.s363}>
                {initials(s.name)}
              </span>
              <span className={styles.s364}>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
