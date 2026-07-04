'use client';

import React, { useEffect, useState } from 'react';
import { Button, Spinner } from '@unerp/ui';
import { Modal, inputStyle, labelStyle } from './Modal';
import { apiGet, apiSend } from './api';

type Entity = 'leads' | 'contacts' | 'accounts' | 'customers';

interface DuplicateRecord {
  id: string;
  [k: string]: unknown;
}
interface DuplicateGroup {
  key: string;
  score: number;
  records: DuplicateRecord[];
}

interface Props {
  entity: Entity;
  onClose: () => void;
  onMerged?: () => void;
}

// GUESSED SHAPE: GET /crm/duplicates/scan?entity=leads -> { data: [{ key, score, records: [...] }] }
export function DuplicatesFinder({ entity, onClose, onMerged }: Props) {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mergingGroup, setMergingGroup] = useState<DuplicateGroup | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await apiGet<DuplicateGroup[]>(`/crm/duplicates/scan?entity=${entity}`);
        if (mounted) setGroups(Array.isArray(data) ? data : []);
      } catch {
        if (mounted) setError('Could not load duplicate groups.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [entity]);

  const displayName = (r: DuplicateRecord): string => {
    const first = (r.firstName as string) || '';
    const last = (r.lastName as string) || '';
    const name = (r.name as string) || `${first} ${last}`.trim();
    const email = (r.email as string) || '';
    return name || email || (r.id as string);
  };

  return (
    <>
      <Modal title={`Find Duplicates — ${entity}`} onClose={onClose} maxWidth="720px">
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
            <Spinner size="lg" />
          </div>
        )}
        {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</div>}
        {!loading && !error && groups.length === 0 && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
            No duplicate groups detected.
          </p>
        )}
        {!loading && groups.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {groups.map((g) => (
              <div key={g.key} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>Group: {g.key}</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                      Confidence {Math.round((g.score ?? 0) * 100)}% · {g.records.length} records
                    </div>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => setMergingGroup(g)}>Merge</Button>
                </div>
                <ul style={{ margin: 0, paddingLeft: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
                  {g.records.map((r) => <li key={r.id}>{displayName(r)}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Modal>
      {mergingGroup && (
        <MergeReviewModal
          entity={entity}
          group={mergingGroup}
          onClose={() => setMergingGroup(null)}
          onMerged={() => { setMergingGroup(null); onMerged?.(); onClose(); }}
        />
      )}
    </>
  );
}

interface MergeReviewProps {
  entity: Entity;
  group: DuplicateGroup;
  onClose: () => void;
  onMerged: () => void;
}

function MergeReviewModal({ entity, group, onClose, onMerged }: MergeReviewProps) {
  const records = group.records;
  const [winnerId, setWinnerId] = useState<string>(records[0]?.id ?? '');
  const [fieldChoices, setFieldChoices] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // union of fields excluding id
  const fields = Array.from(new Set(records.flatMap((r) => Object.keys(r)))).filter((k) => k !== 'id');

  const doMerge = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // GUESSED SHAPE: POST /crm/{entity}/merge  body: { winnerId, loserIds: [...], fieldChoices: { field: recordId } }
      await apiSend(`/crm/${entity}/merge`, 'POST', {
        winnerId,
        loserIds: records.map((r) => r.id).filter((id) => id !== winnerId),
        fieldChoices,
      });
      onMerged();
    } catch {
      setError('Merge failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Review Merge" onClose={onClose} maxWidth="820px">
      {error && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{error}</div>}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <label style={labelStyle}>Winner (surviving record)</label>
        <select style={inputStyle} value={winnerId} onChange={(e) => setWinnerId(e.target.value)}>
          {records.map((r) => (
            <option key={r.id} value={r.id}>{(r.firstName as string) || (r.name as string) || (r.email as string) || r.id}</option>
          ))}
        </select>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
              <th style={{ padding: 'var(--space-2)', textAlign: 'left' }}>Field</th>
              {records.map((r) => (
                <th key={r.id} style={{ padding: 'var(--space-2)', textAlign: 'left' }}>{(r.firstName as string) || (r.name as string) || r.id}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 'var(--space-2)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>{f}</td>
                {records.map((r) => {
                  const selected = fieldChoices[f] ?? winnerId;
                  const value = r[f] as unknown;
                  return (
                    <td key={r.id} style={{ padding: 'var(--space-2)' }}>
                      <label style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'flex-start', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`field-${f}`}
                          checked={selected === r.id}
                          onChange={() => setFieldChoices((prev) => ({ ...prev, [f]: r.id }))}
                        />
                        <span style={{ wordBreak: 'break-word' }}>{value == null ? <em style={{ color: 'var(--color-text-tertiary)' }}>—</em> : String(value)}</span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={doMerge} disabled={submitting}>{submitting ? 'Merging…' : 'Confirm Merge'}</Button>
      </div>
    </Modal>
  );
}
