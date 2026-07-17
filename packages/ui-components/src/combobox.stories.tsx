import type { Meta, StoryObj } from '@storybook/react';
import { ComboBox, type ComboBoxOption, type ComboBoxProps } from './combobox';
import { useState } from 'react';

const meta: Meta<typeof ComboBox> = {
  title: 'Components/ComboBox',
  component: ComboBox,
  argTypes: {
    disabled: { control: 'boolean' },
    multiple: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof ComboBox>;

const OPTIONS: ComboBoxOption[] = [
  { value: 'sap', label: 'SAP S/4HANA' },
  { value: 'netsuite', label: 'Oracle NetSuite' },
  { value: 'dynamics', label: 'Microsoft Dynamics 365' },
  { value: 'odoo', label: 'Odoo Enterprise' },
  { value: 'erpnext', label: 'ERPNext Open Source' },
  { value: 'workday', label: 'Workday Financials' },
];

const ComboBoxWrapper = (props: ComboBoxProps) => {
  const [value, setValue] = useState(props.value);
  return <ComboBox {...props} value={value} onChange={setValue} />;
};

export const SingleSelect: Story = {
  render: (args) => <ComboBoxWrapper {...args} />,
  args: {
    options: OPTIONS,
    placeholder: 'Select an ERP system...',
    multiple: false,
  },
};

export const MultiSelect: Story = {
  render: (args) => <ComboBoxWrapper {...args} />,
  args: {
    options: OPTIONS,
    placeholder: 'Select multiple ERP systems...',
    multiple: true,
    value: ['sap', 'odoo'],
  },
};

export const Disabled: Story = {
  render: (args) => <ComboBoxWrapper {...args} />,
  args: {
    options: OPTIONS,
    disabled: true,
    value: 'dynamics',
  },
};
