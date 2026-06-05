// lib/design-tokens.ts
// Design tokens extracted from Google Stitch MCP — Removation "Ultra-Minimalist Dark Mode"

export const tokens = {
  colors: {
    // Base surfaces (tonal layering — no blurs)
    bg: '#0a0a0a',             // Level 0: true black canvas
    bgSecondary: '#111111',    // Slightly lifted surface
    bgCard: '#161616',         // Level 1: cards, sidebar containers
    bgHover: '#1c1c1c',        // Hover state for interactive surfaces
    bgPopover: '#222222',      // Level 2: popovers, tooltips

    // Borders (low-opacity white — define structure without bulk)
    border: 'rgba(255,255,255,0.08)',
    borderHover: 'rgba(255,255,255,0.16)',
    borderFocus: '#7c3aed',

    // Accent — electric violet, used exclusively for actions & AI highlights
    accent: '#7c3aed',
    accentHover: '#6d28d9',
    accentMuted: 'rgba(124,58,237,0.15)',
    accentGlow: 'rgba(124,58,237,0.25)',

    // Typography hierarchy
    text: '#ffffff',
    textSecondary: '#e8dfee',      // on-surface
    textMuted: '#a1a1aa',          // zinc-400 for metadata
    textSubtle: 'rgba(255,255,255,0.3)',

    // Status
    statusPending: '#f59e0b',
    statusConfirmed: '#10b981',
    statusCompleted: '#3b82f6',
    statusError: '#ef4444',
  },

  radius: {
    sm: '4px',      // tight chips/badges
    md: '8px',      // buttons, inputs
    lg: '12px',     // cards, major containers
    xl: '16px',     // larger panels
    full: '9999px', // pills
  },

  shadow: {
    card: '0 1px 3px rgba(0,0,0,0.4)',
    elevated: '0 8px 32px rgba(0,0,0,0.6)',
    popover: '0 16px 48px rgba(0,0,0,0.8)',
    accentGlow: '0 0 0 2px rgba(124,58,237,0.4)',
  },

  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    headlineXl: { fontSize: '40px', fontWeight: '600', lineHeight: '48px', letterSpacing: '-0.02em' },
    headlineLg: { fontSize: '30px', fontWeight: '600', lineHeight: '38px', letterSpacing: '-0.02em' },
    headlineMd: { fontSize: '20px', fontWeight: '500', lineHeight: '28px', letterSpacing: '-0.01em' },
    bodyLg: { fontSize: '16px', fontWeight: '400', lineHeight: '24px' },
    bodyMd: { fontSize: '14px', fontWeight: '400', lineHeight: '20px' },
    labelSm: { fontSize: '12px', fontWeight: '500', lineHeight: '16px', letterSpacing: '0.02em' },
    monoLabel: { fontSize: '11px', fontWeight: '600', lineHeight: '14px', letterSpacing: '0.05em' },
  },

  spacing: {
    containerMax: '1440px',
    edgeMargin: '2rem',
    gutter: '1.5rem',
    stackUnit: '0.5rem',
  },

  animation: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type DesignTokens = typeof tokens;
