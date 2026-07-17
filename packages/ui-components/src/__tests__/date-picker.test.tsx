import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import { DatePicker } from '../date-picker';

describe('DatePicker', () => {
  it('renders input with placeholder', () => {
    render(<DatePicker placeholder="Select date..." />);
    expect(screen.getByPlaceholderText('Select date...')).toBeInTheDocument();
  });

  it('toggles calendar dropdown popover on click', async () => {
    render(<DatePicker placeholder="Select date..." />);
    const input = screen.getByPlaceholderText('Select date...');
    
    // Closed initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Opens on click
    await userEvent.click(input);
    expect(screen.getByRole('dialog', { name: 'Calendar dropdown' })).toBeInTheDocument();
  });

  it('selects date and fires onChange callback', async () => {
    const onChange = vi.fn();
    const testDate = new Date(2026, 6, 16); // July 16, 2026
    
    render(<DatePicker value={testDate} onChange={onChange} />);
    const input = screen.getByDisplayValue('2026-07-16');
    expect(input).toBeInTheDocument();

    // Open calendar popover
    await userEvent.click(input);

    // Click day 20 (within same month)
    const dayButton = screen.getByRole('button', { name: '20' });
    await userEvent.click(dayButton);

    expect(onChange).toHaveBeenCalledTimes(1);
    const calledDate = onChange.mock.calls[0]?.[0] as Date;
    expect(calledDate).toBeDefined();
    expect(calledDate.getDate()).toBe(20);
    expect(calledDate.getMonth()).toBe(6); // July
    expect(calledDate.getFullYear()).toBe(2026);
  });

  it('allows clearing selected value', async () => {
    const onChange = vi.fn();
    const testDate = new Date(2026, 6, 16);

    render(<DatePicker value={testDate} onChange={onChange} />);
    const clearBtn = screen.getByRole('button', { name: 'Clear selected date' });
    
    await userEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('has no axe violations', async () => {
    const { container } = render(<DatePicker placeholder="Select date..." />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
