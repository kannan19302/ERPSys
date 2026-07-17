import type { Meta, StoryObj } from '@storybook/react';
import { ListPageTemplate } from './list-page-template';

const meta: Meta<typeof ListPageTemplate> = {
  title: 'Layout/ListPageTemplate',
  component: ListPageTemplate,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof ListPageTemplate>;

const COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Role' },
  { key: 'status', header: 'Status' },
];

const DATA = Array.from({ length: 8 }, (_, i) => ({
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 2 === 0 ? 'Admin' : 'Member',
  status: i % 3 === 0 ? 'INACTIVE' : 'ACTIVE',
}));

export const Default: Story = {
  args: {
    title: 'Team Members',
    subtitle: 'Manage your workspace members and their permissions.',
    columns: COLUMNS,
    data: DATA,
    searchable: true,
  },
};

export const WithPagination: Story = {
  args: {
    title: 'Products',
    columns: COLUMNS,
    data: DATA,
    pagination: { page: 1, pageSize: 5, total: 42, onPageChange: () => {} },
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading…',
    columns: COLUMNS,
    data: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    title: 'No Results',
    columns: COLUMNS,
    data: [],
    emptyTitle: 'No team members yet',
    emptyDescription: 'Invite someone to get started.',
  },
};
