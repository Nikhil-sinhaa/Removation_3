'use client';

import { useState } from 'react';
import { Star, CheckCircle, Loader2, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useRenderFeedback } from '@/hooks/useRenderFeedback';
import { FEEDBACK_TAGS } from '@/lib/constants/feedbackTags';
import { StarDisplay } from '@/components/shared/StarDisplay';

// Human-readable labels for each tag
const TAG_LABELS: Record<string, string> = {
  great_quality: '✨ Great quality',
  accurate_style: '🎨 Accurate style',
  realistic_lighting: '💡 Realistic lighting',
  good_colors: '🎨 Good colors',
  loved_it: '❤️ Loved it',
  blurry: '🌫️ Blurry',
  low_quality: '📉 Low quality',
  artifacts: '🔧 Has artifacts',
  wrong_colors: '🎨 Wrong colors',
  wrong_style: '❌ Wrong style',
  ignored_furniture: '🛋️ Ignored furniture',
  lost_room_structure: '🏠 Lost room structure',
  too_much_change: '↕️ Too much change',
  too_little_change: '↕️ Too little change',
  bad_lighting: '💡 Bad lighting',
  unrealistic: '🤔 Unrealistic',
  weird_textures: '🪨 Weird textures',
};

const POSITIVE_TAGS = ['great_quality', 'accurate_style', 'realistic_lighting', 'good_colors', 'loved_it'];
const NEGATIVE_TAGS = FEEDBACK_TAGS.filter((t) => !POSITIVE_TAGS.includes(t));

function getTagsForRating(rating: number): readonly string[] {
  if (rating >= 4) return POSITIVE_TAGS;
  if (rating <= 2) return NEGATIVE_TAGS;
  return FEEDBACK_TAGS;
}

interface RenderFeedbackProps {
  renderId: string;
  featureLabel?: string;
  initialRating?: number;
  initialTags?: string[];
  initialComment?: string;
  onFeedbackSubmitted?: (rating: number) => void;
  variant?: 'inline' | 'modal';
  className?: string;
}

// Inner form — shared between both variants
function FeedbackForm({
  renderId,
  featureLabel,
  initialRating,
  initialTags,
  initialComment,
  onFeedbackSubmitted,
  onClose,
}: RenderFeedbackProps & { onClose?: () => void }) {
  const { toast } = useToast();
  const { submitFeedback, isSubmitting } = useRenderFeedback({ renderId });

  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(initialRating ?? null);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags ?? []);
  const [comment, setComment] = useState(initialComment ?? '');
  const [showFullForm, setShowFullForm] = useState(initialRating != null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const activeStar = hoveredStar ?? selectedRating;
  const visibleTags = selectedRating != null ? getTagsForRating(selectedRating) : [];

  const handleStarClick = (n: number) => {
    setSelectedRating(n);
    setShowFullForm(true);
    // Reset tags if rating category changed
    if (selectedRating != null) {
      const oldTags = getTagsForRating(selectedRating);
      const newTags = getTagsForRating(n);
      const sameCategory =
        (n >= 4 && selectedRating >= 4) ||
        (n <= 2 && selectedRating <= 2) ||
        (n === 3 && selectedRating === 3);
      if (!sameCategory) {
        setSelectedTags((prev) => prev.filter((t) => newTags.includes(t)));
      }
    }
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 3) return [...prev.slice(1), tag];
      return [...prev, tag];
    });
  };

  const handleSubmit = async () => {
    if (selectedRating == null) return;

    // Optimistic: show success immediately
    setIsSubmitted(true);
    onFeedbackSubmitted?.(selectedRating);

    const ok = await submitFeedback({
      rating: selectedRating,
      feedbackTags: selectedTags,
      feedbackComment: comment,
    });

    if (!ok) {
      setIsSubmitted(false);
      toast({
        title: 'Failed to submit feedback. Please try again.',
        variant: 'destructive',
      });
    } else {
      onClose?.();
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-2 py-3 text-center">
        <CheckCircle className="w-8 h-8 text-green-500" />
        <p className="font-medium text-sm">Thanks for your feedback!</p>
        <p className="text-muted-foreground text-sm">Your rating helps us improve</p>
        {selectedRating != null && (
          <StarDisplay rating={selectedRating} size="md" showEmpty />
        )}
        <button
          onClick={() => setIsSubmitted(false)}
          className="text-xs text-muted-foreground underline mt-1"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Star row */}
      <div role="group" aria-label="Rating" className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            aria-label={`Rate ${n} out of 5 stars`}
            onMouseEnter={() => setHoveredStar(n)}
            onMouseLeave={() => setHoveredStar(null)}
            onClick={() => handleStarClick(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'w-6 h-6 transition-colors',
                n <= (activeStar ?? 0)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/50'
              )}
            />
          </button>
        ))}
        {selectedRating == null && (
          <span className="text-sm text-muted-foreground ml-2">Rate this result</span>
        )}
      </div>

      {/* Tags + comment — slide in after star click */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          showFullForm ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        {/* Tag selector */}
        {visibleTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {visibleTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className={cn(
                  'px-3 py-1 rounded-full border text-xs transition-colors',
                  selectedTags.includes(tag)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                {TAG_LABELS[tag] ?? tag}
              </button>
            ))}
          </div>
        )}

        {/* Comment box (only for 1-3 stars) */}
        {selectedRating != null && selectedRating <= 3 && (
          <div className="mb-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 500))}
              placeholder="Tell us more (optional)..."
              rows={3}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {comment.length} / 500
            </p>
          </div>
        )}

        {/* Submit button */}
        <Button
          size="sm"
          disabled={selectedRating == null || isSubmitting}
          onClick={handleSubmit}
          className="w-full"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Submit Feedback
        </Button>
      </div>
    </div>
  );
}

// Main exported component
export function RenderFeedback({
  renderId,
  featureLabel,
  initialRating,
  initialTags,
  initialComment,
  onFeedbackSubmitted,
  variant = 'inline',
  className,
}: RenderFeedbackProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!renderId) return null;

  if (variant === 'modal') {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className={className}
        >
          <ThumbsUp className="w-4 h-4 mr-1.5" />
          Rate
        </Button>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>
                How was your {featureLabel ?? 'result'}?
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Your feedback helps us improve the AI
              </p>
            </DialogHeader>

            <FeedbackForm
              renderId={renderId}
              featureLabel={featureLabel}
              initialRating={initialRating}
              initialTags={initialTags}
              initialComment={initialComment}
              onFeedbackSubmitted={(rating) => {
                onFeedbackSubmitted?.(rating);
              }}
              onClose={() => setIsModalOpen(false)}
            />

            <DialogFooter>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // inline variant
  return (
    <div className={cn('border-t border-border pt-3 mt-3', className)}>
      <FeedbackForm
        renderId={renderId}
        featureLabel={featureLabel}
        initialRating={initialRating}
        initialTags={initialTags}
        initialComment={initialComment}
        onFeedbackSubmitted={onFeedbackSubmitted}
      />
    </div>
  );
}

export default RenderFeedback;
