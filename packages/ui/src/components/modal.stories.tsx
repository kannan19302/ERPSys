import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, ConfirmDialog } from './modal';
import { Button } from './button';

export default { title: 'Components/Modal' } as Meta;

export const BasicModal: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal open={open} onClose={() => setOpen(false)} title="Edit Invoice">
          <p>Modal content goes here.</p>
        </Modal>
      </>
    );
  },
};

export const Confirmation: StoryObj = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete</Button>
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => { setOpen(false); alert('Deleted!'); }}
          title="Delete Invoice?"
          description="This action cannot be undone."
        />
      </>
    );
  },
};
