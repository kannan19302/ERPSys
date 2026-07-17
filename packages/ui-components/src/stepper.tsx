'use client';

import React from 'react';
import { Check } from 'lucide-react';
import styles from './stepper.module.css';

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
  <div className={styles.stepper_container}>
    {steps.map((step, idx) => {
      const isCompleted = idx < activeStep;
      const isActive = idx === activeStep;
      const isLast = idx === steps.length - 1;

      const circleClass = [
        styles.step_circle,
        isCompleted ? styles.circle_completed : isActive ? styles.circle_active : styles.circle_inactive,
      ].join(' ');

      const labelClass = [
        styles.step_label,
        isActive ? styles.label_active : styles.label_inactive,
      ].join(' ');

      const lineClass = [
        styles.step_line,
        isCompleted ? styles.line_completed : styles.line_incomplete,
      ].join(' ');

      return (
        <div key={step.label} className={styles.step_wrapper}>
          <div
            className={`${styles.step_node} ${onStepClick ? styles.step_node_clickable : ''}`}
            onClick={() => onStepClick?.(idx)}
          >
            <div className={circleClass}>
              {isCompleted ? <Check size={16} /> : idx + 1}
            </div>
            <span className={labelClass}>
              {step.label}
            </span>
            {step.description && (
              <span className={styles.step_desc}>
                {step.description}
              </span>
            )}
          </div>
          {!isLast && (
            <div className={lineClass} />
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
    <div className={styles.section}>
      <div
        className={`${styles.section_header} ${collapsible ? styles.section_header_clickable : ''}`}
        onClick={() => collapsible && setOpen(o => !o)}
      >
        <div>
          <h3 className={styles.section_title}>{title}</h3>
          {description && <p className={styles.section_desc}>{description}</p>}
        </div>
        {collapsible && (
          <span className={`${styles.chevron} ${open ? styles.chevron_open : ''}`}>▾</span>
        )}
      </div>
      {open && (
        <div className={styles.section_body}>
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
    saving: { text: 'Saving...', className: styles.indicator_saving },
    saved: { text: 'All changes saved', className: styles.indicator_saved },
    error: { text: 'Save failed', className: styles.indicator_error },
  }[status];

  return (
    <span className={`${styles.indicator} ${config.className}`}>
      {status === 'saving' && <span className={styles.saving_spinner} />}
      {status === 'saved' && <Check size={12} />}
      {config.text}
    </span>
  );
};

