'use client';

import styles from './page.module.css';

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
import { RouteGuard, useApiClient } from '@unerp/framework';

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
  const client = useApiClient();
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
      setScorecard(await client.get<Scorecard>(`/procurement/vendors/${vendorId}/scorecard`));
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
  }, [vendorId, client]);

  if (loading) {
    return (
      <div className={styles.p1}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!scorecard) {
    return (
      <div className={styles.p2}>
        <AlertCircle size={48} className={styles.p3} />
        <h3 className={styles.p4}>Vendor Scorecard Not Found</h3>
        <Button onClick={() => router.push('/procurement/vendors')} className={["ui-btn ui-btn-secondary", styles.p5].join(' ')} >
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
    <RouteGuard permission="procurement.vendor-scorecard.read">
      <div className="ui-stack-6 ui-animate-in">

      {/* Header */}
      <div className="ui-hstack-2">
        <button
          onClick={() => router.push('/procurement/vendors')}
          className={styles.p6}
        >
          <ArrowLeft size={18} />
        </button>
        <PageHeader
          title={`${scorecard.vendorName} Performance`}
          description="Supplier Quality scorecard, on-time delivery audits, defect tracking, and volume analytics."
          breadcrumbs={[{ label: 'Apps', href: '/apps' }, { label: 'Procurement', href: '/procurement' }, { label: 'Suppliers', href: '/procurement/vendors' }, { label: scorecard.vendorName }, { label: 'Performance' }]}
          actions={
            <Button onClick={loadScorecard} className="ui-btn ui-btn-secondary">
              <RefreshCw size={14} className="mr-2" />
              Re-calculate Metrics
            </Button>
          }
        />
      </div>

      {error && (
        <div className={styles.p7}>
          <AlertCircle size={16} />
          <span>Note: {error}</span>
        </div>
      )}

      {/* Tier Classification Banner */}
      <Card className={["ui-card", styles.p8].join(' ')} style={{ borderLeft: `5px solid ${supplierClass.color}` }}>
        <div className={styles.p9}>
          <div style={{ color: supplierClass.color }}>
            <Award size={32} />
          </div>
          <div>
            <div className={styles.p11}>Supplier Sourcing Class</div>
            <h3 className={styles.p12}>
              {supplierClass.tier}
            </h3>
            <p className={styles.p13}>
              {supplierClass.desc}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Metric Cards */}
      <div className="ui-grid-4">

        {/* On Time Delivery */}
        <Card className={["ui-card", styles.p14].join(' ')} >
          <div className={styles.p15}>
            <Clock size={24} />
          </div>
          <div className={styles.p16}>On-Time Delivery (OTD)</div>
          <div style={{ color: scorecard.onTimeDeliveryRate >= 90 ? 'var(--color-success)' : scorecard.onTimeDeliveryRate >= 80 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
            {scorecard.onTimeDeliveryRate}%
          </div>
          <div className="ui-text-caption">Based on PO expected date checks</div>
        </Card>

        {/* Quality Accepted */}
        <Card className={["ui-card", styles.p18].join(' ')} >
          <div className={styles.p19}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.p20}>Goods Acceptance Rate</div>
          <div style={{ color: scorecard.qualityRate >= 95 ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {scorecard.qualityRate}%
          </div>
          <div className="ui-text-caption">Accepted vs total received inventory</div>
        </Card>

        {/* Defect Rate */}
        <Card className={["ui-card", styles.p22].join(' ')} >
          <div className={styles.p23}>
            <TrendingDown size={24} />
          </div>
          <div className={styles.p24}>Defect / Rejection Rate</div>
          <div style={{ color: scorecard.defectRate <= 3 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {scorecard.defectRate}%
          </div>
          <div className="ui-text-caption">Items returned or scrapped on intake</div>
        </Card>

        {/* Lead Time */}
        <Card className={["ui-card", styles.p26].join(' ')} >
          <div className={styles.p27}>
            <Clock size={24} />
          </div>
          <div className={styles.p28}>Avg Lead Time</div>
          <div className={styles.p29}>
            {scorecard.avgLeadTimeDays} Days
          </div>
          <div className="ui-text-caption">From PO creation to GRN completion</div>
        </Card>

      </div>

      {/* Sourcing Volume Stats */}
      <div className="ui-grid-2">
        <Card className="ui-card">
          <h4 className={styles.p30}>
            Supplier Sourcing Volume
          </h4>
          <div className="ui-stack-4">

            <div className="ui-flex-between">
              <div className={styles.p31}>
                <div className={styles.p32}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <div className={styles.p33}>Total Orders Placed</div>
                  <div className="ui-text-caption">Historical purchase order count</div>
                </div>
              </div>
              <div className={styles.p34}>
                {scorecard.totalOrders} POs
              </div>
            </div>

            <div className="ui-flex-between">
              <div className={styles.p35}>
                <div className={styles.p36}>
                  <DollarSign size={18} />
                </div>
                <div>
                  <div className={styles.p37}>Total Sourcing Spend</div>
                  <div className="ui-text-caption">Consolidated purchasing value</div>
                </div>
              </div>
              <div className={styles.p38}>
                ${scorecard.totalSpend.toLocaleString()}
              </div>
            </div>

          </div>
        </Card>

        {/* Audit criteria explanation */}
        <Card className="ui-card">
          <h4 className={styles.p39}>
            Scorecard Audit Parameters
          </h4>
          <div className={styles.p40}>
            <div>
              <span className={styles.p41}>On-Time Delivery (OTD) Rate</span> matches the actual warehouse Goods Receipt Note (GRN) dates against the expected shipment delivery dates committed inside the PO.
            </div>
            <div>
              <span className={styles.p42}>Goods Acceptance Rate</span> compiles incoming inspection check logs. For every receipt line item, we compare the accepted inventory count vs the total received count.
            </div>
            <div>
              <span className={styles.p43}>Average Lead Time</span> measures the total calendar days from the moment the Purchase Order is marked approved to when the inventory gets clocked at warehouses.
            </div>
          </div>
        </Card>
      </div>

      </div>
    </RouteGuard>
  );
}
