'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, X, Video, Clock, Users, Trash2, Copy,
  CalendarDays, MapPin, AlignLeft, Search, Repeat, Check, HelpCircle, XCircle,
  ChevronDown, Bell, Palette, MoreHorizontal,
} from 'lucide-react';
import { CalendarEvent, Member, avatarColor, initials, RsvpStatus, RecurrenceRule } from './connectData';

type View = 'day' | 'week' | 'month' | 'schedule';

interface Props {
  events: CalendarEvent[];
  directory: Member[];
  onCreate: (e: {
    title: string; date: string; time: string; durationMins: number;
    withMeet: boolean; attendeeIds: string[];
    description?: string; location?: string; color?: string; allDay?: boolean;
    recurrence?: RecurrenceRule;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onJoin: (e: CalendarEvent) => void;
  onClose: () => void;
}

const EVENT_COLORS: { name: string; value: string }[] = [
  { name: 'Tomato', value: '#d50000' }, { name: 'Flamingo', value: '#e67c73' },
  { name: 'Tangerine', value: '#f4511e' }, { name: 'Banana', value: '#f6bf26' },
  { name: 'Sage', value: '#33b679' }, { name: 'Basil', value: '#0b8043' },
  { name: 'Peacock', value: '#039be5' }, { name: 'Blueberry', value: '#3f51b5' },
  { name: 'Lavender', value: '#7986cb' }, { name: 'Grape', value: '#8e24aa' },
  { name: 'Graphite', value: '#616161' },
];
const DEFAULT_COLOR = '#039be5';
const WEEKDAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const HOUR_H = 48;
const DURATIONS = [15, 30, 45, 60, 90, 120, 180, 240, 480];
const RECURRENCE_LABELS: Record<RecurrenceRule, string> = {
  none: 'Does not repeat', daily: 'Daily', weekly: 'Weekly',
  biweekly: 'Every 2 weeks', monthly: 'Monthly', yearly: 'Annually',
};

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDT = (e: CalendarEvent) => new Date(`${e.date}T${e.time || '00:00'}:00`);
const minutesOf = (time: string) => { const [h, m] = time.split(':').map(Number); return (h ?? 0) * 60 + (m ?? 0); };
const colorOf = (e: CalendarEvent) => e.color || DEFAULT_COLOR;
const fmtTime = (time: string) => {
  const m = minutesOf(time); const h = Math.floor(m / 60); const mm = m % 60;
  const am = h < 12; const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}${mm ? ':' + pad(mm) : ''} ${am ? 'AM' : 'PM'}`;
};
const endTime = (e: CalendarEvent) => {
  const t = minutesOf(e.time) + (e.durationMins || 30);
  return `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`;
};
const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function ConnectCalendar({ events, directory, onCreate, onDelete, onJoin, onClose }: Props) {
  const [view, setView] = useState<View>('week');
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [creating, setCreating] = useState<CreateFormData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [miniCursor, setMiniCursor] = useState(new Date());
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const nameById = useMemo(() => new Map(directory.map((d) => [d.id, d])), [directory]);
  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = m.get(e.date) ?? []; list.push(e); m.set(e.date, list);
    }
    for (const list of m.values()) list.sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return minutesOf(a.time) - minutesOf(b.time);
    });
    return m;
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase();
    return events.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  useEffect(() => {
    if ((view === 'week' || view === 'day') && gridRef.current) gridRef.current.scrollTop = 7 * HOUR_H;
  }, [view]);

  const today = new Date();
  const todayKey = toKey(today);

  const move = (dir: number) => {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else if (view === 'day') d.setDate(d.getDate() + dir);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
    setMiniCursor(new Date(d));
  };

  const goToday = () => { const n = new Date(); setCursor(n); setMiniCursor(n); };

  const openCreate = (date: string, time = '09:00') =>
    setCreating({
      title: '', date, time, durationMins: 60, withMeet: true, attendeeIds: [],
      description: '', location: '', color: DEFAULT_COLOR, allDay: false, recurrence: 'none',
    });

  const submitCreate = async () => {
    if (!creating || !creating.title.trim()) return;
    await onCreate(creating);
    setCreating(null);
  };

  const headerLabel = () => {
    if (view === 'month' || view === 'schedule') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === 'day') return cursor.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const ws = weekStart(cursor); const we = new Date(ws); we.setDate(ws.getDate() + 6);
    if (ws.getMonth() === we.getMonth()) return `${MONTHS[ws.getMonth()]} ${ws.getFullYear()}`;
    return `${MONTHS_SHORT[ws.getMonth()]} – ${MONTHS_SHORT[we.getMonth()]} ${we.getFullYear()}`;
  };

  const handleMiniDayClick = (d: Date) => {
    setCursor(d);
    if (view === 'month') setView('day');
  };

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--color-bg-elevated)', borderRadius: 12,
        width: 'min(1140px, 100%)', height: 'min(760px, 94vh)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(0,0,0,.2)',
      }}>
        {/* ─── Top bar ─── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
          borderBottom: '1px solid var(--color-border)', minHeight: 52,
        }}>
          <CalendarDays size={24} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <span style={{ fontSize: 18, fontWeight: 700, marginRight: 8, color: 'var(--color-text)' }}>Calendar</span>

          <button onClick={goToday} style={todayBtn}>Today</button>

          <div style={{ display: 'flex', gap: 2 }}>
            <button onClick={() => move(-1)} style={iconBtn}><ChevronLeft size={18} /></button>
            <button onClick={() => move(1)} style={iconBtn}><ChevronRight size={18} /></button>
          </div>

          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap' }}>{headerLabel()}</h2>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Search */}
            {searchOpen ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 20, padding: '4px 12px' }}>
                <Search size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events" style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--color-text)', fontSize: 13, width: 160 }} />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ ...iconBtn, width: 22, height: 22 }}><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} style={iconBtn} title="Search events"><Search size={18} /></button>
            )}

            {/* View switcher */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setViewMenuOpen(!viewMenuOpen)} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)',
                color: 'var(--color-text)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>
                {view === 'schedule' ? 'Schedule' : view.charAt(0).toUpperCase() + view.slice(1)}
                <ChevronDown size={14} />
              </button>
              {viewMenuOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: 4, minWidth: 130,
                  background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                  borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.15)', zIndex: 10, overflow: 'hidden',
                }}>
                  {(['day', 'week', 'month', 'schedule'] as View[]).map((v) => (
                    <button key={v} onClick={() => { setView(v); setViewMenuOpen(false); }} style={{
                      display: 'block', width: '100%', padding: '8px 14px', border: 'none', textAlign: 'left',
                      background: view === v ? 'var(--color-primary-light)' : 'transparent',
                      color: view === v ? 'var(--color-primary)' : 'var(--color-text)', cursor: 'pointer',
                      fontSize: 13, fontWeight: view === v ? 600 : 400,
                    }}>
                      {v === 'schedule' ? 'Schedule' : v.charAt(0).toUpperCase() + v.slice(1)}
                      <span style={{ float: 'right', color: 'var(--color-text-tertiary)', fontSize: 11 }}>
                        {v === 'day' ? 'D' : v === 'week' ? 'W' : v === 'month' ? 'M' : 'A'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => openCreate(toKey(view === 'day' ? cursor : today))} style={createBtn}>
              <Plus size={16} /> <span>Create</span>
            </button>

            <button onClick={onClose} style={iconBtn}><X size={18} /></button>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Left sidebar — mini calendar + upcoming */}
          <div style={{
            width: 220, flexShrink: 0, borderRight: '1px solid var(--color-border)',
            display: 'flex', flexDirection: 'column', background: 'var(--color-bg)',
            overflowY: 'auto',
          }}>
            <MiniCalendar cursor={miniCursor} setCursor={setMiniCursor} todayKey={todayKey}
              eventsByDay={eventsByDay} onDayClick={handleMiniDayClick} />

            {/* Upcoming events */}
            <div style={{ padding: '4px 12px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>
                Upcoming
              </div>
              {(() => {
                const upcoming = [...events]
                  .filter((e) => parseDT(e) >= new Date(new Date().toDateString()))
                  .sort((a, b) => parseDT(a).getTime() - parseDT(b).getTime())
                  .slice(0, 5);
                if (upcoming.length === 0) return <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>No upcoming events</p>;
                return upcoming.map((e) => (
                  <button key={e.id} onClick={() => setSelected(e)} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 8px',
                    border: 'none', borderRadius: 6, background: 'transparent', cursor: 'pointer',
                    textAlign: 'left', width: '100%', marginBottom: 2,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: colorOf(e), flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.3 }}>{e.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                        {MONTHS_SHORT[new Date(e.date + 'T00:00').getMonth()]} {new Date(e.date + 'T00:00').getDate()} · {e.allDay ? 'All day' : fmtTime(e.time)}
                      </div>
                    </div>
                  </button>
                ));
              })()}
            </div>

            {/* My calendars legend */}
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.5px' }}>
                My calendars
              </div>
              {[{ label: 'Events', color: DEFAULT_COLOR }, { label: 'Birthdays', color: '#33b679' }, { label: 'Tasks', color: '#7986cb' }].map((c) => (
                <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', fontSize: 12, color: 'var(--color-text)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          {/* Main area */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {view === 'month' && <MonthView cursor={cursor} todayKey={todayKey} eventsByDay={eventsByDay} onPick={setSelected} onCreateOn={(d) => openCreate(d)} />}
            {view === 'schedule' && <ScheduleView events={searchQuery ? filteredEvents : events} nameById={nameById} onPick={setSelected} />}
            {(view === 'week' || view === 'day') && (
              <TimeGrid ref={gridRef} days={view === 'day' ? [cursor] : weekDays(cursor)}
                todayKey={todayKey} eventsByDay={eventsByDay} onPick={setSelected} onCreateAt={openCreate} />
            )}
          </div>

          {/* Right sidebar — event detail / create form */}
          {(selected || creating) && (
            <aside style={{
              width: 340, flexShrink: 0, borderLeft: '1px solid var(--color-border)',
              background: 'var(--color-bg)', overflowY: 'auto',
            }}>
              {creating ? (
                <CreateForm form={creating} setForm={setCreating as any} directory={directory}
                  onSubmit={submitCreate} onCancel={() => setCreating(null)} />
              ) : selected ? (
                <EventDetail e={selected} nameById={nameById} onClose={() => setSelected(null)}
                  onDelete={async () => { await onDelete(selected.id); setSelected(null); }}
                  onJoin={() => onJoin(selected)} />
              ) : null}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── styles ─── */
const iconBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32,
  border: 'none', borderRadius: '50%', background: 'transparent', color: 'var(--color-text-secondary)',
  cursor: 'pointer',
};
const todayBtn: React.CSSProperties = {
  padding: '6px 16px', border: '1px solid var(--color-border)', borderRadius: 6,
  background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer',
  fontSize: 13, fontWeight: 600,
};
const createBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', border: 'none',
  borderRadius: 20, background: 'var(--color-primary)', color: '#fff', cursor: 'pointer',
  fontSize: 13, fontWeight: 600, boxShadow: '0 1px 3px rgba(0,0,0,.2)',
};

/* ─── Mini calendar sidebar ─── */
function MiniCalendar({ cursor, setCursor, todayKey, eventsByDay, onDayClick }: {
  cursor: Date; setCursor: (d: Date) => void; todayKey: string;
  eventsByDay: Map<string, CalendarEvent[]>; onDayClick: (d: Date) => void;
}) {
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = weekStart(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
          {MONTHS_SHORT[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            style={{ ...iconBtn, width: 24, height: 24 }}><ChevronLeft size={14} /></button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            style={{ ...iconBtn, width: 24, height: 24 }}><ChevronRight size={14} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {WEEKDAYS_SHORT.map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', padding: '2px 0' }}>{w}</div>
        ))}
        {cells.map((d, i) => {
          const key = toKey(d); const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = key === todayKey; const hasEvents = eventsByDay.has(key);
          return (
            <button key={i} onClick={() => onDayClick(d)} style={{
              width: 26, height: 26, margin: '0 auto', border: 'none', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              fontSize: 11, fontWeight: isToday ? 700 : 400, position: 'relative',
              background: isToday ? 'var(--color-primary)' : 'transparent',
              color: isToday ? '#fff' : inMonth ? 'var(--color-text)' : 'var(--color-text-tertiary)',
            }}>
              {d.getDate()}
              {hasEvents && !isToday && (
                <span style={{ position: 'absolute', bottom: 1, width: 4, height: 4, borderRadius: '50%', background: 'var(--color-primary)' }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── helpers ─── */
function weekStart(d: Date) { const s = new Date(d); s.setDate(d.getDate() - d.getDay()); s.setHours(0, 0, 0, 0); return s; }
function weekDays(d: Date) { const s = weekStart(d); return Array.from({ length: 7 }, (_, i) => { const x = new Date(s); x.setDate(s.getDate() + i); return x; }); }

/* ─── Month view ─── */
function MonthView({ cursor, todayKey, eventsByDay, onPick, onCreateOn }: {
  cursor: Date; todayKey: string; eventsByDay: Map<string, CalendarEvent[]>;
  onPick: (e: CalendarEvent) => void; onCreateOn: (date: string) => void;
}) {
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = weekStart(monthStart);
  const cells = Array.from({ length: 42 }, (_, i) => { const d = new Date(gridStart); d.setDate(gridStart.getDate() + i); return d; });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--color-border)' }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: '0.5px' }}>{w}</div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '1fr', minHeight: 0 }}>
        {cells.map((d, i) => {
          const key = toKey(d); const inMonth = d.getMonth() === cursor.getMonth(); const isToday = key === todayKey;
          const evs = eventsByDay.get(key) ?? [];
          return (
            <div key={i} onClick={() => onCreateOn(key)} style={{
              borderRight: (i % 7 !== 6) ? '1px solid var(--color-border)' : undefined,
              borderBottom: '1px solid var(--color-border)', padding: '4px 6px',
              overflow: 'hidden', cursor: 'pointer',
              background: isToday ? 'var(--color-primary-light)' : inMonth ? 'transparent' : 'var(--color-bg)',
              display: 'flex', flexDirection: 'column', gap: 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 2 }}>
                <span style={{
                  fontSize: 12, fontWeight: 500, width: 24, height: 24, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', borderRadius: '50%',
                  background: isToday ? 'var(--color-primary)' : 'transparent',
                  color: isToday ? '#fff' : inMonth ? 'var(--color-text)' : 'var(--color-text-tertiary)',
                }}>{d.getDate()}</span>
              </div>
              {evs.slice(0, 3).map((e) => (
                <button key={e.id} onClick={(ev) => { ev.stopPropagation(); onPick(e); }} style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '1px 6px', border: 'none',
                  borderRadius: 4, background: e.allDay ? colorOf(e) : `${colorOf(e)}20`,
                  color: e.allDay ? '#fff' : 'var(--color-text)',
                  cursor: 'pointer', fontSize: 11, textAlign: 'left', overflow: 'hidden',
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: '100%', lineHeight: '18px',
                }}>
                  {!e.allDay && <span style={{ width: 6, height: 6, borderRadius: '50%', background: colorOf(e), flexShrink: 0 }} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.allDay ? e.title : `${fmtTime(e.time)} ${e.title}`}
                  </span>
                </button>
              ))}
              {evs.length > 3 && (
                <span style={{ fontSize: 10, color: 'var(--color-text-secondary)', paddingLeft: 2, fontWeight: 600 }}>
                  +{evs.length - 3} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Time grid (week / day) ─── */
const TimeGrid = React.forwardRef<HTMLDivElement, {
  days: Date[]; todayKey: string; eventsByDay: Map<string, CalendarEvent[]>;
  onPick: (e: CalendarEvent) => void; onCreateAt: (date: string, time: string) => void;
}>(function TimeGrid({ days, todayKey, eventsByDay, onPick, onCreateAt }, ref) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const isMultiDay = days.length > 1;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* All-day row */}
      <div style={{
        display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, 1fr)`,
        borderBottom: '1px solid var(--color-border)', minHeight: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-text-tertiary)' }}>
          ALL DAY
        </div>
        {days.map((d) => {
          const key = toKey(d);
          const allDayEvs = (eventsByDay.get(key) ?? []).filter((e) => e.allDay);
          return (
            <div key={key} style={{ borderLeft: '1px solid var(--color-border)', padding: '2px 4px', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {allDayEvs.map((e) => (
                <button key={e.id} onClick={() => onPick(e)} style={{
                  padding: '1px 6px', border: 'none', borderRadius: 4, background: colorOf(e),
                  color: '#fff', cursor: 'pointer', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
                  overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%',
                }}>{e.title}</button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Day headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, 1fr)`,
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div />
        {days.map((d) => {
          const isToday = toKey(d) === todayKey;
          return (
            <div key={toKey(d)} style={{ padding: '6px 4px', textAlign: 'center', borderLeft: '1px solid var(--color-border)' }}>
              <div style={{ fontSize: 11, color: isToday ? 'var(--color-primary)' : 'var(--color-text-tertiary)', fontWeight: 600, letterSpacing: '0.5px' }}>
                {WEEKDAYS[d.getDay()]}
              </div>
              <div style={{
                fontSize: isMultiDay ? 22 : 28, fontWeight: 400, lineHeight: 1.2,
                color: isToday ? '#fff' : 'var(--color-text)',
                background: isToday ? 'var(--color-primary)' : 'transparent',
                borderRadius: '50%', width: isMultiDay ? 36 : 44, height: isMultiDay ? 36 : 44,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time slots */}
      <div ref={ref} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: `56px repeat(${days.length}, 1fr)`, position: 'relative' }}>
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_H, position: 'relative' }}>
                <span style={{
                  position: 'absolute', top: -8, right: 8, fontSize: 10, color: 'var(--color-text-tertiary)',
                  fontWeight: 500,
                }}>{h === 0 ? '' : `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`}</span>
              </div>
            ))}
          </div>
          {days.map((d) => {
            const key = toKey(d);
            const evs = (eventsByDay.get(key) ?? []).filter((e) => !e.allDay);
            const isToday = key === todayKey;
            const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
            return (
              <div key={key} style={{ borderLeft: '1px solid var(--color-border)', position: 'relative' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const min = Math.max(0, Math.round((y / HOUR_H) * 60 / 30) * 30);
                  onCreateAt(key, `${pad(Math.floor(min / 60))}:${pad(min % 60)}`);
                }}>
                {hours.map((h) => (
                  <div key={h} style={{
                    height: HOUR_H, borderBottom: '1px solid var(--color-border)',
                    background: isToday ? 'var(--color-primary-light)' : 'transparent',
                    opacity: isToday ? 0.25 : 1,
                  }} />
                ))}
                {/* Current time indicator */}
                {isToday && (
                  <div style={{
                    position: 'absolute', left: -1, right: 0, top: (nowMin / 60) * HOUR_H,
                    height: 2, background: '#ea4335', zIndex: 4, pointerEvents: 'none',
                  }}>
                    <span style={{
                      position: 'absolute', left: -5, top: -4, width: 10, height: 10,
                      borderRadius: '50%', background: '#ea4335',
                    }} />
                  </div>
                )}
                {/* Events */}
                {evs.map((ev) => {
                  const top = (minutesOf(ev.time) / 60) * HOUR_H;
                  const height = Math.max((ev.durationMins / 60) * HOUR_H, 24);
                  const c = colorOf(ev);
                  return (
                    <button key={ev.id} onClick={(e) => { e.stopPropagation(); onPick(ev); }} style={{
                      position: 'absolute', top, left: 4, right: 4, height: height - 2,
                      padding: '4px 8px', border: 'none', borderRadius: 6,
                      background: c, color: '#fff', cursor: 'pointer',
                      textAlign: 'left', overflow: 'hidden', zIndex: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,.15)',
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                      <div style={{ fontSize: 11, opacity: 0.9 }}>{fmtTime(ev.time)} – {fmtTime(endTime(ev))}</div>
                      {ev.location && <div style={{ fontSize: 10, opacity: 0.8, marginTop: 1 }}><MapPin size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> {ev.location}</div>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

/* ─── Schedule (agenda) view ─── */
function ScheduleView({ events, nameById, onPick }: {
  events: CalendarEvent[]; nameById: Map<string, Member>; onPick: (e: CalendarEvent) => void;
}) {
  const upcoming = [...events]
    .filter((e) => parseDT(e) >= new Date(new Date().toDateString()))
    .sort((a, b) => parseDT(a).getTime() - parseDT(b).getTime());
  const groups = new Map<string, CalendarEvent[]>();
  for (const e of upcoming) { const list = groups.get(e.date) ?? []; list.push(e); groups.set(e.date, list); }
  const todayKey = toKey(new Date());

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
      {[...groups.entries()].map(([date, evs]) => {
        const d = new Date(date + 'T00:00');
        const isToday = date === todayKey;
        return (
          <div key={date} style={{ marginBottom: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, paddingBottom: 8,
              borderBottom: '1px solid var(--color-border)',
            }}>
              <div style={{
                textAlign: 'center', minWidth: 48,
                color: isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{WEEKDAYS[d.getDay()]}</div>
                <div style={{
                  fontSize: 24, fontWeight: 400, lineHeight: 1,
                  background: isToday ? 'var(--color-primary)' : 'transparent',
                  color: isToday ? '#fff' : 'var(--color-text)',
                  borderRadius: '50%', width: 40, height: 40,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '2px auto 0',
                }}>{d.getDate()}</div>
              </div>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                {MONTHS[d.getMonth()]} {d.getFullYear()}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 60 }}>
              {evs.map((e) => {
                const attendees = e.attendees.map((id) => nameById.get(id)).filter(Boolean) as Member[];
                return (
                  <button key={e.id} onClick={() => onPick(e)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', border: 'none', borderRadius: 8,
                    borderLeft: `4px solid ${colorOf(e)}`,
                    background: 'var(--color-bg-elevated)', cursor: 'pointer', textAlign: 'left',
                    boxShadow: '0 1px 2px rgba(0,0,0,.06)',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text)' }}>{e.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {e.allDay ? 'All day' : `${fmtTime(e.time)} – ${fmtTime(endTime(e))}`}
                        {e.location && <> · <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {e.location}</>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {e.meetingCode && <Video size={15} style={{ color: 'var(--color-primary)' }} />}
                      {e.recurrence && e.recurrence !== 'none' && <Repeat size={13} style={{ color: 'var(--color-text-tertiary)' }} />}
                      {attendees.length > 0 && (
                        <div style={{ display: 'flex', marginLeft: 4 }}>
                          {attendees.slice(0, 3).map((a, i) => (
                            <span key={a.id} style={{
                              width: 22, height: 22, borderRadius: '50%', background: avatarColor(a.id),
                              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, fontWeight: 700, border: '2px solid var(--color-bg-elevated)',
                              marginLeft: i > 0 ? -6 : 0,
                            }}>{initials(a.name)}</span>
                          ))}
                          {attendees.length > 3 && (
                            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginLeft: 4 }}>+{attendees.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {upcoming.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <CalendarDays size={48} style={{ color: 'var(--color-text-tertiary)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 15 }}>No upcoming events</p>
          <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13 }}>Events you create will appear here</p>
        </div>
      )}
    </div>
  );
}

/* ─── RSVP badge ─── */
function RsvpBadge({ status }: { status?: RsvpStatus }) {
  if (!status || status === 'pending') return null;
  const map: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    accepted: { icon: <Check size={12} />, label: 'Accepted', color: '#33b679' },
    declined: { icon: <XCircle size={12} />, label: 'Declined', color: '#ea4335' },
    tentative: { icon: <HelpCircle size={12} />, label: 'Maybe', color: '#f6bf26' },
  };
  const m = map[status];
  if (!m) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
      borderRadius: 12, background: `${m.color}18`, color: m.color, fontSize: 11, fontWeight: 600,
    }}>{m.icon} {m.label}</span>
  );
}

/* ─── Event detail sidebar ─── */
function EventDetail({ e, nameById, onClose, onDelete, onJoin }: {
  e: CalendarEvent; nameById: Map<string, Member>;
  onClose: () => void; onDelete: () => void; onJoin: () => void;
}) {
  const attendees = e.attendees.map((id) => nameById.get(id)).filter(Boolean) as Member[];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Colored header */}
      <div style={{
        background: colorOf(e), padding: '16px 20px', color: '#fff', position: 'relative',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, marginBottom: 8 }}>
          <button onClick={onDelete} style={{ ...iconBtn, color: 'rgba(255,255,255,.8)' }} title="Delete"><Trash2 size={16} /></button>
          <button onClick={onClose} style={{ ...iconBtn, color: 'rgba(255,255,255,.8)' }}><X size={16} /></button>
        </div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{e.title}</h3>
        <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
          {new Date(e.date + 'T00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        {!e.allDay && (
          <div style={{ fontSize: 13, opacity: 0.9 }}>{fmtTime(e.time)} – {fmtTime(endTime(e))}</div>
        )}
        {e.allDay && <div style={{ fontSize: 13, opacity: 0.9 }}>All day</div>}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>
        {/* RSVP status */}
        {e.rsvpStatus && <RsvpBadge status={e.rsvpStatus} />}

        {/* Recurrence */}
        {e.recurrence && e.recurrence !== 'none' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            <Repeat size={15} /> {RECURRENCE_LABELS[e.recurrence]}
          </div>
        )}

        {/* Location */}
        {e.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            <MapPin size={15} /> {e.location}
          </div>
        )}

        {/* Description */}
        {e.description && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--color-text)' }}>
            <AlignLeft size={15} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: 2 }} />
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{e.description}</div>
          </div>
        )}

        {/* Meeting link */}
        {e.meetingCode && (
          <div style={{
            padding: 12, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              <Video size={14} style={{ color: 'var(--color-primary)' }} /> Connect Meeting
            </div>
            <code style={{ fontSize: 12, color: 'var(--color-text-tertiary)', wordBreak: 'break-all' }}>connect.meet/{e.meetingCode}</code>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onJoin} style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', border: 'none', borderRadius: 6, background: 'var(--color-primary)',
                color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}><Video size={14} /> Join meeting</button>
              <button onClick={() => navigator.clipboard?.writeText(`connect.meet/${e.meetingCode}`)}
                title="Copy link" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 10px',
                  border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)',
                  color: 'var(--color-text)', cursor: 'pointer',
                }}><Copy size={14} /></button>
            </div>
          </div>
        )}

        {/* Attendees */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            <Users size={14} /> {attendees.length} guest{attendees.length !== 1 ? 's' : ''}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {attendees.map((a) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', background: avatarColor(a.id),
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                }}>{initials(a.name)}</span>
                <span style={{ fontSize: 13 }}>{a.name}</span>
              </div>
            ))}
            {attendees.length === 0 && <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>No guests</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Create form ─── */
type CreateFormData = {
  title: string; date: string; time: string; durationMins: number;
  withMeet: boolean; attendeeIds: string[];
  description: string; location: string; color: string; allDay: boolean;
  recurrence: RecurrenceRule;
};

function CreateForm({ form, setForm, directory, onSubmit, onCancel }: {
  form: CreateFormData; setForm: (f: CreateFormData) => void;
  directory: Member[]; onSubmit: () => void; onCancel: () => void;
}) {
  const [colorOpen, setColorOpen] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const inp: React.CSSProperties = {
    padding: '8px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
    background: 'var(--color-bg-elevated)', color: 'var(--color-text)', fontSize: 13, width: '100%',
  };
  const toggle = (id: string) =>
    setForm({ ...form, attendeeIds: form.attendeeIds.includes(id) ? form.attendeeIds.filter((x) => x !== id) : [...form.attendeeIds, id] });

  const filteredDir = guestSearch.trim()
    ? directory.filter((d) => d.name.toLowerCase().includes(guestSearch.toLowerCase()))
    : directory;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with color strip */}
      <div style={{ background: form.color, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#fff' }}>New event</h3>
        <button onClick={onCancel} style={{ ...iconBtn, color: 'rgba(255,255,255,.8)' }}><X size={16} /></button>
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>
        {/* Title */}
        <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Add title" style={{ ...inp, fontSize: 16, fontWeight: 600, border: 'none', borderBottom: '2px solid var(--color-border)', borderRadius: 0, padding: '8px 0' }} />

        {/* All day toggle */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
          <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
            style={{ accentColor: 'var(--color-primary)' }} />
          All day
        </label>

        {/* Date & time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ ...inp, flex: 1 }} />
            {!form.allDay && (
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={{ ...inp, flex: 1 }} />
            )}
          </div>
        </div>

        {/* Duration */}
        {!form.allDay && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 24 }}>
            <select value={form.durationMins} onChange={(e) => setForm({ ...form, durationMins: Number(e.target.value) })} style={inp}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d >= 60 ? `${Math.floor(d / 60)} hr${d > 60 && d % 60 ? ` ${d % 60} min` : d > 60 ? 's' : ''}` : `${d} min`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Recurrence */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Repeat size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value as RecurrenceRule })} style={inp}>
            {(Object.keys(RECURRENCE_LABELS) as RecurrenceRule[]).map((r) => (
              <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MapPin size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Add location" style={inp} />
        </div>

        {/* Description */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <AlignLeft size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginTop: 10 }} />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add description" rows={3}
            style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
        </div>

        {/* Color picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Palette size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <div style={{ position: 'relative' }}>
            <button onClick={() => setColorOpen(!colorOpen)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', border: '1px solid var(--color-border)',
              borderRadius: 6, background: 'var(--color-bg-elevated)', cursor: 'pointer', fontSize: 13, color: 'var(--color-text)',
            }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: form.color }} />
              {EVENT_COLORS.find((c) => c.value === form.color)?.name || 'Custom'}
              <ChevronDown size={12} />
            </button>
            {colorOpen && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, padding: 8,
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.15)', zIndex: 10,
                display: 'flex', flexWrap: 'wrap', gap: 6, width: 200,
              }}>
                {EVENT_COLORS.map((c) => (
                  <button key={c.value} onClick={() => { setForm({ ...form, color: c.value }); setColorOpen(false); }}
                    title={c.name} style={{
                      width: 28, height: 28, borderRadius: '50%', background: c.value,
                      border: form.color === c.value ? '3px solid var(--color-text)' : '2px solid transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                    {form.color === c.value && <Check size={14} style={{ color: '#fff' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video meeting */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
          <Video size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <input type="checkbox" checked={form.withMeet} onChange={(e) => setForm({ ...form, withMeet: e.target.checked })}
            style={{ accentColor: 'var(--color-primary)' }} />
          Add Connect video meeting
        </label>

        {/* Guests */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Users size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
            <input value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)}
              placeholder="Add guests" style={inp} />
          </div>
          {form.attendeeIds.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8, paddingLeft: 24 }}>
              {form.attendeeIds.map((id) => {
                const m = directory.find((d) => d.id === id);
                if (!m) return null;
                return (
                  <span key={id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 4px',
                    borderRadius: 16, background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                    fontSize: 12,
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', background: avatarColor(id),
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700,
                    }}>{initials(m.name)}</span>
                    {m.name}
                    <button onClick={() => toggle(id)} style={{ ...iconBtn, width: 16, height: 16, marginLeft: 2 }}><X size={12} /></button>
                  </span>
                );
              })}
            </div>
          )}
          <div style={{ maxHeight: 140, overflowY: 'auto', paddingLeft: 24 }}>
            {filteredDir.filter((d) => !form.attendeeIds.includes(d.id)).map((d) => (
              <button key={d.id} onClick={() => toggle(d.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', width: '100%',
                borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%', background: avatarColor(d.id),
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700,
                }}>{initials(d.name)}</span>
                <div>
                  <div style={{ fontSize: 13 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{d.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid var(--color-border)',
        display: 'flex', gap: 8, justifyContent: 'flex-end',
      }}>
        <button onClick={onCancel} style={{
          padding: '8px 20px', border: '1px solid var(--color-border)', borderRadius: 6,
          background: 'var(--color-bg)', color: 'var(--color-text)', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>Cancel</button>
        <button onClick={onSubmit} disabled={!form.title.trim()} style={{
          padding: '8px 24px', border: 'none', borderRadius: 6,
          background: form.title.trim() ? 'var(--color-primary)' : 'var(--color-border)',
          color: '#fff', cursor: form.title.trim() ? 'pointer' : 'default',
          fontSize: 13, fontWeight: 600,
        }}>Save</button>
      </div>
    </div>
  );
}
