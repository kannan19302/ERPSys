import type { Meta, StoryObj } from '@storybook/react';
import { FormField, Input, Textarea, Select, TextField } from './form';

export default { title: 'Components/Form', parameters: { layout: 'padded' } } as Meta;

export const TextInput: StoryObj = {
  render: () => (
    <FormField label="Email Address" required>
      <Input type="email" placeholder="name@company.com" />
    </FormField>
  ),
};
export const TextAreaField: StoryObj = {
  render: () => (
    <FormField label="Notes">
      <Textarea placeholder="Enter notes..." rows={4} />
    </FormField>
  ),
};
export const SelectField: StoryObj = {
  render: () => (
    <FormField label="Status">
      <Select>
        <option value="DRAFT">Draft</option>
        <option value="ACTIVE">Active</option>
        <option value="CLOSED">Closed</option>
      </Select>
    </FormField>
  ),
};
export const InlineTextField: StoryObj = {
  render: () => <TextField label="Invoice Number" placeholder="INV-001" />,
};
