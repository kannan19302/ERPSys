import { type FC, type CSSProperties } from 'react';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Shimmer placeholder for perceived performance (Doherty threshold) — show the
 * shape of content before it loads instead of a blank spinner.
 */
export const Skeleton: FC<SkeletonProps> = ({ width = '100%', height = 16, radius = 'var(--radius-md)', className, style }) => {
  return (
    <span
      aria-hidden="true"
      className={className}
      style={{
        display: 'block',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: radius,
        background: 'linear-gradient(90deg, var(--color-bg-sunken) 25%, var(--color-border) 37%, var(--color-bg-sunken) 63%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  gap?: number;
}

/** A stack of text-line skeletons; last line is shorter for natural rhythm. */
export const SkeletonText: FC<SkeletonTextProps> = ({ lines = 3, gap = 8 }) => (
  <span style={{ display: 'flex', flexDirection: 'column', gap }}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
    ))}
  </span>
);
