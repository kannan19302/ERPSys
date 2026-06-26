import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './card';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  argTypes: {
    padding: { control: 'select', options: ['none', 'sm', 'md', 'lg'] },
    hover: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = { args: { children: 'Card content goes here', padding: 'md' } };
export const Hoverable: Story = { args: { children: 'Hover over me', hover: true, padding: 'md' } };
export const NoPadding: Story = { args: { children: 'No padding card', padding: 'none' } };
export const LargePadding: Story = { args: { children: 'Large padding card', padding: 'lg' } };
