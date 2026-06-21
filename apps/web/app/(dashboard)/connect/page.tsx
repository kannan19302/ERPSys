'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Workspace, Member, Conversation, ConnectMessage, Attachment, Meeting, CalendarEvent, Presence,
  PRESENCE_META, PRESENCE_ORDER, EMOJI_PALETTE, STATUS_SUGGESTIONS, SHORTCUTS,
  api, uid, initials, avatarColor, formatBytes, formatTime, formatDateSmart, formatDateDivider,
  parseMarkdown, isImageMime,
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
  const [staged, setStaged] = useState<Attachment[]>([]);
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
  const [mutedConvs, setMutedConvs] = useState<Set<string>>(new Set());
  const [starredConvs, setStarredConvs] = useState<Set<string>>(new Set());
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [pinnedView, setPinnedView] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const lastActivityRef = useRef(Date.now());
  const autoAwayRef = useRef(false);

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

  const loadMessages = useCallback(async (id: string) => {
    try { setMessages(await api.messages(id)); } catch { /* keep prior */ }
  }, []);

  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

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

  /* ── message mutations ── */
  const replaceMsg = (m: ConnectMessage) => setMessages((prev) => prev.map((x) => (x.id === m.id ? m : x)));

  const handleSend = async () => {
    if (!activeId || (!composer.trim() && staged.length === 0)) return;
    const content = composer; const attachments = staged;
    setComposer(''); setStaged([]); setMentionQuery(null);
    try { await api.send(activeId, { content, attachments }); await loadMessages(activeId); }
    catch (e) { alert(e instanceof Error ? e.message : 'Send failed'); setComposer(content); setStaged(attachments); }
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
    try {
      const res = await api.bookmark(id);
      setBookmarks((prev) => { const next = new Set(prev); res.bookmarked ? next.add(id) : next.delete(id); return next; });
    } catch { setBookmarks((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }); }
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

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    setStaged((prev) => [...prev, ...Array.from(files).map((f) => ({ id: uid('a'), name: f.name, size: f.size, mime: f.type || 'application/octet-stream', url: URL.createObjectURL(f) }))]);
  };

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
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            {onlineCount} online of {directory.length} members
          </div>
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
                    <input value={convSearch} onChange={(e) => setConvSearch(e.target.value)} placeholder="Search in chat" style={{ padding: '5px 8px 5px 26px', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)', fontSize: 12, width: 140 }} />
                  </div>

                  {pinned.length > 0 && (
                    <button onClick={() => setPinnedView(!pinnedView)} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-text-secondary)', fontSize: 12 }}>
                      <Pin size={13} style={{ color: 'var(--color-warning)' }} /> {pinned.length}
                    </button>
                  )}

                  <button onClick={() => toggleMute(activeConv.id)} title={mutedConvs.has(activeConv.id) ? 'Unmute' : 'Mute'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 6 }}>
                    {mutedConvs.has(activeConv.id) ? <BellOff size={16} /> : <Bell size={16} />}
                  </button>
                  <button onClick={startMeeting} title="Start meeting" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', padding: 6 }}><Video size={16} /></button>
                  <button onClick={() => setChannelInfo(!channelInfo)} title="Channel info" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 6 }}>
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
                          onProfileClick={(member) => setProfileCard(member)} memberById={memberById} />
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
                    {staged.map((a) => (
                      <span key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: 12 }}>
                        {isImageMime(a.mime) ? <Image size={14} style={{ color: 'var(--color-primary)' }} /> : <FileText size={14} style={{ color: 'var(--color-text-secondary)' }} />}
                        <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                        <span style={{ color: 'var(--color-text-tertiary)' }}>{formatBytes(a.size)}</span>
                        <button onClick={() => setStaged((p) => p.filter((x) => x.id !== a.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 0 }}><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                )}

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
                      onChange={(e) => { setComposer(e.target.value); const mt = /(?:^|\s)@(\w*)$/.exec(e.target.value); setMentionQuery(mt ? (mt[1] ?? '') : null); }}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      placeholder={`Message ${activeConv.kind === 'CHANNEL' ? '#' + activeConv.name : activeConv.name}...`}
                      rows={1} style={{ flex: 1, resize: 'none', padding: '7px 4px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-text)', fontSize: 13, fontFamily: 'inherit', maxHeight: 120, lineHeight: 1.5 }} />
                    <button onClick={() => setEmojiFor('composer')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 6 }}><Smile size={16} /></button>
                    <button onClick={handleSend} disabled={!composer.trim() && staged.length === 0} style={{ background: (composer.trim() || staged.length) ? 'var(--color-primary)' : 'var(--color-border)', color: '#fff', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', transition: 'background .15s' }}><Send size={16} /></button>
                  </div>
                  {emojiFor === 'composer' && (
                    <div style={{ position: 'absolute', bottom: '100%', right: 16, marginBottom: 4, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 8, boxShadow: '0 -4px 16px rgba(0,0,0,.1)', display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, zIndex: 20 }}>
                      {EMOJI_PALETTE.map((e) => <button key={e} onClick={() => { setComposer((p) => p + e); setEmojiFor(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, borderRadius: 6 }}>{e}</button>)}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

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

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => toggleMute(activeConv.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg)', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: 11 }}>
                  {mutedConvs.has(activeConv.id) ? <BellOff size={18} /> : <Bell size={18} />}
                  {mutedConvs.has(activeConv.id) ? 'Unmute' : 'Mute'}
                </button>
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
              {switcher && switcherResults.length === 0 && <p style={{ color: 'var(--color-text-tertiary)', fontSize: 14, textAlign: 'center', padding: 20 }}>No results found</p>}
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
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setProfileCard(null); startDM(profileCard.id); }} style={{ flex: 1, ...tbtn({ justifyContent: 'center' }) }}><MessageSquare size={15} /> Message</button>
              <button style={{ flex: 1, ...tbtn({ justifyContent: 'center', background: 'var(--color-primary)', color: '#fff', border: 'none' }) }}><Video size={15} /> Call</button>
            </div>
          </div>
        </Modal>
      )}

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
}

function MessageRow(p: RowProps) {
  const { m, author } = p;
  const [hover, setHover] = useState(false);

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
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', gap: p.compact ? 0 : 10, padding: p.compact ? '1px 8px 1px 54px' : '6px 8px', borderRadius: 8, position: 'relative', background: hover ? 'var(--color-bg-hover)' : 'transparent', transition: 'background .1s' }}>
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
        ) : (
          <div style={{ fontSize: 13, color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5 }}>{renderContent(m.content)}</div>
        )}

        {/* Inline image previews */}
        {!m.deleted && m.attachments.filter((a) => isImageMime(a.mime) && a.url).length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            {m.attachments.filter((a) => isImageMime(a.mime) && a.url).map((a) => (
              <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', maxWidth: 300 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.url} alt={a.name} style={{ maxWidth: '100%', maxHeight: 200, display: 'block' }} />
              </a>
            ))}
          </div>
        )}

        {/* File attachments */}
        {!m.deleted && m.attachments.filter((a) => !isImageMime(a.mime)).length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {m.attachments.filter((a) => !isImageMime(a.mime)).map((a) => (
              <a key={a.id} href={a.url ?? '#'} download={a.name} onClick={(e) => { if (!a.url) e.preventDefault(); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontSize: 12, textDecoration: 'none', color: 'var(--color-text)', maxWidth: 280 }}>
                <FileText size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{formatBytes(a.size)}</div>
                </div>
                <Download size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
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
      </div>

      {/* Hover actions */}
      {(hover || p.emojiOpen) && !m.deleted && !p.editing && (
        <div style={{ position: 'absolute', top: -6, right: 8, display: 'flex', gap: 1, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 2, boxShadow: '0 2px 8px rgba(0,0,0,.1)', zIndex: 10 }}>
          <IconBtn title="React" onClick={p.onEmojiToggle}><Smile size={15} /></IconBtn>
          <IconBtn title="Reply" onClick={p.onOpenThread}><Reply size={15} /></IconBtn>
          <IconBtn title={m.pinned ? 'Unpin' : 'Pin'} onClick={p.onPin}><Pin size={15} /></IconBtn>
          <IconBtn title={p.isBookmarked ? 'Remove bookmark' : 'Bookmark'} onClick={p.onToggleBookmark}>{p.isBookmarked ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}</IconBtn>
          {m.authorId === p.me && <IconBtn title="Edit" onClick={p.onEdit}><Pencil size={15} /></IconBtn>}
          {m.authorId === p.me && <IconBtn title="Delete" onClick={p.onDelete}><Trash2 size={15} /></IconBtn>}
          {p.emojiOpen && (
            <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 12, padding: 8, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2, boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 20 }}>
              {EMOJI_PALETTE.map((e) => <button key={e} onClick={() => p.onReact(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, borderRadius: 6 }}>{e}</button>)}
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

function Modal({ children, onClose, width = 480 }: { children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 14, padding: 20, width: `min(${width}px, 100%)`, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,.2)' }}>
        {children}
      </div>
    </div>
  );
}
