'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cpu, Cloud, RefreshCw, Save, CheckCircle, XCircle,
  HardDrive, Upload, Unlink, AlertCircle, ExternalLink,
  ChevronDown, ChevronUp, Loader2
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type Mode = 'local' | 'auto' | 'cloud';

interface GPUStatus {
  mode: Mode;
  cloudUrl: string;
  localAlive: boolean;
  cloudAlive: boolean;
  activeSource: 'local' | 'cloud' | 'none';
  statusMessage: string;
  localVramFree?: number;
  cloudVramFree?: number;
}

interface DriveStatus {
  connected: boolean;
  running: boolean;
  credsMissing?: boolean;
  authUrl?: string | null;
  summary: {
    total: number;
    done: number;
    errors: number;
    sentGB: number;
    totalGB: number;
    percent: number;
  } | null;
}

interface UploadFile {
  file: string;
  folder: string;
  percent: number;
  done: boolean;
  error?: string;
}

function GPUSettingsPageContent() {
  const searchParams = useSearchParams();

  // GPU mode state
  const [mode, setMode]         = useState<Mode>('local');
  const [cloudUrl, setCloudUrl] = useState('');
  const [gpuStatus, setGPUStatus] = useState<GPUStatus | null>(null);
  const [saving, setSaving]     = useState(false);
  const [checking, setChecking] = useState(false);
  const [saved, setSaved]       = useState(false);

  // Drive state
  const [driveStatus, setDriveStatus]     = useState<DriveStatus | null>(null);
  const [driveLoading, setDriveLoading]   = useState(false);
  const [uploadFiles, setUploadFiles]     = useState<UploadFile[]>([]);
  const [showFileList, setShowFileList]   = useState(false);
  const [driveMsg, setDriveMsg]           = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [colabUrl, setColabUrl]           = useState<string | null>(null);
  const [notebookLoading, setNotebookLoading] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  // Handle OAuth redirect params
  useEffect(() => {
    const connected = searchParams.get('drive_connected');
    const error     = searchParams.get('drive_error');
    if (connected === '1') {
      setDriveMsg({ type: 'success', text: '✅ Google Drive connected! You can now upload your models.' });
    }
    if (error) {
      setDriveMsg({ type: 'error', text: `❌ Drive connection failed: ${error}` });
    }
  }, [searchParams]);

  const checkGPUStatus = useCallback(async () => {
    setChecking(true);
    try {
      const res  = await fetch('/api/settings/gpu/status');
      const data = await res.json();
      setGPUStatus(data);
    } finally {
      setChecking(false);
    }
  }, []);

  const loadDriveStatus = useCallback(async () => {
    try {
      const res  = await fetch('/api/settings/gpu/drive/status');
      const data: DriveStatus = await res.json();
      setDriveStatus(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch('/api/settings/gpu')
      .then(r => r.json())
      .then(data => {
        setMode(data.mode || 'local');
        setCloudUrl(data.cloudUrl || '');
      });
    checkGPUStatus();
    loadDriveStatus();
  }, [checkGPUStatus, loadDriveStatus]);

  // When user switches to cloud/auto mode, also load drive status
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    if (newMode !== 'local') loadDriveStatus();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/gpu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, cloudUrl }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      checkGPUStatus();
    } finally {
      setSaving(false);
    }
  };

  // ─── Drive actions ───────────────────────────────────────────────────────────
  const handleConnectDrive = () => {
    window.location.href = '/api/settings/gpu/drive/connect';
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Drive? Tokens will be removed.')) return;
    await fetch('/api/settings/gpu/drive/disconnect', { method: 'POST' });
    setDriveStatus(prev => prev ? { ...prev, connected: false } : null);
    setUploadFiles([]);
    setColabUrl(null);
    if (sseRef.current) sseRef.current.close();
  };

  const uploadNotebook = async () => {
    setNotebookLoading(true);
    try {
      const res  = await fetch('/api/settings/gpu/drive/upload-notebook', { method: 'POST' });
      const data = await res.json();
      if (data.colabUrl) {
        setColabUrl(data.colabUrl);
        window.open(data.colabUrl, '_blank');
      } else {
        setDriveMsg({ type: 'error', text: data.error ?? 'Notebook upload failed' });
      }
    } finally {
      setNotebookLoading(false);
    }
  };

  const startUpload = async () => {
    if (!driveStatus?.connected) { handleConnectDrive(); return; }
    setDriveLoading(true);
    try {
      const res = await fetch('/api/settings/gpu/drive/upload', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        setDriveMsg({ type: 'error', text: err.error });
        return;
      }
      // Subscribe to SSE stream
      startSSE();
    } finally {
      setDriveLoading(false);
    }
  };

  const startSSE = () => {
    if (sseRef.current) sseRef.current.close();
    const es = new EventSource('/api/settings/gpu/drive/upload');
    sseRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setUploadFiles(data.progress ?? []);
      setDriveStatus(prev => prev
        ? { ...prev, running: data.running, summary: data.summary }
        : prev
      );
      if (!data.running && data.progress?.every((p: UploadFile) => p.done)) {
        es.close();
        setDriveMsg({ type: 'success', text: '✅ All models uploaded to Google Drive!' });
      }
    };

    es.onerror = () => {
      es.close();
    };
  };

  // Resume SSE if upload already running on mount
  useEffect(() => {
    if (driveStatus?.running) startSSE();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driveStatus?.running]);

  useEffect(() => () => { sseRef.current?.close(); }, []);

  // ─── Render ──────────────────────────────────────────────────────────────────

  const bannerClass =
    gpuStatus?.activeSource === 'cloud'  ? 'bg-green-900/20 border-green-600/40' :
    gpuStatus?.activeSource === 'local'  ? 'bg-yellow-900/20 border-yellow-600/40' :
    'bg-red-900/20 border-red-600/40';

  const needsDrive = mode === 'cloud' || mode === 'auto';

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">GPU Settings</h1>
        <p className="text-gray-400 text-sm mt-1">
          Choose local RTX 4060 or Google Colab T4 cloud GPU for AI processing.
        </p>
      </div>

      {/* Drive message banner */}
      {driveMsg && (
        <div className={`rounded-xl p-4 text-sm border flex items-start gap-3 ${
          driveMsg.type === 'success'
            ? 'bg-green-900/20 border-green-600/40 text-green-300'
            : 'bg-red-900/20 border-red-600/40 text-red-300'
        }`}>
          {driveMsg.type === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          <span>{driveMsg.text}</span>
          <button onClick={() => setDriveMsg(null)} className="ml-auto text-gray-500 hover:text-white">×</button>
        </div>
      )}

      {/* Live Status Banner */}
      <div className={`rounded-xl p-4 flex items-center justify-between border ${bannerClass}`}>
        <span className="text-white font-medium text-sm">
          {checking ? '⏳ Checking...' : (gpuStatus?.statusMessage ?? 'Unknown status')}
        </span>
        <button onClick={checkGPUStatus} disabled={checking} className="text-gray-400 hover:text-white p-1">
          <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Mode Selector */}
      <div>
        <label className="text-gray-300 text-sm font-medium mb-3 block">GPU Mode</label>
        <div className="grid grid-cols-3 gap-3">

          {/* Local Only */}
          <button
            onClick={() => handleModeChange('local')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              mode === 'local' ? 'border-purple-500 bg-purple-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <Cpu size={20} className="text-purple-400 mb-2" />
            <div className="text-white font-medium text-sm">Local Only</div>
            <div className="text-gray-400 text-xs mt-1">RTX 4060 8GB</div>
            {gpuStatus && (
              <div className={`text-xs mt-2 flex items-center gap-1 ${gpuStatus.localAlive ? 'text-green-400' : 'text-red-400'}`}>
                {gpuStatus.localAlive
                  ? <><CheckCircle size={10} /> Online{gpuStatus.localVramFree ? ` · ${gpuStatus.localVramFree}MB` : ''}</>
                  : <><XCircle size={10} /> Offline</>}
              </div>
            )}
          </button>

          {/* Auto */}
          <button
            onClick={() => handleModeChange('auto')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              mode === 'auto' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="flex items-center mb-2">
              <Cloud size={20} className="text-blue-400" />
              <span className="text-blue-400 text-xs mx-1">→</span>
              <Cpu size={20} className="text-purple-400" />
            </div>
            <div className="text-white font-medium text-sm">Auto</div>
            <div className="text-gray-400 text-xs mt-1">Cloud first, local fallback</div>
            <div className="text-blue-400 text-xs mt-2">✨ Recommended</div>
          </button>

          {/* Cloud Only */}
          <button
            onClick={() => handleModeChange('cloud')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              mode === 'cloud' ? 'border-blue-500 bg-blue-900/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'
            }`}
          >
            <Cloud size={20} className="text-blue-400 mb-2" />
            <div className="text-white font-medium text-sm">Cloud Only</div>
            <div className="text-gray-400 text-xs mt-1">Colab T4 15GB</div>
            {gpuStatus && (
              <div className={`text-xs mt-2 flex items-center gap-1 ${gpuStatus.cloudAlive ? 'text-green-400' : 'text-red-400'}`}>
                {gpuStatus.cloudAlive
                  ? <><CheckCircle size={10} /> Online{gpuStatus.cloudVramFree ? ` · ${gpuStatus.cloudVramFree}MB` : ''}</>
                  : <><XCircle size={10} /> {gpuStatus.cloudUrl ? 'Offline' : 'No URL'}</>}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Cloud URL Input */}
      {needsDrive && (
        <div>
          <label className="text-gray-300 text-sm font-medium mb-2 block">Colab Tunnel URL</label>
          <input
            type="text"
            value={cloudUrl}
            onChange={e => setCloudUrl(e.target.value)}
            placeholder="https://abc123.trycloudflare.com"
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:border-blue-500 transition-colors"
          />
          <p className="text-gray-500 text-xs mt-2">
            Start your Colab notebook → copy the tunnel URL → paste here
          </p>
        </div>
      )}

      {/* Mode description */}
      <div className="bg-gray-800/50 rounded-xl p-4 text-xs text-gray-400">
        {mode === 'local' && <p>All AI uses your RTX 4060 (8GB VRAM). ComfyUI must be running at localhost:8188.</p>}
        {mode === 'auto'  && <p>Every job pings Colab first (3s timeout). Cloud if alive → T4 15GB. Otherwise → RTX 4060 automatically. No manual switching needed.</p>}
        {mode === 'cloud' && <p>All AI uses Google Colab T4 (15GB VRAM). Jobs fail if Colab is not running. Start your notebook before generating.</p>}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {saving ? <><RefreshCw size={16} className="animate-spin" /> Saving...</>
         : saved  ? <><CheckCircle size={16} /> Saved!</>
         : <><Save size={16} /> Save Settings</>}
      </button>

      {/* ─── Google Drive Section (shown when cloud or auto mode) ─── */}
      {needsDrive && (
        <div className="border border-gray-700 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-blue-400" />
              <span className="text-white font-medium text-sm">Google Drive — Model Storage</span>
            </div>
            {driveStatus?.connected && (
              <span className="text-green-400 text-xs flex items-center gap-1">
                <CheckCircle size={12} /> Connected
              </span>
            )}
          </div>

          <div className="p-4 space-y-4">
            {driveStatus?.credsMissing ? (
              /* ── Credentials not set up ── */
              <div className="space-y-3">
                <div className="flex items-start gap-2 text-yellow-400 text-sm">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <p>Google Drive credentials not configured yet. Follow these steps once:</p>
                </div>
                <ol className="text-xs text-gray-400 space-y-1 pl-4 list-decimal">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink size={10} /></a></li>
                  <li>Create OAuth 2.0 Client ID → Web Application</li>
                  <li>Add redirect URI: <code className="bg-gray-700 px-1 rounded">http://localhost:3000/api/settings/gpu/drive/callback</code></li>
                  <li>Enable <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">Google Drive API</a></li>
                  <li>Add to <code className="bg-gray-700 px-1 rounded">.env.local</code>:
                    <pre className="bg-gray-700 rounded p-2 mt-1 leading-6 select-all">
{`GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000`}
                    </pre>
                  </li>
                  <li>Restart the dev server</li>
                </ol>
              </div>
            ) : !driveStatus?.connected ? (
              /* ── Not signed in ── */
              <div className="space-y-3">
                <p className="text-gray-400 text-sm">
                  Sign in with Google to upload your ComfyUI models (~14GB) to Drive.
                  Colab will then load them via symlinks — fast 5-min startup every session.
                </p>
                <button
                  onClick={handleConnectDrive}
                  className="w-full flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold py-2.5 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </button>
              </div>
            ) : (
              /* ── Connected ── */
              <div className="space-y-4">
                {/* Upload button / progress */}
                {driveStatus.running || driveStatus.summary ? (
                  <div className="space-y-3">
                    {/* Overall progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>
                          {driveStatus.running
                            ? `Uploading… ${driveStatus.summary?.done ?? 0} / ${driveStatus.summary?.total ?? 0} files`
                            : `Complete — ${driveStatus.summary?.done ?? 0} files uploaded`}
                        </span>
                        <span>
                          {driveStatus.summary?.sentGB.toFixed(1)}GB / {driveStatus.summary?.totalGB.toFixed(1)}GB
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${driveStatus.summary?.percent ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* File list toggle */}
                    {uploadFiles.length > 0 && (
                      <div>
                        <button
                          onClick={() => setShowFileList(v => !v)}
                          className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
                        >
                          {showFileList ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {showFileList ? 'Hide' : 'Show'} file details
                        </button>
                        {showFileList && (
                          <div className="mt-2 max-h-48 overflow-y-auto space-y-1 pr-1">
                            {uploadFiles.map((f, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <div className="w-16 text-gray-500 shrink-0">{f.folder}</div>
                                <div className="flex-1 truncate text-gray-300">{f.file}</div>
                                {f.done
                                  ? f.error
                                    ? <XCircle size={12} className="text-red-400 shrink-0" />
                                    : <CheckCircle size={12} className="text-green-400 shrink-0" />
                                  : <div className="w-8 text-right text-gray-400 shrink-0">{f.percent}%</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {driveStatus.summary && driveStatus.summary.errors > 0 && (
                      <p className="text-xs text-red-400">{driveStatus.summary.errors} file(s) failed — check logs.</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-gray-400 text-sm">
                      Upload your ComfyUI models (~14GB) to Google Drive. Colab will link them via symlinks — no re-upload needed next time.
                    </p>
                    <button
                      onClick={startUpload}
                      disabled={driveLoading}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                    >
                      {driveLoading
                        ? <><Loader2 size={16} className="animate-spin" /> Starting...</>
                        : <><Upload size={16} /> Upload Models to Drive</>}
                    </button>
                  </div>
                )}

                {/* Colab Notebook */}
                <div className="border border-gray-700/60 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-gray-400 font-medium">🤖 Colab Notebook</p>
                  <p className="text-xs text-gray-500">
                    Upload the notebook to Drive and open it in Colab to start your T4 GPU session.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={uploadNotebook}
                      disabled={notebookLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white text-xs font-medium py-2 rounded-lg transition-colors"
                    >
                      {notebookLoading
                        ? <><Loader2 size={12} className="animate-spin" /> Uploading...</>
                        : <><Upload size={12} /> Upload to Drive &amp; Open Colab</>}
                    </button>
                    {colabUrl && (
                      <a
                        href={colabUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <ExternalLink size={12} /> Open Colab
                      </a>
                    )}
                  </div>
                  {colabUrl && (
                    <div className="bg-gray-800 rounded p-2">
                      <p className="text-xs text-gray-500 mb-1">After Colab starts, copy the tunnel URL from Cell 4 and paste it in the field above:</p>
                      <code className="text-xs text-blue-400 break-all">{colabUrl}</code>
                    </div>
                  )}
                </div>

                {/* Disconnect link */}
                <button
                  onClick={handleDisconnect}
                  className="text-xs text-gray-600 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Unlink size={12} /> Disconnect Google Drive
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connection Details */}
      {gpuStatus && (
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider">Connection Details</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Local GPU</span>
              <span className={gpuStatus.localAlive ? 'text-green-400' : 'text-red-400'}>
                {gpuStatus.localAlive
                  ? `🟢 localhost:8188${gpuStatus.localVramFree ? ` · ${gpuStatus.localVramFree}MB VRAM` : ''}`
                  : '🔴 Not running'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Cloud GPU</span>
              <span className={gpuStatus.cloudAlive ? 'text-green-400' : gpuStatus.cloudUrl ? 'text-red-400' : 'text-gray-600'}>
                {gpuStatus.cloudAlive
                  ? `🟢 Colab T4${gpuStatus.cloudVramFree ? ` · ${gpuStatus.cloudVramFree}MB VRAM` : ''}`
                  : gpuStatus.cloudUrl ? '🔴 Not reachable' : '⚪ No URL set'}
              </span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
              <span className="text-gray-400">Currently routing to</span>
              <span className="text-white font-medium">
                {gpuStatus.activeSource === 'cloud' ? '☁️ Cloud (T4 15GB)'
                 : gpuStatus.activeSource === 'local' ? '💻 Local (RTX 4060)'
                 : '❌ None'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GPUSettingsPage() {
  return (
    <Suspense fallback={null}>
      <GPUSettingsPageContent />
    </Suspense>
  );
}
