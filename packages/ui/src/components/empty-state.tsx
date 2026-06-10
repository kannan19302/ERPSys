import { type FC, type ReactNode } from 'react';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState: FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-16) var(--space-8)',
        textAlign: 'center',
      }}
    >
      {icon && (
        <div
          style={{
            marginBottom: 'var(--space-4)',
            color: 'var(--color-text-tertiary)',
            opacity: 0.5,
          }}
        >
          {icon}
        </div>
      )}
      <h3
        style={{
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--weight-semibold)' as unknown as number,
          color: 'var(--color-text)',
          marginBottom: 'var(--space-2)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            maxWidth: '400px',
            marginBottom: action ? 'var(--space-6)' : undefined,
          }}
        >
          {description}
        </p>
      )}
      {action}
    </div>
  );
};
