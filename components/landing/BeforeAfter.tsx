'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Sparkles } from 'lucide-react';

interface BeforeAfterProps {
  beforeImage?: string;
  afterImage?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfter({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: BeforeAfterProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            AI Transformation
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Drag to See the
            <span className="block bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Transformation
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            Experience the power of AI-driven interior redesign
          </p>
        </motion.div>

        {/* Before/After Slider */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div
            ref={containerRef}
            className="relative aspect-[16/9] rounded-2xl overflow-hidden cursor-ew-resize select-none border border-slate-700"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            {/* Before Image (Background) */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-600 flex items-center justify-center">
                    <span className="text-3xl">🏠</span>
                  </div>
                  <p className="text-slate-400">{beforeLabel}</p>
                </div>
              </div>
            </div>

            {/* After Image (Overlay with clip-path) */}
            <div
              className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-cyan-900/50"
              style={{
                clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white">{afterLabel}</p>
                </div>
              </div>
            </div>

            {/* Slider Line */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white/80 z-10"
              style={{ left: `${sliderPosition}%` }}
            >
              {/* Slider Handle */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center cursor-ew-resize">
                <GripVertical className="w-5 h-5 text-slate-600" />
              </div>
            </div>

            {/* Labels */}
            <div className="absolute top-4 left-4 z-20">
              <Badge className="bg-black/50 text-white backdrop-blur-sm">
                {beforeLabel}
              </Badge>
            </div>
            <div className="absolute top-4 right-4 z-20">
              <Badge className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white">
                {afterLabel}
              </Badge>
            </div>
          </div>

          {/* Instruction */}
          <p className="text-center text-slate-500 text-sm mt-4">
            Drag the slider left and right to compare
          </p>
        </motion.div>
      </div>
    </section>
  );
}