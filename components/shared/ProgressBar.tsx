// components/shared/ProgressBar.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CheckCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';

interface ProgressStep {
  id: string;
  label: string;
  labelHi?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

interface ProgressBarProps {
  progress: number;
  status?: 'idle' | 'processing' | 'completed' | 'error';
  message?: string;
  messageHi?: string;
  showPercentage?: boolean;
  showSteps?: boolean;
  steps?: ProgressStep[];
  variant?: 'default' | 'gradient' | 'glow' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animated?: boolean;
  language?: 'en' | 'hi';
}

const statusColors = {
  idle: 'bg-gray-500',
  processing: 'bg-gradient-to-r from-primary via-purple-500 to-primary',
  completed: 'bg-gradient-to-r from-green-500 to-emerald-500',
  error: 'bg-gradient-to-r from-red-500 to-rose-500',
};

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  progress,
  status = 'processing',
  message,
  messageHi,
  showPercentage = true,
  showSteps = false,
  steps = [],
  variant = 'gradient',
  size = 'md',
  className,
  animated = true,
  language = 'en',
}: ProgressBarProps) {
  const displayMessage = language === 'hi' && messageHi ? messageHi : message;

  return (
    <div className={cn('w-full space-y-3', className)}>
      {/* Header with message and percentage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === 'processing' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-4 w-4 text-primary" />
            </motion.div>
          )}
          {status === 'completed' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <CheckCircle className="h-4 w-4 text-green-500" />
            </motion.div>
          )}
          {status === 'error' && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          
          {displayMessage && (
            <motion.span
              key={displayMessage}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm font-medium text-foreground"
            >
              {displayMessage}
            </motion.span>
          )}
        </div>
        
        {showPercentage && (
          <motion.span
            key={progress}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={cn(
              'text-sm font-bold tabular-nums',
              status === 'completed' ? 'text-green-500' : 'text-primary'
            )}
          >
            {Math.round(progress)}%
          </motion.span>
        )}
      </div>

      {/* Progress bar */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-secondary',
          sizeClasses[size]
        )}
      >
        {/* Background glow effect */}
        {variant === 'glow' && status === 'processing' && (
          <motion.div
            className="absolute inset-0 bg-primary/20 blur-md"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
        
        {/* Progress fill */}
        <motion.div
          className={cn(
            'h-full rounded-full relative',
            statusColors[status],
            variant === 'gradient' && 'bg-gradient-to-r from-primary via-purple-500 to-pink-500',
            variant === 'glow' && 'shadow-lg shadow-primary/50'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Shimmer effect */}
          {animated && status === 'processing' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          )}
          
          {/* Pulse effect at the end */}
          {animated && status === 'processing' && progress > 0 && (
            <motion.div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>

      {/* Steps indicator */}
      {showSteps && steps.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <StepIndicator step={step} language={language} />
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-full h-0.5 mx-2',
                    step.status === 'completed' ? 'bg-green-500' : 'bg-secondary'
                  )}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StepIndicator({
  step,
  language,
}: {
  step: ProgressStep;
  language: 'en' | 'hi';
}) {
  const label = language === 'hi' && step.labelHi ? step.labelHi : step.label;

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
          step.status === 'pending' && 'bg-secondary text-muted-foreground',
          step.status === 'active' && 'bg-primary text-primary-foreground',
          step.status === 'completed' && 'bg-green-500 text-white',
          step.status === 'error' && 'bg-red-500 text-white'
        )}
        animate={step.status === 'active' ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {step.status === 'completed' ? (
          <CheckCircle className="h-4 w-4" />
        ) : step.status === 'error' ? (
          <AlertCircle className="h-4 w-4" />
        ) : step.status === 'active' ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="h-4 w-4" />
          </motion.div>
        ) : (
          <span>{step.id}</span>
        )}
      </motion.div>
      <span
        className={cn(
          'text-xs',
          step.status === 'active' ? 'text-primary font-medium' : 'text-muted-foreground'
        )}
      >
        {label}
      </span>
    </div>
  );
}

// Specialized progress bars for different use cases
export function RenderProgress({
  progress,
  stage,
  eta,
  language = 'en',
}: {
  progress: number;
  stage: 'uploading' | 'analyzing' | 'generating' | 'enhancing' | 'completed';
  eta?: number;
  language?: 'en' | 'hi';
}) {
  const stages = {
    uploading: { 
      en: 'Uploading image...', 
      hi: 'छवि अपलोड हो रही है...' 
    },
    analyzing: { 
      en: 'Analyzing room layout...', 
      hi: 'कमरे का लेआउट विश्लेषण...' 
    },
    generating: { 
      en: 'Generating design...', 
      hi: 'डिज़ाइन बनाया जा रहा है...' 
    },
    enhancing: { 
      en: 'Enhancing details...', 
      hi: 'विवरण बढ़ाया जा रहा है...' 
    },
    completed: { 
      en: 'Render complete!', 
      hi: 'रेंडर पूर्ण!' 
    },
  };

  const steps: ProgressStep[] = [
    { id: '1', label: 'Upload', labelHi: 'अपलोड', status: 'completed' },
    { 
      id: '2', 
      label: 'Analyze', 
      labelHi: 'विश्लेषण',
      status: stage === 'uploading' ? 'pending' : stage === 'analyzing' ? 'active' : 'completed'
    },
    { 
      id: '3', 
      label: 'Generate', 
      labelHi: 'निर्माण',
      status: ['uploading', 'analyzing'].includes(stage) ? 'pending' : stage === 'generating' ? 'active' : 'completed'
    },
    { 
      id: '4', 
      label: 'Enhance', 
      labelHi: 'बढ़ाना',
      status: ['uploading', 'analyzing', 'generating'].includes(stage) ? 'pending' : stage === 'enhancing' ? 'active' : 'completed'
    },
  ];

  return (
    <div className="space-y-4">
      <ProgressBar
        progress={progress}
        status={stage === 'completed' ? 'completed' : 'processing'}
        message={stages[stage][language]}
        variant="glow"
        size="lg"
        showSteps
        steps={steps}
        language={language}
      />
      
      {eta && stage !== 'completed' && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>
            {language === 'hi' 
              ? `अनुमानित समय: ~${eta} सेकंड`
              : `Estimated time: ~${eta} seconds`
            }
          </span>
        </div>
      )}
    </div>
  );
}

export function UploadProgress({
  progress,
  fileName,
  fileSize,
  language = 'en',
}: {
  progress: number;
  fileName: string;
  fileSize: string;
  language?: 'en' | 'hi';
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate max-w-[200px]">{fileName}</span>
        <span className="text-muted-foreground">{fileSize}</span>
      </div>
      <ProgressBar
        progress={progress}
        status={progress === 100 ? 'completed' : 'processing'}
        message={
          progress === 100
            ? language === 'hi' ? 'अपलोड पूर्ण' : 'Upload complete'
            : language === 'hi' ? 'अपलोड हो रहा है...' : 'Uploading...'
        }
        variant="minimal"
        size="sm"
        language={language}
      />
    </div>
  );
}

export function CircularProgress({
  progress,
  size = 120,
  strokeWidth = 8,
  showPercentage = true,
  status = 'processing',
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  status?: 'processing' | 'completed' | 'error';
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-secondary"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="50%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (
          showPercentage && (
            <motion.span
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={cn(
                'text-2xl font-bold tabular-nums',
                status === 'completed' ? 'text-green-500' : 'text-foreground'
              )}
            >
              {Math.round(progress)}%
            </motion.span>
          )
        )}
      </div>
    </div>
  );
}