// lib/constants/badges.ts
// Static badge catalog — source of truth for all badge definitions.
// Criteria are evaluated server-side by lib/badges/evaluateBadges.ts.

export interface BadgeCriteria {
  type: 'render_count' | 'distinct_styles' | 'distinct_tools' | 'streak_days' | 'vastu_scans';
  threshold: number;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  nameHi?: string;
  description: string;
  descriptionHi?: string;
  // Criteria hint shown on locked badges (e.g. "Complete 10 renders to unlock")
  criteriaHint: string;
  criteriaHintHi?: string;
  icon: string; // lucide-react icon name
  category: 'milestone' | 'exploration' | 'engagement';
  criteria: BadgeCriteria;
}

export const BADGE_CATALOG: BadgeDefinition[] = [
  // ── Milestone ────────────────────────────────────────────────────────────────
  {
    id: 'first_render',
    name: 'First Design',
    nameHi: 'पहला डिज़ाइन',
    description: 'Completed your very first AI render.',
    descriptionHi: 'आपने अपना पहला AI रेंडर पूरा किया।',
    criteriaHint: 'Complete 1 render to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 1 रेंडर पूरा करें',
    icon: 'Sparkles',
    category: 'milestone',
    criteria: { type: 'render_count', threshold: 1 },
  },
  {
    id: 'getting_started',
    name: 'Getting Started',
    nameHi: 'शुरुआत हो गई',
    description: 'Completed 10 AI renders.',
    descriptionHi: '10 AI रेंडर पूरे किए।',
    criteriaHint: 'Complete 10 renders to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 10 रेंडर पूरे करें',
    icon: 'CheckCircle2',
    category: 'milestone',
    criteria: { type: 'render_count', threshold: 10 },
  },
  {
    id: 'prolific_designer',
    name: 'Prolific Designer',
    nameHi: 'अनुभवी डिज़ाइनर',
    description: 'Completed 25 AI renders.',
    descriptionHi: '25 AI रेंडर पूरे किए।',
    criteriaHint: 'Complete 25 renders to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 25 रेंडर पूरे करें',
    icon: 'TrendingUp',
    category: 'milestone',
    criteria: { type: 'render_count', threshold: 25 },
  },
  {
    id: 'design_veteran',
    name: 'Design Veteran',
    nameHi: 'डिज़ाइन दिग्गज',
    description: 'Completed 50 AI renders.',
    descriptionHi: '50 AI रेंडर पूरे किए।',
    criteriaHint: 'Complete 50 renders to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 50 रेंडर पूरे करें',
    icon: 'Star',
    category: 'milestone',
    criteria: { type: 'render_count', threshold: 50 },
  },
  {
    id: 'power_user',
    name: 'Power User',
    nameHi: 'पावर यूज़र',
    description: 'Completed 100 AI renders.',
    descriptionHi: '100 AI रेंडर पूरे किए।',
    criteriaHint: 'Complete 100 renders to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 100 रेंडर पूरे करें',
    icon: 'Crown',
    category: 'milestone',
    criteria: { type: 'render_count', threshold: 100 },
  },
  // ── Exploration ───────────────────────────────────────────────────────────────
  {
    id: 'style_explorer',
    name: 'Style Explorer',
    nameHi: 'स्टाइल खोजकर्ता',
    description: 'Used 5 different design styles.',
    descriptionHi: '5 अलग-अलग डिज़ाइन स्टाइल इस्तेमाल किए।',
    criteriaHint: 'Use 5 distinct styles to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 5 अलग स्टाइल इस्तेमाल करें',
    icon: 'Palette',
    category: 'exploration',
    criteria: { type: 'distinct_styles', threshold: 5 },
  },
  {
    id: 'tool_master',
    name: 'Tool Master',
    nameHi: 'टूल मास्टर',
    description: 'Used 5 different AI tools.',
    descriptionHi: '5 अलग-अलग AI टूल इस्तेमाल किए।',
    criteriaHint: 'Use 5 distinct AI tools to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 5 अलग AI टूल इस्तेमाल करें',
    icon: 'Wand2',
    category: 'exploration',
    criteria: { type: 'distinct_tools', threshold: 5 },
  },
  {
    id: 'vastu_curious',
    name: 'Vastu Curious',
    nameHi: 'वास्तु जिज्ञासु',
    description: 'Ran your first Vastu analysis.',
    descriptionHi: 'पहला वास्तु विश्लेषण चलाया।',
    criteriaHint: 'Complete 1 Vastu analysis to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 1 वास्तु विश्लेषण करें',
    icon: 'Compass',
    category: 'exploration',
    criteria: { type: 'vastu_scans', threshold: 1 },
  },
  // ── Engagement ────────────────────────────────────────────────────────────────
  {
    id: 'week_streak',
    name: 'On a Roll',
    nameHi: 'लगातार जारी',
    description: 'Maintained a 7-day activity streak.',
    descriptionHi: '7 दिन की लगातार गतिविधि बनाए रखी।',
    criteriaHint: 'Maintain a 7-day streak to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 7-दिन की स्ट्रीक बनाए रखें',
    icon: 'Flame',
    category: 'engagement',
    criteria: { type: 'streak_days', threshold: 7 },
  },
  {
    id: 'design_fanatic',
    name: 'Design Fanatic',
    nameHi: 'डिज़ाइन दीवाना',
    description: 'Maintained a 30-day activity streak.',
    descriptionHi: '30 दिन की लगातार गतिविधि बनाए रखी।',
    criteriaHint: 'Maintain a 30-day streak to unlock',
    criteriaHintHi: 'अनलॉक करने के लिए 30-दिन की स्ट्रीक बनाए रखें',
    icon: 'Zap',
    category: 'engagement',
    criteria: { type: 'streak_days', threshold: 30 },
  },
];

export const BADGE_MAP = new Map<string, BadgeDefinition>(
  BADGE_CATALOG.map(b => [b.id, b])
);
