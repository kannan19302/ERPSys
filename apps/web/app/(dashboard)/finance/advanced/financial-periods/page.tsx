/* eslint-disable no-console */
'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Lock, Unlock, Loader2 } from 'lucide-react';
import { Card, Button } from '@unerp/ui';

interface FinancialPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function FinancialPeriodsPage() {
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '' });

  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/financial-periods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
      setPeriods(Array.isArray(data) ? data : (data?.data || []));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch('http://localhost:3001/api/v1/advanced-finance/financial-periods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, status: 'OPEN' })
      });
      if (res.ok) {
        setShowForm(false);
        setFormData({ name: '', startDate: '', endDate: '' });
        fetchPeriods();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
      const token = localStorage.getItem('token') || localStorage.getItem('admin_token') || '';
      const res = await fetch(`http://localhost:3001/api/v1/advanced-finance/financial-periods/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchPeriods();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div style={{ padding: 'var(--space-8)', display: 'flex', justifyContent: 'center' }}><Loader2 className="animate-spin h-8 w-8" style={{ color: 'var(--color-primary)' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)' }}>Financial Periods</h1>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>Manage period-end close workflows and lock transactions.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus style={{ marginRight: 'var(--space-2)' }} />
          New Period
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <div style={{ padding: 'var(--space-6)' }}>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-semibold)' }}>Create New Financial Period</h3>
          </div>
          <div style={{ padding: 'var(--space-6)' }}>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="frappe-grid-3">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Period Name (e.g. FY2026-Q1)</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>Start Date</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="date" required value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)' }}>End Date</label>
                  <input style={{ display: 'flex', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', paddingInline: 'var(--space-3)', paddingBlock: 'var(--space-2)', fontSize: 'var(--text-sm)' }} type="date" required value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit">Save Period</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="frappe-grid-3">
        {periods.map(period => (
          <Card key={period.id} className={period.status === 'CLOSED' ? 'opacity-70 bg-muted/30' : 'border-primary/10 hover:border-primary/30 transition-colors'}>
            <div style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-4)' }}>
                <div style={{ padding: 'var(--space-2)', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-lg)' }}>
                  <Calendar style={{ height: '20px', width: '20px', color: 'var(--color-primary)' }} />
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${period.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {period.status}
                </div>
              </div>
              <h3 style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-1)' }}>{period.name}</h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                {new Date(period.startDate).toLocaleDateString()} — {new Date(period.endDate).toLocaleDateString()}
              </p>
              <Button 
                variant={period.status === 'OPEN' ? 'danger' : 'outline'} 
                style={{ width: '100%' }} 
                onClick={() => toggleStatus(period.id, period.status)}
              >
                {period.status === 'OPEN' ? (
                  <><Lock style={{ marginRight: 'var(--space-2)' }} /> Close Period</>
                ) : (
                  <><Unlock style={{ marginRight: 'var(--space-2)' }} /> Reopen Period</>
                )}
              </Button>
            </div>
          </Card>
        ))}
        {periods.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
            No financial periods found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
