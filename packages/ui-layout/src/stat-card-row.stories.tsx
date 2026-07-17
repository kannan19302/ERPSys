import type { Meta, StoryObj } from '@storybook/react';
import { Package, Users, DollarSign, TrendingUp } from 'lucide-react';
import { StatCardRow } from './stat-card-row';

const meta: Meta<typeof StatCardRow> = {
  title: 'Layout/StatCardRow',
  component: StatCardRow,
  parameters: { layout: 'padded' },
};
export default meta;

type Story = StoryObj<typeof StatCardRow>;

export const Default: Story = {
  args: {
    stats: [
      { label: 'Total Products', value: 1284, change: 12.5, icon: <Package size={16} />, color: 'var(--color-primary)' },
      { label: 'Active Users', value: 342, change: -3.2, icon: <Users size={16} />, color: 'var(--chart-2)' },
      { label: 'Revenue', value: '$48,290', change: 8.1, changeLabel: 'vs last month', icon: <DollarSign size={16} />, color: 'var(--chart-3)' },
      { label: 'Growth', value: '24.3%', change: 4.7, icon: <TrendingUp size={16} />, color: 'var(--chart-4)' },
    ],
  },
};

export const Loading: Story = {
  args: {
    stats: [
      { label: 'Products', value: 0, loading: true },
      { label: 'Users', value: 0, loading: true },
      { label: 'Revenue', value: 0, loading: true },
    ],
  },
};

export const TwoColumns: Story = {
  args: {
    columns: 2,
    stats: [
      { label: 'Open Issues', value: 17, change: -25, color: 'var(--color-danger)' },
      { label: 'Resolved', value: 348, change: 18, color: 'var(--color-success)' },
    ],
  },
};
