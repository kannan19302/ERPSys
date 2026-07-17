import type { Meta, StoryObj } from '@storybook/react';
import { StatusBadge } from './status-badge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Components/StatusBadge',
  component: StatusBadge,
};
export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Active: Story = { args: { status: 'ACTIVE' } };
export const Paid: Story = { args: { status: 'PAID' } };
export const Draft: Story = { args: { status: 'DRAFT' } };
export const Overdue: Story = { args: { status: 'OVERDUE' } };
export const Cancelled: Story = { args: { status: 'CANCELLED' } };
export const Pending: Story = { args: { status: 'PENDING' } };
