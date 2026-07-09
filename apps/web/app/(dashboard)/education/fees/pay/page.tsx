'use client';

import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { DollarSign, CreditCard, CheckCircle } from 'lucide-react';

interface StudentFee {
  id: string;
  studentId: string;
  amount: number;
  paidAmount: number;
  status: string;
  student?: { firstName: string; lastName: string };
  feeStructure?: { name: string };
}

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function FeePaymentPage() {
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/v1/ext/education/student-fees', { headers: { Authorization: `Bearer ${getToken() || ''}` } });
        if (res.ok) { const d = await res.json(); setFees(Array.isArray(d) ? d : d?.data || []); }
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handlePayment = async () => {
    if (!selectedFee || !paymentAmount) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/v1/ext/education/student-fees/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}` },
        body: JSON.stringify({ studentFeeId: selectedFee, paymentAmount: Number(paymentAmount) }),
      });
      if (res.ok) setSuccess(true);
    } catch { /* handled */ }
    finally { setProcessing(false); }
  };

  const unpaidFees = fees.filter(f => f.status !== 'PAID');
  const selected = fees.find(f => f.id === selectedFee);
  const outstanding = selected ? (selected.amount - selected.paidAmount) : 0;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}><Spinner size="lg" /></div>;

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <PageHeader title="Fee Payment" description="Process student fee payments"
          breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Fees', href: '/education/fees' }, { label: 'Payment' }]} />
        <Card>
          <div style={{ padding: 'var(--space-8)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={32} />
            </div>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>Payment Successful!</h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>The fee payment of {fmtCurrency(Number(paymentAmount))} has been processed.</p>
            <Button variant="primary" onClick={() => { setSuccess(false); setSelectedFee(''); setPaymentAmount(''); }}>Make Another Payment</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <PageHeader title="Fee Payment" description="Process student fee payments"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Fees', href: '/education/fees' }, { label: 'Payment' }]} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
        <KPICard title="Unpaid Fees" value={unpaidFees.length} icon={<CreditCard size={18} />} color="var(--color-warning)" />
        <KPICard title="Total Outstanding" value={fmtCurrency(unpaidFees.reduce((a, f) => a + (f.amount - f.paidAmount), 0))} icon={<DollarSign size={18} />} color="var(--color-danger)" />
      </div>

      <Card>
        <div style={{ padding: 'var(--space-6)', maxWidth: 500 }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--space-4)' }}>Process Payment</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <FormField label="Select Student Fee">
              <Select value={selectedFee} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedFee(e.target.value)}>
                <option value="">Choose a fee...</option>
                {unpaidFees.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.student ? `${f.student.firstName} ${f.student.lastName}` : f.studentId} — {f.feeStructure?.name || 'Fee'} ({fmtCurrency(f.amount - f.paidAmount)} due)
                  </option>
                ))}
              </Select>
            </FormField>

            {selected && (
              <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Total Fee:</span>
                  <span style={{ fontWeight: 'var(--weight-semibold)' }}>{fmtCurrency(selected.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Already Paid:</span>
                  <span style={{ color: 'var(--color-success)' }}>{fmtCurrency(selected.paidAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-1)' }}>
                  <span style={{ fontWeight: 'var(--weight-semibold)' }}>Outstanding:</span>
                  <span style={{ fontWeight: 'var(--weight-bold)', color: 'var(--color-danger)' }}>{fmtCurrency(outstanding)}</span>
                </div>
              </div>
            )}

            <TextField label="Payment Amount ($)" type="number" value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" />

            <Button variant="primary" onClick={handlePayment} disabled={processing || !selectedFee || !paymentAmount}>
              {processing ? 'Processing...' : 'Submit Payment'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
