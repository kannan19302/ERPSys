'use client';

import React, { useEffect, useState } from 'react';
import { Button, Spinner } from '@unerp/ui';
import { Modal, inputStyle, labelStyle } from './Modal';
import { apiGet, apiSend } from './api';
import styles from './DuplicatesFinder.module.css';

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
          <div className="ui-flex-center p-8">
            <Spinner size="lg" />
          </div>
        )}
        {error && <div className={styles.error}>{error}</div>}
        {!loading && !error && groups.length === 0 && (
          <p className={styles.empty}>
            No duplicate groups detected.
          </p>
        )}
        {!loading && groups.length > 0 && (
          <div className="ui-stack-3">
            {groups.map((g) => (
              <div key={g.key} className={styles.group}>
                <div className="ui-flex-between mb-2">
                  <div>
                    <div className="ui-heading-sm">Group: {g.key}</div>
                    <div className="ui-text-xs-muted">
                      Confidence {Math.round((g.score ?? 0) * 100)}% · {g.records.length} records
                    </div>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => setMergingGroup(g)}>Merge</Button>
                </div>
                <ul className={styles.recordList}>
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
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.field}>
        <label style={labelStyle}>Winner (surviving record)</label>
        <select style={inputStyle} value={winnerId} onChange={(e) => setWinnerId(e.target.value)}>
          {records.map((r) => (
            <option key={r.id} value={r.id}>{(r.firstName as string) || (r.name as string) || (r.email as string) || r.id}</option>
          ))}
        </select>
      </div>
      <div className="builder-table-wrapper">
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHead}>
              <th className={styles.cell}>Field</th>
              {records.map((r) => (
                <th key={r.id} className={styles.cell}>{(r.firstName as string) || (r.name as string) || r.id}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((f) => (
              <tr key={f} className="border-b">
                <td className={styles.fieldCell}>{f}</td>
                {records.map((r) => {
                  const selected = fieldChoices[f] ?? winnerId;
                  const value = r[f] as unknown;
                  return (
                    <td key={r.id} className="p-2">
                      <label className={styles.choice}>
                        <input
                          type="radio"
                          name={`field-${f}`}
                          checked={selected === r.id}
                          onChange={() => setFieldChoices((prev) => ({ ...prev, [f]: r.id }))}
                        />
                        <span className={styles.breakWord}>{value == null ? <em className="ui-text-tertiary">—</em> : String(value)}</span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.footer}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={doMerge} disabled={submitting}>{submitting ? 'Merging…' : 'Confirm Merge'}</Button>
      </div>
    </Modal>
  );
}
