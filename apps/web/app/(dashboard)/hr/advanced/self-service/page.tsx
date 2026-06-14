'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, StatusBadge, Button, Spinner } from '@unerp/ui';
import { User, Phone, Briefcase, Calendar, DollarSign, FileText, ClipboardList } from 'lucide-react';

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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/advanced-hr/self-service/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
        setPhone(dashboardData.employee.phone || '');
        
        const address = dashboardData.employee.address || {};
        setAddressLine(address.line || '');
        setCity(address.city || '');
        setCountry(address.country || 'US');

        const bank = dashboardData.employee.bankDetails || {};
        setBankAccount(bank.accountNumber || '');
      } else {
        setError('Could not retrieve your employee profile. Make sure your user login is linked.');
      }
    } catch {
      setError('Connection failed. Serving placeholder dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      const res = await fetch('/api/v1/advanced-hr/self-service/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          phone,
          address: { line: addressLine, city, country },
          bankDetails: { accountNumber: bankAccount }
        })
      });
      if (res.ok) {
        setMsg('Profile details updated successfully.');
        fetchData();
      } else {
        setMsg('Failed to update details.');
      }
    } catch {
      setMsg('Update failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Self-Service Portal"
        description="View your corporate documents, update your contact details, check your leaves status, and view payslips."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'HR', href: '/hr' }, { label: 'Self-Service' }]}
      />

      {error && (
        <div style={{ padding: 'var(--space-4)', background: 'var(--color-danger-light)', border: '1px solid var(--color-danger)', color: 'var(--color-danger-text)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      )}

      {msg && (
        <div style={{ padding: 'var(--space-3)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)' }}>
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--space-6)', alignItems: 'start' }}>
          {/* Profile Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <Card padding="md">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-full)', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)' }}>
                  {data.employee.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)' }}>{data.employee.name}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{data.employee.designation} • {data.employee.department}</p>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', background: 'var(--color-bg-sunken)', padding: '2px 10px', borderRadius: 'var(--radius-md)' }}>
                  Code: <strong>{data.employee.code}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Calendar size={15} style={{ color: 'var(--color-text-tertiary)' }} />
                  <span>Joined {new Date(data.employee.dateOfJoining).toLocaleDateString()}</span>
                </div>
                {data.employee.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <Phone size={15} style={{ color: 'var(--color-text-tertiary)' }} />
                    <span>{data.employee.phone}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Profile Update Details Form */}
            <Card padding="md">
              <h4 style={{ margin: '0 0 var(--space-3)' }}>Modify Contact Details</h4>
              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="frappe-form-group">
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Phone Number</label>
                  <input className="frappe-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 0123" />
                </div>
                <div className="frappe-form-group">
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Address Line</label>
                  <input className="frappe-input" value={addressLine} onChange={e => setAddressLine(e.target.value)} placeholder="123 Stark Tower" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)' }}>
                  <div className="frappe-form-group">
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>City</label>
                    <input className="frappe-input" value={city} onChange={e => setCity(e.target.value)} placeholder="New York" />
                  </div>
                  <div className="frappe-form-group">
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Country</label>
                    <input className="frappe-input" value={country} onChange={e => setCountry(e.target.value)} placeholder="US" />
                  </div>
                </div>
                <div className="frappe-form-group">
                  <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>Bank Account Number</label>
                  <input className="frappe-input" type="password" value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="XXXX-XXXX-XXXX" />
                </div>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Updating...' : 'Save Profile Details'}
                </Button>
              </form>
            </Card>
          </div>

          {/* Details Dashboard Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Recent Payslips */}
            <Card padding="md">
              <h4 style={{ margin: '0 0 var(--space-3)', display: 'flex', alignItems: 'center', gap: 8 }}><DollarSign size={16} /> Recent Salary Payslips</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-3)' }}>Period</th>
                      <th style={{ padding: 'var(--space-3)' }}>Gross Salary</th>
                      <th style={{ padding: 'var(--space-3)' }}>Tax Deductions</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Net Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentPayslips.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No payslips issued yet.</td>
                      </tr>
                    ) : (
                      data.recentPayslips.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)', fontWeight: 600 }}>{new Date(s.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</td>
                          <td style={{ padding: 'var(--space-3)' }}>${Number(s.grossSalary).toFixed(2)}</td>
                          <td style={{ padding: 'var(--space-3)', color: 'var(--color-danger-text)' }}>-${Number(s.deductions).toFixed(2)}</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right', fontWeight: 'bold', color: 'var(--color-success)' }}>${Number(s.netSalary).toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pending Leaves requests */}
            <Card padding="md">
              <h4 style={{ margin: '0 0 var(--space-3)', display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={16} /> Leave Status</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-sunken)' }}>
                      <th style={{ padding: 'var(--space-3)' }}>Start Date</th>
                      <th style={{ padding: 'var(--space-3)' }}>End Date</th>
                      <th style={{ padding: 'var(--space-3)' }}>Reason</th>
                      <th style={{ padding: 'var(--space-3)', textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pendingLeaves.length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No pending leave requests.</td>
                      </tr>
                    ) : (
                      data.pendingLeaves.map(l => (
                        <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: 'var(--space-3)' }}>{new Date(l.startDate).toLocaleDateString()}</td>
                          <td style={{ padding: 'var(--space-3)' }}>{new Date(l.endDate).toLocaleDateString()}</td>
                          <td style={{ padding: 'var(--space-3)' }}>{l.reason}</td>
                          <td style={{ padding: 'var(--space-3)', textAlign: 'right' }}><StatusBadge status={l.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Assigned Assets */}
            <Card padding="md">
              <h4 style={{ margin: '0 0 var(--space-3)', display: 'flex', alignItems: 'center', gap: 8 }}><Briefcase size={16} /> Assigned Company Assets</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-3)' }}>
                {data.assignedAssets.length === 0 ? (
                  <div style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center', gridColumn: '1/-1' }}>No company assets assigned.</div>
                ) : (
                  data.assignedAssets.map(asset => (
                    <Card key={asset.id} padding="sm" style={{ border: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{asset.assetName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{asset.assetType} • S/N: {asset.serialNumber}</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: 4 }}>Assigned: {new Date(asset.assignedDate).toLocaleDateString()}</div>
                    </Card>
                  ))
                )}
              </div>
            </Card>

            {/* My Documents */}
            <Card padding="md">
              <h4 style={{ margin: '0 0 var(--space-3)', display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={16} /> Documents & Contracts</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                {data.documents.length === 0 ? (
                  <div style={{ padding: 'var(--space-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>No documents uploaded.</div>
                ) : (
                  data.documents.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-bg-sunken)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: 'var(--text-sm)' }}>
                        <span style={{ fontWeight: 600 }}>{doc.name}</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginLeft: 8 }}>({doc.docType})</span>
                      </div>
                      {doc.fileUrl ? (
                        <a href={doc.fileUrl} download style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Download File</a>
                      ) : (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>No File</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <User size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: 16 }} />
          <h3>Self-Service Dashboard Not Connected</h3>
          <p>We could not find an Employee Profile linked to your user account.</p>
        </div>
      )}
    </div>
  );
}
