import { type FC, type CSSProperties } from 'react';
import styles from './skeleton.module.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
  style?: CSSProperties;
}

export const Skeleton: FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = 'var(--radius-md)',
  className = '',
  style,
}) => {
  const inlineStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: radius,
    ...style,
  };

  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${className}`}
      style={inlineStyle}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  gap?: number;
}

export const SkeletonText: FC<SkeletonTextProps> = ({ lines = 3, gap = 8 }) => (
  <span className={styles.text_container} style={{ gap }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
    ))}
  </span>
);

