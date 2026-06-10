'use client';
// hooks/useMobileViewport.ts
// Re-exports from the existing useMobile hook for backward compatibility with the new Phase 2 pattern.
// The full useMobile hook already exists at hooks/useMobile.ts — this is a thin alias.

export { useIsMobile as useMobileViewport } from './useMobile';
