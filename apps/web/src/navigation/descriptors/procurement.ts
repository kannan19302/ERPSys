import { registerModule } from '@unerp/shared/module-registry';

registerModule({
  slug: 'procurement',
  title: 'Procurement',
  icon: 'ShoppingCart',
  routeSegment: 'procurement',
  dashboardRoute: '/procurement',
  settingsRoute: undefined,
  nav: [
    { label: 'Procurement Dashboard', href: '/procurement', icon: 'ShoppingCart' },
    { label: 'Purchase Requisitions', href: '/procurement/requisitions', icon: 'ClipboardCheck' },
    { label: 'Blanket Agreements', href: '/procurement/blanket-agreements', icon: 'Layers' },
    { label: 'Purchase Orders', href: '/procurement/purchase-orders', icon: 'FileText' },
    { label: 'Purchase Receipts (GRN)', href: '/procurement/purchase-receipts', icon: 'Truck' },
    { label: 'Supplier Returns', href: '/procurement/returns', icon: 'History' },
    { label: 'Sourcing (RFQs)', href: '/procurement/rfqs', icon: 'ClipboardList' },
    { label: 'Supplier Bids', href: '/procurement/supplier-quotations', icon: 'FileText' },
    { label: 'Supplier Directory', href: '/procurement/vendors', icon: 'Building2' },
    { label: 'Supplier Portal', href: '/procurement/portal', icon: 'Store' },
  ],
});
