'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import type { TourStep } from '@/hooks/useTour';

interface TooltipPos {
  top: number;
  left: number;
  transformOrigin: string;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

function computePosition(
  targetEl: Element | null,
  placement: TourStep['placement'],
  tooltipWidth: number,
  tooltipHeight: number
): { tooltip: TooltipPos; spotlight: SpotlightRect | null } {
  const PAD = 12;

  if (!targetEl || placement === 'center') {
    return {
      tooltip: {
        top: window.innerHeight / 2 - tooltipHeight / 2,
        left: window.innerWidth / 2 - tooltipWidth / 2,
        transformOrigin: 'center center',
      },
      spotlight: null,
    };
  }

  const rect = targetEl.getBoundingClientRect();
  const spotlight: SpotlightRect = {
    top: rect.top - 6,
    left: rect.left - 6,
    width: rect.width + 12,
    height: rect.height + 12,
    borderRadius: 8,
  };

  let top = 0;
  let left = 0;
  let transformOrigin = 'top left';

  switch (placement) {
    case 'bottom':
      top = rect.bottom + PAD;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      transformOrigin = 'top center';
      break;
    case 'top':
      top = rect.top - tooltipHeight - PAD;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      transformOrigin = 'bottom center';
      break;
    case 'right':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + PAD;
      transformOrigin = 'center left';
      break;
    case 'left':
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - PAD;
      transformOrigin = 'center right';
      break;
    default:
      top = rect.bottom + PAD;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      transformOrigin = 'top center';
  }

  // Clamp to viewport
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  left = Math.max(PAD, Math.min(left, vw - tooltipWidth - PAD));
  top = Math.max(PAD, Math.min(top, vh - tooltipHeight - PAD));

  return { tooltip: { top, left, transformOrigin }, spotlight };
}

interface GuidedTourProps {
  isOpen: boolean;
  step: TourStep | null;
  currentStep: number;
  totalSteps: number;
  tourName: string;
  isDismissible?: boolean;
  onNext: () => void;
  onPrev: () => void;
  onDismiss: () => void;
  onComplete: () => void;
}

export function GuidedTour({
  isOpen,
  step,
  currentStep,
  totalSteps,
  tourName,
  isDismissible = true,
  onNext,
  onPrev,
  onDismiss,
  onComplete,
}: GuidedTourProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: -9999, left: -9999, transformOrigin: 'center' });
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null);
  const TOOLTIP_W = 340;
  const TOOLTIP_H = 180; // approximate

  const isLastStep = currentStep === totalSteps - 1;

  useEffect(() => {
    if (!isOpen || !step) return;

    const calculate = () => {
      const el =
        step.target === 'body'
          ? null
          : document.querySelector(step.target);

      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      const h = tooltipRef.current?.offsetHeight ?? TOOLTIP_H;
      const { tooltip, spotlight } = computePosition(el, step.placement ?? 'bottom', TOOLTIP_W, h);
      setTooltipPos(tooltip);
      setSpotlight(spotlight);
    };

    // Small delay to let page settle after navigation/scroll
    const tid = setTimeout(calculate, 120);
    window.addEventListener('resize', calculate);
    return () => {
      clearTimeout(tid);
      window.removeEventListener('resize', calculate);
    };
  }, [isOpen, step, currentStep]);

  return (
    <AnimatePresence>
      {isOpen && step && (
        <>
          {/* Backdrop overlay with spotlight cutout */}
          <motion.div
            key="tour-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9990,
              pointerEvents: 'auto',
            }}
            onClick={isDismissible ? onDismiss : undefined}
          >
            <svg
              width="100%"
              height="100%"
              style={{ position: 'absolute', inset: 0 }}
            >
              <defs>
                <mask id="tour-spotlight-mask">
                  <rect width="100%" height="100%" fill="white" />
                  {spotlight && (
                    <rect
                      x={spotlight.left}
                      y={spotlight.top}
                      width={spotlight.width}
                      height={spotlight.height}
                      rx={spotlight.borderRadius}
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.65)"
                mask="url(#tour-spotlight-mask)"
              />
            </svg>
          </motion.div>

          {/* Spotlight ring */}
          <AnimatePresence>
            {spotlight && (
              <motion.div
                key={`spotlight-${currentStep}`}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.22 }}
                style={{
                  position: 'fixed',
                  top: spotlight.top,
                  left: spotlight.left,
                  width: spotlight.width,
                  height: spotlight.height,
                  borderRadius: spotlight.borderRadius,
                  boxShadow: '0 0 0 3px #7c3aed, 0 0 24px rgba(124,58,237,0.5)',
                  zIndex: 9991,
                  pointerEvents: 'none',
                }}
              />
            )}
          </AnimatePresence>

          {/* Tooltip card */}
          <motion.div
            ref={tooltipRef}
            key={`tooltip-${currentStep}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            style={{
              position: 'fixed',
              top: tooltipPos.top,
              left: tooltipPos.left,
              width: TOOLTIP_W,
              transformOrigin: tooltipPos.transformOrigin,
              zIndex: 9999,
              pointerEvents: 'auto',
            }}
          >
            <div
              style={{
                background: '#1a1a2e',
                border: '1px solid rgba(124,58,237,0.4)',
                borderRadius: 14,
                boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.2)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(109,40,217,0.1) 100%)',
                  borderBottom: '1px solid rgba(124,58,237,0.2)',
                  padding: '14px 16px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: 'rgba(124,58,237,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <BookOpen style={{ width: 14, height: 14, color: '#a78bfa' }} />
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#f0f0ff',
                      lineHeight: 1.3,
                    }}
                  >
                    {step.title}
                  </span>
                </div>

                {isDismissible && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDismiss(); }}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.06)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      color: '#a1a1aa',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  >
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                )}
              </div>

              {/* Body */}
              <div style={{ padding: '14px 16px 16px' }}>
                <p style={{ fontSize: 13, color: '#c4c4d4', lineHeight: 1.6, margin: 0 }}>
                  {step.content}
                </p>
              </div>

              {/* Footer */}
              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* Step dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: i === currentStep ? 18 : 6,
                        height: 6,
                        borderRadius: 3,
                        background: i === currentStep
                          ? '#7c3aed'
                          : i < currentStep
                          ? 'rgba(124,58,237,0.5)'
                          : 'rgba(255,255,255,0.15)',
                        transition: 'all 300ms ease',
                      }}
                    />
                  ))}
                </div>

                {/* Navigation buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {currentStep > 0 && (
                    <button
                      onClick={onPrev}
                      style={{
                        height: 30,
                        padding: '0 10px',
                        borderRadius: 7,
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: 'transparent',
                        color: '#a1a1aa',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 150ms',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; }}
                    >
                      <ChevronLeft style={{ width: 12, height: 12 }} />
                      Back
                    </button>
                  )}

                  <button
                    onClick={isLastStep ? onComplete : onNext}
                    style={{
                      height: 30,
                      padding: '0 14px',
                      borderRadius: 7,
                      border: 'none',
                      background: '#7c3aed',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#6d28d9'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#7c3aed'; }}
                  >
                    {isLastStep ? '🎉 Done' : (
                      <>
                        Next
                        <ChevronRight style={{ width: 12, height: 12 }} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
