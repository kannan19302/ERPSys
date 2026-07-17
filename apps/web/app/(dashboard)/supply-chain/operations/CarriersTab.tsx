'use client';
import styles from './operations.module.css';
import React, { useState } from 'react';
import {
  Card, Button, Badge, DataTable, type Column, Modal, TextField, FormField, Select, KPICard,
} from '@unerp/ui';
import { Truck, Plus, Star, DollarSign, Clock } from 'lucide-react';

interface Carrier {
  id: string;
  name: string;
  type: string;
  contactEmail: string;
  contactPhone: string;
  rating: number;
  avgDeliveryDays: number;
  costPerKg: number;
  status: 'ACTIVE' | 'INACTIVE';
  shipmentCount: number;
}

const MOCK_CARRIERS: Carrier[] = [
  { id: '1', name: 'FedEx', type: 'EXPRESS', contactEmail: 'business@fedex.com', contactPhone: '+1-800-463-3339', rating: 4.5, avgDeliveryDays: 3, costPerKg: 12.50, status: 'ACTIVE', shipmentCount: 45 },
  { id: '2', name: 'UPS', type: 'STANDARD', contactEmail: 'support@ups.com', contactPhone: '+1-800-742-5877', rating: 4.3, avgDeliveryDays: 5, costPerKg: 8.75, status: 'ACTIVE', shipmentCount: 32 },
  { id: '3', name: 'DHL Express', type: 'INTERNATIONAL', contactEmail: 'sales@dhl.com', contactPhone: '+1-800-225-5345', rating: 4.7, avgDeliveryDays: 4, costPerKg: 15.00, status: 'ACTIVE', shipmentCount: 18 },
  { id: '4', name: 'USPS', type: 'ECONOMY', contactEmail: 'help@usps.com', contactPhone: '+1-800-275-8777', rating: 3.8, avgDeliveryDays: 7, costPerKg: 5.25, status: 'ACTIVE', shipmentCount: 22 },
];

export default function CarriersTab() {
  const [carriers] = useState(MOCK_CARRIERS);
  const [createOpen, setCreateOpen] = useState(false);

  const columns: Column<Carrier>[] = [
    {
      key: 'name', header: 'Carrier',
      render: (row) => (
        <div className="ui-hstack-3">
          <div className={styles.carrierIconWell}>
            <Truck size={18} />
          </div>
          <div>
            <div className="ui-heading-sm">{row.name}</div>
            <div className="ui-text-xs-tertiary">{row.contactEmail}</div>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Service Type', render: (row) => <Badge variant="info">{row.type}</Badge> },
    {
      key: 'rating', header: 'Rating',
      render: (row) => (
        <div className="ui-flex ui-items-center ui-gap-1">
          <Star size={12} className={styles.starIcon} />
          <span className="ui-heading-sm">{row.rating}</span>
        </div>
      ),
    },
    { key: 'avgDeliveryDays', header: 'Avg Delivery', render: (row) => <span className="text-sm">{row.avgDeliveryDays} days</span> },
    { key: 'costPerKg', header: 'Cost/kg', align: 'right' as const, render: (row) => <span className="font-semibold">${row.costPerKg.toFixed(2)}</span> },
    { key: 'shipmentCount', header: 'Shipments', render: (row) => <span className="text-sm">{row.shipmentCount}</span> },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : 'default'}>{row.status}</Badge> },
  ];

  return (
    <div className="ui-stack-6">
      <div className="ui-flex-end">
        <Button variant="primary" onClick={() => setCreateOpen(true)}><Plus size={14} className="mr-2" /> Add Carrier</Button>
      </div>

      <div className="ui-grid-auto">
        <KPICard title="Active Carriers" value={carriers.filter(c => c.status === 'ACTIVE').length} icon={<Truck size={18} />} color="var(--color-primary)" />
        <KPICard title="Avg Cost/kg" value={`$${(carriers.reduce((a, c) => a + c.costPerKg, 0) / carriers.length).toFixed(2)}`} icon={<DollarSign size={18} />} color="var(--color-info)" />
        <KPICard title="Avg Delivery" value={`${Math.round(carriers.reduce((a, c) => a + c.avgDeliveryDays, 0) / carriers.length)} days`} icon={<Clock size={18} />} color="var(--color-success)" />
      </div>

      <Card padding="none">
        <DataTable columns={columns} data={carriers} rowKey={r => r.id}
          emptyTitle="No carriers" emptyMessage="Add shipping carriers to manage your logistics network." emptyIcon={<Truck size={48} />} />
      </Card>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Carrier" size="md"
        footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button variant="primary">Save Carrier</Button></>}>
        <div className="ui-stack-4">
          <TextField label="Carrier Name" required placeholder="FedEx" />
          <div className="ui-grid-2 ui-gap-3">
            <FormField label="Service Type"><Select><option value="EXPRESS">Express</option><option value="STANDARD">Standard</option><option value="ECONOMY">Economy</option><option value="INTERNATIONAL">International</option></Select></FormField>
            <TextField label="Cost per kg ($)" type="number" step="0.01" placeholder="12.50" />
          </div>
          <div className="ui-grid-2 ui-gap-3">
            <TextField label="Contact Email" type="email" placeholder="business@carrier.com" />
            <TextField label="Contact Phone" placeholder="+1-800-000-0000" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
