import { type FC } from 'react';
import styles from './spinner.module.css';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const spinnerClass = [
    styles.spinner,
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={spinnerClass} role="status" aria-label="Loading">
      <span className="sr-only">Loading...</span>
    </div>
  );
};

