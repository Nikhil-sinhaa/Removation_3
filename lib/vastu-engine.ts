// lib/vastu-engine.ts

import VASTU_RULES, { VASTU_DIRECTIONS } from '@/constants/vastu-rules';
interface VastuAnalysisParams {
    roomType: string;
    direction: string;
    dimensions?: {
        length: number;
        width: number;
        height?: number;
    };
    features?: string[];
    imageUrl?: string;
}

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const DIR_TO_COMPASS: Record<string, string> = {
    north: 'NORTH', northeast: 'NORTHEAST', east: 'EAST', southeast: 'SOUTHEAST',
    south: 'SOUTH', southwest: 'SOUTHWEST', west: 'WEST', northwest: 'NORTHWEST',
};

// Maps constants/vastu-rules.ts category names → types/vastu.ts VastuCategory names
const CATEGORY_NAME_MAP: Record<string, string> = {
    color: 'colors',
    placement: 'furniture',
    pooja: 'puja',
    mirror: 'mirrors',
    general: 'elements',
    staircase: 'storage',
    element: 'elements',
};

// Maps violation type strings → VastuSuggestionType values
const SUGGESTION_TYPE_MAP: Record<string, string> = {
    direction: 'reorient',
    placement: 'relocate',
    color: 'color-change',
    element: 'add',
};

export interface VastuRecommendation {
    category: string;
    severity: 'critical' | 'moderate' | 'minor';
    issue: string;
    recommendation: string;
    priority: number;
}

interface VastuScore {
    overall: number;
    categories: {
        direction: number;
        placement: number;
        elements: number;
        energy: number;
    };
}

export interface VastuViolation {
    type: string;
    severity: 'critical' | 'moderate' | 'minor';
    description: string;
    impact: string;
    remedy: string;
    id?: string;
    // How this violation was triggered
    source?: 'direction' | 'detection';
}

export interface VastuCompliance {
    aspect: string;
    status: 'excellent' | 'good' | 'acceptable';
    description: string;
}

export interface ElementBalance {
    fire: number;
    water: number;
    earth: number;
    air: number;
    space: number;
}

export interface DirectionalAnalysis {
    north: { score: number; notes: string };
    south: { score: number; notes: string };
    east: { score: number; notes: string };
    west: { score: number; notes: string };
    northeast: { score: number; notes: string };
    northwest: { score: number; notes: string };
    southeast: { score: number; notes: string };
    southwest: { score: number; notes: string };
}

export interface VastuAnalysisResult {
    overallScore: {
        value: number;
        grade: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
        label: string;
        labelHi: string;
        description: string;
        descriptionHi: string;
    };
    violations: VastuViolation[];
    compliances: VastuCompliance[];
    elementBalance: ElementBalance;
    directionalAnalysis: DirectionalAnalysis;
    recommendations: VastuRecommendation[];
    detailedReport: string;
    categories: any[];
    roomDirection: string;
    confidence: number;
    processingTime: number;
    suggestions: any[];
    ruleEvaluations: any[];
    positiveAspects: any[];
    autoFixAvailable: boolean;
    detectedElements: any[];
    compass?: any;
}

export function analyzeVastu(params: any): VastuAnalysisResult {
    const { roomType, direction, entranceDirection, floorLevel, imageAnalysis, features = [], language = 'en' } = params;

    const violations: VastuViolation[] = [];
    const compliances: VastuCompliance[] = [];
    const recommendations: VastuRecommendation[] = [];
    const ruleEvaluations: any[] = [];
    const positiveAspects: any[] = [];

    // ─── Normalize room type for rule matching ────────────────────
    const roomTypeMap: Record<string, string> = {
        bedroom: 'bedroom', living_room: 'living-room', living: 'living-room',
        kitchen: 'kitchen', bathroom: 'bathroom', pooja_room: 'pooja-room',
        pooja: 'pooja-room', study: 'study', dining: 'dining', foyer: 'foyer',
        entrance: 'foyer', balcony: 'balcony', outdoor: 'outdoor',
    };
    const normalizedRoomType = roomTypeMap[roomType] || roomType;
    const normalizedDirection = direction?.toLowerCase() || '';
    const featureSet = new Set((features || []).map((f: string) => f.toLowerCase()));

    // ─── Evaluate all 120+ rules from VASTU_RULES ─────────────────
    const applicableRules = VASTU_RULES.filter(rule =>
        rule.roomTypes.some(rt =>
            rt === normalizedRoomType ||
            rt === roomType ||
            // Also include general rules that apply broadly
            (rule.category === 'general' && ['living-room', 'bedroom', 'kitchen', 'bathroom'].includes(normalizedRoomType))
        )
    );

    let totalApplicablePoints = 0;
    let deductedPoints = 0;
    let positivePoints = 0;
    let positiveMatches = 0;

    for (const rule of applicableRules) {
        // Positive rules never contribute to the penalty budget
        if (!rule.isPositive) {
            totalApplicablePoints += rule.points;
        }
        const evaluation: any = {
            ruleId: rule.id,
            title: language === 'hi' ? rule.titleHi : rule.title,
            category: rule.category,
            severity: rule.severity,
            points: rule.points,
            passed: true,
            reason: '',
        };

        let violated = false;
        let violationSource: 'direction' | 'detection' | undefined = undefined;

        // Direction-based rules: check if the room direction violates
        if (rule.direction && normalizedDirection) {
            const ruleDir = rule.direction;
            // Rules that say "should be in X direction" — violated if room is NOT in that direction
            if (rule.title.toLowerCase().includes('should be in') ||
                rule.title.toLowerCase().includes('should face')) {
                if (normalizedDirection !== ruleDir) {
                    violated = true;
                    violationSource = 'direction';
                    evaluation.reason = `Room is in ${direction}, but should be in ${ruleDir}`;
                }
            }
            // Rules that say "avoid X direction" — violated if room IS in that direction
            if (rule.title.toLowerCase().includes('avoid') && normalizedDirection === ruleDir) {
                violated = true;
                violationSource = 'direction';
                evaluation.reason = `Room is in ${direction}, which should be avoided`;
            }
        }

        // Keyword-based heuristic: check detected features against rule keywords
        if (!violated && featureSet.size > 0) {
            const negativeKeywords = ['avoid', 'no ', 'not ', 'never'];
            const isNegativeRule = negativeKeywords.some(kw => rule.title.toLowerCase().includes(kw));

            if (rule.requireAllKeywords) {
                // AND logic: every keyword must be present in featureSet before the rule fires.
                // Rules with unreachable keywords (beam, alignment, adjacent, above/below) will
                // correctly stay silent until a detection pass that produces those keywords exists.
                const allPresent = rule.keywords.every(kw => featureSet.has(kw.toLowerCase()));
                if (allPresent && isNegativeRule) {
                    violated = true;
                    violationSource = 'detection';
                    evaluation.reason = `Detected all of [${rule.keywords.join(', ')}] which violates: ${rule.title}`;
                }
            } else {
                // OR logic (default): any single keyword match triggers the rule.
                for (const keyword of rule.keywords) {
                    if (featureSet.has(keyword.toLowerCase())) {
                        if (isNegativeRule) {
                            violated = true;
                            violationSource = 'detection';
                            evaluation.reason = `Detected "${keyword}" which violates: ${rule.title}`;
                        } else {
                            evaluation.passed = true;
                            if (rule.isPositive) {
                                positivePoints += rule.points;
                                positiveMatches++;
                                positiveAspects.push(language === 'hi' ? rule.titleHi : rule.title);
                            }
                        }
                        break;
                    }
                }
            }
        }

        // Suggestion-only rules (0 points) are never violations
        if (rule.severity === 'suggestion') violated = false;

        if (violated) {
            evaluation.passed = false;
            evaluation.source = violationSource;
            deductedPoints += rule.points;

            violations.push({
                type: rule.category,
                severity: rule.severity === 'critical' ? 'critical' : rule.severity === 'major' ? 'moderate' : 'minor',
                description: language === 'hi' ? rule.descriptionHi : rule.description,
                impact: language === 'hi' ? rule.descriptionHi : rule.description,
                remedy: language === 'hi' ? rule.remedyHi : rule.remedy,
                id: generateId('viol'),
                source: violationSource,
            });

            recommendations.push({
                category: rule.category,
                severity: rule.severity === 'critical' ? 'critical' : rule.severity === 'major' ? 'moderate' : 'minor',
                issue: language === 'hi' ? rule.titleHi : rule.title,
                recommendation: language === 'hi' ? rule.remedyHi : rule.remedy,
                priority: rule.severity === 'critical' ? 1 : rule.severity === 'major' ? 2 : 3,
            });
        } else if (rule.points > 0 && !rule.isPositive) {
            // Standard non-violated rule: track as positive aspect and direction compliance.
            // Positive rules (isPositive: true) are handled in the keyword match branch above —
            // they only add to positiveAspects when the keyword is actually detected.
            positiveAspects.push(language === 'hi' ? rule.titleHi : rule.title);

            if (rule.direction && normalizedDirection === rule.direction) {
                compliances.push({
                    aspect: language === 'hi' ? rule.titleHi : rule.title,
                    status: 'excellent',
                    description: language === 'hi' ? rule.descriptionHi : rule.description,
                });
            }
        }

        evaluation.status = evaluation.passed ? 'passed' : 'failed';
        ruleEvaluations.push(evaluation);
    }

    // ─── Compute real scores from rule evaluations ─────────────────
    const maxPoints = Math.max(totalApplicablePoints, 1); // prevent div by 0

    // Capped fill-back: positive detections can only offset existing deductions,
    // not push above the no-violation ceiling of 100.
    // For zero-violation rooms cappedPositive is always 0 by definition — this is
    // expected; the uncapped positiveBonus below handles that case.
    const cappedPositive = Math.min(positivePoints, deductedPoints);
    const ruleBasedScore = Math.min(100, Math.round(
        ((maxPoints - deductedPoints + cappedPositive) / maxPoints) * 100
    ));

    // Direction score (legacy compatibility)
    const idealDirections: Record<string, string[]> = {
        bedroom: ['south', 'southwest', 'west'],
        kitchen: ['southeast', 'northwest'],
        'living-room': ['north', 'northeast', 'east'],
        living_room: ['north', 'northeast', 'east'],
        study: ['north', 'northeast', 'east'],
        bathroom: ['west', 'northwest'],
        'pooja-room': ['northeast', 'north', 'east'],
        dining: ['west', 'east'],
        foyer: ['north', 'northeast', 'east'],
    };
    const ideal = idealDirections[normalizedRoomType] || idealDirections[roomType] || [];
    const directionScore = normalizedDirection && ideal.includes(normalizedDirection) ? 95 : normalizedDirection ? 55 : 70;

    if (normalizedDirection && ideal.includes(normalizedDirection)) {
        compliances.push({
            aspect: 'Room Direction',
            status: 'excellent',
            description: `${roomType} is in an ideal Vastu direction (${direction})`,
        });
    } else if (normalizedDirection) {
        if (!violations.some(v => v.type === 'direction')) {
            violations.push({
                type: 'direction',
                severity: 'moderate',
                description: `${roomType} is in ${direction} direction`,
                impact: 'May affect energy flow and harmony',
                remedy: `Ideal directions for ${roomType}: ${ideal.join(', ')}. Use colors and elements to balance.`,
                id: generateId('viol'),
                source: 'direction' as const,
            });
        }
    }

    // Weighted overall: 40% rule-based + 30% direction + 15% placement + 15% energy
    const placementScore = compliances.length > 0 ? 80 : 65;
    const energyScore = violations.filter(v => v.severity === 'critical').length === 0 ? 80 : 50;
    const baseOverall = Math.round(
        ruleBasedScore * 0.40 + directionScore * 0.30 + placementScore * 0.15 + energyScore * 0.15
    );
    // Uncapped bonus: +3 per positive element detected, max +8 total.
    // This creates a visible delta even in zero-violation rooms where cappedPositive = 0.
    // A room with a detected plant scores 3 pts higher than an identical unanalyzed room.
    const positiveBonus = Math.min(8, positiveMatches * 3);
    const overall = Math.min(100, baseOverall + positiveBonus);

    let rating: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
    if (overall >= 85) rating = 'excellent';
    else if (overall >= 70) rating = 'good';
    else if (overall >= 50) rating = 'average';
    else if (overall >= 30) rating = 'poor';
    else rating = 'critical';

    // ─── Element balance (based on room type + direction) ──────────
    const dirInfo = normalizedDirection ? VASTU_DIRECTIONS.find(d => d.direction === normalizedDirection) : undefined;
    const elementBalance: ElementBalance = {
        fire: normalizedRoomType === 'kitchen' ? 85 : (dirInfo?.element === 'fire' ? 70 : 45),
        water: normalizedRoomType === 'bathroom' ? 85 : (dirInfo?.element === 'water' ? 70 : 40),
        earth: dirInfo?.element === 'earth' ? 75 : 55,
        air: dirInfo?.element === 'air' ? 75 : 60,
        space: normalizedDirection === 'center' ? 80 : 60,
    };

    // ─── Directional analysis ──────────────────────────────────────
    const directionalAnalysis: DirectionalAnalysis = {} as any;
    for (const di of VASTU_DIRECTIONS) {
        if (di.direction === 'center') continue;
        const isIdeal = ideal.includes(di.direction);
        const isCurrent = normalizedDirection === di.direction;
        (directionalAnalysis as any)[di.direction] = {
            score: isIdeal ? 90 : isCurrent ? 70 : 65,
            notes: `${di.name} — ${language === 'hi' ? di.deityHi : di.deity}. ${isIdeal ? 'Ideal for this room.' : `Suitable for: ${di.suitable.join(', ')}`}`,
        };
    }

    // ─── Build compass from VASTU_DIRECTIONS + directional scores ─
    const compassDir = direction ? direction.toUpperCase() : 'NORTH';
    const compass = {
        propertyFacing: compassDir,
        entranceFacing: compassDir,
        zones: VASTU_DIRECTIONS.filter(d => d.direction !== 'center').map(d => {
            const da = (directionalAnalysis as any)[d.direction];
            const score: number = da?.score ?? 65;
            const zoneStatus = score >= 70 ? 'compliant' : score >= 40 ? 'partial' : 'non-compliant';
            return {
                direction: DIR_TO_COMPASS[d.direction],
                name: d.name,
                nameHi: d.nameHi,
                deity: d.deity,
                deityHi: d.deityHi,
                element: d.element,
                idealFor: d.suitable,
                avoidFor: d.avoid,
                colors: d.color,
                status: zoneStatus,
            };
        }),
    };

    // ─── Auto-fix availability ─────────────────────────────────────
    const autoFixAvailable = violations.some(v =>
        v.type === 'color' || v.type === 'lighting' || v.type === 'plants'
    );

    // ─── Generate suggestions from actual violations ───────────────
    const suggestions = violations.slice(0, 5).map((v, i) => ({
        id: generateId('sug'),
        type: SUGGESTION_TYPE_MAP[v.type] ?? 'remedy',
        priority: v.severity === 'critical' ? 'critical' as const : v.severity === 'moderate' ? 'high' as const : 'medium' as const,
        title: v.description.slice(0, 60),
        description: v.remedy,
        currentState: v.description,
        suggestedState: v.remedy,
        scoreImpact: v.severity === 'critical' ? 15 : v.severity === 'moderate' ? 10 : 5,
        difficulty: (v.type === 'color' || v.type === 'plants') ? 'easy' as const : 'moderate' as const,
        canAutoFix: v.type === 'color' || v.type === 'lighting',
    }));

    // ─── Detailed report ───────────────────────────────────────────
    const detailedReport = `
Vastu Analysis Report for ${roomType}

Overall Score: ${overall}/100 (${rating})
Rules Evaluated: ${ruleEvaluations.length} | Violations: ${violations.length} | Compliances: ${compliances.length}

Direction Analysis:
${normalizedDirection ? `The ${roomType} is facing ${direction}.` : 'Direction not specified.'}
${normalizedDirection && ideal.includes(normalizedDirection)
            ? `This is an ideal direction for a ${roomType}.`
            : `Ideal directions would be: ${ideal.join(', ')}.`}

Compliances (${compliances.length}):
${compliances.map(c => `- ${c.aspect}: ${c.description}`).join('\n')}

${violations.length > 0 ? `Violations (${violations.length}):\n${violations.map(v => `- [${v.severity.toUpperCase()}] ${v.description}\n  Remedy: ${v.remedy}`).join('\n\n')}` : 'No violations detected.'}

Element Balance:
- Fire: ${elementBalance.fire}% | Water: ${elementBalance.water}% | Earth: ${elementBalance.earth}%
- Air: ${elementBalance.air}% | Space: ${elementBalance.space}%

Recommendations:
${recommendations.length > 0 ? recommendations.map(r => `- [${r.severity}] ${r.issue}\n  → ${r.recommendation}`).join('\n') : 'Continue maintaining the current setup.'}
    `.trim();

    // ─── Build per-category analysis from ruleEvaluations ─────────
    const catDataMap = new Map<string, {
        totalPoints: number; earnedPoints: number;
        findings: string[]; findingsHi: string[]; worstSeverity: string;
    }>();
    for (const ev of ruleEvaluations) {
        const cat = CATEGORY_NAME_MAP[ev.category] || ev.category || 'elements';
        if (!catDataMap.has(cat)) {
            catDataMap.set(cat, { totalPoints: 0, earnedPoints: 0, findings: [], findingsHi: [], worstSeverity: '' });
        }
        const d = catDataMap.get(cat)!;
        d.totalPoints += ev.points || 0;
        if (ev.passed) {
            d.earnedPoints += ev.points || 0;
        } else {
            if (ev.reason) d.findings.push(ev.reason);
            const sev = ev.severity;
            if (!d.worstSeverity || sev === 'critical' || (sev === 'major' && d.worstSeverity !== 'critical')) {
                d.worstSeverity = sev;
            }
        }
    }
    type CatData = { totalPoints: number; earnedPoints: number; findings: string[]; findingsHi: string[]; worstSeverity: string };
    const categories = Array.from(catDataMap.entries()).map(([catName, d]: [string, CatData]) => {
        const maxScore = d.totalPoints > 0 ? d.totalPoints : 100;
        const score = d.totalPoints > 0 ? d.earnedPoints : 100;
        const percentage = Math.round((score / maxScore) * 100);
        const sev = d.worstSeverity;
        const status = (sev === 'critical' || sev === 'major') ? 'non-compliant' :
            sev === 'moderate' ? 'partial' : 'compliant';
        return {
            category: catName,
            score,
            maxScore,
            percentage,
            status,
            findings: d.findings,
            findingsHi: d.findingsHi,
        };
    });

    return {
        overallScore: {
            value: overall,
            grade: rating,
            label: rating.charAt(0).toUpperCase() + rating.slice(1),
            labelHi: rating === 'excellent' ? 'उत्कृष्ट' : rating === 'good' ? 'अच्छा' : rating === 'average' ? 'सामान्य' : rating === 'poor' ? 'खराब' : 'गंभीर',
            description: `Based on ${ruleEvaluations.length} Vastu rules evaluated for ${roomType}`,
            descriptionHi: `${roomType} के लिए ${ruleEvaluations.length} वास्तु नियमों के मूल्यांकन पर आधारित`,
        },
        violations,
        compliances,
        elementBalance,
        directionalAnalysis,
        recommendations: recommendations.sort((a, b) => a.priority - b.priority),
        detailedReport,
        categories,
        roomDirection: direction || 'Unknown',
        confidence: normalizedDirection ? 90 : 70,
        processingTime: 0.5,
        suggestions,
        ruleEvaluations,
        positiveAspects,
        autoFixAvailable,
        detectedElements: params.detectedElements || features || [],
        compass,
    };
}

export function getVastuGuidelines(roomType: string): {
    idealDirections: string[];
    colors: string[];
    elements: string[];
    tips: string[];
} {
    const guidelines: Record<string, any> = {
        bedroom: {
            idealDirections: ['South', 'Southwest', 'West'],
            colors: ['Light blue', 'Green', 'Pink', 'Light yellow'],
            elements: ['Earth', 'Water'],
            tips: [
                'Place bed in southwest with head towards south',
                'Avoid mirrors facing the bed',
                'Keep electronics to minimum',
                'Use soft, soothing colors',
            ],
        },
        kitchen: {
            idealDirections: ['Southeast', 'Northwest'],
            colors: ['Orange', 'Red', 'Yellow', 'Rose'],
            elements: ['Fire', 'Water'],
            tips: [
                'Place stove in southeast corner',
                'Sink should be in northeast',
                'Keep kitchen clean and clutter-free',
                'Ensure good ventilation',
            ],
        },
        living_room: {
            idealDirections: ['North', 'Northeast', 'East'],
            colors: ['White', 'Yellow', 'Blue', 'Green'],
            elements: ['Air', 'Space'],
            tips: [
                'Keep the center of the room empty',
                'Place heavy furniture in southwest',
                'Ensure good natural light',
                'Use plants for positive energy',
            ],
        },
        default: {
            idealDirections: ['North', 'East', 'Northeast'],
            colors: ['White', 'Light yellow', 'Light blue'],
            elements: ['Air', 'Space', 'Light'],
            tips: [
                'Ensure proper ventilation',
                'Keep the space clutter-free',
                'Use natural light when possible',
                'Maintain cleanliness',
            ],
        },
    };

    return guidelines[roomType] || guidelines.default;
}

interface VastuSuggestion {
    id: string;
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low' | 'informational';
    title: string;
    description: string;
    currentState: string;
    suggestedState: string;
    scoreImpact: number;
    difficulty: 'easy' | 'moderate' | 'difficult';
    canAutoFix: boolean;
}

export function getVastuSuggestions(params: any): VastuSuggestion[] {
    const { roomType, violations = [], language = 'en' } = params;

    const suggestions: VastuSuggestion[] = [
        {
            id: 'vs-001',
            type: 'remedy',
            priority: 'high',
            title: 'Clear Northeast Corner',
            description: 'Remove clutter from the northeast corner to improved energy flow.',
            currentState: 'Cluttered Northeast corner',
            suggestedState: 'Clean and open Northeast corner',
            scoreImpact: 15,
            difficulty: 'easy',
            canAutoFix: false
        },
        {
            id: 'vs-002',
            type: 'placement',
            priority: 'medium',
            title: 'Improve Ventilation',
            description: 'Ensure proper cross-ventilation in the room.',
            currentState: 'Limited ventilation',
            suggestedState: 'Enhanced airflow',
            scoreImpact: 10,
            difficulty: 'moderate',
            canAutoFix: false
        },
        {
            id: 'vs-003',
            type: 'color-change',
            priority: 'medium',
            title: 'Optimize Colors',
            description: 'Use Vastu-compliant colors for this room type.',
            currentState: 'Non-compliant colors',
            suggestedState: 'Balanced color palette',
            scoreImpact: 10,
            difficulty: 'easy',
            canAutoFix: true
        }
    ];

    return suggestions;
}

export async function generateVastuReport(params: any) {
    const { roomType, imageUrl, direction, language = 'en' } = params;

    return {
        reportUrl: null, // PDF generation would go here
        summary: `Vastu report for ${roomType}`,
        score: 75,
        recommendations: [
            'Follow the suggested improvements',
            'Implement changes gradually',
            'Monitor the energy flow',
        ],
    };
}

export default analyzeVastu;
