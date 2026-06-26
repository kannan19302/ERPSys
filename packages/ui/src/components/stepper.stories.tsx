import type { Meta, StoryObj } from '@storybook/react';
import { Stepper, FormSection, AutosaveIndicator } from './stepper';

export default { title: 'Components/Stepper' } as Meta;

export const StepperDefault: StoryObj = {
  render: () => (
    <Stepper
      steps={[
        { id: '1', label: 'Basic Info', status: 'completed' },
        { id: '2', label: 'Line Items', status: 'current' },
        { id: '3', label: 'Review', status: 'upcoming' },
      ]}
      currentStep="2"
    />
  ),
};

export const FormSectionExample: StoryObj = {
  render: () => (
    <FormSection title="Contact Details" description="Enter the customer's contact information">
      <p>Form fields go here</p>
    </FormSection>
  ),
};

export const AutosaveSaving: StoryObj = {
  render: () => <AutosaveIndicator status="saving" />,
};
export const AutosaveSaved: StoryObj = {
  render: () => <AutosaveIndicator status="saved" />,
};
