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
  fields: [
    { name: 'createdAt', label: 'Date', type: 'datetime', readOnly: true },
    { name: 'voucherType', label: 'Voucher', type: 'text', readOnly: true },
    { name: 'voucherNumber', label: 'Voucher #', type: 'text', readOnly: true },
    { name: 'quantity', label: 'Qty Change', type: 'number', readOnly: true },
    { name: 'valuationRate', label: 'Valuation Rate', type: 'currency', readOnly: true },
    { name: 'balanceQty', label: 'Balance', type: 'number', readOnly: true },
  ],
  list: { columns: ['createdAt', 'voucherType', 'voucherNumber', 'quantity', 'valuationRate', 'balanceQty'], searchable: false },
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
  resources: [productResource, warehouseResource, categoryResource, stockLedgerResource, productVariantResource],
});
