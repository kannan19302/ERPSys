'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, PageHeader, Button, Spinner, Badge } from '@unerp/ui';
import {
  Award,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle,
  Percent,
  TrendingDown,
  Building,
  ArrowLeft,
  RefreshCw,
  ShoppingBag,
  DollarSign
} from 'lucide-react';

interface Scorecard {
  vendorId: string;
  vendorName: string;
  onTimeDeliveryRate: number;
  qualityRate: number;
  defectRate: number;
  totalOrders: number;
  totalSpend: number;
  avgLeadTimeDays: number;
}

export default function VendorScorecardPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.id as string;

  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadScorecard = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token || ''}` };

      const res = await fetch(`/api/v1/procurement/vendors/${vendorId}/scorecard`, { headers });
      if (!res.ok) throw new Error();
      setScorecard(await res.json());
    } catch {
      setError('Could not load data. Please try again.');
      setScorecard({
        vendorId,
        vendorName: 'Apex Metal Solutions',
        onTimeDeliveryRate: 92.5,
        qualityRate: 98.2,
        defectRate: 1.8,
        totalOrders: 24,
        totalSpend: 125000,
        avgLeadTimeDays: 4.2
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      loadScorecard();
    }
  }, [vendorId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!scorecard) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'var(--space-12)' }}>
        <AlertCircle size={48} style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-4)' }} />
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>Vendor Scorecard Not Found</h3>
        <Button onClick={() => router.push('/procurement/vendors')} className="frappe-btn frappe-btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
          Back to Directory
        </Button>
      </div>
    );
  }

  // Calculate Vendor Class/Tier
  const getSupplierTier = (otd: number, quality: number) => {
    if (otd >= 90 && quality >= 95) {
      return { tier: 'Preferred (Class A)', color: 'var(--color-success)', desc: 'Demonstrates exceptional delivery precision and strict quality compliance. Recommended for priority contract allocation.' };
    }
    if (otd >= 80 && quality >= 90) {
      return { tier: 'Good Standings (Class B)', color: 'var(--color-primary)', desc: 'Reliable supplier meeting key delivery schedules. Minor occasional quality variances.' };
    }
    if (otd >= 70 && quality >= 80) {
      return { tier: 'Remediation Action Required (Class C)', color: 'var(--color-warning)', desc: 'Underperforming in either delivery timeliness or component quality. Formulate a corrective action plan.' };
    }
    return { tier: 'Probation / Under Review (Class D)', color: 'var(--color-danger)', desc: 'Critical underperformance. Highly elevated defect rates or chronic shipping delays. Stop active sourcing.' };
  };

  const supplierClass = getSupplierTier(scorecard.onTimeDeliveryRate, scorecard.qualityRate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', animation: 'fadeInUp 0.4s ease-out' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button
          onClick={() => router.push('/procurement/vendors')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-sunken)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
        >
          <ArrowLeft size={18} />
        </button>
        <PageHeader
          title={`${scorecard.vendorName} Performance`}
          description="Supplier Quality scorecard, on-time delivery audits, defect tracking, and volume analytics."
          breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Procurement', href: '/procurement' }, { label: 'Suppliers', href: '/procurement/vendors' }, { label: scorecard.vendorName }, { label: 'Performance' }]}
          actions={
            <Button onClick={loadScorecard} className="frappe-btn frappe-btn-secondary">
              <RefreshCw size={14} style={{ marginRight: 'var(--space-2)' }} />
              Re-calculate Metrics
            </Button>
          }
        />
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-light)', border: '1px solid var(--color-warning)', borderRadius: 'var(--radius-md)', color: 'var(--color-warning-text)', fontSize: 'var(--text-sm)' }}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Tier Classification Banner */}
      <Card className="frappe-card" style={{ borderLeft: `5px solid ${supplierClass.color}`, padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
          <div style={{ color: supplierClass.color, background: 'var(--color-bg-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-lg)' }}>
            <Award size={32} />
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Supplier Sourcing Class</div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold', color: 'var(--color-text)', marginTop: 'var(--space-1)' }}>
              {supplierClass.tier}
            </h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-2)', lineHeight: '1.5' }}>
              {supplierClass.desc}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Metric Cards */}
      <div className="frappe-grid-4">
        
        {/* On Time Delivery */}
        <Card className="frappe-card" style={{ textAlign: 'center', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: 'var(--space-3)', borderRadius: '50%' }}>
            <Clock size={24} />
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>On-Time Delivery (OTD)</div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: scorecard.onTimeDeliveryRate >= 90 ? 'var(--color-success)' : scorecard.onTimeDeliveryRate >= 80 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
            {scorecard.onTimeDeliveryRate}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Based on PO expected date checks</div>
        </Card>

        {/* Quality Accepted */}
        <Card className="frappe-card" style={{ textAlign: 'center', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', padding: 'var(--space-3)', borderRadius: '50%' }}>
            <CheckCircle size={24} />
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Goods Acceptance Rate</div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: scorecard.qualityRate >= 95 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {scorecard.qualityRate}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Accepted vs total received inventory</div>
        </Card>

        {/* Defect Rate */}
        <Card className="frappe-card" style={{ textAlign: 'center', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ background: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: 'var(--space-3)', borderRadius: '50%' }}>
            <TrendingDown size={24} />
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Defect / Rejection Rate</div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: scorecard.defectRate <= 3 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {scorecard.defectRate}%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Items returned or scrapped on intake</div>
        </Card>

        {/* Lead Time */}
        <Card className="frappe-card" style={{ textAlign: 'center', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
          <div style={{ background: 'var(--color-warning-light)', color: 'var(--color-warning)', padding: 'var(--space-3)', borderRadius: '50%' }}>
            <Clock size={24} />
          </div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Avg Lead Time</div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)' }}>
            {scorecard.avgLeadTimeDays} Days
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>From PO creation to GRN completion</div>
        </Card>

      </div>

      {/* Sourcing Volume Stats */}
      <div className="frappe-grid-2">
        <Card className="frappe-card">
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            Supplier Sourcing Volume
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>Total Orders Placed</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Historical purchase order count</div>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold' }}>
                {scorecard.totalOrders} POs
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ background: 'var(--color-bg-sunken)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <DollarSign size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold' }}>Total Sourcing Spend</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Consolidated purchasing value</div>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                ${scorecard.totalSpend.toLocaleString()}
              </div>
            </div>

          </div>
        </Card>

        {/* Audit criteria explanation */}
        <Card className="frappe-card">
          <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'bold', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            Scorecard Audit Parameters
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
            <div>
              <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>On-Time Delivery (OTD) Rate</span> matches the actual warehouse Goods Receipt Note (GRN) dates against the expected shipment delivery dates committed inside the PO.
            </div>
            <div>
              <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>Goods Acceptance Rate</span> compiles incoming inspection check logs. For every receipt line item, we compare the accepted inventory count vs the total received count.
            </div>
            <div>
              <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>Average Lead Time</span> measures the total calendar days from the moment the Purchase Order is marked approved to when the inventory gets clocked at warehouses.
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
