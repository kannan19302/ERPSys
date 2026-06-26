import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton, SkeletonText } from './skeleton';

export default { title: 'Components/Skeleton' } as Meta;

export const Rectangle: StoryObj<typeof Skeleton> = {
  render: () => <Skeleton width="200px" height="40px" />,
};
export const Circle: StoryObj<typeof Skeleton> = {
  render: () => <Skeleton width="48px" height="48px" borderRadius="50%" />,
};
export const TextBlock: StoryObj<typeof SkeletonText> = {
  render: () => <SkeletonText lines={3} />,
};
