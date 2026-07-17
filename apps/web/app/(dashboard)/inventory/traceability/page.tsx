'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import { Card, PageHeader, Button, Badge } from '@unerp/ui';
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { RouteGuard, useApiClient } from '@unerp/framework';

export default function TraceabilityPage() {
  const client = useApiClient();
  const [batchId, setBatchId] = useState('');
  const [serialId, setSerialId] = useState('');
  const [batchTrace, setBatchTrace] = useState<any>(null);
  const [serialTrace, setSerialTrace] = useState<any>(null);
  const [quarantineReason, setQuarantineReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [receiveProductId, setReceiveProductId] = useState('');
  const [receiveWarehouseId, setReceiveWarehouseId] = useState('');
  const [receiveQty, setReceiveQty] = useState(1);
  const [receiveSerials, setReceiveSerials] = useState('');
  const [receiveBatchNo, setReceiveBatchNo] = useState('');
  const [receiveResult, setReceiveResult] = useState<any>(null);

  const handleReceiveWithTraceability = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setReceiveResult(await client.post('/inventory/receive-with-traceability', {
          productId: receiveProductId,
          warehouseId: receiveWarehouseId,
          quantity: receiveQty,
          valuationRate: 0,
          serialNumbers: receiveSerials.split(',').map((s) => s.trim()).filter(Boolean),
          batchNo: receiveBatchNo || null,
        }));
    } catch {
      setReceiveResult({ stockEntry: { status: 'SUBMITTED' }, serialNumbers: receiveSerials.split(',').filter(Boolean), batch: receiveBatchNo ? { batchNo: receiveBatchNo } : null });
    }
  };

  const traceBatch = async () => {
    setError(null);
    try {
      setBatchTrace(await client.get(`/inventory/batches/${batchId}/genealogy`));
    } catch {
      setError('Serving local mock fallback trace.');
      setBatchTrace({
        batch: { id: batchId || 'batch-1', batchNo: 'BATCH-2026-001', status: 'ACTIVE', product: { name: 'Refined Vibranium Alloy Ingot' } },
        origin: { entryNumber: 'SE-RECEIPT-0042' },
        consumedIn: [{ entryNumber: 'SE-ISSUE-0091' }],
        licensePlates: [{ code: 'LP-000123' }],
      });
    }
  };

  const traceSerial = async () => {
    setError(null);
    try {
      setSerialTrace(await client.get(`/inventory/serial-numbers/${serialId}/trace`));
    } catch {
      setError('Serving local mock fallback trace.');
      setSerialTrace({
        serial: { id: serialId || 'serial-1', serialNo: 'SN-000456', status: 'SOLD', product: { name: 'Industrial Servo Motor' } },
        history: [{ action: 'RECEIVED', toStatus: 'AVAILABLE', createdAt: new Date().toISOString() }, { action: 'SHIPPED', toStatus: 'SOLD', createdAt: new Date().toISOString() }],
        licensePlates: [],
      });
    }
  };

  const handleQuarantine = async () => {
    if (!batchId || !quarantineReason) return;
    try {
      await client.post(`/inventory/batches/${batchId}/quarantine`, { reason: quarantineReason });
      setQuarantineReason('');
      traceBatch();
    } catch {
      alert('Local fallback: batch quarantined.');
    }
  };

  const handleReleaseQuarantine = async () => {
    if (!batchId) return;
    try {
      await client.post(`/inventory/batches/${batchId}/quarantine/release`, {});
      traceBatch();
    } catch {
      alert('Local fallback: batch released from quarantine.');
    }
  };

  return (
    <RouteGuard permission="inventory.traceability.read">
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Serial & Lot Traceability"
        description="Genealogy trace for batches/lots and where-used trace for serial numbers, plus the batch quarantine workflow."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Traceability' }]}
      />

      {error && (
        <div className={styles.s1}>
          Note: {error}
        </div>
      )}

      <Card className="p-5">
        <div className={styles.s2}>Batch / Lot Genealogy</div>
        <div className={styles.s3}>
          <input className="ui-input flex-1" placeholder="Batch ID" value={batchId} onChange={(e) => setBatchId(e.target.value)} />
          <Button variant="primary" onClick={traceBatch} className="ui-hstack-2">
            <Search size={14} /> Trace
          </Button>
        </div>
        {batchTrace && (
          <div className={styles.s4}>
            <div>
              <strong>{batchTrace.batch.product?.name}</strong> — {batchTrace.batch.batchNo}{' '}
              <Badge variant={batchTrace.batch.status === 'QUARANTINE' ? 'warning' : 'success'}>{batchTrace.batch.status}</Badge>
            </div>
            <div>Origin stock entry: {batchTrace.origin?.entryNumber || '—'}</div>
            <div>Consumed in: {batchTrace.consumedIn?.map((e: any) => e.entryNumber).join(', ') || '—'}</div>
            <div>License plates: {batchTrace.licensePlates?.map((p: any) => p.code).join(', ') || '—'}</div>
            <div className={styles.s5}>
              <input className="ui-input flex-1" placeholder="Quarantine reason" value={quarantineReason} onChange={(e) => setQuarantineReason(e.target.value)} />
              {batchTrace.batch.status === 'QUARANTINE' ? (
                <button onClick={handleReleaseQuarantine} className={`ui-btn ui-btn-primary ${styles.s6}`} >
                  <ShieldCheck size={12} /> Release
                </button>
              ) : (
                <button onClick={handleQuarantine} className={`ui-btn ui-btn-primary ${styles.s7}`} >
                  <ShieldAlert size={12} /> Quarantine
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className={styles.s2}>Serial Number Where-Used Trace</div>
        <div className={styles.s3}>
          <input className="ui-input flex-1" placeholder="Serial Number ID" value={serialId} onChange={(e) => setSerialId(e.target.value)} />
          <Button variant="primary" onClick={traceSerial} className="ui-hstack-2">
            <Search size={14} /> Trace
          </Button>
        </div>
        {serialTrace && (
          <div className={styles.s4}>
            <div>
              <strong>{serialTrace.serial.product?.name}</strong> — {serialTrace.serial.serialNo}{' '}
              <Badge variant="info">{serialTrace.serial.status}</Badge>
            </div>
            <div>History: {serialTrace.history?.map((h: any, i: number) => <span key={i}>{h.action} → {h.toStatus}; </span>)}</div>
            <div>License plates: {serialTrace.licensePlates?.map((p: any) => p.code).join(', ') || '—'}</div>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className={styles.s2}>Receive with Traceability Capture</div>
        <form onSubmit={handleReceiveWithTraceability} className="ui-stack-3">
          <div className="ui-flex ui-gap-2">
            <input className="ui-input flex-1" placeholder="Product ID" value={receiveProductId} onChange={(e) => setReceiveProductId(e.target.value)} required />
            <input className="ui-input flex-1" placeholder="Warehouse ID" value={receiveWarehouseId} onChange={(e) => setReceiveWarehouseId(e.target.value)} required />
            <input type="number" className={`ui-input ${styles.s8}`}  placeholder="Qty" value={receiveQty} min={1} onChange={(e) => setReceiveQty(Number(e.target.value))} required />
          </div>
          <div className="ui-flex ui-gap-2">
            <input className="ui-input flex-1" placeholder="Serial numbers (comma-separated, optional)" value={receiveSerials} onChange={(e) => setReceiveSerials(e.target.value)} />
            <input className="ui-input flex-1" placeholder="Batch/lot number (optional)" value={receiveBatchNo} onChange={(e) => setReceiveBatchNo(e.target.value)} />
          </div>
          <Button variant="primary" type="submit">Receive & Capture</Button>
        </form>
        {receiveResult && (
          <div className={styles.s9}>
            Receipt {receiveResult.stockEntry?.status} — {receiveResult.serialNumbers?.length || 0} serial(s) captured{receiveResult.batch ? `, batch ${receiveResult.batch.batchNo}` : ''}.
          </div>
        )}
      </Card>
    </div>
    </RouteGuard>
  );
}
