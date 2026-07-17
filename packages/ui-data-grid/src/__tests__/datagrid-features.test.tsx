import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable, type Column } from '../table';
import { ColumnPicker } from '../column-picker';
import { toCsv } from '../csv';

interface Row {
  id: string;
  name: string;
  qty: number;
}

const columns: Column<Row>[] = [
  { key: 'name', header: 'Name' },
  { key: 'qty', header: 'Qty', align: 'right' },
];

const data: Row[] = [
  { id: '1', name: 'Widget', qty: 1200 },
  { id: '2', name: 'Gadget', qty: 45 },
];

describe('DataTable selection', () => {
  it('renders checkboxes and toggles a single row', async () => {
    const onSelectionChange = vi.fn();
    render(
      <DataTable columns={columns} data={data} rowKey={(r) => r.id} selectedKeys={[]} onSelectionChange={onSelectionChange} />,
    );
    const boxes = screen.getAllByRole('checkbox', { name: 'Select row' });
    expect(boxes).toHaveLength(2);
    await userEvent.click(boxes[1]!);
    expect(onSelectionChange).toHaveBeenCalledWith(['2']);
  });

  it('select-all selects every row and clears when all selected', async () => {
    const onSelectionChange = vi.fn();
    const { rerender } = render(
      <DataTable columns={columns} data={data} rowKey={(r) => r.id} selectedKeys={[]} onSelectionChange={onSelectionChange} />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onSelectionChange).toHaveBeenCalledWith(['1', '2']);

    rerender(
      <DataTable columns={columns} data={data} rowKey={(r) => r.id} selectedKeys={['1', '2']} onSelectionChange={onSelectionChange} />,
    );
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  it('shows the bulk-action bar only while rows are selected', () => {
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={data}
        rowKey={(r) => r.id}
        selectedKeys={[]}
        onSelectionChange={() => {}}
        bulkActions={(keys) => <button>Delete {keys.length}</button>}
      />,
    );
    expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    rerender(
      <DataTable
        columns={columns}
        data={data}
        rowKey={(r) => r.id}
        selectedKeys={['1']}
        onSelectionChange={() => {}}
        bulkActions={(keys) => <button>Delete {keys.length}</button>}
      />,
    );
    expect(screen.getByRole('toolbar', { name: 'Bulk actions' })).toBeInTheDocument();
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect(screen.getByText('Delete 1')).toBeInTheDocument();
  });
});

describe('DataTable virtualization', () => {
  it('windows rows when virtualized with a large dataset', () => {
    const big: Row[] = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `Row ${i}`, qty: i }));
    render(
      <DataTable columns={columns} data={big} rowKey={(r) => r.id} virtualized rowHeight={40} maxHeight={400} />,
    );
    expect(screen.getByText('Row 0')).toBeInTheDocument();
    // Rows far below the window must not be mounted
    expect(screen.queryByText('Row 500')).not.toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeLessThan(60);
  });

  it('renders everything when the dataset fits without windowing', () => {
    render(<DataTable columns={columns} data={data} rowKey={(r) => r.id} virtualized />);
    expect(screen.getByText('Widget')).toBeInTheDocument();
    expect(screen.getByText('Gadget')).toBeInTheDocument();
  });
});

describe('ColumnPicker', () => {
  it('toggles column visibility but never hides the last column', async () => {
    const onChange = vi.fn();
    render(
      <ColumnPicker
        options={[{ key: 'name', label: 'Name' }, { key: 'qty', label: 'Qty' }]}
        visible={['name', 'qty']}
        onChange={onChange}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Qty' }));
    expect(onChange).toHaveBeenCalledWith(['name']);

    onChange.mockClear();
    // With only one visible column, unchecking it is ignored
    render(
      <ColumnPicker options={[{ key: 'name', label: 'OnlyCol' }]} visible={['name']} onChange={onChange} />,
    );
    const buttons = screen.getAllByRole('button', { name: 'Columns' });
    await userEvent.click(buttons[buttons.length - 1]!);
    await userEvent.click(screen.getByRole('checkbox', { name: 'OnlyCol' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('toCsv', () => {
  it('serializes headers, escapes quotes/commas, honors exportValue', () => {
    const cols: Column<Row>[] = [
      { key: 'name', header: 'Name' },
      { key: 'qty', header: 'Qty', exportValue: (r) => r.qty * 2 },
    ];
    const rows: Row[] = [
      { id: '1', name: 'A "quoted", name', qty: 10 },
      { id: '2', name: 'Plain', qty: 5 },
    ];
    const csv = toCsv(cols, rows);
    expect(csv.split('\r\n')).toEqual([
      'Name,Qty',
      '"A ""quoted"", name",20',
      'Plain,10',
    ]);
  });

  it('renders empty strings for null/undefined', () => {
    const cols: Column<{ a?: string | null }>[] = [{ key: 'a', header: 'A' }];
    expect(toCsv(cols, [{ a: null }, {}])).toBe('A\r\n\r\n');
  });
});
