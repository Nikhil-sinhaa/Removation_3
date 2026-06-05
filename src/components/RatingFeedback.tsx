'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingFeedbackProps {
  projectId: string;
  feature: string; // e.g. 'room-3d', 'room-changer'
  onSubmitted?: () => void;
}

export default function RatingFeedback({
  projectId,
  feature,
  onSubmitted,
}: RatingFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);

    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          feature,
          rating,
          comment,
        }),
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-gray-800 rounded-xl p-4 text-center border border-gray-700">
        <div className="text-2xl mb-1">🙏</div>
        <p className="text-white font-medium text-sm">
          Thank you for your feedback!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <p className="text-white font-medium text-sm mb-3 text-center">
        How was your 3D room experience?
      </p>

      {/* Stars */}
      <div className="flex justify-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={32}
              className={
                star <= (hovered || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600'
              }
            />
          </button>
        ))}
      </div>

      {/* Rating label */}
      {(hovered || rating) > 0 && (
        <p className="text-center text-sm text-gray-400 mb-3">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][
            hovered || rating
          ]}
        </p>
      )}

      {/* Optional comment */}
      {rating > 0 && (
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tell us more (optional)..."
          rows={2}
          className="w-full bg-gray-900 border border-gray-600 text-white text-sm rounded-lg px-3 py-2 mb-3 resize-none placeholder-gray-500 focus:outline-none focus:border-purple-500"
        />
      )}

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || submitting}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-2 rounded-lg transition-colors text-sm"
      >
        {submitting ? 'Submitting...' : 'Submit Feedback'}
      </button>
    </div>
  );
}
