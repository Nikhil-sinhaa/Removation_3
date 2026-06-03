'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, BookOpen, CheckCircle2, RotateCcw, X, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';
import { useTourContext } from './TourProvider';

interface TourItem {
  id: string;
  name: string;
  description?: string;
  pages: string[];
  isCompleted: boolean;
}

export function TourHelpMenu() {
  const { startTour } = useTourContext();
  const [open, setOpen] = useState(false);
  const [tours, setTours] = useState<TourItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTours = useCallback(async () => {
    if (tours.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tours/all');
      if (!res.ok) return;
      const data = await res.json();
      setTours(data);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  }, [tours.length]);

  useEffect(() => {
    if (open) fetchTours();
  }, [open, fetchTours]);

  const handleStartTour = async (tour: TourItem) => {
    setOpen(false);
    await startTour(tour.id);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        id="tour-help-btn"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: open ? 'rgba(124,58,237,0.15)' : 'transparent',
          border: open ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
          color: open ? '#a78bfa' : '#a1a1aa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms ease',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = '#161616';
            e.currentTarget.style.color = '#fff';
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#a1a1aa';
          }
        }}
        title="Guided Tours"
      >
        <HelpCircle style={{ width: 16, height: 16 }} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9000,
              }}
              onClick={() => setOpen(false)}
            />

            {/* Dropdown panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                width: 300,
                zIndex: 9001,
                background: '#1a1a2e',
                border: '1px solid rgba(124,58,237,0.3)',
                borderRadius: 14,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '14px 16px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: 'rgba(124,58,237,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <BookOpen style={{ width: 14, height: 14, color: '#a78bfa' }} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#f0f0ff' }}>
                      Guided Tours
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#a1a1aa' }}>
                      Learn the platform quickly
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.05)',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#a1a1aa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>

              {/* Tours list */}
              <div style={{ padding: '8px 8px', maxHeight: 320, overflowY: 'auto' }}>
                {loading && (
                  <div style={{ padding: '20px 8px', textAlign: 'center' }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: '2px solid rgba(124,58,237,0.3)',
                        borderTopColor: '#7c3aed',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto',
                      }}
                    />
                  </div>
                )}

                {!loading && tours.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#a1a1aa', fontSize: 13, padding: '20px 8px' }}>
                    No tours available
                  </p>
                )}

                {!loading && tours.map((tour) => (
                  <button
                    key={tour.id}
                    onClick={() => handleStartTour(tour)}
                    style={{
                      width: '100%',
                      padding: '10px 10px',
                      borderRadius: 9,
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      textAlign: 'left',
                      transition: 'background 150ms',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: tour.isCompleted
                          ? 'rgba(16,185,129,0.15)'
                          : 'rgba(124,58,237,0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {tour.isCompleted ? (
                        <CheckCircle2 style={{ width: 15, height: 15, color: '#10b981' }} />
                      ) : (
                        <Play style={{ width: 13, height: 13, color: '#7c3aed' }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#f0f0ff', lineHeight: 1.3 }}>
                        {tour.name}
                      </p>
                      {tour.description && (
                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#71717a', lineHeight: 1.4 }}>
                          {tour.description}
                        </p>
                      )}
                    </div>

                    <div style={{ flexShrink: 0, color: '#52525b' }}>
                      {tour.isCompleted
                        ? <RotateCcw style={{ width: 12, height: 12 }} />
                        : <ChevronRight style={{ width: 13, height: 13 }} />
                      }
                    </div>
                  </button>
                ))}
              </div>

              {/* Footer */}
              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  padding: '10px 16px',
                }}
              >
                <Link
                  href="/help"
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: '#7c3aed',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  View Help Center
                  <ChevronRight style={{ width: 12, height: 12 }} />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
