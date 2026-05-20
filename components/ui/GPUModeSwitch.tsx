'use client';

import { useState, useRef, useEffect } from 'react';
import { useGPUMode, type GPUMode } from '@/hooks/useGPUMode';

interface GPUModeSwitchProps {
  /** Extra Tailwind classes for the wrapper */
  className?: string;
  /** Called after a successful mode switch */
  onSwitch?: (mode: GPUMode) => void;
}

export default function GPUModeSwitch({ className = '', onSwitch }: GPUModeSwitchProps) {
  const { status, loading, error, switchMode, refresh } = useGPUMode();
  const [showCloudInput, setShowCloudInput] = useState(false);
  const [cloudUrlInput, setCloudUrlInput] = useState('');
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pre-fill cloud URL from env or current status
  useEffect(() => {
    if (status?.cloud?.url) setCloudUrlInput(status.cloud.url);
  }, [status?.cloud?.url]);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSwitch(mode: GPUMode) {
    if (loading) return;

    if (mode === 'cloud') {
      // Resolve cloud URL: from input or existing env
      const url = cloudUrlInput.trim() || status?.cloud?.url || '';
      if (!url) {
        setShowCloudInput(true);
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }
      const result = await switchMode('cloud', url);
      if (result.success) {
        setShowCloudInput(false);
        showToast(result.message, true);
        onSwitch?.('cloud');
      } else {
        showToast(result.message, false);
      }
      return;
    }

    // Switch to local
    const result = await switchMode('local');
    setShowCloudInput(false);
    showToast(result.message, result.success);
    if (result.success) onSwitch?.('local');
  }

  const mode = status?.mode ?? 'local';
  const localHealth = status?.local;
  const cloudHealth = status?.cloud;

  function HealthDot({ online }: { online?: boolean }) {
    if (online === undefined) return <span className="gpu-dot gpu-dot-idle" />;
    return <span className={`gpu-dot ${online ? 'gpu-dot-on' : 'gpu-dot-off'}`} />;
  }

  function VramBadge({ h }: { h?: { vramFree?: number; vramTotal?: number; online?: boolean } }) {
    if (!h?.online || !h.vramFree) return null;
    const pct = h.vramTotal ? Math.round((h.vramFree / h.vramTotal) * 100) : null;
    return (
      <span className="gpu-vram-badge">
        {h.vramFree}MB free{pct !== null ? ` (${pct}%)` : ''}
      </span>
    );
  }

  return (
    <>
      {/* ── Styles ─────────────────────────────────────────────────────── */}
      <style>{`
        .gpu-switch-wrap {
          display: inline-flex;
          flex-direction: column;
          gap: 8px;
          font-family: inherit;
          font-size: 13px;
          user-select: none;
        }
        .gpu-switch-label {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #94a3b8;
        }
        .gpu-toggle-row {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(15,23,42,.6);
          border: 1px solid rgba(99,102,241,.2);
          border-radius: 12px;
          padding: 4px 6px;
          backdrop-filter: blur(12px);
        }
        .gpu-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all .2s ease;
          color: #94a3b8;
          background: transparent;
          white-space: nowrap;
        }
        .gpu-btn:hover:not(.gpu-btn-active):not(:disabled) {
          background: rgba(99,102,241,.12);
          color: #c7d2fe;
        }
        .gpu-btn-active {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          box-shadow: 0 2px 12px rgba(99,102,241,.45);
        }
        .gpu-btn:disabled { opacity: .5; cursor: not-allowed; }
        .gpu-divider { width:1px; height:24px; background: rgba(99,102,241,.2); flex-shrink:0; }
        .gpu-dot {
          display: inline-block;
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .gpu-dot-on  { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .gpu-dot-off { background: #f43f5e; }
        .gpu-dot-idle{ background: #64748b; }
        .gpu-status-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 6px;
          font-size: 11px;
          color: #64748b;
          min-height: 20px;
        }
        .gpu-vram-badge {
          background: rgba(99,102,241,.15);
          color: #a5b4fc;
          border-radius: 4px;
          padding: 1px 6px;
          font-size: 10px;
          font-weight: 600;
        }
        .gpu-cloud-input-wrap {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .gpu-cloud-input {
          flex: 1;
          background: rgba(15,23,42,.8);
          border: 1px solid rgba(99,102,241,.35);
          border-radius: 8px;
          padding: 6px 10px;
          color: #e2e8f0;
          font-size: 12px;
          outline: none;
          transition: border .2s;
          min-width: 240px;
        }
        .gpu-cloud-input::placeholder { color: #475569; }
        .gpu-cloud-input:focus { border-color: #6366f1; }
        .gpu-connect-btn {
          padding: 6px 14px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity .2s;
        }
        .gpu-connect-btn:hover { opacity: .88; }
        .gpu-connect-btn:disabled { opacity: .5; cursor: not-allowed; }
        .gpu-toast {
          position: fixed;
          bottom: 24px; right: 24px;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
          z-index: 9999;
          box-shadow: 0 4px 24px rgba(0,0,0,.4);
          animation: gpu-slidein .25s ease;
          max-width: 380px;
        }
        .gpu-toast-ok  { background: #064e3b; color: #6ee7b7; border: 1px solid #065f46; }
        .gpu-toast-err { background: #4c0519; color: #fda4af; border: 1px solid #881337; }
        .gpu-error-row { font-size: 11px; color: #f43f5e; padding: 2px 6px; }
        @keyframes gpu-slidein {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Widget ─────────────────────────────────────────────────────── */}
      <div className={`gpu-switch-wrap ${className}`}>
        <span className="gpu-switch-label">⚡ GPU Mode</span>

        <div className="gpu-toggle-row">
          {/* Local button */}
          <button
            className={`gpu-btn ${mode === 'local' ? 'gpu-btn-active' : ''}`}
            onClick={() => handleSwitch('local')}
            disabled={loading}
            title={localHealth?.url}
          >
            <HealthDot online={localHealth?.online} />
            🖥️&nbsp;Local
          </button>

          <div className="gpu-divider" />

          {/* Cloud button */}
          <button
            className={`gpu-btn ${mode === 'cloud' ? 'gpu-btn-active' : ''}`}
            onClick={() => handleSwitch('cloud')}
            disabled={loading}
            title={cloudHealth?.url || 'Enter Colab URL to connect'}
          >
            <HealthDot online={cloudHealth?.online} />
            ☁️&nbsp;Google Colab
          </button>

          {/* Refresh */}
          <button
            className="gpu-btn"
            onClick={refresh}
            disabled={loading}
            title="Refresh health status"
            style={{ padding: '7px 10px' }}
          >
            {loading ? '⟳' : '↻'}
          </button>
        </div>

        {/* Status row */}
        <div className="gpu-status-row">
          {mode === 'local' ? (
            <>
              <HealthDot online={localHealth?.online} />
              <span>{localHealth?.online ? 'Local ComfyUI connected' : 'Local ComfyUI offline'}</span>
              <VramBadge h={localHealth} />
            </>
          ) : (
            <>
              <HealthDot online={cloudHealth?.online} />
              <span>{cloudHealth?.online ? 'Colab ComfyUI connected' : 'Colab not reachable'}</span>
              <VramBadge h={cloudHealth} />
            </>
          )}
        </div>

        {/* Cloud URL input (shown when no URL configured or edit requested) */}
        {showCloudInput && (
          <div className="gpu-cloud-input-wrap">
            <input
              ref={inputRef}
              className="gpu-cloud-input"
              type="url"
              placeholder="https://xxxx.pinggy.io  ← paste Colab tunnel URL"
              value={cloudUrlInput}
              onChange={e => setCloudUrlInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSwitch('cloud')}
            />
            <button
              className="gpu-connect-btn"
              onClick={() => handleSwitch('cloud')}
              disabled={loading || !cloudUrlInput.trim()}
            >
              {loading ? 'Connecting…' : 'Connect'}
            </button>
            <button
              className="gpu-btn"
              onClick={() => setShowCloudInput(false)}
              style={{ padding: '6px 10px' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Inline error */}
        {error && !toast && <div className="gpu-error-row">⚠️ {error}</div>}

        {/* Edit cloud URL link when already in cloud mode */}
        {mode === 'cloud' && !showCloudInput && (
          <button
            className="gpu-btn"
            style={{ fontSize: 11, padding: '3px 6px', color: '#6366f1' }}
            onClick={() => setShowCloudInput(true)}
          >
            ✏️ Change tunnel URL
          </button>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`gpu-toast ${toast.ok ? 'gpu-toast-ok' : 'gpu-toast-err'}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}
