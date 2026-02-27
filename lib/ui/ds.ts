import type { CSSProperties } from 'react'

/**
 * Albassam Design System helpers.
 *
 * IMPORTANT (project constraint): we still style via inline styles.
 * We use CSS variables (defined in app/components/ui/DesignSystemStyles.tsx)
 * so pages stay consistent + support dark mode.
 */

export const ds = {
  font: {
    sans: 'var(--ds-font-sans)'
  },
  color: {
    bg: 'var(--ds-bg)',
    bgElevated: 'var(--ds-bg-elevated)',
    surface: 'var(--ds-surface)',
    surface2: 'var(--ds-surface-2)',
    text: 'var(--ds-text)',
    text2: 'var(--ds-text-2)',
    muted: 'var(--ds-muted)',
    border: 'var(--ds-border)',
    borderStrong: 'var(--ds-border-strong)',

    brand900: 'var(--ds-brand-900)',
    brand800: 'var(--ds-brand-800)',
    brand700: 'var(--ds-brand-700)',

    accent600: 'var(--ds-accent-600)',
    accent500: 'var(--ds-accent-500)',
    accent400: 'var(--ds-accent-400)',

    info: 'var(--ds-info)',
    success: 'var(--ds-success)',
    warning: 'var(--ds-warning)',
    danger: 'var(--ds-danger)'
  },
  radius: {
    sm: 'var(--ds-radius-sm)',
    md: 'var(--ds-radius-md)',
    lg: 'var(--ds-radius-lg)'
  },
  shadow: {
    sm: 'var(--ds-shadow-sm)',
    md: 'var(--ds-shadow-md)',
    glow: 'var(--ds-shadow-glow)'
  }
} as const

export function mergeStyles(...styles: Array<CSSProperties | undefined | false | null>): CSSProperties {
  const out: CSSProperties = {}
  for (const s of styles) {
    if (!s) continue
    Object.assign(out, s)
  }
  return out
}

export const text = {
  display: {
    fontSize: 'clamp(22px, 2.2vw, 34px)',
    fontWeight: 800,
    letterSpacing: '-0.02em'
  } satisfies CSSProperties,
  h2: {
    fontSize: '18px',
    fontWeight: 800
  } satisfies CSSProperties,
  h3: {
    fontSize: '15px',
    fontWeight: 800
  } satisfies CSSProperties,
  body: {
    fontSize: '14px',
    fontWeight: 500
  } satisfies CSSProperties,
  small: {
    fontSize: '12px',
    fontWeight: 600
  } satisfies CSSProperties
} as const
