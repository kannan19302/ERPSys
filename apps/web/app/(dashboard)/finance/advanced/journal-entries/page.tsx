'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpDown, Plus, Save, X } from 'lucide-react';

interface Account {
  id: string;
  code: string;
  name: string;
}

interface Dimension {
  id: string;
  name: string;
  code?: string;
}

interface JournalEntryLine {
  id?: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string;
  departmentId?: string;
  costCenterId?: string;
  projectId?: string;
}

interface Journal {
  id: string;
  entryNumber: string;
  date: string;
  notes: string;
  entries: JournalEntryLine[];
}

export default function JournalEntriesPage() {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<Dimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [entryNumber, setEntryNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<JournalEntryLine[]>([
    { accountId: '', debit: '0', credit: '0', description: '' },
    { accountId: '', debit: '0', credit: '0', description: '' }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const [jourRes, accRes, ccRes] = await Promise.all([
        fetch('http://localhost:3001/api/v1/advanced-finance/journals', { headers }),
        fetch('http://localhost:3001/api/v1/advanced-finance/accounts', { headers }),
        fetch('http://localhost:3001/api/v1/advanced-finance/cost-centers', { headers })
      ]);

      const [jourData, accData, ccData] = await Promise.all([
        jourRes.json(), accRes.json(), ccRes.json()
      ]);

      setJournals(Array.isArray(jourData) ? jourData : []);
      setAccounts(Array.isArray(accData) ? accData : []);
      setCostCenters(Array.isArray(ccData) ? ccData : []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const addLine = () => {
    setLines([...lines, { accountId: '', debit: '0', credit: '0', description: '' }]);
  };

  const updateLine = (index: number, field: keyof JournalEntryLine, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value } as JournalEntryLine;
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        entryNumber: entryNumber || `JV-${Date.now()}`,
        notes,
        entries: lines.map(l => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description,
          costCenterId: l.costCenterId || undefined,
          departmentId: l.departmentId || undefined,
          projectId: l.projectId || undefined
        })).filter(l => l.accountId && (l.debit > 0 || l.credit > 0))
      };

      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/journals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        setLines([
          { accountId: '', debit: '0', credit: '0', description: '' },
          { accountId: '', debit: '0', credit: '0', description: '' }
        ]);
        setEntryNumber('');
        setNotes('');
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Error saving journal');
      }
    } catch {
      alert('Network error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ArrowUpDown style={{ color: 'var(--color-primary)' }} />
            Journal Entries
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
            Manage manual journal postings with dimensional tags.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
            background: 'var(--color-primary)', color: 'var(--color-bg-elevated)', border: 'none',
            padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)',
            cursor: 'pointer', fontSize: 'var(--text-sm)', fontWeight: 'bold'
          }}>
            <Plus size={16} /> New Journal Entry
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', margin: 0 }}>Create Journal Entry</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={20} style={{ color: 'var(--color-text-secondary)' }} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'bold', marginBottom: 'var(--space-1)' }}>Entry Number (Optional)</label>
              <input type="text" value={entryNumber} onChange={e => setEntryNumber(e.target.value)} placeholder="Auto-generated if empty" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 'bold', marginBottom: 'var(--space-1)' }}>Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Purpose of this entry" style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 'var(--space-4)' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: 'var(--space-2)' }}>Account</th>
                <th style={{ padding: 'var(--space-2)' }}>Description</th>
                <th style={{ padding: 'var(--space-2)' }}>Cost Center</th>
                <th style={{ padding: 'var(--space-2)' }}>Debit</th>
                <th style={{ padding: 'var(--space-2)' }}>Credit</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <select value={line.accountId} onChange={e => updateLine(idx, 'accountId', e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                      <option value="">Select Account</option>
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <input type="text" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <select value={line.costCenterId || ''} onChange={e => updateLine(idx, 'costCenterId', e.target.value)} style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                      <option value="">None</option>
                      {costCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <input type="number" min="0" step="0.01" value={line.debit} onChange={e => updateLine(idx, 'debit', e.target.value)} style={{ width: '100px', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <input type="number" min="0" step="0.01" value={line.credit} onChange={e => updateLine(idx, 'credit', e.target.value)} style={{ width: '100px', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }} />
                  </td>
                  <td style={{ padding: 'var(--space-2)' }}>
                    <button onClick={() => removeLine(idx)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><X size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
            <button onClick={addLine} style={{ background: 'none', border: '1px solid var(--color-border)', padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <Plus size={16} /> Add Line
            </button>
            <button onClick={handleSave} style={{ background: 'var(--color-primary)', color: 'var(--color-bg-elevated)', border: 'none', padding: 'var(--space-2) var(--space-6)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', gap: 'var(--space-2)', alignItems: 'center', fontWeight: 'bold' }}>
              <Save size={16} /> Save Journal
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-5)' }}>
          {loading ? <p>Loading...</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {journals.map(j => (
                <div key={j.id} style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                    <span style={{ fontWeight: 'bold' }}>Entry: {j.entryNumber}</span>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{new Date(j.date).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Notes: {j.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
