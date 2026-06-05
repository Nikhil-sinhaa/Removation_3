// lib/constants/feedbackTags.ts
// Kept in a standalone constants file so it can be safely imported by
// both server-side code (Render.ts mongoose model) and client components
// without pulling mongoose into the browser bundle.

export const FEEDBACK_TAGS = [
  // Positive
  'great_quality',
  'accurate_style',
  'realistic_lighting',
  'good_colors',
  'loved_it',
  // Negative — quality
  'blurry',
  'low_quality',
  'artifacts',
  'wrong_colors',
  // Negative — accuracy
  'wrong_style',
  'ignored_furniture',
  'lost_room_structure',
  'too_much_change',
  'too_little_change',
  // Negative — specific
  'bad_lighting',
  'unrealistic',
  'weird_textures',
] as const;

export type FeedbackTag = typeof FEEDBACK_TAGS[number];
