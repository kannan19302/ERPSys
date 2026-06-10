import { type FC, type ReactNode } from 'react';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<string, React.CSSProperties> = {
  default: { background: 'var(--color-bg-sunken)', color: 'var(--color-text-secondary)' },
  primary: { background: 'var(--color-primary-light)', color: 'var(--color-primary)' },
  success: { background: 'var(--color-success-light)', color: 'var(--color-success-text)' },
  warning: { background: 'var(--color-warning-light)', color: 'var(--color-warning-text)' },
  danger: { background: 'var(--color-danger-light)', color: 'var(--color-danger-text)' },
  info: { background: 'var(--color-info-light)', color: 'var(--color-info-text)' },
};

const sizeStyles: Record<string, React.CSSProperties> = {
  sm: { padding: '2px 8px', fontSize: 'var(--text-xs)' },
  md: { padding: '4px 12px', fontSize: 'var(--text-sm)' },
};

export const Badge: FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
}) => {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 'var(--radius-full)',
        fontWeight: 'var(--weight-medium)' as unknown as number,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
      }}
    >
      {children}
    </span>
  );
};
