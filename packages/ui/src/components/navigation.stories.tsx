import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, Tooltip, Pagination } from './navigation';
import { Button } from './button';

export default { title: 'Components/Navigation' } as Meta;

export const TabsExample: StoryObj = {
  render: () => (
    <Tabs
      tabs={[
        { key: 'overview', label: 'Overview' },
        { key: 'details', label: 'Details' },
        { key: 'history', label: 'History' },
      ]}
      value="overview"
      onChange={() => {}}
    />
  ),
};

export const TooltipExample: StoryObj = {
  render: () => (
    <Tooltip content="This is a tooltip">
      <Button variant="outline">Hover me</Button>
    </Tooltip>
  ),
};

export const PaginationExample: StoryObj = {
  render: () => <Pagination page={3} pageCount={10} onChange={() => {}} />,
};
