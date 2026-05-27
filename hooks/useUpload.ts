// hooks/useUpload.ts
'use client';

import { useState, useCallback, useRef } from 'react';
import { useUploadThing } from '@/lib/uploadthing';
import { toast } from '@/components/ui/use-toast';

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseUploadOptions {
  endpoint?: 'imageUploader' | 'projectImage' | 'avatar' | 'designerPortfolio';
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  onUploadProgress?: (progress: UploadProgress) => void;
  autoUpload?: boolean;
}

interface UseUploadReturn {
  // State
  files: File[];
  uploadedFiles: UploadedFile[];
  isUploading: boolean;
  progress: UploadProgress;
  error: string | null;
  isDragging: boolean;

  // Input ref for file input
  inputRef: React.RefObject<HTMLInputElement>;

  // Actions
  upload: (files?: File[]) => Promise<UploadedFile[]>;
  addFiles: (files: File[]) => void;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  openFileDialog: () => void;

  // Drag & drop handlers
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;

  // File input handler
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Utility
  validateFile: (file: File) => { valid: boolean; error?: string };
  getFilePreview: (file: File) => string | null;
  formatFileSize: (bytes: number) => string;
  reset: () => void;
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const {
    endpoint = 'imageUploader',
    maxFiles = 10,
    maxSize = DEFAULT_MAX_SIZE,
    acceptedTypes = DEFAULT_ACCEPTED_TYPES,
    onUploadComplete,
    onUploadError,
    onUploadProgress,
    autoUpload = false,
  } = options;

  // State
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // UploadThing hook
  const { startUpload, isUploading: uploadThingUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      const uploaded: UploadedFile[] = res.map(file => ({
        id: file.key,
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type || 'image/jpeg',
        uploadedAt: new Date(),
      }));

      setUploadedFiles(prev => [...prev, ...uploaded]);
      setFiles([]);
      setIsUploading(false);
      setProgress({ loaded: 0, total: 0, percentage: 100 });

      onUploadComplete?.(uploaded);

      toast({
        title: 'Upload Complete',
        description: `${uploaded.length} file(s) uploaded successfully.`,
      });
    },
    onUploadError: (err) => {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      setIsUploading(false);

      onUploadError?.(err);

      toast({
        title: 'Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    },
    onUploadProgress: (p) => {
      const newProgress = {
        loaded: Math.round((p / 100) * progress.total),
        total: progress.total,
        percentage: p,
      };
      setProgress(newProgress);
      onUploadProgress?.(newProgress);
    },
  });

  // Validate file
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type "${file.type}" is not supported. Accepted types: ${acceptedTypes.join(', ')}`,
      };
    }

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed (${formatFileSize(maxSize)})`,
      };
    }

    return { valid: true };
  }, [acceptedTypes, maxSize]);

  // Add files
  const addFiles = useCallback((newFiles: File[]) => {
    setError(null);

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      toast({
        title: 'Some files were rejected',
        description: errors.join('\n'),
        variant: 'destructive',
      });
    }

    // Check max files limit
    const totalFiles = files.length + validFiles.length;
    if (totalFiles > maxFiles) {
      const filesToAdd = validFiles.slice(0, maxFiles - files.length);
      setFiles(prev => [...prev, ...filesToAdd]);
      toast({
        title: 'File limit reached',
        description: `Maximum ${maxFiles} files allowed.`,
      });
    } else {
      setFiles(prev => [...prev, ...validFiles]);
    }

    // Auto-upload if enabled
    if (autoUpload && validFiles.length > 0) {
      setTimeout(() => upload(validFiles), 100);
    }
  }, [files.length, maxFiles, validateFile, autoUpload]);

  // Remove file
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  // Upload files
  const upload = useCallback(async (filesToUpload?: File[]): Promise<UploadedFile[]> => {
    const uploadFiles = filesToUpload || files;

    if (uploadFiles.length === 0) {
      toast({
        title: 'No files to upload',
        description: 'Please select files first.',
        variant: 'destructive',
      });
      return [];
    }

    setIsUploading(true);
    setError(null);
    setProgress({
      loaded: 0,
      total: uploadFiles.reduce((sum, f) => sum + f.size, 0),
      percentage: 0,
    });

    try {
      const result = await startUpload(uploadFiles);

      if (!result) {
        throw new Error('Upload failed - no response');
      }

      return result.map(file => ({
        id: file.key,
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type || 'image/jpeg',
        uploadedAt: new Date(),
      }));
    } catch (err: any) {
      const errorMessage = err.message || 'Upload failed';
      setError(errorMessage);
      throw err;
    }
  }, [files, startUpload]);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    inputRef.current?.click();
  }, []);

  // Handle file input change
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      addFiles(Array.from(fileList));
    }
    // Reset input value to allow selecting same file again
    e.target.value = '';
  }, [addFiles]);

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;

    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(false);
    dragCounterRef.current = 0;

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  }, [addFiles]);

  // Get file preview URL
  const getFilePreview = useCallback((file: File): string | null => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setFiles([]);
    setUploadedFiles([]);
    setIsUploading(false);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setError(null);
    setIsDragging(false);
    dragCounterRef.current = 0;
  }, []);

  return {
    // State
    files,
    uploadedFiles,
    isUploading: isUploading || uploadThingUploading,
    progress,
    error,
    isDragging,

    // Ref
    inputRef,

    // Actions
    upload,
    addFiles,
    removeFile,
    clearFiles,
    openFileDialog,

    // Drag & drop handlers
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,

    // File input handler
    handleFileChange,

    // Utility
    validateFile,
    getFilePreview,
    formatFileSize,
    reset,
  };
}