'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import {
  PageHeader, Card, Button, Spinner, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { DollarSign, CreditCard, CheckCircle } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface StudentFee {
  id: string;
  studentId: string;
  amount: number;
  paidAmount: number;
  status: string;
  student?: { firstName: string; lastName: string };
  feeStructure?: { name: string };
}

const fmtCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function FeePaymentPage() {
  const client = useApiClient();
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFee, setSelectedFee] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const d = await client.get<StudentFee[] | { data?: StudentFee[] }>('/ext/education/student-fees');
        setFees(Array.isArray(d) ? d : d.data || []);
      } catch { /* empty */ }
      finally { setLoading(false); }
    })();
  }, [client]);

  const handlePayment = async () => {
    if (!selectedFee || !paymentAmount) return;
    setProcessing(true);
    try {
      await client.post('/ext/education/student-fees/pay', { studentFeeId: selectedFee, paymentAmount: Number(paymentAmount) });
      setSuccess(true);
    } catch { /* handled */ }
    finally { setProcessing(false); }
  };

  const unpaidFees = fees.filter(f => f.status !== 'PAID');
  const selected = fees.find(f => f.id === selectedFee);
  const outstanding = selected ? (selected.amount - selected.paidAmount) : 0;

  if (loading) return <div className="ui-center-pad"><Spinner size="lg" /></div>;

  if (success) {
    return (
      <RouteGuard permission="education.fee.pay">
        <div className="ui-stack-6">
        <PageHeader title="Fee Payment" description="Process student fee payments"
          breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Fees', href: '/education/fees' }, { label: 'Payment' }]} />
        <Card>
          <div className={styles.s1}>
            <div className={styles.s2}>
              <CheckCircle size={32} />
            </div>
            <h2 className={styles.s3}>Payment Successful!</h2>
            <p className="ui-text-sm-muted">The fee payment of {fmtCurrency(Number(paymentAmount))} has been processed.</p>
            <Button variant="primary" onClick={() => { setSuccess(false); setSelectedFee(''); setPaymentAmount(''); }}>Make Another Payment</Button>
          </div>
        </Card>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard permission="education.fee.pay">
      <div className="ui-stack-6">
      <PageHeader title="Fee Payment" description="Process student fee payments"
        breadcrumbs={[{ label: 'Education', href: '/education' }, { label: 'Fees', href: '/education/fees' }, { label: 'Payment' }]} />

      <div className="ui-grid-auto">
        <KPICard title="Unpaid Fees" value={unpaidFees.length} icon={<CreditCard size={18} />} color="var(--color-warning)" />
        <KPICard title="Total Outstanding" value={fmtCurrency(unpaidFees.reduce((a, f) => a + (f.amount - f.paidAmount), 0))} icon={<DollarSign size={18} />} color="var(--color-danger)" />
      </div>

      <Card>
        <div className={styles.s4}>
          <h3 className="ui-heading-base mb-4">Process Payment</h3>
          <div className="ui-stack-4">
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
              <div className={styles.s5}>
                <div className={styles.s6}>
                  <span className="ui-text-muted">Total Fee:</span>
                  <span className="font-semibold">{fmtCurrency(selected.amount)}</span>
                </div>
                <div className={styles.s6}>
                  <span className="ui-text-muted">Already Paid:</span>
                  <span className="ui-text-success">{fmtCurrency(selected.paidAmount)}</span>
                </div>
                <div className={styles.s7}>
                  <span className="font-semibold">Outstanding:</span>
                  <span className={styles.s8}>{fmtCurrency(outstanding)}</span>
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
    </RouteGuard>
  );
}
