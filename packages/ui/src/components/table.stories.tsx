import type { Meta, StoryObj } from '@storybook/react';
import { DataTable, type Column } from './table';

export default { title: 'Components/DataTable', parameters: { layout: 'padded' } } as Meta;

const columns: Column<{ id: string; name: string; status: string; amount: number }>[] = [
  { key: 'id', header: 'ID', width: '80px' },
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'amount', header: 'Amount', render: (row) => `$${row.amount.toLocaleString()}` },
];

const data = Array.from({ length: 20 }, (_, i) => ({
  id: `INV-${String(i + 1).padStart(3, '0')}`,
  name: `Customer ${i + 1}`,
  status: ['PAID', 'PENDING', 'OVERDUE', 'DRAFT'][i % 4]!,
  amount: Math.round(Math.random() * 10000),
}));

export const Default: StoryObj = {
  render: () => <DataTable columns={columns} data={data} />,
};

export const Empty: StoryObj = {
  render: () => <DataTable columns={columns} data={[]} />,
};

export const LargeDataset: StoryObj = {
  render: () => {
    const largeData = Array.from({ length: 500 }, (_, i) => ({
      id: `ROW-${i + 1}`,
      name: `Item ${i + 1}`,
      status: ['ACTIVE', 'INACTIVE'][i % 2]!,
      amount: Math.round(Math.random() * 50000),
    }));
    return <DataTable columns={columns} data={largeData} />;
  },
};
