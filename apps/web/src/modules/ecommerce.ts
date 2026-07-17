import { defineModule, defineResource } from '@unerp/framework';

export const categoryResource = defineResource({
  name: 'ecommerce-categories',
  labelSingular: 'Storefront Category',
  labelPlural: 'Storefront Categories',
  endpoint: '/ecommerce/categories',
  titleField: 'name',
  permissions: {
    read: 'ecommerce.category.read',
    create: 'ecommerce.category.create',
    update: 'ecommerce.category.update',
    delete: 'ecommerce.category.delete',
  },
  fields: [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'slug', label: 'Slug', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'sortOrder', label: 'Sort Order', type: 'number', defaultValue: 0 },
  ],
  list: { columns: ['name', 'slug', 'description', 'sortOrder'], searchable: true, pageSize: 25, defaultSort: { field: 'sortOrder', direction: 'asc' } },
});

export const listingResource = defineResource({
  name: 'ecommerce-listings',
  labelSingular: 'Product Listing',
  labelPlural: 'Product Listings',
  endpoint: '/ecommerce/listings',
  titleField: 'productName',
  permissions: {
    read: 'ecommerce.listing.read',
    create: 'ecommerce.listing.create',
    update: 'ecommerce.listing.update',
    delete: 'ecommerce.listing.delete',
  },
  status: { field: 'isPublished', tones: { true: 'success', false: 'neutral' } },
  fields: [
    { name: 'productId', label: 'Product', type: 'link', link: { resource: 'products', labelField: 'name' }, required: true },
    { name: 'categoryId', label: 'Category', type: 'link', link: { resource: 'ecommerce-categories', labelField: 'name' } },
    { name: 'displayName', label: 'Display Name', type: 'text' },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'isPublished', label: 'Published', type: 'boolean', defaultValue: false },
    { name: 'priceOverride', label: 'Price Override', type: 'currency', min: 0 },
    { name: 'sortOrder', label: 'Sort Order', type: 'number', defaultValue: 0 },
  ],
  list: { columns: ['productName', 'productSku', 'categoryName', 'effectivePrice', 'isPublished', 'sortOrder'], searchable: true, pageSize: 25, defaultSort: { field: 'sortOrder', direction: 'asc' }, filters: ['categoryId', 'isPublished'] },
});

export const ecommerceModule = defineModule({
  id: 'ecommerce',
  title: 'E-Commerce',
  basePath: '/ecommerce',
  permission: 'ecommerce.category.read',
  resources: [categoryResource, listingResource],
});
