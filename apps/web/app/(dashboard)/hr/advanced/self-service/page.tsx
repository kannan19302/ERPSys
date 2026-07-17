'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner, ListPageTemplate, type ListColumn } from '@unerp/ui';
import { User, Phone, Briefcase, Calendar, DollarSign, FileText, ClipboardList } from 'lucide-react';
import { useApiClient } from '@unerp/framework';
import styles from './page.module.css';

interface SelfServiceData {
  employee: {
    name: string;
    code: string;
    designation: string;
    department: string;
    dateOfJoining: string;
    phone?: string;
    address?: { line?: string; city?: string; country?: string };
    bankDetails?: { accountNumber?: string };
  };
  recentPayslips: Array<{ id: string; grossSalary: number; deductions: number; netSalary: number; createdAt: string }>;
  pendingLeaves: Array<{ id: string; startDate: string; endDate: string; reason: string; status: string }>;
  activeGoals: Array<{ id: string; title: string; progress: number; status: string }>;
  skills: Array<{ id: string; skillName: string; proficiency: number }>;
  assignedAssets: Array<{ id: string; assetName: string; assetType: string; serialNumber: string; assignedDate: string }>;
  documents: Array<{ id: string; name: string; docType: string; fileUrl: string }>;
}

export default function SelfServicePage() {
  const client = useApiClient();
  const [data, setData] = useState<SelfServiceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  // Form states for profile update
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('US');
  const [bankAccount, setBankAccount] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await client.get<SelfServiceData>('/advanced-hr/self-service/dashboard');
        setData(dashboardData);
        setPhone(dashboardData.employee.phone || '');
        
        const address = dashboardData.employee.address || {};
        setAddressLine(address.line || '');
        setCity(address.city || '');
        setCountry(address.country || 'US');

        const bank = dashboardData.employee.bankDetails || {};
        setBankAccount(bank.accountNumber || '');
    } catch {
      setError('Connection failed. Serving placeholder dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [client]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      await client.request('/advanced-hr/self-service/profile', {
        method: 'PUT',
        body: JSON.stringify({
          phone,
          address: { line: addressLine, city, country },
          bankDetails: { accountNumber: bankAccount }
        })
      });
      setMsg('Profile details updated successfully.');
      fetchData();
    } catch {
      setMsg('Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ui-stack-6 ui-animate-in">
      <PageHeader
        title="Self-Service Portal"
        description="View your corporate documents, update your contact details, check your leaves status, and view payslips."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Self-Service' }]}
      />

      {error && (
        <div className={styles.s0}>
          {error}
        </div>
      )}

      {msg && (
        <div className={styles.s1}>
          {msg}
        </div>
      )}

      {loading ? (
        <div className="ui-center-pad">
          <Spinner size="lg" />
        </div>
      ) : data ? (
        <div className={styles.s2}>
          {/* Profile Column */}
          <div className="ui-stack-6">
            <Card padding="md">
              <div className={styles.s3}>
                <div className={styles.s4}>
                  {data.employee.name.charAt(0)}
                </div>
                <div>
                  <h3 className={styles.s5}>{data.employee.name}</h3>
                  <p className="ui-text-xs-muted m-0">{data.employee.designation} • {data.employee.department}</p>
                </div>
                <div className={styles.s6}>
                  Code: <strong>{data.employee.code}</strong>
                </div>
              </div>
              <div className={styles.s7}>
                <div className="ui-hstack-2">
                  <Calendar size={15} className="ui-text-tertiary" />
                  <span>Joined {new Date(data.employee.dateOfJoining).toLocaleDateString()}</span>
                </div>
                {data.employee.phone && (
                  <div className="ui-hstack-2">
                    <Phone size={15} className="ui-text-tertiary" />
                    <span>{data.employee.phone}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Profile Update Details Form */}
            <Card padding="md">
              <h4 className={styles.s8}>Modify Contact Details</h4>
              <form onSubmit={handleUpdateProfile} className="ui-stack-3">
                <div className="ui-form-group">
                  <label className={styles.s9}>Phone Number</label>
                  <input className="ui-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 0123" />
                </div>
                <div className="ui-form-group">
                  <label className={styles.s10}>Address Line</label>
                  <input className="ui-input" value={addressLine} onChange={e => setAddressLine(e.target.value)} placeholder="123 Stark Tower" />
                </div>
                <div className={styles.s11}>
                  <div className="ui-form-group">
                    <label className={styles.s12}>City</label>
                    <input className="ui-input" value={city} onChange={e => setCity(e.target.value)} placeholder="New York" />
                  </div>
                  <div className="ui-form-group">
                    <label className={styles.s13}>Country</label>
                    <input className="ui-input" value={country} onChange={e => setCountry(e.target.value)} placeholder="US" />
                  </div>
                </div>
                <div className="ui-form-group">
                  <label className={styles.s14}>Bank Account Number</label>
                  <input className="ui-input" type="password" value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="XXXX-XXXX-XXXX" />
                </div>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Save Profile Details'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Details Dashboard Column */}
          <div className="ui-stack-6">
            {/* Recent Payslips */}
            <Card padding="md">
              <h4 className={styles.s15}><DollarSign size={16} /> Recent Salary Payslips</h4>
              <ListPageTemplate
                  title=""
                  columns={[
                    { key: 'createdAt', header: 'Period', render: (v) => new Date(String(v)).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) },
                    { key: 'grossSalary', header: 'Gross Salary', render: (v) => `$${Number(v).toFixed(2)}` },
                    { key: 'deductions', header: 'Tax Deductions', render: (v) => <span className={styles.s16}>-${Number(v).toFixed(2)}</span> },
                    { key: 'netSalary', header: 'Net Paid', render: (v) => <span className={styles.s17}>${Number(v).toFixed(2)}</span> },
                  ] as ListColumn[]}
                  data={data.recentPayslips as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No payslips issued yet."
                />
            </Card>

            {/* Pending Leaves requests */}
            <Card padding="md">
              <h4 className={styles.s18}><ClipboardList size={16} /> Leave Status</h4>
              <ListPageTemplate
                  title=""
                  columns={[
                    { key: 'startDate', header: 'Start Date', render: (v) => new Date(String(v)).toLocaleDateString() },
                    { key: 'endDate', header: 'End Date', render: (v) => new Date(String(v)).toLocaleDateString() },
                    { key: 'reason', header: 'Reason' },
                    { key: 'status', header: 'Status', render: (v) => <StatusBadge status={String(v)} /> },
                  ] as ListColumn[]}
                  data={data.pendingLeaves as unknown as Record<string, unknown>[]}
                  loading={false}
                  emptyTitle="No pending leave requests."
                />
            </Card>

            {/* Assigned Assets */}
            <Card padding="md">
              <h4 className={styles.s19}><Briefcase size={16} /> Assigned Company Assets</h4>
              <div className={styles.auto0}>
                {data.assignedAssets.length === 0 ? (
                  <div className={styles.s20}>No company assets assigned.</div>
                ) : (
                  data.assignedAssets.map(asset => (
                    <Card key={asset.id} padding="sm" className={styles.s21}>
                      <div className={styles.s22}>{asset.assetName}</div>
                      <div className="ui-text-caption">{asset.assetType} • S/N: {asset.serialNumber}</div>
                      <div className={styles.s23}>Assigned: {new Date(asset.assignedDate).toLocaleDateString()}</div>
                    </Card>
                  ))
                )}
              </div>
            </Card>

            {/* My Documents */}
            <Card padding="md">
              <h4 className={styles.s24}><FileText size={16} /> Documents & Contracts</h4>
              <div className="ui-stack-2">
                {data.documents.length === 0 ? (
                  <div className={styles.s25}>No documents uploaded.</div>
                ) : (
                  data.documents.map(doc => (
                    <div key={doc.id} className={styles.s26}>
                      <div className="text-sm">
                        <span className="font-semibold">{doc.name}</span>
                        <span className={styles.s27}>({doc.docType})</span>
                      </div>
                      {doc.fileUrl ? (
                        <a href={doc.fileUrl} download className={styles.s28}>Download File</a>
                      ) : (
                        <span className="ui-text-xs-tertiary">No File</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center p-12">
          <User size={48} className={styles.s29} />
          <h3>Self-Service Dashboard Not Connected</h3>
          <p>We could not find an Employee Profile linked to your user account.</p>
        </div>
      )}
    </div>
  );
}


