'use client';
import styles from './Calendar.module.css';
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
    <div onClick={onClose} className={styles.s1}>
      <div onClick={(e) => e.stopPropagation()} className={styles.s2}>
        {/* ─── Top bar ─── */}
        <div className={styles.s3}>
          <CalendarDays size={24} className={styles.s4} />
          <span className={styles.s5}>Calendar</span>

          <button onClick={goToday} style={todayBtn}>Today</button>

          <div className={styles.s6}>
            <button onClick={() => move(-1)} style={iconBtn}><ChevronLeft size={18} /></button>
            <button onClick={() => move(1)} style={iconBtn}><ChevronRight size={18} /></button>
          </div>

          <h2 className={styles.s7}>{headerLabel()}</h2>

          <div className={styles.s8}>
            {/* Search */}
            {searchOpen ? (
              <div className={styles.s9}>
                <Search size={14} className="ui-text-tertiary" />
                <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events" className={styles.s10} />
                <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} style={{ ...iconBtn }} className={styles.s11}><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} style={iconBtn} title="Search events"><Search size={18} /></button>
            )}

            {/* View switcher */}
            <div className="relative">
              <button onClick={() => setViewMenuOpen(!viewMenuOpen)} className={styles.s12}>
                {view === 'schedule' ? 'Schedule' : view.charAt(0).toUpperCase() + view.slice(1)}
                <ChevronDown size={14} />
              </button>
              {viewMenuOpen && (
                <div className={styles.s13}>
                  {(['day', 'week', 'month', 'schedule'] as View[]).map((v) => (
                    <button key={v} onClick={() => { setView(v); setViewMenuOpen(false); }} style={{ background: view === v ? 'var(--color-primary-light)' : 'transparent', color: view === v ? 'var(--color-primary)' : 'var(--color-text)', fontWeight: view === v ? 600 : 400 }} className={styles.s14}>
                      {v === 'schedule' ? 'Schedule' : v.charAt(0).toUpperCase() + v.slice(1)}
                      <span className={styles.s15}>
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
        <div className={styles.s16}>
          {/* Left sidebar — mini calendar + upcoming */}
          <div className={styles.s17}>
            <MiniCalendar cursor={miniCursor} setCursor={setMiniCursor} todayKey={todayKey}
              eventsByDay={eventsByDay} onDayClick={handleMiniDayClick} />

            {/* Upcoming events */}
            <div className={styles.s18}>
              <div className={styles.s19}>
                Upcoming
              </div>
              {(() => {
                const upcoming = [...events]
                  .filter((e) => parseDT(e) >= new Date(new Date().toDateString()))
                  .sort((a, b) => parseDT(a).getTime() - parseDT(b).getTime())
                  .slice(0, 5);
                if (upcoming.length === 0) return <p className={styles.s20}>No upcoming events</p>;
                return upcoming.map((e) => (
                  <button key={e.id} onClick={() => setSelected(e)} className={styles.s21}>
                    <span style={{ background: colorOf(e) }} className={styles.s22} />
                    <div>
                      <div className={styles.s23}>{e.title}</div>
                      <div className="ui-text-caption ui-text-tertiary">
                        {MONTHS_SHORT[new Date(e.date + 'T00:00').getMonth()]} {new Date(e.date + 'T00:00').getDate()} · {e.allDay ? 'All day' : fmtTime(e.time)}
                      </div>
                    </div>
                  </button>
                ));
              })()}
            </div>

            {/* My calendars legend */}
            <div className={styles.s24}>
              <div className={styles.s25}>
                My calendars
              </div>
              {[{ label: 'Events', color: DEFAULT_COLOR }, { label: 'Birthdays', color: '#33b679' }, { label: 'Tasks', color: '#7986cb' }].map((c) => (
                <div key={c.label} className={styles.s26}>
                  <span style={{ background: c.color }} className={styles.s27} />
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          {/* Main area */}
          <div className={styles.s28}>
            {view === 'month' && <MonthView cursor={cursor} todayKey={todayKey} eventsByDay={eventsByDay} onPick={setSelected} onCreateOn={(d) => openCreate(d)} />}
            {view === 'schedule' && <ScheduleView events={searchQuery ? filteredEvents : events} nameById={nameById} onPick={setSelected} />}
            {(view === 'week' || view === 'day') && (
              <TimeGrid ref={gridRef} days={view === 'day' ? [cursor] : weekDays(cursor)}
                todayKey={todayKey} eventsByDay={eventsByDay} onPick={setSelected} onCreateAt={openCreate} />
            )}
          </div>

          {/* Right sidebar — event detail / create form */}
          {(selected || creating) && (
            <aside className={styles.s29}>
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
    <div className={styles.s30}>
      <div className={styles.s31}>
        <span className={styles.s32}>
          {MONTHS_SHORT[cursor.getMonth()]} {cursor.getFullYear()}
        </span>
        <div className={styles.s6}>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            style={{ ...iconBtn }} className={styles.s33}><ChevronLeft size={14} /></button>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            style={{ ...iconBtn }} className={styles.s33}><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className={styles.s34}>
        {WEEKDAYS_SHORT.map((w, i) => (
          <div key={i} className={styles.s35}>{w}</div>
        ))}
        {cells.map((d, i) => {
          const key = toKey(d); const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = key === todayKey; const hasEvents = eventsByDay.has(key);
          return (
            <button key={i} onClick={() => onDayClick(d)} style={{ fontWeight: isToday ? 700 : 400, background: isToday ? 'var(--color-primary)' : 'transparent', color: isToday ? '#fff' : inMonth ? 'var(--color-text)' : 'var(--color-text-tertiary)' }} className={styles.s36}>
              {d.getDate()}
              {hasEvents && !isToday && (
                <span className={styles.s37} />
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
    <div className={styles.s38}>
      <div className={styles.s39}>
        {WEEKDAYS.map((w) => (
          <div key={w} className={styles.s40}>{w}</div>
        ))}
      </div>
      <div className={styles.s41}>
        {cells.map((d, i) => {
          const key = toKey(d); const inMonth = d.getMonth() === cursor.getMonth(); const isToday = key === todayKey;
          const evs = eventsByDay.get(key) ?? [];
          return (
            <div key={i} onClick={() => onCreateOn(key)} style={{ borderRight: (i % 7 !== 6) ? '1px solid var(--color-border)' : undefined, background: isToday ? 'var(--color-primary-light)' : inMonth ? 'transparent' : 'var(--color-bg)' }} className={styles.s42}>
              <div className={styles.s43}>
                <span style={{ background: isToday ? 'var(--color-primary)' : 'transparent', color: isToday ? '#fff' : inMonth ? 'var(--color-text)' : 'var(--color-text-tertiary)' }} className={styles.s44}>{d.getDate()}</span>
              </div>
              {evs.slice(0, 3).map((e) => (
                <button key={e.id} onClick={(ev) => { ev.stopPropagation(); onPick(e); }} style={{ background: e.allDay ? colorOf(e) : `${colorOf(e)}20`, color: e.allDay ? '#fff' : 'var(--color-text)' }} className={styles.s45}>
                  {!e.allDay && <span style={{ background: colorOf(e) }} className={styles.s46} />}
                  <span className={styles.s47}>
                    {e.allDay ? e.title : `${fmtTime(e.time)} ${e.title}`}
                  </span>
                </button>
              ))}
              {evs.length > 3 && (
                <span className={styles.s48}>
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
    <div className={styles.s38}>
      {/* All-day row */}
      <div style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }} className={styles.s49}>
        <div className={styles.s50}>
          ALL DAY
        </div>
        {days.map((d) => {
          const key = toKey(d);
          const allDayEvs = (eventsByDay.get(key) ?? []).filter((e) => e.allDay);
          return (
            <div key={key} className={styles.s51}>
              {allDayEvs.map((e) => (
                <button key={e.id} onClick={() => onPick(e)} style={{ background: colorOf(e) }} className={styles.s52}>{e.title}</button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Day headers */}
      <div style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }} className={styles.s53}>
        <div />
        {days.map((d) => {
          const isToday = toKey(d) === todayKey;
          return (
            <div key={toKey(d)} className={styles.s54}>
              <div style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }} className={styles.s55}>
                {WEEKDAYS[d.getDay()]}
              </div>
              <div style={{ fontSize: isMultiDay ? 22 : 28, color: isToday ? '#fff' : 'var(--color-text)', background: isToday ? 'var(--color-primary)' : 'transparent', width: isMultiDay ? 36 : 44, height: isMultiDay ? 36 : 44 }} className={styles.s56}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time slots */}
      <div ref={ref} className={styles.s57}>
        <div style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }} className={styles.s58}>
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_H }} className={styles.s59}>
                <span className={styles.s60}>{h === 0 ? '' : `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`}</span>
              </div>
            ))}
          </div>
          {days.map((d) => {
            const key = toKey(d);
            const evs = (eventsByDay.get(key) ?? []).filter((e) => !e.allDay);
            const isToday = key === todayKey;
            const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
            return (
              <div key={key} className={styles.s61}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const y = e.clientY - rect.top;
                  const min = Math.max(0, Math.round((y / HOUR_H) * 60 / 30) * 30);
                  onCreateAt(key, `${pad(Math.floor(min / 60))}:${pad(min % 60)}`);
                }}>
                {hours.map((h) => (
                  <div key={h} style={{ height: HOUR_H, background: isToday ? 'var(--color-primary-light)' : 'transparent', opacity: isToday ? 0.25 : 1 }} className={styles.s62} />
                ))}
                {/* Current time indicator */}
                {isToday && (
                  <div style={{ top: (nowMin / 60) * HOUR_H }} className={styles.s63}>
                    <span className={styles.s64} />
                  </div>
                )}
                {/* Events */}
                {evs.map((ev) => {
                  const top = (minutesOf(ev.time) / 60) * HOUR_H;
                  const height = Math.max((ev.durationMins / 60) * HOUR_H, 24);
                  const c = colorOf(ev);
                  return (
                    <button key={ev.id} onClick={(e) => { e.stopPropagation(); onPick(ev); }} style={{ top: top, height: height - 2, background: c }} className={styles.s65}>
                      <div className={styles.s66}>{ev.title}</div>
                      <div className={styles.s67}>{fmtTime(ev.time)} – {fmtTime(endTime(ev))}</div>
                      {ev.location && <div className={styles.s68}><MapPin size={10} className={styles.s69} /> {ev.location}</div>}
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
    <div className={styles.s70}>
      {[...groups.entries()].map(([date, evs]) => {
        const d = new Date(date + 'T00:00');
        const isToday = date === todayKey;
        return (
          <div key={date} className={styles.s71}>
            <div className={styles.s72}>
              <div style={{ color: isToday ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} className={styles.s73}>
                <div className={styles.s74}>{WEEKDAYS[d.getDay()]}</div>
                <div style={{ background: isToday ? 'var(--color-primary)' : 'transparent', color: isToday ? '#fff' : 'var(--color-text)' }} className={styles.s75}>{d.getDate()}</div>
              </div>
              <span className={styles.s76}>
                {MONTHS[d.getMonth()]} {d.getFullYear()}
              </span>
            </div>
            <div className={styles.s77}>
              {evs.map((e) => {
                const attendees = e.attendees.map((id) => nameById.get(id)).filter(Boolean) as Member[];
                return (
                  <button key={e.id} onClick={() => onPick(e)} style={{ borderLeft: `4px solid ${colorOf(e)}` }} className={styles.s78}>
                    <div className="flex-1">
                      <div className={styles.s79}>{e.title}</div>
                      <div className={styles.s80}>
                        {e.allDay ? 'All day' : `${fmtTime(e.time)} – ${fmtTime(endTime(e))}`}
                        {e.location && <> · <MapPin size={11} className={styles.s69} /> {e.location}</>}
                      </div>
                    </div>
                    <div className="ui-flex ui-items-center ui-gap-1">
                      {e.meetingCode && <Video size={15} className="ui-text-primary" />}
                      {e.recurrence && e.recurrence !== 'none' && <Repeat size={13} className="ui-text-tertiary" />}
                      {attendees.length > 0 && (
                        <div className={styles.s81}>
                          {attendees.slice(0, 3).map((a, i) => (
                            <span key={a.id} style={{ background: avatarColor(a.id), marginLeft: i > 0 ? -6 : 0 }} className={styles.s82}>{initials(a.name)}</span>
                          ))}
                          {attendees.length > 3 && (
                            <span className={styles.s83}>+{attendees.length - 3}</span>
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
        <div className={styles.s84}>
          <CalendarDays size={48} className={styles.s85} />
          <p className={styles.s86}>No upcoming events</p>
          <p className={styles.s87}>Events you create will appear here</p>
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
    <span style={{ background: `${m.color}18`, color: m.color }} className={styles.s88}>{m.icon} {m.label}</span>
  );
}

/* ─── Event detail sidebar ─── */
function EventDetail({ e, nameById, onClose, onDelete, onJoin }: {
  e: CalendarEvent; nameById: Map<string, Member>;
  onClose: () => void; onDelete: () => void; onJoin: () => void;
}) {
  const attendees = e.attendees.map((id) => nameById.get(id)).filter(Boolean) as Member[];
  return (
    <div className={styles.s89}>
      {/* Colored header */}
      <div style={{ background: colorOf(e) }} className={styles.s90}>
        <div className={styles.s91}>
          <button onClick={onDelete} style={{ ...iconBtn }} className={styles.s92} title="Delete"><Trash2 size={16} /></button>
          <button onClick={onClose} style={{ ...iconBtn }} className={styles.s92}><X size={16} /></button>
        </div>
        <h3 className={styles.s93}>{e.title}</h3>
        <div className={styles.s94}>
          {new Date(e.date + 'T00:00').toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
        {!e.allDay && (
          <div className={styles.s95}>{fmtTime(e.time)} – {fmtTime(endTime(e))}</div>
        )}
        {e.allDay && <div className={styles.s95}>All day</div>}
      </div>

      <div className={styles.s96}>
        {/* RSVP status */}
        {e.rsvpStatus && <RsvpBadge status={e.rsvpStatus} />}

        {/* Recurrence */}
        {e.recurrence && e.recurrence !== 'none' && (
          <div className={styles.s97}>
            <Repeat size={15} /> {RECURRENCE_LABELS[e.recurrence]}
          </div>
        )}

        {/* Location */}
        {e.location && (
          <div className={styles.s97}>
            <MapPin size={15} /> {e.location}
          </div>
        )}

        {/* Description */}
        {e.description && (
          <div className={styles.s98}>
            <AlignLeft size={15} className={styles.s99} />
            <div className={styles.s100}>{e.description}</div>
          </div>
        )}

        {/* Meeting link */}
        {e.meetingCode && (
          <div className={styles.s101}>
            <div className={styles.s102}>
              <Video size={14} className="ui-text-primary" /> Connect Meeting
            </div>
            <code className={styles.s103}>connect.meet/{e.meetingCode}</code>
            <div className={styles.s104}>
              <button onClick={onJoin} className={styles.s105}><Video size={14} /> Join meeting</button>
              <button onClick={() => navigator.clipboard?.writeText(`connect.meet/${e.meetingCode}`)}
                title="Copy link" className={styles.s106}><Copy size={14} /></button>
            </div>
          </div>
        )}

        {/* Attendees */}
        <div>
          <div className={styles.s107}>
            <Users size={14} /> {attendees.length} guest{attendees.length !== 1 ? 's' : ''}
          </div>
          <div className={styles.s108}>
            {attendees.map((a) => (
              <div key={a.id} className={styles.s109}>
                <span style={{ background: avatarColor(a.id) }} className={styles.s110}>{initials(a.name)}</span>
                <span className={styles.s111}>{a.name}</span>
              </div>
            ))}
            {attendees.length === 0 && <span className={styles.s20}>No guests</span>}
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
    <div className={styles.s89}>
      {/* Header with color strip */}
      <div style={{ background: form.color }} className={styles.s112}>
        <h3 className={styles.s113}>New event</h3>
        <button onClick={onCancel} style={{ ...iconBtn }} className={styles.s92}><X size={16} /></button>
      </div>

      <div className={styles.s96}>
        {/* Title */}
        <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Add title" style={{ ...inp }} className={styles.s114} />

        {/* All day toggle */}
        <label className={styles.s115}>
          <input type="checkbox" checked={form.allDay} onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
            className={styles.s116} />
          All day
        </label>

        {/* Date & time */}
        <div className={styles.s117}>
          <Clock size={16} className={styles.s118} />
          <div className={styles.s119}>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ ...inp }} className={styles.s120} />
            {!form.allDay && (
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} style={{ ...inp }} className={styles.s120} />
            )}
          </div>
        </div>

        {/* Duration */}
        {!form.allDay && (
          <div className={styles.s121}>
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
        <div className={styles.s117}>
          <Repeat size={16} className={styles.s118} />
          <select value={form.recurrence} onChange={(e) => setForm({ ...form, recurrence: e.target.value as RecurrenceRule })} style={inp}>
            {(Object.keys(RECURRENCE_LABELS) as RecurrenceRule[]).map((r) => (
              <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
            ))}
          </select>
        </div>

        {/* Location */}
        <div className={styles.s117}>
          <MapPin size={16} className={styles.s118} />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Add location" style={inp} />
        </div>

        {/* Description */}
        <div className={styles.s122}>
          <AlignLeft size={16} className={styles.s123} />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add description" rows={3}
            style={{ ...inp }} className={styles.s124} />
        </div>

        {/* Color picker */}
        <div className={styles.s117}>
          <Palette size={16} className={styles.s118} />
          <div className="relative">
            <button onClick={() => setColorOpen(!colorOpen)} className={styles.s125}>
              <span style={{ background: form.color }} className={styles.s126} />
              {EVENT_COLORS.find((c) => c.value === form.color)?.name || 'Custom'}
              <ChevronDown size={12} />
            </button>
            {colorOpen && (
              <div className={styles.s127}>
                {EVENT_COLORS.map((c) => (
                  <button key={c.value} onClick={() => { setForm({ ...form, color: c.value }); setColorOpen(false); }}
                    title={c.name} style={{ background: c.value, border: form.color === c.value ? '3px solid var(--color-text)' : '2px solid transparent' }} className={styles.s128}>
                    {form.color === c.value && <Check size={14} className={styles.s129} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Video meeting */}
        <label className={styles.s115}>
          <Video size={16} className={styles.s4} />
          <input type="checkbox" checked={form.withMeet} onChange={(e) => setForm({ ...form, withMeet: e.target.checked })}
            className={styles.s116} />
          Add Connect video meeting
        </label>

        {/* Guests */}
        <div>
          <div className={styles.s130}>
            <Users size={16} className={styles.s118} />
            <input value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)}
              placeholder="Add guests" style={inp} />
          </div>
          {form.attendeeIds.length > 0 && (
            <div className={styles.s131}>
              {form.attendeeIds.map((id) => {
                const m = directory.find((d) => d.id === id);
                if (!m) return null;
                return (
                  <span key={id} className={styles.s132}>
                    <span style={{ background: avatarColor(id) }} className={styles.s133}>{initials(m.name)}</span>
                    {m.name}
                    <button onClick={() => toggle(id)} style={{ ...iconBtn }} className={styles.s134}><X size={12} /></button>
                  </span>
                );
              })}
            </div>
          )}
          <div className={styles.s135}>
            {filteredDir.filter((d) => !form.attendeeIds.includes(d.id)).map((d) => (
              <button key={d.id} onClick={() => toggle(d.id)} className={styles.s136}>
                <span style={{ background: avatarColor(d.id) }} className={styles.s137}>{initials(d.name)}</span>
                <div>
                  <div className={styles.s111}>{d.name}</div>
                  <div className="ui-text-caption ui-text-tertiary">{d.email}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.s138}>
        <button onClick={onCancel} className={styles.s139}>Cancel</button>
        <button onClick={onSubmit} disabled={!form.title.trim()} style={{ background: form.title.trim() ? 'var(--color-primary)' : 'var(--color-border)', cursor: form.title.trim() ? 'pointer' : 'default' }} className={styles.s140}>Save</button>
      </div>
    </div>
  );
}
