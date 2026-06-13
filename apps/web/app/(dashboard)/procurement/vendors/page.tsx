'use client';

import React, { useState, useEffect } from 'react';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Search,
  Plus,
  Mail,
  Phone,
  Building,
  AlertCircle
} from 'lucide-react';

interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  paymentTerms: number;
  status: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const loadVendors = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/vendors', {
        headers: { Authorization: `Bearer ${token || ''}` }
      });
      if (!res.ok) throw new Error();
      setVendors(await res.json());
    } catch {
      setError('Serving local mock fallback registry.');
      setVendors([
        { id: 'v-1', name: 'Oscorp Chemical Supply', email: 'sales@oscorp.com', phone: '555-0144', paymentTerms: 30, status: 'ACTIVE' },
        { id: 'v-2', name: 'LexCorp Heavy Industries', email: 'logistics@lexcorp.com', phone: '555-0133', paymentTerms: 45, status: 'ACTIVE' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/crm/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || ''}`
        },
        body: JSON.stringify({ name, email, phone, paymentTerms })
      });
      if (!res.ok) throw new Error();
      setIsModalOpen(false);
      resetForm();
      loadVendors();
    } catch {
      // Mock local update
      const newMock: Vendor = {
        id: `v-mock-${Date.now()}`,
        name,
        email: email || null,
        phone: phone || null,
        paymentTerms,
        status: 'ACTIVE'
      };
      setVendors(prev => [newMock, ...prev]);
      setIsModalOpen(false);
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPaymentTerms(30);
  };

  const filteredVendors = vendors.filter(v =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.email && v.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      <PageHeader
        title="Supplier Directory"
        description="Onboard, review, and organize company suppliers and payment conditions."
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Procurement', href: '/procurement' }, { label: 'Vendors' }]}
        actions={
          <Button variant="primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <Plus size={14} />
            Onboard Vendor
          </Button>
        }
      />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error} (Serving local mock fallback list)</span>
        </div>
      )}

      {/* Filter panel */}
      <Card padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
        <div style={{ position: 'relative', maxWidth: '360px', width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            className="frappe-input"
            placeholder="Search suppliers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: 'var(--space-9)' }}
          />
        </div>
      </Card>

      {/* Directory Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-12)' }}>
          <Spinner size="lg" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
          {filteredVendors.map(v => (
            <Card key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '8px', borderRadius: 'var(--radius-md)' }}>
                    <Building size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 'var(--text-md)', fontWeight: 'var(--weight-semibold)' }}>{v.name}</h4>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>ID: {v.id.slice(0, 8)}</span>
                  </div>
                </div>
                <Badge variant="success">{v.status}</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Mail size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  <span>{v.email || 'No email recorded'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Phone size={14} style={{ color: 'var(--color-text-tertiary)' }} />
                  <span>{v.phone || 'No phone recorded'}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)', display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Net Terms: <strong style={{ color: 'var(--color-text)' }}>Net {v.paymentTerms}</strong></span>
              </div>
            </Card>
          ))}
          {filteredVendors.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-12)', color: 'var(--color-text-tertiary)' }}>
              No suppliers cataloged matching your parameters.
            </div>
          )}
        </div>
      )}

      {/* Onboard Vendor Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--color-bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }}>
          <div className="frappe-card" style={{ width: '100%', maxWidth: '460px', boxShadow: 'var(--shadow-xl)', background: 'var(--color-bg-elevated)' }}>
            <div className="frappe-card-header flex items-center justify-between" style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-md)' }}>Onboard Supplier Profile</span>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>Close</button>
            </div>
            <div className="frappe-card-body" style={{ padding: 'var(--space-5)' }}>
              <form onSubmit={handleCreateVendor} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Supplier Legal Name *</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Oscorp Chemicals"
                    required
                  />
                </div>
                <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Email Address</label>
                  <input
                    type="email"
                    className="frappe-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@oscorp.com"
                  />
                </div>
                <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Phone Number</label>
                  <input
                    type="text"
                    className="frappe-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="555-0144"
                  />
                </div>
                <div className="frappe-form-group" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <label className="frappe-label" style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text-secondary)' }}>Payment Terms (Days Credit)</label>
                  <select
                    className="frappe-input"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(Number(e.target.value))}
                    style={{ width: '100%', padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', fontSize: 'var(--text-sm)' }}
                  >
                    <option value={15}>Net 15</option>
                    <option value={30}>Net 30</option>
                    <option value={45}>Net 45</option>
                    <option value={60}>Net 60</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t border-muted pt-4" style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
                  <button type="button" className="frappe-btn frappe-btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="frappe-btn frappe-btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Onboard Vendor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
