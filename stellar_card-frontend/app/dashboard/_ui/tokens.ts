// Centralized theme constants (#135).
//
// Single source of truth for every CSS variable used in the design
// system. Components should import tokens from here rather than
// inlining raw var() strings — this makes refactoring token names
// a one-line change and keeps auto-complete working in editors.
//
// Values mirror globals.css :root exactly. The CSS variables themselves
// remain the runtime source (light/dark switching happens in CSS), so
// these constants are the *names* of the variables, not their values.
// Usage:
//   import { token } from '@/app/dashboard/_ui/tokens';
//   style={{ color: token.fg, background: token.surface }}

const v = (name: string) => `var(${name})` as const;

// ── Canvas + ink ──────────────────────────────────────────────────────
export const token = {
  bg: v('--bg'),
  bgElev: v('--bg-elev'),
  bgElev2: v('--bg-elev-2'),
  fg: v('--fg'),
  fgMuted: v('--fg-muted'),
  fgDim: v('--fg-dim'),
  muted: v('--muted'),

  // ── Surfaces ──────────────────────────────────────────────────────
  surface: v('--surface'),
  surface2: v('--surface-2'),
  surface3: v('--surface-3'),
  surfaceHover: v('--surface-hover'),
  border: v('--border'),
  borderStrong: v('--border-strong'),
  borderHairline: v('--border-hairline'),

  // ── Accents ───────────────────────────────────────────────────────
  green: v('--green'),
  greenDim: v('--green-dim'),
  greenMuted: v('--green-muted'),
  greenBorder: v('--green-border'),
  greenGlow: v('--green-glow'),

  red: v('--red'),
  redMuted: v('--red-muted'),
  redBorder: v('--red-border'),

  yellow: v('--yellow'),
  yellowMuted: v('--yellow-muted'),
  yellowBorder: v('--yellow-border'),

  blue: v('--blue'),
  blueMuted: v('--blue-muted'),
  blueBorder: v('--blue-border'),

  purple: v('--purple'),
  purpleMuted: v('--purple-muted'),
  purpleBorder: v('--purple-border'),

  // ── Shadows ───────────────────────────────────────────────────────
  shadowCard: v('--shadow-card'),
  shadowHero: v('--shadow-hero'),
  shadowFloat: v('--shadow-float'),

  // ── Typography ────────────────────────────────────────────────────
  fontDisplay: v('--font-display'),
  fontBody: v('--font-body'),
  fontMono: v('--font-mono'),

  // ── Motion ────────────────────────────────────────────────────────
  easeOut: v('--ease-out'),
  easeInOut: v('--ease-in-out'),
  easeSpring: v('--ease-spring'),
} as const;

export type TokenKey = keyof typeof token;

// ── Tone map ──────────────────────────────────────────────────────────
// Re-export the per-tone triplet so Pill, FilterChip, and AgentStatePill
// share one canonical mapping instead of duplicating it.

export type Tone = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'neutral';

export const toneTokens: Record<Tone, { fg: string; bg: string; border: string }> = {
  green: { fg: token.green, bg: token.greenMuted, border: token.greenBorder },
  red: { fg: token.red, bg: token.redMuted, border: token.redBorder },
  yellow: { fg: token.yellow, bg: token.yellowMuted, border: token.yellowBorder },
  blue: { fg: token.blue, bg: token.blueMuted, border: token.blueBorder },
  purple: { fg: token.purple, bg: token.purpleMuted, border: token.purpleBorder },
  neutral: { fg: token.fgMuted, bg: token.surface2, border: token.border },
};
