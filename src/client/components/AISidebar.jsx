/**
 * AI Dashboard Sidebar Component
 * Provides interface for room redesign, object removal, and recoloring
 */

import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import ReactCompareSlider from 'react-compare-slider';
import ReactCompareSliderImage from 'react-compare-slider-image';
import { 
  Palette, 
  Trash2, 
  Brush, 
  Upload, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Cpu,
  Wifi,
  WifiOff,
  Play,
  Pause
} from 'lucide-react';

const AISidebar = () => {
  const [activeTab, setActiveTab] = useState('redesign');
  const [gpuStatus, setGpuStatus] = useState({ status: 'offline', queueLength: 0 });
  const [socket, setSocket] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [originalImage, setOriginalImage] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);

  // Form states
  const [redesignForm, setRedesignForm] = useState({
    style: '',
    roomType: '',
    colorPalette: ''
  });
  const [removalForm, setRemovalForm] = useState({
    objectName: ''
  });
  const [recolorForm, setRecolorForm] = useState({
    target: 'walls',
    color: '',
    material: 'default'
  });

  // Presets
  const [presets, setPresets] = useState({
    colors: [],
    materials: [],
    targets: []
  });

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('comfy:status', (data) => {
      console.log('ComfyUI status:', data);
      if (data.status === 'connected') {
        toast.success('GPU Connected');
      } else {
        toast.error('GPU Disconnected');
      }
    });

    newSocket.on('comfy:progress', (data) => {
      setProgress(data.progress);
      setCurrentStage(data.stage || 'Processing...');
    });

    newSocket.on('comfy:done', (data) => {
      setIsProcessing(false);
      setProgress(100);
      setCurrentStage('Completed!');
      setResultImage(data.imageUrl);
      toast.success('AI Processing Complete!');
      
      if (currentProject) {
        setCurrentProject(prev => ({
          ...prev,
          status: 'completed',
          resultImage: data.imageUrl
        }));
      }
    });

    newSocket.on('comfy:error', (data) => {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStage('');
      toast.error(`AI Error: ${data.message}`);
      
      if (currentProject) {
        setCurrentProject(prev => ({
          ...prev,
          status: 'failed',
          errorMessage: data.message
        }));
      }
    });

    return () => newSocket.close();
  }, [currentProject]);

  // Fetch GPU status every 5 seconds
  useEffect(() => {
    const fetchGPUStatus = async () => {
      try {
        const response = await fetch('/api/ai/status');
        const data = await response.json();
        setGpuStatus(data);
      } catch (error) {
        console.error('Failed to fetch GPU status:', error);
        setGpuStatus({ status: 'offline', queueLength: 0 });
      }
    };

    fetchGPUStatus();
    const interval = setInterval(fetchGPUStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch presets
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const response = await fetch('/api/ai/recolor/presets');
        const data = await response.json();
        setPresets(data);
      } catch (error) {
        console.error('Failed to fetch presets:', error);
      }
    };

    fetchPresets();
  }, []);

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
        setResultImage(null);
        setCurrentProject(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(async (endpoint, formData) => {
    if (!originalImage) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentStage('Queuing...');

    try {
      const formDataToSend = new FormData();
      
      // Convert base64 to blob
      const blob = await fetch(originalImage).then(r => r.blob());
      formDataToSend.append('image', blob, 'upload.jpg');

      // Add form data based on endpoint
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Processing failed');
      }

      setCurrentProject(result);
      setCurrentStage('Processing started...');
      toast.success('Job queued successfully!');

    } catch (error) {
      setIsProcessing(false);
      setProgress(0);
      setCurrentStage('');
      toast.error(`Error: ${error.message}`);
    }
  }, [originalImage]);

  const renderGPUStatus = () => {
    const isOnline = gpuStatus.status !== 'offline';
    const isBusy = gpuStatus.status === 'busy' || gpuStatus.queueLength > 0;
    
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
        isOnline 
          ? isBusy 
            ? 'bg-yellow-100 text-yellow-800' 
            : 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {isOnline ? (
          isBusy ? (
            <>
              <Cpu className="w-4 h-4" />
              GPU Busy (Queue: {gpuStatus.queueLength})
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              GPU Ready
            </>
          )
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            GPU Offline
          </>
        )}
      </div>
    );
  };

  const renderProgressBar = () => {
    if (!isProcessing) return null;

    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{currentStage}</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderImageComparison = () => {
    if (!originalImage || !resultImage) return null;

    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Before / After</h3>
        <div className="rounded-lg overflow-hidden border border-gray-200">
          <ReactCompareSlider
            itemOne={<ReactCompareSliderImage src={originalImage} alt="Before" />}
            itemTwo={<ReactCompareSliderImage src={resultImage} alt="After" />}
            sliderPosition={0.5}
            sliderHandleStyle={{
              width: 40,
              height: 40,
              background: 'white',
              border: '2px solid #3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
            sliderLineStyle={{
              background: '#3b82f6',
              opacity: 0.3
            }}
          />
        </div>
      </div>
    );
  };

  const renderRedesignTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
        <select
          value={redesignForm.style}
          onChange={(e) => setRedesignForm(prev => ({ ...prev, style: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isProcessing}
        >
          <option value="">Select style...</option>
          <option value="Modern">Modern</option>
          <option value="Minimalist">Minimalist</option>
          <option value="Scandinavian">Scandinavian</option>
          <option value="Industrial">Industrial</option>
          <option value="Traditional">Traditional</option>
          <option value="Contemporary">Contemporary</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
        <select
          value={redesignForm.roomType}
          onChange={(e) => setRedesignForm(prev => ({ ...prev, roomType: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isProcessing}
        >
          <option value="">Select room type...</option>
          <option value="living room">Living Room</option>
          <option value="bedroom">Bedroom</option>
          <option value="kitchen">Kitchen</option>
          <option value="bathroom">Bathroom</option>
          <option value="dining room">Dining Room</option>
          <option value="office">Home Office</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color Palette</label>
        <select
          value={redesignForm.colorPalette}
          onChange={(e) => setRedesignForm(prev => ({ ...prev, colorPalette: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isProcessing}
        >
          <option value="">Select color palette...</option>
          <option value="neutral">Neutral</option>
          <option value="warm">Warm</option>
          <option value="cool">Cool</option>
          <option value="monochromatic">Monochromatic</option>
          <option value="vibrant">Vibrant</option>
          <option value="pastel">Pastel</option>
        </select>
      </div>

      <button
        onClick={() => handleSubmit('/api/ai/redesign', redesignForm)}
        disabled={isProcessing || !redesignForm.style || !redesignForm.roomType || !redesignForm.colorPalette}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Start Redesign
          </>
        )}
      </button>
    </div>
  );

  const renderRemovalTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Object to Remove</label>
        <input
          type="text"
          value={removalForm.objectName}
          onChange={(e) => setRemovalForm(prev => ({ ...prev, objectName: e.target.value }))}
          placeholder="e.g., lamp, chair, painting"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isProcessing}
        />
      </div>

      <button
        onClick={() => handleSubmit('/api/ai/remove-object', removalForm)}
        disabled={isProcessing || !removalForm.objectName}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Trash2 className="w-4 h-4" />
            Remove Object
          </>
        )}
      </button>
    </div>
  );

  const renderRecolorTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
        <select
          value={recolorForm.target}
          onChange={(e) => setRecolorForm(prev => ({ ...prev, target: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isProcessing}
        >
          {presets.targets?.map(target => (
            <option key={target.value} value={target.value}>
              {target.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <select
          value={recolorForm.color}
          onChange={(e) => setRecolorForm(prev => ({ ...prev, color: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isProcessing}
        >
          <option value="">Select color...</option>
          {presets.colors?.map(color => (
            <option key={color.hex} value={color.name}>
              {color.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
        <select
          value={recolorForm.material}
          onChange={(e) => setRecolorForm(prev => ({ ...prev, material: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isProcessing}
        >
          {presets.materials?.map(material => (
            <option key={material.name} value={material.name}>
              {material.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => handleSubmit('/api/ai/recolor', recolorForm)}
        disabled={isProcessing || !recolorForm.color}
        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Brush className="w-4 h-4" />
            Apply Color
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Tools</h2>
        {renderGPUStatus()}
      </div>

      {/* Progress */}
      {renderProgressBar()}

      {/* Image Upload */}
      <div className="p-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="image-upload"
            className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="w-5 h-5 mr-2 text-gray-400" />
            <span className="text-sm text-gray-600">
              {originalImage ? 'Change Image' : 'Choose Image'}
            </span>
          </label>
        </div>
        
        {originalImage && (
          <div className="mt-2">
            <img src={originalImage} alt="Uploaded" className="w-full h-32 object-cover rounded-lg" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('redesign')}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'redesign'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🎨 Redesign
        </button>
        <button
          onClick={() => setActiveTab('removal')}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'removal'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🗑 Remove Object
        </button>
        <button
          onClick={() => setActiveTab('recolor')}
          className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'recolor'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🖌 Recolor
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'redesign' && renderRedesignTab()}
        {activeTab === 'removal' && renderRemovalTab()}
        {activeTab === 'recolor' && renderRecolorTab()}
      </div>

      {/* Image Comparison */}
      {renderImageComparison()}
    </div>
  );
};

export default AISidebar;
