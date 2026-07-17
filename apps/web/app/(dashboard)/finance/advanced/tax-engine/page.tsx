'use client';
import styles from './page.module.css';
import React, { useState, useEffect } from 'react';
import { Percent, ShieldAlert, Plus, Settings, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, Button, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { RouteGuard, useApiClient } from '@unerp/framework';

interface TaxRule {
  id: string;
  name: string;
  components?: { length: number }[];
  status: string;
}

interface WithholdingTax {
  id: string;
  name: string;
  rate: number | string;
  threshold?: number | string;
}

export default function TaxEnginePage() {
  const client = useApiClient();
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [withholding, setWithholding] = useState<WithholdingTax[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showWithholdingForm, setShowWithholdingForm] = useState(false);
  const [ruleData, setRuleData] = useState({ name: '', rate: '', type: 'GST' });
  const [withholdingData, setWithholdingData] = useState({ name: '', rate: '', threshold: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rulesRes, wTaxesRes] = await Promise.all([
        client.get<TaxRule[]>('/api/v1/advanced-finance/tax-rules'),
        client.get<WithholdingTax[]>('/api/v1/advanced-finance/withholding-taxes')
      ]);
      setRules(rulesRes); setWithholding(wTaxesRes);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/api/v1/advanced-finance/tax-rules', {
          name: ruleData.name,
          rate: parseFloat(ruleData.rate) || 0,
          type: ruleData.type,
          status: 'ACTIVE'
        });
      {
        setShowRuleForm(false);
        setRuleData({ name: '', rate: '', type: 'GST' });
        fetchData();
      }
    } catch {
    }
  };

  const handleCreateWithholding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/api/v1/advanced-finance/withholding-taxes', {
          name: withholdingData.name,
          rate: parseFloat(withholdingData.rate) || 0,
          threshold: parseFloat(withholdingData.threshold) || 0
        });
      {
        setShowWithholdingForm(false);
        setWithholdingData({ name: '', rate: '', threshold: '' });
        fetchData();
      }
    } catch {
    }
  };

  if (loading) return <div className="p-8 ui-flex-center"><Loader2 className="animate-spin h-8 w-8 ui-text-primary" /></div>;

  return (
    <RouteGuard permission="finance.tax-engine.read">
    <div className="p-8 ui-stack-6">
      <div className="ui-flex-between">
        <div>
          <h1 className="text-3xl">Tax Engine</h1>
          <p className="ui-text-muted mt-1">Configure complex Tax Rules, GST components, and TDS logic.</p>
        </div>
        <Button onClick={fetchData}>
          <Settings className="mr-2" />
          Refresh Data
        </Button>
      </div>

      {showRuleForm && (
        <Card className="border-primary/20">
          <div className="p-6">
            <h3 className={styles.s1}>Create Tax Rule</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleCreateRule} className="ui-stack-4">
              <div className="ui-grid-3">
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Rule Name</label>
                  <input className="ui-field-line" required placeholder="Standard GST" value={ruleData.name} onChange={e => setRuleData({ ...ruleData, name: e.target.value })} />
                </div>
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Tax Rate (%)</label>
                  <input className="ui-field-line" type="number" required placeholder="18" value={ruleData.rate} onChange={e => setRuleData({ ...ruleData, rate: e.target.value })} />
                </div>
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Type</label>
                  <select className="ui-field-line" required value={ruleData.type} onChange={e => setRuleData({ ...ruleData, type: e.target.value })}>
                    <option value="GST">GST</option>
                    <option value="VAT">VAT</option>
                    <option value="CUSTOMS">CUSTOMS</option>
                  </select>
                </div>
              </div>
              <div className="ui-flex-end ui-gap-2">
                <Button type="button" variant="outline" onClick={() => setShowRuleForm(false)}>Cancel</Button>
                <Button type="submit">Save Rule</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {showWithholdingForm && (
        <Card className="border-primary/20">
          <div className="p-6">
            <h3 className={styles.s1}>Add Withholding Tax (TDS)</h3>
          </div>
          <div className="p-6">
            <form onSubmit={handleCreateWithholding} className="ui-stack-4">
              <div className="ui-grid-3">
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Tax Name</label>
                  <input className="ui-field-line" required placeholder="TDS on Contracts (Section 194C)" value={withholdingData.name} onChange={e => setWithholdingData({ ...withholdingData, name: e.target.value })} />
                </div>
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Rate (%)</label>
                  <input className="ui-field-line" type="number" required placeholder="2" value={withholdingData.rate} onChange={e => setWithholdingData({ ...withholdingData, rate: e.target.value })} />
                </div>
                <div className="ui-stack-2">
                  <label className="ui-heading-sm">Threshold Limit ($)</label>
                  <input className="ui-field-line" type="number" required placeholder="1000" value={withholdingData.threshold} onChange={e => setWithholdingData({ ...withholdingData, threshold: e.target.value })} />
                </div>
              </div>
              <div className="ui-flex-end ui-gap-2">
                <Button type="button" variant="outline" onClick={() => setShowWithholdingForm(false)}>Cancel</Button>
                <Button type="submit">Save Withholding Tax</Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      <div className="ui-grid-2">
        {/* Tax Rules */}
        <Card className={`border-primary/20 hover:border-primary/50 transition-colors ${styles.s2}`} >
          <div className={styles.s3}>
            <div className="ui-hstack-3">
              <div className={`bg-purple-100 dark:bg-purple-900/30 ${styles.s4}`} >
                <Percent className={`text-purple-700 dark:text-purple-400 ${styles.s5}`}  />
              </div>
              <div>
                <h3 className="ui-heading-lg">Sales & Purchase Tax Rules</h3>
                <p className="ui-text-sm-muted">e.g. Inter-state GST, Standard VAT</p>
              </div>
            </div>
          </div>
          <div className={styles.s6}>
            {(() => {
              const ruleColumns: ListColumn[] = [
                { key: 'name', header: 'Rule Name', render: (v) => <span className="font-medium">{v as string}</span> },
                { key: 'components', header: 'Components', render: (_v, row) => <span className="ui-text-muted">{(row as unknown as TaxRule).components?.length || 0} rates</span> },
                { key: 'status', header: 'Status', render: (v) => v === 'ACTIVE' ? <CheckCircle2 className="h-4 w-4 text-green-500 inline" /> : <span>{v as string}</span> },
              ];
              return (
                <ListPageTemplate
                  columns={ruleColumns}
                  data={rules as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No Tax Rules"
                  emptyDescription="No tax rules configured."
                />
              );
            })()}
          </div>
          <div className={styles.s7}>
            <Button variant="outline" className="w-full" onClick={() => setShowRuleForm(true)}>Create Tax Rule <Plus className={styles.s8} /></Button>
          </div>
        </Card>

        {/* Withholding Taxes / TDS */}
        <Card className={`border-primary/20 hover:border-primary/50 transition-colors ${styles.s2}`} >
          <div className={styles.s3}>
            <div className="ui-hstack-3">
              <div className={`bg-red-100 dark:bg-red-900/30 ${styles.s4}`} >
                <ShieldAlert className={`text-red-700 dark:text-red-400 ${styles.s5}`}  />
              </div>
              <div>
                <h3 className="ui-heading-lg">Withholding Taxes (TDS)</h3>
                <p className="ui-text-sm-muted">Automated deductions on AP invoices</p>
              </div>
            </div>
          </div>
          <div className={styles.s6}>
            {(() => {
              const withholdingColumns: ListColumn[] = [
                { key: 'name', header: 'Tax Name', render: (v) => <span className="font-medium">{v as string}</span> },
                { key: 'rate', header: 'Rate (%)', render: (v) => <span className="font-medium">{Number(v).toFixed(2)}%</span> },
                { key: 'threshold', header: 'Threshold ($)', render: (v) => <span className="ui-text-muted">${Number(v || 0).toFixed(2)}</span> },
              ];
              return (
                <ListPageTemplate
                  columns={withholdingColumns}
                  data={withholding as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No Withholding Taxes"
                  emptyDescription="No withholding taxes configured."
                />
              );
            })()}
          </div>
          <div className={styles.s7}>
            <Button variant="outline" className="w-full" onClick={() => setShowWithholdingForm(true)}>Add Withholding Tax <Plus className={styles.s8} /></Button>
          </div>
        </Card>
      </div>
    </div>
    </RouteGuard>
  );
}
