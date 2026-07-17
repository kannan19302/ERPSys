'use client';

import { type FC, type ReactNode, type HTMLAttributes } from 'react';
import styles from './card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card: FC<CardProps> = ({
  children,
  padding = 'md',
  hover = false,
  className = '',
  style,
  ...props
}) => {
  const cardClass = [
    styles.card,
    styles[`p_${padding}`],
    hover && styles.hoverable,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass || undefined}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

