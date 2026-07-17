import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  argTypes: {
    variant: { control: 'select', options: ['default', 'primary', 'success', 'warning', 'danger', 'info'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
};
export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: 'Default' } };
export const Primary: Story = { args: { children: 'Primary', variant: 'primary' } };
export const Success: Story = { args: { children: 'Active', variant: 'success' } };
export const Warning: Story = { args: { children: 'Pending', variant: 'warning' } };
export const Danger: Story = { args: { children: 'Overdue', variant: 'danger' } };
export const Info: Story = { args: { children: 'Info', variant: 'info' } };
export const Medium: Story = { args: { children: 'Medium Badge', size: 'md', variant: 'primary' } };
