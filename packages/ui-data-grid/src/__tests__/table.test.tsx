import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from '../table';

interface Row {
  id: string;
  name: string;
  qty: number;
}

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'qty', header: 'Qty', align: 'right', render: (r) => r.qty.toLocaleString() },
];

const data: Row[] = [
  { id: '1', name: 'Widget', qty: 1200 },
  { id: '2', name: 'Gadget', qty: 45 },
];

describe('DataTable', () => {
  it('renders headers and rows', () => {
    render(<DataTable columns={columns} data={data} rowKey={(r) => r.id} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('1,200')).toBeInTheDocument();
  });

  it('shows the empty state when there is no data', () => {
    render(<DataTable columns={columns} data={[]} emptyTitle="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('reports sort changes on sortable headers', async () => {
    const onSortChange = vi.fn();
    render(<DataTable columns={columns} data={data} sortBy="name" sortOrder="asc" onSortChange={onSortChange} />);
    await userEvent.click(screen.getByText('Name'));
    expect(onSortChange).toHaveBeenCalledWith('name', 'desc');
  });

  it('fires onRowClick with the row', async () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    await userEvent.click(screen.getByText('Widget'));
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });
});
