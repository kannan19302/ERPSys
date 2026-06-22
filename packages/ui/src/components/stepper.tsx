'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface StepperStep {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  activeStep: number;
  onStepClick?: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, activeStep, onStepClick }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, width: '100%' }}>
    {steps.map((step, idx) => {
      const isCompleted = idx < activeStep;
      const isActive = idx === activeStep;
      const isLast = idx === steps.length - 1;

      return (
        <div key={step.label} style={{ display: 'flex', alignItems: 'flex-start', flex: isLast ? '0 0 auto' : '1 1 0' }}>
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: onStepClick ? 'pointer' : 'default' }}
            onClick={() => onStepClick?.(idx)}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isCompleted ? 'var(--color-success)' : isActive ? 'var(--color-primary)' : 'var(--color-bg-sunken)',
              color: isCompleted || isActive ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-xs)',
              transition: 'all var(--duration-fast) var(--ease-default)',
              border: isActive ? '2px solid var(--color-primary)' : isCompleted ? '2px solid var(--color-success)' : '2px solid var(--color-border)',
            }}>
              {isCompleted ? <Check size={16} /> : idx + 1}
            </div>
            <span style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-xs)', fontWeight: isActive ? 'var(--weight-semibold)' : 'var(--weight-normal)', color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)', textAlign: 'center', maxWidth: 100 }}>
              {step.label}
            </span>
            {step.description && (
              <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textAlign: 'center', maxWidth: 100 }}>
                {step.description}
              </span>
            )}
          </div>
          {!isLast && (
            <div style={{ flex: 1, height: 2, background: isCompleted ? 'var(--color-success)' : 'var(--color-border)', marginTop: 15, marginInline: 'var(--space-2)', transition: 'background var(--duration-fast) var(--ease-default)' }} />
          )}
        </div>
      );
    })}
  </div>
);

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, description, children, collapsible = false, defaultOpen = true }) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
      <div
        style={{ padding: 'var(--space-4) var(--space-5)', background: 'var(--color-bg-sunken)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: collapsible ? 'pointer' : 'default' }}
        onClick={() => collapsible && setOpen(o => !o)}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)' }}>{title}</h3>
          {description && <p style={{ margin: '2px 0 0', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{description}</p>}
        </div>
        {collapsible && (
          <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform var(--duration-fast)', color: 'var(--color-text-tertiary)', fontSize: '18px' }}>▾</span>
        )}
      </div>
      {open && (
        <div style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {children}
        </div>
      )}
    </div>
  );
};

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface AutosaveIndicatorProps {
  status: AutosaveStatus;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ status }) => {
  if (status === 'idle') return null;

  const config = {
    saving: { text: 'Saving...', color: 'var(--color-text-secondary)' },
    saved: { text: 'All changes saved', color: 'var(--color-success)' },
    error: { text: 'Save failed', color: 'var(--color-danger)' },
  }[status];

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 'var(--text-xs)', color: config.color }}>
      {status === 'saving' && <span style={{ width: 8, height: 8, borderRadius: '50%', border: '2px solid var(--color-text-secondary)', borderTopColor: 'transparent', animation: 'spin 0.6s linear infinite' }} />}
      {status === 'saved' && <Check size={12} />}
      {config.text}
    </span>
  );
};
