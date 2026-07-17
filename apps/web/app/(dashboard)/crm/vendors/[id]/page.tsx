'use client';
import styles from './page.module.css';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Modal, Badge, ListPageTemplate, type ListColumn, ChangeHistory, useToast } from '@unerp/ui';
import { ArrowLeft, RefreshCw, Printer, ShieldAlert, Award, FileText } from 'lucide-react';
import { DetailView, FormView, RouteGuard, useApiClient } from '@unerp/framework';
import { vendorResource } from '@/modules/crm';

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const client = useApiClient();
  const { success, error } = useToast();

  const [vendorData, setVendorData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const fetchVendorSummary = useCallback(async () => {
    try {
      const summary = await client.get(`/crm/vendors/${id}/summary`);
      setVendorData(summary);
    } catch {}
  }, [id, client]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchVendorSummary();
      setLoading(false);
    };
    init();
  }, [fetchVendorSummary]);

  if (loading || !vendorData) {
    return (
      <div className="ui-center-pad">
        <RefreshCw size={24} className="animate-spin" />
      </div>
    );
  }

  const { vendor, metrics } = vendorData;

  return (
    <RouteGuard permission="crm.vendor.read">
      <div className="ui-stack-6">
        <DetailView
          resource={vendorResource}
          id={id}
          onEdit={() => setShowEdit(true)}
          actions={
            <div className="ui-flex ui-gap-2">
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer size={14} className="mr-2" /> Print Profile
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/crm/vendors')}>
                <ArrowLeft size={14} className="mr-2" /> Back
              </Button>
            </div>
          }
        >
          {/* Performance metrics dashboard widget */}
          <div className={styles.metricsGrid}>
            <Card padding="sm" className={styles.metricCard}>
              <span className={styles.metricLabel}>Total POS Spend</span>
              <span className="ui-heading-lg">
                ${(metrics?.totalSpend || 0).toLocaleString()}
              </span>
            </Card>
            <Card padding="sm" className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Orders</span>
              <span className="ui-heading-lg">
                {metrics?.totalPOs || 0}
              </span>
            </Card>
            <Card padding="sm" className={styles.metricCard}>
              <span className={styles.metricLabel}>On-Time Delivery</span>
              <span className={styles.s1}>
                {metrics?.onTimeDeliveryRate || 100}%
              </span>
            </Card>
            <Card padding="sm" className={styles.metricCard}>
              <span className={styles.metricLabel}>Quality Rating</span>
              <span className={styles.s2}>
                {vendor.qualityScore || 100}/100
              </span>
            </Card>
          </div>

          {/* Action sidebars & tabs */}
          <div className={styles.contentGrid}>
            <div>
              {/* Tab Selectors */}
              <div className={styles.tabs}>
                {[
                  { id: 'details', label: 'Compliance & Checklists' },
                  { id: 'pos', label: `Purchase Orders (${vendorData.pos?.length || 0})` },
                ].map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>

              {activeTab === 'details' && (
                <Card padding="md" className="ui-stack-4">
                   <h4 className={styles.sectionTitle}>
                    <ShieldAlert size={16} /> Compliance Checklist
                  </h4>
                  <div className="ui-stack-3">
                     <div className={styles.checkRow}>
                      <span>Tax/TIN ID Verified</span>
                      <Badge variant={vendor.checklistTaxVerified ? 'success' : 'default'}>
                        {vendor.checklistTaxVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                     <div className={styles.checkRow}>
                      <span>Bank Details Verified</span>
                      <Badge variant={vendor.checklistBankVerified ? 'success' : 'default'}>
                        {vendor.checklistBankVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </div>
                     <div className={styles.checkRow}>
                      <span>NDA/SLA Contract Signed</span>
                      <Badge variant={vendor.checklistNdaSigned ? 'success' : 'default'}>
                        {vendor.checklistNdaSigned ? 'Signed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              )}

              {activeTab === 'pos' && (
                <Card padding="md" className="ui-stack-4">
                  <h4 className={styles.s3}>
                    <FileText size={16} /> Linked Purchase Orders
                  </h4>
                  <ListPageTemplate
                    columns={[
                      { key: 'orderNumber', header: 'PO #' },
                      { key: 'totalAmount', header: 'Total Value', render: (v: any) => `$${Number(v).toLocaleString()}` },
                      { key: 'status', header: 'Status' },
                      { key: 'orderDate', header: 'Order Date', render: (v: any) => v ? new Date(v).toLocaleDateString() : '—' },
                    ] as ListColumn[]}
                    data={(vendorData.pos || []) as unknown as Record<string, unknown>[]}
                    loading={false}
                    emptyTitle="No POs found"
                    emptyDescription="No purchase orders linked to this vendor yet."
                  />
                </Card>
              )}
            </div>

            <div>
              {/* Onboarding & Delivery Info */}
              <Card padding="md" className="ui-stack-4">
                <h4 className={styles.s3}>
                  <Award size={16} /> Partner Details
                </h4>
                <div className="ui-stack-3">
                  <div>
                    <div className="ui-text-xs-soft">Onboarding Status</div>
                    <div className="ui-heading-sm">
                      {vendor.onboardingStatus || 'PENDING'}
                    </div>
                  </div>
                  <div>
                    <div className="ui-text-xs-soft">Average Lead Time</div>
                    <div className="ui-heading-sm">
                      {vendor.averageLeadTimeDays || metrics?.avgLeadTimeDays || 0} days
                    </div>
                  </div>
                  {vendor.notes && (
                    <div>
                      <div className="ui-text-xs-soft">Internal Notes</div>
                      <p className={styles.s4}>
                        {vendor.notes}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          <ChangeHistory entityType="Vendor" entityId={id} />
        </DetailView>

        {/* Edit Modal */}
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Vendor">
          <FormView
            resource={vendorResource}
            id={id}
            onSuccess={() => {
              setShowEdit(false);
              fetchVendorSummary();
            }}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      </div>
    </RouteGuard>
  );
}
