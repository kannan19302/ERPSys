import { type FC, type ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  breadcrumbs,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              {index > 0 && <span style={{ opacity: 0.5 }}>/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  style={{
                    color: 'var(--color-text-secondary)',
                    textDecoration: 'none',
                  }}
                >
                  {crumb.label}
                </a>
              ) : (
                <span style={{ color: 'var(--color-text)' }}>{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--weight-bold)' as unknown as number,
              color: 'var(--color-text)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {title}
          </h1>
          {description && (
            <p
              style={{
                marginTop: 'var(--space-1)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              flexShrink: 0,
            }}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
