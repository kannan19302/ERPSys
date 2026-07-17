'use client';
import { PageHeader } from '@unerp/ui';
import { ListView, RouteGuard } from '@unerp/framework';
import { stockLedgerResource } from '@/modules/inventory';

export default function StockLedgerPage() {
  return (
    <RouteGuard permission="inventory.stock.read">
      <div className="ui-card">
        <PageHeader title="Stock Ledger" description="Review inventory movements, valuation changes, and running balances." breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Inventory', href: '/inventory' }, { label: 'Stock Ledger' }]} />
        <ListView resource={stockLedgerResource} />
      </div>
    </RouteGuard>
  );
}
