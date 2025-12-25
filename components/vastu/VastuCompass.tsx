"use client";

import React from 'react';
import { Compass, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompassDirection } from '@/types/vastu';

interface VastuCompassProps {
  direction?: CompassDirection;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  interactive?: boolean;
  onDirectionSelect?: (direction: CompassDirection) => void;
  className?: string;
}

// Updated direction labels to match the new CompassDirection type
const directionLabels: Record<CompassDirection, { short: string; full: string; fullHi: string }> = {
  'NORTH': { short: 'N', full: 'North', fullHi: 'उत्तर' },
  'NORTHEAST': { short: 'NE', full: 'North-East', fullHi: 'उत्तर-पूर्व' },
  'EAST': { short: 'E', full: 'East', fullHi: 'पूर्व' },
  'SOUTHEAST': { short: 'SE', full: 'South-East', fullHi: 'दक्षिण-पूर्व' },
  'SOUTH': { short: 'S', full: 'South', fullHi: 'दक्षिण' },
  'SOUTHWEST': { short: 'SW', full: 'South-West', fullHi: 'दक्षिण-पश्चिम' },
  'WEST': { short: 'W', full: 'West', fullHi: 'पश्चिम' },
  'NORTHWEST': { short: 'NW', full: 'North-West', fullHi: 'उत्तर-पश्चिम' },
};

const directionAngles: Record<CompassDirection, number> = {
  'NORTH': 0,
  'NORTHEAST': 45,
  'EAST': 90,
  'SOUTHEAST': 135,
  'SOUTH': 180,
  'SOUTHWEST': 225,
  'WEST': 270,
  'NORTHWEST': 315,
};

export function VastuCompass({
  direction,
  size = 'md',
  showLabels = true,
  interactive = false,
  onDirectionSelect,
  className
}: VastuCompassProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-32 h-32';
      case 'lg': return 'w-64 h-64';
      default: return 'w-48 h-48';
    }
  };

  const handleDirectionClick = (dir: CompassDirection) => {
    if (interactive && onDirectionSelect) {
      onDirectionSelect(dir);
    }
  };

  return (
    <div className={cn("relative", getSizeClasses(), className)}>
      {/* Compass Outer Circle */}
      <div className="absolute inset-0 rounded-full border-2 border-muted-foreground/30" />
      
      {/* Compass Inner Circle */}
      <div className="absolute inset-8 rounded-full border border-muted-foreground/20" />
      
      {/* Center Point */}
      <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary" />
      
      {/* Compass Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Compass className="w-1/2 h-1/2 text-muted-foreground/50" />
      </div>
      
      {/* Direction Labels */}
      {(Object.entries(directionLabels) as [CompassDirection, typeof directionLabels[CompassDirection]][]).map(([dir, label]) => {
        const angle = directionAngles[dir];
        const rad = (angle * Math.PI) / 180;
        const radius = size === 'sm' ? 56 : size === 'lg' ? 120 : 88;
        const x = Math.sin(rad) * radius;
        const y = -Math.cos(rad) * radius;
        
        const isActive = direction === dir;
        const isInteractive = interactive && onDirectionSelect;
        
        return (
          <button
            key={dir}
            type="button"
            onClick={() => handleDirectionClick(dir)}
            className={cn(
              "absolute text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full",
              isActive ? 'text-primary font-bold scale-110' : 'text-muted-foreground',
              isInteractive && 'hover:text-primary hover:scale-110 cursor-pointer',
              showLabels ? 'p-2' : 'p-1'
            )}
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)'
            }}
            aria-label={`Direction: ${label.full}`}
          >
            {showLabels ? label.short : '•'}
          </button>
        );
      })}
      
      {/* Selected Direction Indicator */}
      {direction && (
        <>
          <div
            className="absolute w-1 h-8 bg-primary origin-bottom pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -100%) rotate(${directionAngles[direction]}deg)`,
              transformOrigin: 'bottom center'
            }}
          />
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary" />
              <div>
                <div className="text-sm font-semibold text-center">
                  {directionLabels[direction].full}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  {directionLabels[direction].fullHi}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Cardinal Points */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary">
        N
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary">
        S
      </div>
      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">
        W
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">
        E
      </div>
    </div>
  );
}