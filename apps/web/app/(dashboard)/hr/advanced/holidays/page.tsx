'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner } from '@unerp/ui';
import { Plus, Calendar, Globe } from 'lucide-react';

interface Holiday {
  id: string;
  name: string;
  date: string;
  region: string;
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', region: 'GLOBAL' });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/advanced-hr/holidays', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setHolidays(await res.json());
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/advanced-hr/holidays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setMsg('Holiday added successfully.');
        setShowForm(false);
        setForm({ name: '', date: '', region: 'GLOBAL' });
        fetchData();
      }
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Public Holidays"
        description="Configure public holidays. These dates are automatically excluded when calculating business day leave requests."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Advanced', href: '/hr/advanced' }, { label: 'Holidays' }]}
        actions={
          <Button variant="primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plus size={14} /> Add Public Holiday
          </Button>
        }
      />

      {msg && (
        <div style={{ padding: '8px 16px', background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {msg}
        </div>
      )}

      {showForm && (
        <Card padding="md">
          <h4 style={{ margin: '0 0 var(--space-4)' }}>Add Public Holiday</h4>
          <form onSubmit={handleCreateHoliday} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)' }}>
              <input className="frappe-input" placeholder="Holiday Name (e.g. New Year's Day)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              <input className="frappe-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
              <select className="frappe-input" value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} required>
                <option value="GLOBAL">Global</option>
                <option value="US">United States (US)</option>
                <option value="CA">Canada (CA)</option>
                <option value="IN">India (IN)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="outline" type="button" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Holiday</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <Card padding="none">
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                <th style={{ padding: 'var(--space-4)' }}>Holiday Name</th>
                <th style={{ padding: 'var(--space-4)' }}>Date</th>
                <th style={{ padding: 'var(--space-4)', textAlign: 'right' }}>Region Scope</th>
              </tr>
            </thead>
            <tbody>
              {holidays.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    No public holidays registered. Set holidays to exclude them from leave calculations.
                  </td>
                </tr>
              ) : (
                holidays.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--space-4)', fontWeight: 600 }}>{h.name}</td>
                    <td style={{ padding: 'var(--space-4)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={14} className="text-muted-foreground" />
                        {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-4)', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-xs)', background: 'var(--color-bg-sunken)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                        <Globe size={12} className="text-muted-foreground" />
                        {h.region}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
