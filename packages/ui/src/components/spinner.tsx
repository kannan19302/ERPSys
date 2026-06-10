import { type FC } from 'react';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: '16px',
  md: '24px',
  lg: '40px',
};

export const Spinner: FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  return (
    <div
      className={className}
      role="status"
      aria-label="Loading"
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        border: '2px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
        display: 'inline-block',
      }}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};
