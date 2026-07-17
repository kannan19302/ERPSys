import { defineModule, defineResource } from '@unerp/framework';

// ─────────────────────────────────────────────────
// Inventory module definition — the pilot adoption
// of @unerp/framework. Pages under app/(dashboard)/
// inventory consume these schemas instead of
// hand-rolling fetch/table/form code.
// ─────────────────────────────────────────────────

export const productResource = defineResource({
  name: 'products',
  labelSingular: 'Product',
  labelPlural: 'Products',
  endpoint: '/inventory/products',
  titleField: 'name',
  permissions: {
    read: 'inventory.product.read',
    create: 'inventory.product.create',
    update: 'inventory.product.update',
    delete: 'inventory.product.delete',
  },
  status: {
    field: 'type',
    tones: {
      GOODS: 'success',
      SERVICE: 'info',
      CONSUMABLE: 'warning',
      RAW_MATERIAL: 'neutral',
      FINISHED_GOOD: 'success',
      SEMI_FINISHED: 'warning',
      ASSET: 'info',
    },
  },
  fields: [
    { name: 'sku', label: 'SKU Code', type: 'text', required: true, placeholder: 'SKU-XXX-001' },
    { name: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Premium Core Processor' },
    {
      // Values mirror the Product.type column (see prisma schema.prisma)
      name: 'type',
      label: 'Inventory Type',
      type: 'select',
      required: true,
      defaultValue: 'GOODS',
      options: [
        { value: 'GOODS', label: 'Goods' },
        { value: 'SERVICE', label: 'Service' },
        { value: 'CONSUMABLE', label: 'Consumable' },
        { value: 'RAW_MATERIAL', label: 'Raw Material' },
        { value: 'FINISHED_GOOD', label: 'Finished Good' },
        { value: 'SEMI_FINISHED', label: 'Semi-Finished' },
        { value: 'ASSET', label: 'Asset' },
      ],
    },
    { name: 'unit', label: 'Measurement Unit', type: 'text', required: true, defaultValue: 'EACH' },
    { name: 'costPrice', label: 'Cost Price', type: 'currency', min: 0, defaultValue: 0 },
    { name: 'sellPrice', label: 'Sell Price', type: 'currency', min: 0, defaultValue: 0 },
    { name: 'category', label: 'Category', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
  ],
  list: {
    columns: ['sku', 'name', 'category', 'type', 'sellPrice'],
    searchable: true,
    pageSize: 25,
    defaultSort: { field: 'name', direction: 'asc' },
    filters: ['type', 'category'],
    selectable: true,
    savedViews: true,
    inlineEdit: ['sellPrice'],
  },
  form: {
    sections: [
      { title: 'Identification', fields: ['sku', 'name', 'type', 'unit'] },
      { title: 'Pricing & Classification', fields: ['costPrice', 'sellPrice', 'category', 'description'] },
    ],
  },
});

export const warehouseResource = defineResource({
  name: 'warehouses',
  labelSingular: 'Warehouse',
  labelPlural: 'Warehouses',
  endpoint: '/inventory/warehouses',
  titleField: 'name',
  permissions: {
    read: 'inventory.warehouse.read',
    create: 'inventory.warehouse.create',
    update: 'inventory.warehouse.update',
    delete: 'inventory.warehouse.delete',
  },
  fields: [
    { name: 'code', label: 'Code', type: 'text', required: true, placeholder: 'WH-MAIN' },
    { name: 'name', label: 'Warehouse Name', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'isActive', label: 'Active', type: 'boolean', defaultValue: true },
  ],
  list: {
    columns: ['code', 'name', 'address', 'items', 'isActive'],
    searchable: false,
    pageSize: 25,
    render: {
      items: (row) => String((row._count as { inventoryItems?: number } | undefined)?.inventoryItems ?? 0),
      isActive: (row) => (row.isActive ? 'Active' : 'Inactive'),
    },
  },
});

export const categoryResource = defineResource({
  name: 'categories',
  labelSingular: 'Category',
  labelPlural: 'Categories',
  endpoint: '/inventory/categories',
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'text' },
  ],
});

export const stockLedgerResource = defineResource({
  name: 'stock-ledger',
  labelSingular: 'Ledger Entry',
  labelPlural: 'Stock Ledger',
  endpoint: '/inventory/stock-ledger',
  permissions: { read: 'inventory.stock.read' },
  fields: [
    { name: 'createdAt', label: 'Date', type: 'datetime', readOnly: true },
    { name: 'voucherType', label: 'Voucher', type: 'text', readOnly: true },
    { name: 'voucherNumber', label: 'Voucher #', type: 'text', readOnly: true },
    { name: 'quantity', label: 'Qty Change', type: 'number', readOnly: true },
    { name: 'valuationRate', label: 'Valuation Rate', type: 'currency', readOnly: true },
    { name: 'balanceQty', label: 'Balance', type: 'number', readOnly: true },
    { name: 'productId', label: 'Product', type: 'link', link: { resource: 'products', labelField: 'name' }, readOnly: true },
    { name: 'warehouseId', label: 'Warehouse', type: 'link', link: { resource: 'warehouses', labelField: 'name' }, readOnly: true },
  ],
  list: { columns: ['createdAt', 'productId', 'warehouseId', 'voucherType', 'voucherNumber', 'quantity', 'valuationRate', 'balanceQty'], searchable: true, pageSize: 25, defaultSort: { field: 'createdAt', direction: 'desc' }, filters: ['productId', 'warehouseId'] },
});

export const stockLevelResource = defineResource({
  name: 'stock-levels',
  labelSingular: 'Stock Level',
  labelPlural: 'Stock Levels',
  endpoint: '/inventory/stock-levels',
  titleField: 'product',
  permissions: { read: 'inventory.stock.read' },
  fields: [
    { name: 'product', label: 'Product', type: 'text', readOnly: true },
    { name: 'warehouse', label: 'Warehouse', type: 'text', readOnly: true },
    { name: 'quantity', label: 'Qty on Hand', type: 'number', readOnly: true },
    { name: 'reorderPoint', label: 'Reorder Point', type: 'number', readOnly: true },
  ],
  list: {
    columns: ['product', 'warehouse', 'quantity', 'reorderPoint'],
    searchable: true,
    pageSize: 25,
    render: {
      product: (row) => { const p = row.product as { name?: string; sku?: string } | undefined; return p ? `${p.name ?? ''} (${p.sku ?? ''})` : ''; },
      warehouse: (row) => { const w = row.warehouse as { name?: string } | undefined; return w?.name ?? ''; },
    },
  },
});

export const binLocationResource = defineResource({
  name: 'bin-locations',
  labelSingular: 'Bin Location',
  labelPlural: 'Bin Locations',
  endpoint: '/inventory/bin-locations',
  titleField: 'code',
  permissions: { read: 'inventory.warehouse.read', create: 'inventory.warehouse.create', update: 'inventory.warehouse.update', delete: 'inventory.warehouse.delete' },
  fields: [
    { name: 'warehouseId', label: 'Warehouse', type: 'link', link: { resource: 'warehouses', labelField: 'name' }, required: true },
    { name: 'code', label: 'Bin Code', type: 'text', required: true },
    { name: 'name', label: 'Display Name', type: 'text' },
    { name: 'zone', label: 'Zone', type: 'text', required: true, defaultValue: 'A' },
    { name: 'aisle', label: 'Aisle', type: 'text' },
    { name: 'rack', label: 'Rack', type: 'text' },
    { name: 'bin', label: 'Bin', type: 'text' },
    { name: 'capacity', label: 'Capacity', type: 'number', min: 0 },
  ],
  list: { columns: ['code', 'name', 'warehouseId', 'zone', 'aisle', 'rack', 'bin', 'capacity'], searchable: true, pageSize: 25, defaultSort: { field: 'code', direction: 'asc' }, filters: ['warehouseId'], selectable: true },
});

export const batchResource = defineResource({
  name: 'batches',
  labelSingular: 'Batch',
  labelPlural: 'Batches',
  endpoint: '/inventory/batches',
  titleField: 'batchNo',
  permissions: { read: 'inventory.stock.read', create: 'inventory.stock.create', update: 'inventory.stock.update' },
  status: { field: 'status', tones: { ACTIVE: 'success', PARTIALLY_USED: 'warning', EXHAUSTED: 'neutral', EXPIRED: 'danger', QUARANTINE: 'danger' } },
  fields: [
    { name: 'productId', label: 'Product', type: 'link', link: { resource: 'products', labelField: 'name' }, required: true },
    { name: 'batchNo', label: 'Batch Number', type: 'text', required: true },
    { name: 'lotNo', label: 'Lot Number', type: 'text' },
    { name: 'quantity', label: 'Quantity', type: 'number', required: true, min: 0 },
    { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
    { name: 'supplierBatchNo', label: 'Supplier Batch', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
    { name: 'usedQty', label: 'Used Quantity', type: 'number', readOnly: true },
    { name: 'status', label: 'Status', type: 'text', readOnly: true },
  ],
  list: { columns: ['batchNo', 'lotNo', 'productId', 'quantity', 'usedQty', 'expiryDate', 'status'], searchable: true, pageSize: 25, defaultSort: { field: 'expiryDate', direction: 'asc' }, filters: ['productId', 'status'], selectable: true },
});

export const serialNumberResource = defineResource({
  name: 'serial-numbers',
  labelSingular: 'Serial Number',
  labelPlural: 'Serial Numbers',
  endpoint: '/inventory/serial-numbers',
  titleField: 'serialNo',
  permissions: { read: 'inventory.stock.read', create: 'inventory.stock.create', update: 'inventory.stock.update' },
  status: { field: 'status', tones: { AVAILABLE: 'success', RESERVED: 'warning', SOLD: 'info', IN_REPAIR: 'warning', SCRAPPED: 'danger', RETURNED: 'neutral' } },
  fields: [
    { name: 'productId', label: 'Product', type: 'link', link: { resource: 'products', labelField: 'name' }, required: true },
    { name: 'warehouseId', label: 'Warehouse', type: 'link', link: { resource: 'warehouses', labelField: 'name' } },
    { name: 'serialNo', label: 'Serial Number', type: 'text', required: true },
    { name: 'status', label: 'Status', type: 'select', defaultValue: 'AVAILABLE', options: ['AVAILABLE', 'RESERVED', 'SOLD', 'IN_REPAIR', 'SCRAPPED', 'RETURNED'].map((value) => ({ value, label: value.replace('_', ' ') })) },
    { name: 'purchaseDate', label: 'Purchase Date', type: 'date' },
    { name: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
    { name: 'purchaseOrderId', label: 'Purchase Order', type: 'text' },
    { name: 'salesOrderId', label: 'Sales Order', type: 'text' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
  list: { columns: ['serialNo', 'productId', 'warehouseId', 'status', 'warrantyExpiry'], searchable: true, pageSize: 25, defaultSort: { field: 'serialNo', direction: 'asc' }, filters: ['productId', 'status'], selectable: true },
});

export const cycleCountScheduleResource = defineResource({
  name: 'cycle-count-schedules',
  labelSingular: 'Cycle Count Schedule',
  labelPlural: 'Cycle Count Schedules',
  endpoint: '/inventory/cycle-count-schedules',
  titleField: 'warehouseId',
  permissions: { read: 'inventory.stock.read', create: 'inventory.stock.create', update: 'inventory.stock.update', delete: 'inventory.stock.delete' },
  fields: [
    { name: 'warehouseId', label: 'Warehouse', type: 'link', link: { resource: 'warehouses', labelField: 'name' }, required: true },
    { name: 'zone', label: 'Zone', type: 'text' },
    { name: 'binScope', label: 'Bin Scope', type: 'text' },
    { name: 'frequency', label: 'Frequency', type: 'select', required: true, defaultValue: 'MONTHLY', options: [{ value: 'WEEKLY', label: 'Weekly' }, { value: 'MONTHLY', label: 'Monthly' }, { value: 'QUARTERLY', label: 'Quarterly' }] },
    { name: 'blindCount', label: 'Blind Count', type: 'boolean', defaultValue: false },
    { name: 'nextDueDate', label: 'Next Due Date', type: 'date', required: true },
    { name: 'active', label: 'Active', type: 'boolean', defaultValue: true },
  ],
  list: { columns: ['warehouseId', 'zone', 'binScope', 'frequency', 'blindCount', 'nextDueDate', 'active'], searchable: false, pageSize: 25, defaultSort: { field: 'nextDueDate', direction: 'asc' }, filters: ['warehouseId', 'active'], selectable: true },
});

export const productVariantResource = defineResource({
  name: 'product-variants',
  labelSingular: 'Variant',
  labelPlural: 'Variants',
  endpoint: '/inventory/products/variants',
  permissions: { create: 'inventory.product.update' },
  fields: [
    // parentSkuId is provided via FormView `initial` and never rendered
    { name: 'parentSkuId', label: 'Parent Product', type: 'text' },
    { name: 'sku', label: 'Variant SKU', type: 'text', required: true },
    { name: 'name', label: 'Variant Name', type: 'text', required: true },
    { name: 'color', label: 'Color', type: 'text' },
    { name: 'size', label: 'Size', type: 'text' },
    { name: 'costPrice', label: 'Cost Price', type: 'currency', min: 0, defaultValue: 0 },
    { name: 'sellPrice', label: 'Sell Price', type: 'currency', min: 0, defaultValue: 0 },
  ],
  form: { sections: [{ fields: ['sku', 'name', 'color', 'size', 'costPrice', 'sellPrice'] }] },
});

export const inventoryModule = defineModule({
  id: 'inventory',
  title: 'Inventory',
  basePath: '/inventory',
  permission: 'inventory.product.read',
  resources: [productResource, warehouseResource, categoryResource, stockLedgerResource, stockLevelResource, binLocationResource, batchResource, serialNumberResource, cycleCountScheduleResource, productVariantResource],
});
