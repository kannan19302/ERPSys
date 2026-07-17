import type { Meta, StoryObj } from '@storybook/react';
import { DetailPageTemplate } from './detail-page-template';

const meta: Meta<typeof DetailPageTemplate> = {
  title: 'Layout/DetailPageTemplate',
  component: DetailPageTemplate,
  parameters: { layout: 'fullscreen' },
};
export default meta;

type Story = StoryObj<typeof DetailPageTemplate>;

const TABS = [
  { key: 'overview', label: 'Overview', content: <p style={{ color: 'var(--color-text-secondary)' }}>Overview content goes here.</p> },
  { key: 'activity', label: 'Activity', count: 12, content: <p style={{ color: 'var(--color-text-secondary)' }}>Activity feed goes here.</p> },
  { key: 'settings', label: 'Settings', content: <p style={{ color: 'var(--color-text-secondary)' }}>Settings form goes here.</p> },
];

export const Default: Story = {
  args: {
    title: 'Acme Corporation',
    subtitle: 'Enterprise customer since 2021',
    backLabel: 'Back to Customers',
    onBack: () => {},
    tabs: TABS,
  },
};

export const Loading: Story = {
  args: {
    title: 'Loading…',
    tabs: TABS,
    loading: true,
  },
};
