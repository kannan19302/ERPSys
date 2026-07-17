import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './date-picker';
import { useState } from 'react';

const meta: Meta<typeof DatePicker> = {
  title: 'Components/DatePicker',
  component: DatePicker,
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof DatePicker>;

const DatePickerWrapper = (props: any) => {
  const [value, setValue] = useState<Date | undefined>(props.value);
  return <DatePicker {...props} value={value} onChange={setValue} />;
};

export const Default: Story = {
  render: (args) => <DatePickerWrapper {...args} />,
  args: {
    placeholder: 'Select date...',
  },
};

export const Preselected: Story = {
  render: (args) => <DatePickerWrapper {...args} />,
  args: {
    value: new Date(2026, 6, 16), // July 16, 2026
  },
};

export const Disabled: Story = {
  render: (args) => <DatePickerWrapper {...args} />,
  args: {
    disabled: true,
    value: new Date(2026, 6, 16),
  },
};

export const MinMaxRestricted: Story = {
  render: (args) => <DatePickerWrapper {...args} />,
  args: {
    minDate: new Date(2026, 6, 10),
    maxDate: new Date(2026, 6, 20),
    placeholder: 'Select July 10-20, 2026 only',
  },
};
