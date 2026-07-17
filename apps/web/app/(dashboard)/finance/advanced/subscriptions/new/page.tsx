'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import {
  Card, Button, FormField, Input, Select, PageHeader
} from '@unerp/ui';
import { apiPost } from '@/lib/api';

interface LineItemForm {
  description: string;
  unitAmount: number;
  quantity: number;
  taxRate: number;
}

export default function NewSubscriptionPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    customerId: '',
    productId: '',
    currency: 'USD',
    unitAmount: 0,
    quantity: 1,
    billingPeriod: 'MONTHLY',
    billingCycles: '',
    startDate: new Date().toISOString().split('T')[0],
    trialEndDate: '',
  });

  const [lines, setLines] = useState<LineItemForm[]>([]);

  const handleAddLine = () => {
    setLines([...lines, { description: '', unitAmount: 0, quantity: 1, taxRate: 0 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: keyof LineItemForm, val: any) => {
    const updated = [...lines];
    updated[idx] = {
      ...updated[idx],
      [field]: val,
    } as LineItemForm;
    setLines(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.startDate) {
      alert('Plan Name and Start Date are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        orgId: 'cmrcf3g2e000a7kyszikgy6b8', // fallback system org
        unitAmount: Number(form.unitAmount),
        quantity: Number(form.quantity),
        billingCycles: form.billingCycles ? Number(form.billingCycles) : undefined,
        lines: lines.map(l => ({
          description: l.description,
          unitAmount: Number(l.unitAmount),
          quantity: Number(l.quantity),
          taxRate: Number(l.taxRate),
        })),
      };

      await apiPost('/subscriptions', payload);
      alert('Subscription created successfully.');
      router.push('/finance/advanced/subscriptions');
    } catch (err: any) {
      alert(err.message || 'Failed to create subscription.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/finance/advanced/subscriptions">
          <Button variant="secondary" size="sm">
            <ArrowLeft size={16} /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold ui-text-primary">New Subscription</h1>
          <p className="text-sm ui-text-muted mt-1">Register a new client subscription contract</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="text-md font-semibold text-slate-800 border-b pb-2">Plan Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Subscription/Plan Name" required>
              <Input
                type="text"
                placeholder="e.g. Enterprise SaaS Plan"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Description">
              <Input
                type="text"
                placeholder="Details of the subscription"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
            <FormField label="Customer ID">
              <Input
                type="text"
                placeholder="ID of the Customer"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              />
            </FormField>
            <FormField label="Product ID">
              <Input
                type="text"
                placeholder="ID of the primary Product"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
              />
            </FormField>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-md font-semibold text-slate-800 border-b pb-2">Pricing &amp; Schedules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Currency">
              <Select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </Select>
            </FormField>
            <FormField label="Unit Amount" required>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.unitAmount}
                onChange={(e) => setForm({ ...form, unitAmount: Number(e.target.value) })}
                required
              />
            </FormField>
            <FormField label="Quantity">
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Billing Period">
              <Select
                value={form.billingPeriod}
                onChange={(e) => setForm({ ...form, billingPeriod: e.target.value })}
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="SEMI_ANNUAL">Semi-Annual</option>
                <option value="ANNUAL">Annual</option>
              </Select>
            </FormField>
            <FormField label="Billing Cycles (empty for infinite)">
              <Input
                type="number"
                min="1"
                placeholder="Infinite"
                value={form.billingCycles}
                onChange={(e) => setForm({ ...form, billingCycles: e.target.value })}
              />
            </FormField>
            <FormField label="Start Date" required>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </FormField>
            <FormField label="Trial End Date">
              <Input
                type="date"
                value={form.trialEndDate}
                onChange={(e) => setForm({ ...form, trialEndDate: e.target.value })}
              />
            </FormField>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-md font-semibold text-slate-800">Additional Lines (Optional)</h2>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddLine} className="flex items-center gap-1">
              <Plus size={14} /> Add Line
            </Button>
          </div>

          {lines.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No additional line items added. The base subscription pricing above will be used.</p>
          ) : (
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-3 border p-3 rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <FormField label="Description" required>
                      <Input
                        type="text"
                        placeholder="e.g. Hosting add-on"
                        value={line.description}
                        onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                        required
                      />
                    </FormField>
                  </div>
                  <div className="w-28">
                    <FormField label="Unit Amount" required>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitAmount}
                        onChange={(e) => handleLineChange(idx, 'unitAmount', Number(e.target.value))}
                        required
                      />
                    </FormField>
                  </div>
                  <div className="w-20">
                    <FormField label="Qty" required>
                      <Input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))}
                        required
                      />
                    </FormField>
                  </div>
                  <div className="w-20">
                    <FormField label="Tax %">
                      <Input
                        type="number"
                        min="0"
                        value={line.taxRate}
                        onChange={(e) => handleLineChange(idx, 'taxRate', Number(e.target.value))}
                      />
                    </FormField>
                  </div>
                  <div className="pt-6">
                    <Button type="button" variant="secondary" className="p-2 text-red-600" onClick={() => handleRemoveLine(idx)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/finance/advanced/subscriptions">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Subscription'}
          </Button>
        </div>
      </form>
    </div>
  );
}
