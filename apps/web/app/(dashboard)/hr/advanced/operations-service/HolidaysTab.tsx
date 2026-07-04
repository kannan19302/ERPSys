'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Modal, FormField, Input, Select, useToast } from '@unerp/ui';
import { Plus, Calendar, Globe } from 'lucide-react';

interface Holiday {
  id: string;
  name: string;
  date: string;
  region: string;
}

export default function HolidaysTab() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

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
        const d = await res.json(); setHolidays(Array.isArray(d) ? d : (d?.data || []));
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
        toast.success('Holiday added successfully.');
        setShowForm(false);
        setForm({ name: '', date: '', region: 'GLOBAL' });
        fetchData();
      }
    } catch {}
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> Add Public Holiday
        </Button>
      </div>

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

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Public Holiday"
        footer={<><Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button><Button variant="primary" onClick={handleCreateHoliday as any}>Save Holiday</Button></>}
      >
        <form onSubmit={handleCreateHoliday} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <FormField label="Holiday Name" required>
            <Input placeholder="e.g. New Year's Day" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Date" required>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
          </FormField>
          <FormField label="Region" required>
            <Select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} required>
              <option value="GLOBAL">Global</option>
              <option value="US">United States (US)</option>
              <option value="CA">Canada (CA)</option>
              <option value="IN">India (IN)</option>
            </Select>
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
