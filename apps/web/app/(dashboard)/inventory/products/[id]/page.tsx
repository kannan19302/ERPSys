'use client';
import styles from './page.module.css';
import React, { useState } from 'react';
import { Badge, Button, Card, DataTable, Modal, Tabs, type Column } from '@unerp/ui';
import { useQueryClient } from '@tanstack/react-query';
import {
  DetailView,
  FormView,
  Guarded,
  RouteGuard,
  resourceKeys,
  useApiClient,
  useResourceDoc,
  useResourceList,
  type FieldValues,
} from '@unerp/framework';
import { productResource, productVariantResource, stockLedgerResource } from '@/modules/inventory';

interface WarehouseStockRow extends FieldValues {
  quantity: number;
  reservedQty: number;
  valuationRate: number;
  warehouse: { id: string; name: string; code: string };
}

interface VariantRow extends FieldValues {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  sellPrice: number;
}

const stockColumns: Column<WarehouseStockRow>[] = [
  { key: 'warehouse', header: 'Warehouse', render: (r) => `${r.warehouse.name} (${r.warehouse.code})` },
  { key: 'quantity', header: 'On Hand', align: 'right', render: (r) => Number(r.quantity).toLocaleString() },
  { key: 'reservedQty', header: 'Reserved', align: 'right', render: (r) => Number(r.reservedQty ?? 0).toLocaleString() },
  {
    key: 'valuationRate',
    header: 'Valuation Rate',
    align: 'right',
    render: (r) => Number(r.valuationRate ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 }),
  },
];

const variantColumns: Column<VariantRow>[] = [
  { key: 'sku', header: 'SKU' },
  { key: 'name', header: 'Name' },
  {
    key: 'attributes',
    header: 'Attributes',
    render: (r) => (
      <span className={styles.s1}>
        {Object.entries(r.attributes ?? {}).map(([k, v]) => (
          <Badge key={k} variant="info">{`${k}: ${v}`}</Badge>
        ))}
      </span>
    ),
  },
  {
    key: 'sellPrice',
    header: 'Sell Price',
    align: 'right',
    render: (r) => Number(r.sellPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
  },
];

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: productId } = React.use(params);
  const [tab, setTab] = useState('stock');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVariantOpen, setIsVariantOpen] = useState(false);

  const { data: product } = useResourceDoc<FieldValues>(productResource, productId);
  const queryClient = useQueryClient();
  const apiClient = useApiClient();
  // Variants live inside the product record, so a new variant must refresh it
  const refreshProduct = () =>
    queryClient.invalidateQueries({ queryKey: resourceKeys(apiClient.tenantId, productResource.name).all });
  const ledger = useResourceList(stockLedgerResource, { pageSize: 50, filters: { productId } });

  const stockRows = ((product?.inventoryItems as WarehouseStockRow[] | undefined) ?? []).map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    reservedQty: Number(item.reservedQty ?? 0),
    valuationRate: Number(item.valuationRate ?? 0),
  }));
  const variantRows = ((product?.variants as VariantRow[] | undefined) ?? []).map((v) => ({
    ...v,
    sellPrice: Number(v.sellPrice),
  }));

  return (
    <RouteGuard permission="inventory.product.read">
      <DetailView
        resource={productResource}
        id={productId}
        onEdit={() => setIsEditOpen(true)}
        actions={
          <Guarded permission="inventory.product.update">
            <Button variant="secondary" onClick={() => setIsVariantOpen(true)}>
              Add Variant
            </Button>
          </Guarded>
        }
      >
        <Card padding="md" className="ui-stack-4">
          <Tabs
            value={tab}
            onChange={setTab}
            tabs={[
              { key: 'stock', label: `Stock by Warehouse (${stockRows.length})` },
              { key: 'variants', label: `Variants (${variantRows.length})` },
              { key: 'ledger', label: 'Stock Ledger' },
            ]}
          />

          {tab === 'stock' && (
            <DataTable<WarehouseStockRow>
              columns={stockColumns}
              data={stockRows}
              rowKey={(r) => r.warehouse.id}
              emptyTitle="No stock on hand"
              emptyMessage="Stock entries against this product will appear here."
            />
          )}

          {tab === 'variants' && (
            <DataTable<VariantRow>
              columns={variantColumns}
              data={variantRows}
              rowKey={(r) => r.id}
              emptyTitle="No variants"
              emptyMessage="Add color/size variants of this SKU."
            />
          )}

          {tab === 'ledger' && (
            <DataTable<FieldValues>
              columns={stockLedgerResource.fields.map((f) => ({
                key: f.name,
                header: f.label,
                align: f.type === 'number' || f.type === 'currency' ? 'right' : 'left',
                render:
                  f.name === 'createdAt'
                    ? (r: FieldValues) => new Date(String(r.createdAt)).toLocaleString()
                    : undefined,
              }))}
              data={ledger.data?.data ?? []}
              loading={ledger.isLoading}
              rowKey={(r, i) => String(r.id ?? i)}
              emptyTitle="No ledger entries"
              emptyMessage="Stock movements for this product will appear here."
            />
          )}
        </Card>
      </DetailView>

      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Product">
        <FormView
          resource={productResource}
          id={productId}
          onSuccess={() => setIsEditOpen(false)}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      <Modal open={isVariantOpen} onClose={() => setIsVariantOpen(false)} title="Add Product Variant">
        <FormView
          resource={productVariantResource}
          initial={{ parentSkuId: productId }}
          transform={(payload) => {
            const { color, size, ...rest } = payload;
            const attributes: Record<string, string> = {};
            if (color) attributes.Color = String(color);
            if (size) attributes.Size = String(size);
            return { ...rest, attributes, isActive: true };
          }}
          onSuccess={() => {
            setIsVariantOpen(false);
            void refreshProduct();
          }}
          onCancel={() => setIsVariantOpen(false)}
        />
      </Modal>
    </RouteGuard>
  );
}
