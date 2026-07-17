import { type FC, type ReactNode } from 'react';
import styles from './badge.module.css';

export interface BadgeProps {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  children: ReactNode;
  className?: string;
}

export const Badge: FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  children,
  className = '',
}) => {
  const badgeClass = [
    styles.badge,
    styles[size],
    styles[variant],
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClass}>
      {children}
    </span>
  );
};

