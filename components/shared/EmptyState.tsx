// components/shared/EmptyState.tsx
'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FolderOpen,
  Image,
  Sparkles,
  Search,
  Heart,
  Clock,
  Plus,
  Upload,
  Palette,
  Home,
  Compass,
  CreditCard,
  FileQuestion,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';

type EmptyStateType =
  | 'projects'
  | 'renders'
  | 'search'
  | 'favorites'
  | 'history'
  | 'no-credits'
  | 'upload'
  | 'styles'
  | 'vastu'
  | 'cost'
  | 'generic';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  titleHi?: string;
  description?: string;
  descriptionHi?: string;
  actionLabel?: string;
  actionLabelHi?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  showIllustration?: boolean;
  language?: 'en' | 'hi';
  className?: string;
}

const emptyStateConfig: Record<EmptyStateType, {
  icon: LucideIcon;
  title: { en: string; hi: string };
  description: { en: string; hi: string };
  action?: { label: { en: string; hi: string }; href?: string };
}> = {
  projects: {
    icon: FolderOpen,
    title: {
      en: 'No projects yet',
      hi: 'अभी तक कोई प्रोजेक्ट नहीं',
    },
    description: {
      en: 'Create your first project to start transforming spaces with AI.',
      hi: 'AI के साथ स्थानों को बदलना शुरू करने के लिए अपना पहला प्रोजेक्ट बनाएं।',
    },
    action: {
      label: { en: 'Create Project', hi: 'प्रोजेक्ट बनाएं' },
      href: '/dashboard',
    },
  },
  renders: {
    icon: Image,
    title: {
      en: 'No renders yet',
      hi: 'अभी तक कोई रेंडर नहीं',
    },
    description: {
      en: 'Upload an image and select a style to generate your first design.',
      hi: 'अपना पहला डिज़ाइन जेनरेट करने के लिए एक छवि अपलोड करें और एक शैली चुनें।',
    },
    action: {
      label: { en: 'Upload Image', hi: 'छवि अपलोड करें' },
    },
  },
  search: {
    icon: Search,
    title: {
      en: 'No results found',
      hi: 'कोई परिणाम नहीं मिला',
    },
    description: {
      en: 'Try adjusting your search or filters to find what you\'re looking for.',
      hi: 'जो आप खोज रहे हैं उसे खोजने के लिए अपनी खोज या फ़िल्टर समायोजित करने का प्रयास करें।',
    },
  },
  favorites: {
    icon: Heart,
    title: {
      en: 'No favorites yet',
      hi: 'अभी तक कोई पसंदीदा नहीं',
    },
    description: {
      en: 'Save your favorite renders to access them quickly later.',
      hi: 'बाद में जल्दी से एक्सेस करने के लिए अपने पसंदीदा रेंडर सहेजें।',
    },
    action: {
      label: { en: 'Browse Renders', hi: 'रेंडर ब्राउज़ करें' },
      href: '/projects',
    },
  },
  history: {
    icon: Clock,
    title: {
      en: 'No history yet',
      hi: 'अभी तक कोई इतिहास नहीं',
    },
    description: {
      en: 'Your generation history will appear here.',
      hi: 'आपका जनरेशन इतिहास यहां दिखाई देगा।',
    },
  },
  'no-credits': {
    icon: CreditCard,
    title: {
      en: 'No credits remaining',
      hi: 'कोई क्रेडिट शेष नहीं',
    },
    description: {
      en: 'Upgrade your plan to continue generating amazing designs.',
      hi: 'अद्भुत डिज़ाइन बनाना जारी रखने के लिए अपनी योजना अपग्रेड करें।',
    },
    action: {
      label: { en: 'Upgrade Plan', hi: 'योजना अपग्रेड करें' },
      href: '/pricing',
    },
  },
  upload: {
    icon: Upload,
    title: {
      en: 'Upload an image to get started',
      hi: 'शुरू करने के लिए एक छवि अपलोड करें',
    },
    description: {
      en: 'Drag and drop or click to upload your room photo.',
      hi: 'अपनी कमरे की फोटो अपलोड करने के लिए ड्रैग और ड्रॉप करें या क्लिक करें।',
    },
  },
  styles: {
    icon: Palette,
    title: {
      en: 'Select a style',
      hi: 'एक शैली चुनें',
    },
    description: {
      en: 'Choose from 400+ design styles to transform your space.',
      hi: 'अपने स्थान को बदलने के लिए 400+ डिज़ाइन शैलियों में से चुनें।',
    },
  },
  vastu: {
    icon: Compass,
    title: {
      en: 'No Vastu analysis yet',
      hi: 'अभी तक कोई वास्तु विश्लेषण नहीं',
    },
    description: {
      en: 'Upload a floor plan to get Vastu Shastra recommendations.',
      hi: 'वास्तु शास्त्र की सिफारिशें प्राप्त करने के लिए एक फ्लोर प्लान अपलोड करें।',
    },
  },
  cost: {
    icon: Home,
    title: {
      en: 'No cost estimate yet',
      hi: 'अभी तक कोई लागत अनुमान नहीं',
    },
    description: {
      en: 'Select materials and options to get a renovation cost estimate.',
      hi: 'नवीनीकरण लागत अनुमान प्राप्त करने के लिए सामग्री और विकल्प चुनें।',
    },
  },
  generic: {
    icon: FileQuestion,
    title: {
      en: 'Nothing here yet',
      hi: 'यहाँ अभी कुछ नहीं है',
    },
    description: {
      en: 'This section is empty for now.',
      hi: 'यह अनुभाग अभी खाली है।',
    },
  },
};

export function EmptyState({
  type = 'generic',
  title,
  titleHi,
  description,
  descriptionHi,
  actionLabel,
  actionLabelHi,
  actionHref,
  onAction,
  icon,
  showIllustration = true,
  language = 'en',
  className,
}: EmptyStateProps) {
  const config = emptyStateConfig[type];
  const Icon = icon || config.icon;

  const displayTitle = title || config.title[language];
  const displayDescription = description || config.description[language];
  const displayActionLabel = actionLabel || config.action?.label[language];
  const displayActionHref = actionHref || config.action?.href;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {/* Illustration / Icon */}
      {showIllustration && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="relative mb-6"
        >
          {/* Background glow */}
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
          
          {/* Icon container */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
            <motion.div
              animate={{
                y: [0, -4, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Icon className="h-10 w-10 text-primary" />
            </motion.div>
          </div>

          {/* Decorative elements */}
          <motion.div
            className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary/30"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-purple-500/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
          />
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-lg font-semibold text-foreground mb-2"
      >
        {displayTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-sm text-muted-foreground max-w-sm mb-6"
      >
        {displayDescription}
      </motion.p>

      {/* Action button */}
      {(displayActionLabel || onAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {displayActionHref ? (
            <Link href={displayActionHref}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {displayActionLabel}
              </Button>
            </Link>
          ) : (
            <Button onClick={onAction} className="gap-2">
              <Plus className="h-4 w-4" />
              {displayActionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Specialized empty states
export function NoProjectsEmpty({ language = 'en' }: { language?: 'en' | 'hi' }) {
  return (
    <EmptyState
      type="projects"
      language={language}
      showIllustration
    />
  );
}

export function NoRendersEmpty({
  onUpload,
  language = 'en',
}: {
  onUpload: () => void;
  language?: 'en' | 'hi';
}) {
  return (
    <EmptyState
      type="renders"
      language={language}
      onAction={onUpload}
      showIllustration
    />
  );
}

export function NoCreditsEmpty({ language = 'en' }: { language?: 'en' | 'hi' }) {
  return (
    <EmptyState
      type="no-credits"
      language={language}
      showIllustration
    />
  );
}

export function SearchEmpty({
  query,
  language = 'en',
}: {
  query: string;
  language?: 'en' | 'hi';
}) {
  return (
    <EmptyState
      type="search"
      description={
        language === 'hi'
          ? `"${query}" के लिए कोई परिणाम नहीं मिला`
          : `No results found for "${query}"`
      }
      language={language}
      showIllustration
    />
  );
}