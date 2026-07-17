import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { ComboBox } from '../combobox';

const OPTIONS = [
  { value: 'sap', label: 'SAP S/4HANA' },
  { value: 'netsuite', label: 'Oracle NetSuite' },
  { value: 'odoo', label: 'Odoo Enterprise' },
];

describe('ComboBox', () => {
  it('renders trigger with placeholder', () => {
    render(<ComboBox options={OPTIONS} placeholder="Select ERP..." />);
    expect(screen.getByRole('button', { name: 'Select ERP...' })).toBeInTheDocument();
  });

  it('toggles dropdown option list on click', async () => {
    render(<ComboBox options={OPTIONS} placeholder="Select ERP..." />);
    const trigger = screen.getByRole('button', { name: 'Select ERP...' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  it('selects option on click in single select mode', async () => {
    const onChange = vi.fn();
    render(<ComboBox options={OPTIONS} onChange={onChange} placeholder="Select ERP..." />);
    
    await userEvent.click(screen.getByRole('button', { name: 'Select ERP...' }));
    await userEvent.click(screen.getByRole('option', { name: 'Oracle NetSuite' }));

    expect(onChange).toHaveBeenCalledWith('netsuite');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects and deselects options in multi-select mode', async () => {
    const onChange = vi.fn();
    render(
      <ComboBox
        options={OPTIONS}
        multiple
        value={['sap']}
        onChange={onChange}
        placeholder="Select ERP..."
      />
    );

    // Displays selected tag
    expect(screen.getByText('SAP S/4HANA')).toBeInTheDocument();

    // Click remove tag button
    const removeBtn = screen.getByRole('button', { name: 'Remove SAP S/4HANA' });
    await userEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('filters options by search term', async () => {
    render(<ComboBox options={OPTIONS} placeholder="Select ERP..." />);
    await userEvent.click(screen.getByRole('button', { name: 'Select ERP...' }));

    const searchInput = screen.getByPlaceholderText('Search...');
    await userEvent.type(searchInput, 'Net');

    expect(screen.getByRole('option', { name: 'Oracle NetSuite' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'SAP S/4HANA' })).not.toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<ComboBox options={OPTIONS} placeholder="Select ERP..." />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
