'use client';

import type { CSSProperties, FC, ReactNode } from 'react';
import { Tooltip } from './navigation';

// ── InfoHint ──────────────────────────────────────────
// The platform-wide "What does this do?" affordance: a small (i) icon that
// reveals a short explanation on hover/focus. Place it next to nav entries,
// tab labels, toolbar actions, cards, and chart titles so every capability
// is self-describing.

export interface InfoHintProps {
  /** Short plain-language explanation of what the adjacent control does. */
  text: ReactNode;
  /** Icon diameter in px (default 14). */
  size?: number;
  style?: CSSProperties;
}

export const InfoHint: FC<InfoHintProps> = ({ text, size = 14, style }) => (
  <Tooltip content={text}>
    <span
      role="img"
      aria-label={typeof text === 'string' ? text : 'More information'}
      tabIndex={0}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px solid var(--color-border-strong, var(--color-border))',
        color: 'var(--color-text-tertiary, var(--color-text-secondary))',
        fontSize: Math.round(size * 0.68),
        fontWeight: 600,
        fontStyle: 'italic',
        fontFamily: 'var(--font-serif, Georgia, serif)',
        lineHeight: 1,
        cursor: 'help',
        userSelect: 'none',
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      i
    </span>
  </Tooltip>
);
