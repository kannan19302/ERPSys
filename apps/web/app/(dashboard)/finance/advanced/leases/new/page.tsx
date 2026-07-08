'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Card, Button } from '@unerp/ui';
import { apiPost } from '@/lib/api';

export default function NewLeasePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    leaseRef: '',
    description: '',
    startDate: '',
    endDate: '',
    leaseType: 'OPERATING',
    presentValue: '',
    interestRate: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        leaseRef: form.leaseRef || undefined,
        description: form.description || undefined,
        startDate: form.startDate,
        endDate: form.endDate,
        leaseType: form.leaseType,
      };
      if (form.presentValue) payload.presentValue = Number(form.presentValue);
      if (form.interestRate) payload.interestRate = Number(form.interestRate);
      const lease = await apiPost<{ id: string }>('/finance/leases', payload);
      router.push(`/finance/advanced/leases/${lease.id}`);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create lease');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/finance/advanced/leases" className="frappe-text-muted hover:frappe-text-primary">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <p className="text-xs frappe-text-muted">Finance / Lease Accounting</p>
          <h1 className="text-xl font-bold frappe-text-primary">New Lease</h1>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5">
          {error && <p className="text-red-600 text-sm bg-red-50 rounded p-2">{error}</p>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium frappe-text-muted">Lease Reference</label>
              <input className="frappe-input w-full" placeholder="e.g. LEASE-HQ-2024" value={form.leaseRef} onChange={set('leaseRef')} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium frappe-text-muted">Lease Type *</label>
              <select className="frappe-input w-full" value={form.leaseType} onChange={set('leaseType')} required>
                <option value="OPERATING">Operating Lease (ASC 842)</option>
                <option value="FINANCE">Finance Lease (ASC 842 / IFRS 16)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium frappe-text-muted">Description</label>
            <input className="frappe-input w-full" placeholder="e.g. Office space — HQ floor 3" value={form.description} onChange={set('description')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium frappe-text-muted">Start Date *</label>
              <input type="date" className="frappe-input w-full" value={form.startDate} onChange={set('startDate')} required />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium frappe-text-muted">End Date *</label>
              <input type="date" className="frappe-input w-full" value={form.endDate} onChange={set('endDate')} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium frappe-text-muted">Present Value (PV of lease payments)</label>
              <input type="number" step="0.01" min="0" className="frappe-input w-full" placeholder="0.00" value={form.presentValue} onChange={set('presentValue')} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium frappe-text-muted">Annual Incremental Borrowing Rate</label>
              <input type="number" step="0.0001" min="0" max="1" className="frappe-input w-full" placeholder="e.g. 0.05 for 5%" value={form.interestRate} onChange={set('interestRate')} />
            </div>
          </div>

          <p className="text-xs frappe-text-muted bg-blue-50 dark:bg-blue-900/20 rounded p-3">
            On save, the system will automatically generate a monthly amortization schedule using the effective-interest method (ASC 842 / IFRS 16).
          </p>

          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={saving} className="flex items-center gap-2">
              <Save size={14} /> {saving ? 'Saving…' : 'Create Lease'}
            </Button>
            <Link href="/finance/advanced/leases">
              <Button type="button" variant="secondary">Cancel</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
