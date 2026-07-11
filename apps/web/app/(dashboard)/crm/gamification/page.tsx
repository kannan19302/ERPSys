'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, PageHeader, Button, Spinner, Badge, useToast, DataTable, ProtectedComponent, type Column } from '@unerp/ui';
import { Trophy, RefreshCw, Award, Flame, Plus, X } from 'lucide-react';
import { apiGet, apiPost, ApiRequestError } from '../../../../src/lib/api';

interface LeaderboardRow {
  userId: string;
  userName: string;
  rank: number;
  points: number;
  dealsWon: number;
  revenue: number | string;
  activityCount: number;
}

interface StreakRow {
  userId: string;
  userName: string;
  streakType: 'ACTIVITY' | 'DEALS_WON';
  currentStreak: number;
  bestStreak: number;
}

interface BadgeDef {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  criteriaType: string;
  criteriaValue: number | string;
  periodScope: string;
  isActive: boolean;
  _count?: { awards: number };
}

const CRITERIA_TYPES = ['DEALS_WON_COUNT', 'REVENUE_TOTAL', 'ACTIVITY_STREAK', 'FIRST_DEAL', 'DEAL_SIZE_ABOVE'];

export default function GamificationPage() {
  const [tab, setTab] = useState<'leaderboard' | 'streaks' | 'badges'>('leaderboard');
  const [period, setPeriod] = useState('ALL_TIME');
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [streaks, setStreaks] = useState<StreakRow[]>([]);
  const [badges, setBadges] = useState<BadgeDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', icon: 'award', criteriaType: 'DEALS_WON_COUNT', criteriaValue: 1, periodScope: 'ALL_TIME' });
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lb, st, bd] = await Promise.all([
        apiGet<LeaderboardRow[]>(`/crm/gamification/leaderboard?period=${encodeURIComponent(period)}`),
        apiGet<StreakRow[]>('/crm/gamification/streaks'),
        apiGet<BadgeDef[]>('/crm/gamification/badges'),
      ]);
      setLeaderboard(Array.isArray(lb) ? lb : []);
      setStreaks(Array.isArray(st) ? st : []);
      setBadges(Array.isArray(bd) ? bd : []);
    } catch (err) {
      toast.error('Could not load gamification data', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => { load(); }, [load]);

  const recomputeLeaderboard = async () => {
    setBusy(true);
    try {
      await apiPost(`/crm/gamification/leaderboard/recompute?period=${encodeURIComponent(period)}`, {});
      toast.success('Leaderboard recomputed');
      await load();
    } catch (err) {
      toast.error('Recompute failed', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const recomputeStreaks = async () => {
    setBusy(true);
    try {
      const r = await apiPost<{ usersProcessed: number }>('/crm/gamification/streaks/recompute', {});
      toast.success('Streaks recomputed', `${r.usersProcessed} reps processed`);
      await load();
    } catch (err) {
      toast.error('Recompute failed', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const evaluateBadges = async () => {
    setBusy(true);
    try {
      const r = await apiPost<{ evaluated: number; awarded: number }>('/crm/gamification/badges/evaluate', {});
      toast.success('Badge evaluation complete', `${r.awarded} new badge(s) awarded across ${r.evaluated} reps`);
      await load();
    } catch (err) {
      toast.error('Evaluation failed', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const createBadge = async () => {
    setBusy(true);
    try {
      await apiPost('/crm/gamification/badges', form);
      toast.success('Badge created');
      setModalOpen(false);
      setForm({ name: '', description: '', icon: 'award', criteriaType: 'DEALS_WON_COUNT', criteriaValue: 1, periodScope: 'ALL_TIME' });
      await load();
    } catch (err) {
      toast.error('Could not create badge', err instanceof ApiRequestError ? err.message : undefined);
    } finally {
      setBusy(false);
    }
  };

  const leaderboardColumns: Column<LeaderboardRow>[] = [
    { key: 'rank', header: 'Rank', render: (r) => <Badge variant={r.rank <= 3 ? 'success' : 'default'}>#{r.rank}</Badge> },
    { key: 'userName', header: 'Rep' },
    { key: 'points', header: 'Points', align: 'right' },
    { key: 'dealsWon', header: 'Deals Won', align: 'right' },
    { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => `$${Number(r.revenue).toLocaleString()}` },
    { key: 'activityCount', header: 'Activities', align: 'right' },
  ];

  const streakColumns: Column<StreakRow>[] = [
    { key: 'userName', header: 'Rep' },
    { key: 'streakType', header: 'Type' },
    { key: 'currentStreak', header: 'Current Streak', align: 'right', render: (r) => (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        {r.currentStreak > 0 && <Flame size={14} color="var(--color-warning)" />} {r.currentStreak}d
      </span>
    ) },
    { key: 'bestStreak', header: 'Best Streak', align: 'right', render: (r) => `${r.bestStreak}d` },
  ];

  const badgeColumns: Column<BadgeDef>[] = [
    { key: 'name', header: 'Badge', render: (b) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Award size={16} color="var(--color-warning)" /> <strong>{b.name}</strong>
      </div>
    ) },
    { key: 'criteriaType', header: 'Criteria', render: (b) => `${b.criteriaType.replace(/_/g, ' ')} ≥ ${b.criteriaValue}` },
    { key: 'periodScope', header: 'Scope' },
    { key: 'awards', header: 'Awarded', align: 'right', render: (b) => b._count?.awards ?? 0 },
    { key: 'isActive', header: 'Status', render: (b) => <Badge variant={b.isActive ? 'success' : 'default'}>{b.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Gamification & Leaderboards"
        description="Rep/team leaderboards, activity streaks, and badge-style recognition driven by closed-won deals and activity volume (SalesScreen/Ambition-style)."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'CRM', href: '/crm' }, { label: 'Gamification & Leaderboards' }]}
      />

      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--color-border)' }}>
        {(['leaderboard', 'streaks', 'badges'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: 'var(--space-3) var(--space-4)', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              fontWeight: tab === t ? 'var(--weight-semibold)' : 'var(--weight-normal)',
              color: tab === t ? 'var(--color-primary)' : 'var(--color-text-secondary)', textTransform: 'capitalize',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'leaderboard' && (
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)' }}>
            <select value={period} onChange={(e) => setPeriod(e.target.value)} style={{ padding: 'var(--space-2)' }}>
              <option value="ALL_TIME">All Time</option>
              <option value={new Date().toISOString().slice(0, 7)}>This Month</option>
              <option value={`${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`}>This Quarter</option>
              <option value={String(new Date().getFullYear())}>This Year</option>
            </select>
            <ProtectedComponent permission="crm.commission.update">
              <Button variant="primary" onClick={recomputeLeaderboard} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <RefreshCw size={16} /> Recompute
              </Button>
            </ProtectedComponent>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
              <Trophy size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Leaderboard Data</div>
              <div style={{ fontSize: 'var(--text-sm)' }}>Click "Recompute" to rank reps for this period.</div>
            </div>
          ) : (
            <DataTable<LeaderboardRow> columns={leaderboardColumns} data={leaderboard} rowKey={(r) => r.userId} />
          )}
        </Card>
      )}

      {tab === 'streaks' && (
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <ProtectedComponent permission="crm.commission.update">
              <Button variant="primary" onClick={recomputeStreaks} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <RefreshCw size={16} /> Recompute Streaks
              </Button>
            </ProtectedComponent>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
          ) : streaks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
              <Flame size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Streak Data</div>
            </div>
          ) : (
            <DataTable<StreakRow> columns={streakColumns} data={streaks} rowKey={(r) => `${r.userId}-${r.streakType}`} />
          )}
        </Card>
      )}

      {tab === 'badges' && (
        <Card>
          <div style={{ padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between' }}>
            <ProtectedComponent permission="crm.commission.update">
              <Button variant="secondary" onClick={evaluateBadges} disabled={busy} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <RefreshCw size={16} /> Evaluate & Award
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="crm.commission.manage">
              <Button variant="primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Plus size={16} /> New Badge
              </Button>
            </ProtectedComponent>
          </div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>
          ) : badges.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-secondary)' }}>
              <Award size={48} style={{ margin: '0 auto var(--space-4) auto', opacity: 0.3 }} />
              <div style={{ fontWeight: 'var(--weight-semibold)' }}>No Badges Defined</div>
              <div style={{ fontSize: 'var(--text-sm)' }}>Create a badge to start recognizing top performers.</div>
            </div>
          ) : (
            <DataTable<BadgeDef> columns={badgeColumns} data={badges} rowKey={(b) => b.id} />
          )}
        </Card>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <Card>
            <div style={{ padding: 'var(--space-6)', width: '420px', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>New Badge</h3>
                <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <input placeholder="Badge name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ padding: 'var(--space-2)' }} />
              <textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ padding: 'var(--space-2)' }} />
              <select value={form.criteriaType} onChange={(e) => setForm({ ...form, criteriaType: e.target.value })} style={{ padding: 'var(--space-2)' }}>
                {CRITERIA_TYPES.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
              <input type="number" placeholder="Threshold value" value={form.criteriaValue} onChange={(e) => setForm({ ...form, criteriaValue: Number(e.target.value) })} style={{ padding: 'var(--space-2)' }} />
              <select value={form.periodScope} onChange={(e) => setForm({ ...form, periodScope: e.target.value })} style={{ padding: 'var(--space-2)' }}>
                <option value="ALL_TIME">All Time</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
              <Button variant="primary" onClick={createBadge} disabled={busy || !form.name}>Create Badge</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
