'use client';

import { useState, useCallback } from 'react';

export interface CropState {
  isOpen:       boolean;
  originalFile: File | null;
  originalUrl:  string;
}

/**
 * Manages the crop modal lifecycle for pages that use custom file inputs.
 *
 * Usage:
 *   const crop = useCrop();
 *
 *   // When user selects a file:
 *   crop.open(file);
 *
 *   // In JSX:
 *   <ImageCropModal
 *     isOpen={crop.state.isOpen}
 *     imageFile={crop.state.originalFile}
 *     imageUrl={crop.state.originalUrl}
 *     onConfirm={(file, url) => { crop.close(); doSomethingWith(file, url); }}
 *     onCancel={() => { crop.close(); doSomethingWith(crop.state.originalFile!, crop.state.originalUrl); }}
 *   />
 */
export function useCrop() {
  const [state, setState] = useState<CropState>({
    isOpen: false, originalFile: null, originalUrl: '',
  });

  const open = useCallback((file: File) => {
    setState(prev => {
      if (prev.originalUrl) URL.revokeObjectURL(prev.originalUrl);
      return { isOpen: true, originalFile: file, originalUrl: URL.createObjectURL(file) };
    });
  }, []);

  const close = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => {
      if (prev.originalUrl) URL.revokeObjectURL(prev.originalUrl);
      return { isOpen: false, originalFile: null, originalUrl: '' };
    });
  }, []);

  return { state, open, close, reset };
}
