import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, Tooltip, Pagination } from './navigation';
import { Button } from './button';

export default { title: 'Components/Navigation' } as Meta;

export const TabsExample: StoryObj = {
  render: () => (
    <Tabs
      tabs={[
        { id: 'overview', label: 'Overview', content: <p>Overview content</p> },
        { id: 'details', label: 'Details', content: <p>Detail content</p> },
        { id: 'history', label: 'History', content: <p>History content</p> },
      ]}
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
  render: () => <Pagination currentPage={3} totalPages={10} onPageChange={() => {}} />,
};
