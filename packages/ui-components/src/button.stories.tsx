import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Plus, ChevronRight, Trash2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    isLoading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: 'Primary Button', variant: 'primary' } };
export const Secondary: Story = { args: { children: 'Secondary', variant: 'secondary' } };
export const Outline: Story = { args: { children: 'Outline', variant: 'outline' } };
export const Ghost: Story = { args: { children: 'Ghost', variant: 'ghost' } };
export const Link: Story = { args: { children: 'Link Button', variant: 'link' } };
export const Danger: Story = { args: { children: 'Delete', variant: 'danger', leftIcon: <Trash2 size={16} /> } };
export const Small: Story = { args: { children: 'Small', size: 'sm' } };
export const Large: Story = { args: { children: 'Large', size: 'lg' } };
export const Loading: Story = { args: { children: 'Saving...', isLoading: true } };
export const WithIcons: Story = { args: { children: 'Create', leftIcon: <Plus size={16} />, rightIcon: <ChevronRight size={16} /> } };
export const Disabled: Story = { args: { children: 'Disabled', disabled: true } };

