import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from '../modal';

describe('Modal', () => {
  it('renders title and children when open', () => {
    render(
      <Modal open title="Confirm delete" onClose={() => {}}>
        <p>Are you sure?</p>
      </Modal>,
    );
    expect(screen.getByText('Confirm delete')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();
  });

  it('does not have open attribute when closed', () => {
    const { container } = render(
      <Modal open={false} title="Hidden" onClose={() => {}}>
        <p>Nope</p>
      </Modal>,
    );
    const dialog = container.querySelector('dialog');
    expect(dialog).not.toHaveAttribute('open');
  });

  it('calls onClose from the close button', async () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Closable" onClose={onClose}>
        <p>Body</p>
      </Modal>,
    );
    await userEvent.click(screen.getByLabelText(/close/i));
    expect(onClose).toHaveBeenCalled();
  });
});
