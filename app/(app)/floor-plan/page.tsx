'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, CheckCircle, AlertCircle, Loader2, FileBox } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

interface ProjectStatus {
  projectId: string;
  status: string;
  photoCount: number;
  photos: { url: string; order: number }[];
  pointCloud: {
    pointCount: number;
    boundingBox: any;
    cameraCount: number;
  } | null;
  errorMessage: string | null;
  processingLog: string[];
}

export default function FloorPlanPage() {
  const { t } = useLanguage();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [roomName, setRoomName] = useState('Living Room');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<ProjectStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    
    if (selected.length < 3) {
      setErrorMsg(t('fp_min_3'));
      return;
    }
    if (selected.length > 20) {
      setErrorMsg(t('fp_max_20'));
      return;
    }
    
    setErrorMsg('');
    setFiles(selected);
    
    // Generate previews
    const newPreviews: string[] = [];
    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === selected.length) {
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const startPolling = (pid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/floor-plan/status/${pid}`);
        const data = await res.json();
        setProjectData(data);
        
        if (data.status === 'point_cloud_ready') {
          setStatus('done');
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'error') {
          setStatus('error');
          setErrorMsg(data.errorMessage || 'Reconstruction failed');
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
  };

  const handleUpload = async () => {
    if (files.length < 3) {
      setErrorMsg(t('fp_min_3'));
      return;
    }
    
    setStatus('uploading');
    setErrorMsg('');
    
    const formData = new FormData();
    formData.append('roomName', roomName);
    files.forEach(f => formData.append('photos', f));
    
    try {
      const res = await fetch('/api/floor-plan/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setStatus('error');
        setErrorMsg(data.error || 'Upload failed');
        return;
      }
      
      setProjectId(data.projectId);
      setStatus('processing');
      startPolling(data.projectId);
      
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  const reset = () => {
    setFiles([]);
    setPreviews([]);
    setStatus('idle');
    setProjectId(null);
    setProjectData(null);
    setErrorMsg('');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {t('fp_title')}
        </h1>
        <p className="text-gray-400">
          {t('fp_subtitle')}
        </p>
      </div>

      {/* Photo Requirements */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Camera size={18} />
          {t('fp_photo_req')}
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
          <div>✅ Minimum 3 photos (5-12 ideal)</div>
          <div>✅ Each photo must overlap 60% with the next</div>
          <div>✅ Stand at different walls facing inward</div>
          <div>✅ Include floor and ceiling in each shot</div>
          <div>✅ Good lighting — no dark corners</div>
          <div>✅ Minimum resolution: 640×480</div>
        </div>
      </div>

      {status === 'idle' && (
        <>
          {/* Room Name */}
          <div className="mb-4">
            <label className="text-gray-300 text-sm mb-1 block">{t('fp_room_name')}</label>
            <input
              type="text"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 w-full max-w-xs focus:outline-none focus:border-purple-500"
              placeholder="e.g. Living Room"
            />
          </div>

          {/* Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-purple-500 transition-colors mb-4"
          >
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-white font-medium mb-1">
              {t('fp_upload_click')}
            </p>
            <p className="text-gray-400 text-sm">
              {t('fp_upload_types')}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Photo Previews */}
          {previews.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-300 text-sm mb-3">
                {t('fp_photos_selected', { count: String(files.length) })}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {previews.map((preview, i) => (
                  <div key={i} className="relative aspect-square">
                    <img
                      src={preview}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {i + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-900/30 border border-red-500 text-red-300 rounded-lg p-3 mb-4 text-sm">
              {errorMsg}
            </div>
          )}

          {files.length >= 3 && (
            <button
              onClick={handleUpload}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {t('fp_start_reconstruction')}
            </button>
          )}
        </>
      )}

      {/* Processing State */}
      {(status === 'uploading' || status === 'processing') && (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Loader2 className="mx-auto mb-4 text-purple-400 animate-spin" size={48} />
          <h3 className="text-white font-semibold text-lg mb-2">
            {status === 'uploading' ? t('fp_uploading') : t('fp_reconstructing')}
          </h3>
          <p className="text-gray-400 text-sm mb-6">
            {status === 'processing' && t('fp_takes_time')}
          </p>

          {/* Processing Log */}
          {projectData?.processingLog && projectData.processingLog.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 text-left max-h-48 overflow-y-auto">
              {projectData.processingLog.map((logStr, i) => (
                <div key={i} className="text-green-400 text-xs font-mono mb-1">
                  {logStr}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Success State */}
      {status === 'done' && projectData && (
        <div className="space-y-4">
          <div className="bg-green-900/30 border border-green-500 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="text-green-400" size={28} />
              <h3 className="text-white font-semibold text-lg">
                {t('fp_done_title')}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {projectData.pointCloud?.pointCount?.toLocaleString()}
                </div>
                <div className="text-gray-400 text-xs mt-1">{t('fp_3d_points')}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {projectData.pointCloud?.cameraCount}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {t('fp_cameras')}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-white">
                  {projectData.photoCount}
                </div>
                <div className="text-gray-400 text-xs mt-1">{t('fp_photos_used')}</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 text-sm text-gray-300">
              <strong className="text-white">Project ID:</strong>{' '}
              <span className="font-mono text-purple-300">{projectId}</span>
            </div>

            <div className="mt-4 p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg text-blue-300 text-sm">
              {t('fp_phase1_done')}
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-colors"
          >
            {t('fp_start_new')}
          </button>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="bg-red-900/30 border border-red-500 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <AlertCircle className="text-red-400" size={28} />
            <h3 className="text-white font-semibold">{t('fp_failed_title')}</h3>
          </div>
          <p className="text-red-300 text-sm mb-4">{errorMsg}</p>

          <div className="bg-gray-900 rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-xs font-semibold mb-2">
              Common fixes:
            </p>
            <ul className="text-gray-300 text-xs space-y-1">
              <li>• Make sure photos overlap by at least 60%</li>
              <li>• Use at least 5 photos for better results</li>
              <li>• Ensure good lighting — avoid dark rooms</li>
              <li>• Photos should cover all 4 walls</li>
            </ul>
          </div>

          <button
            onClick={reset}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl transition-colors"
          >
            {t('fp_try_again')}
          </button>
        </div>
      )}
    </div>
  );
}
