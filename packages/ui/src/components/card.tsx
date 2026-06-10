import { type FC, type ReactNode, type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const paddingMap = {
  none: '0',
  sm: 'var(--space-4)',
  md: 'var(--space-6)',
  lg: 'var(--space-8)',
};

export const Card: FC<CardProps> = ({
  children,
  padding = 'md',
  hover = false,
  style,
  ...props
}) => {
  return (
    <div
      style={{
        background: 'var(--color-bg-elevated)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: paddingMap[padding],
        transition: hover
          ? 'box-shadow var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default)'
          : undefined,
        cursor: hover ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hover) {
          const el = e.currentTarget;
          el.style.boxShadow = 'var(--shadow-md)';
          el.style.borderColor = 'var(--color-border-strong)';
          el.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          const el = e.currentTarget;
          el.style.boxShadow = 'none';
          el.style.borderColor = 'var(--color-border)';
          el.style.transform = 'translateY(0)';
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};
