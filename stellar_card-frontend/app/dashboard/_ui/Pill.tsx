// Colored status pill with a leading dot. Drives agent state badges and
// order status badges. Colors map to the CSS variable palette so both
// themes look right.

import type { ReactNode } from 'react';
import { toneTokens } from './tokens';

export type PillTone = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'neutral';

interface Props {
  tone?: PillTone;
  pulse?: boolean;
  children: ReactNode;
  title?: string;
}

const TONE_VARS = toneTokens;

export function Pill({ tone = 'neutral', pulse, children, title }: Props) {
  const c = TONE_VARS[tone];
  return (
    <span
      // role="status" lets screen readers announce dynamic state changes
      // (e.g. agent going live → dead) without an explicit live region.
      role="status"
      title={title}
      aria-label={typeof children === 'string' ? children : title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.7rem',
        fontFamily: 'var(--font-mono)',
        color: c.fg,
        padding: '0.2rem 0.55rem',
        borderRadius: 4,
        border: `1px solid ${c.border}`,
        background: c.bg,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'currentColor',
          display: 'inline-block',
          animation: pulse ? 'pulse 2s ease-in-out infinite' : undefined,
        }}
      />
      {children}
    </span>
  );
}
