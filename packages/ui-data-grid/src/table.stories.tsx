import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DataTable, type Column } from './table';
import { ColumnPicker } from './column-picker';
import { exportToCsv } from './csv';

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

export const WithSelectionAndBulkActions: StoryObj = {
  render: function SelectionStory() {
    const [selected, setSelected] = useState<string[]>([]);
    return (
      <DataTable
        columns={columns}
        data={data}
        rowKey={(r) => r.id}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        bulkActions={(keys) => (
          <>
            <button onClick={() => exportToCsv(columns, data.filter((d) => keys.includes(d.id)), 'selection')}>Export selected</button>
            <button onClick={() => setSelected([])}>Clear</button>
          </>
        )}
      />
    );
  },
};

export const Virtualized: StoryObj = {
  render: () => {
    const largeData = Array.from({ length: 10_000 }, (_, i) => ({
      id: `ROW-${i + 1}`,
      name: `Item ${i + 1}`,
      status: ['ACTIVE', 'INACTIVE'][i % 2]!,
      amount: Math.round(Math.random() * 50000),
    }));
    return <DataTable columns={columns} data={largeData} rowKey={(r) => r.id} virtualized maxHeight={420} />;
  },
};

export const WithColumnPicker: StoryObj = {
  render: function ColumnPickerStory() {
    const [visible, setVisible] = useState(columns.map((c) => c.key));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end' }}>
        <ColumnPicker
          options={columns.map((c) => ({ key: c.key, label: String(c.header) }))}
          visible={visible}
          onChange={setVisible}
        />
        <div style={{ alignSelf: 'stretch' }}>
          <DataTable columns={columns.filter((c) => visible.includes(c.key))} data={data} rowKey={(r) => r.id} />
        </div>
      </div>
    );
  },
};
