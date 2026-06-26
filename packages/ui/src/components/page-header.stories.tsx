import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from './page-header';

const meta: Meta<typeof PageHeader> = {
  title: 'Components/PageHeader',
  component: PageHeader,
  parameters: { layout: 'padded' },
};
export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Simple: Story = { args: { title: 'Invoices', description: 'Manage your invoices and billing' } };
export const WithBreadcrumbs: Story = {
  args: {
    title: 'Invoice #INV-001',
    description: 'View invoice details',
    breadcrumbs: [{ label: 'Finance', href: '/finance' }, { label: 'Invoices', href: '/finance/invoices' }, { label: 'INV-001' }],
  },
};
export const WithActions: Story = {
  args: {
    title: 'Products',
    description: 'Manage your product catalog',
    actions: '<button>Add Product</button>' as any,
  },
};
