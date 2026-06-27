import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './empty-state';
import { FileText } from 'lucide-react';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: <FileText size={48} />,
    title: 'No invoices yet',
    description: 'Create your first invoice to get started.',
    action: <button onClick={() => {}}>Create Invoice</button>,
  },
};
export const NoAction: Story = {
  args: {
    icon: <FileText size={48} />,
    title: 'No results found',
    description: 'Try adjusting your search or filters.',
  },
};
