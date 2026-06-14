import { useState, useCallback, useRef } from 'react';
import type {
  VastuAnalysis,
  VastuCategoryAnalysis,
  VastuRuleEvaluation,
  DetectedElement,
  VastuSuggestion,
  CompassDirection,
} from '@/types/vastu';

interface UseVastuParams {
  imageUrl?: string | null;
  roomType?: string;
  direction?: string | null;
  language?: string;
  projectId?: string;
}

/** 3 minutes before we give up polling */
const POLL_TIMEOUT_MS = 3 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;

function deriveColor(value: number): string {
  if (value >= 80) return 'text-green-500';
  if (value >= 60) return 'text-yellow-500';
  if (value >= 40) return 'text-orange-500';
  return 'text-red-500';
}

/** Map a raw API response body (local-mode `analysis` shape) to VastuAnalysis. */
function mapResponseToAnalysis(data: any, projectId?: string, direction?: string | null, roomType?: string): VastuAnalysis {
  const a = data.analysis;
  const scoreValue: number = a?.overallScore?.value ?? data.score ?? 0;

  return {
    id: `vastu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    renderId: `render-${Date.now()}`,
    projectId,
    overallScore: {
      value: scoreValue,
      grade: a?.overallScore?.grade ?? 'average',
      label: a?.overallScore?.label ?? '',
      labelHi: a?.overallScore?.labelHi ?? '',
      color: deriveColor(scoreValue),
      description: a?.overallScore?.description ?? '',
      descriptionHi: a?.overallScore?.descriptionHi ?? '',
    },
    categories: (a?.categories ?? []).map((cat: any): VastuCategoryAnalysis => ({
      category: cat.category ?? 'furniture',
      score: cat.score ?? 100,
      maxScore: cat.maxScore ?? 100,
      percentage: cat.percentage ?? 100,
      status: cat.status ?? 'compliant',
      findings: cat.findings ?? [],
      findingsHi: cat.findingsHi ?? [],
    })),
    ruleEvaluations: (a?.ruleEvaluations ?? []).map((rule: any): VastuRuleEvaluation => ({
      ruleId: rule.ruleId ?? rule.id ?? '',
      ruleCode: rule.ruleCode ?? rule.ruleId ?? '',
      ruleTitle: rule.ruleTitle ?? rule.title ?? '',
      ruleTitleHi: rule.ruleTitleHi ?? rule.titleHi ?? '',
      status: rule.status ?? (rule.passed ? 'passed' : 'failed'),
      score: rule.score ?? (rule.passed ? rule.points : 0) ?? 0,
      maxScore: rule.maxScore ?? rule.points ?? 100,
      details: rule.details ?? rule.reason ?? '',
      detailsHi: rule.detailsHi ?? '',
      affectedElements: rule.affectedElements ?? [],
      suggestedRemedyIds: rule.suggestedRemedyIds ?? [],
      confidence: rule.confidence ?? 1.0,
    })),
    detectedElements: (data.detectedElements ?? a?.detectedElements ?? []).map(
      (elem: any, idx: number): DetectedElement => ({
        id: elem.id ?? `elem-${idx}`,
        type: elem.type ?? 'other',
        name: elem.name ?? '',
        nameHi: elem.nameHi ?? '',
        boundingBox: elem.boundingBox ?? { x: 0, y: 0, width: 0, height: 0 },
        position: elem.position ?? 'center',
        vastuCompliance: elem.vastuCompliance ?? 'compliant',
        issues: elem.issues ?? [],
        issuesHi: elem.issuesHi ?? [],
        confidence: elem.confidence ?? 1.0,
      })
    ),
    suggestions: (a?.suggestions ?? data.suggestions ?? []).map((sug: any): VastuSuggestion => ({
      id: sug.id ?? `sug-${Math.random().toString(36).substr(2, 9)}`,
      type: sug.type ?? 'remedy',
      priority: sug.priority ?? 'medium',
      title: sug.title ?? '',
      titleHi: sug.titleHi ?? sug.title ?? '',
      description: sug.description ?? '',
      descriptionHi: sug.descriptionHi ?? sug.description ?? '',
      currentState: sug.currentState ?? '',
      suggestedState: sug.suggestedState ?? '',
      scoreImpact: sug.scoreImpact ?? 0,
      difficulty: sug.difficulty ?? 'moderate',
      canAutoFix: sug.canAutoFix ?? false,
      relatedRuleIds: sug.relatedRuleIds ?? [],
    })),
    autoFixAvailable: a?.autoFixAvailable ?? false,
    positiveAspects: (a?.positiveAspects ?? []).map((p: any) =>
      typeof p === 'string' ? p : p?.text ?? p?.description ?? String(p)
    ),
    compass: a?.compass,
    roomDirection: (direction?.toUpperCase() as CompassDirection) || null,
    roomType: roomType ?? 'general',
    analysisVersion: '2.0',
    confidence: a?.confidence ?? 1.0,
    processingTime: a?.processingTime ?? 0,
    detectionConfidence: (data.detectionConfidence ?? a?.detectionConfidence) as 'normal' | 'low' | 'failed' | undefined,
    detectedPassCount: data.detectedPassCount ?? a?.detectedPassCount,
    createdAt: new Date(),
  };
}

export function useVastu(initialParams?: UseVastuParams) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VastuAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollDeadlineRef = useRef<number>(0);

  /** Cancel any in-flight polling. */
  const cancelPoll = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /**
   * Poll GET pollUrl every POLL_INTERVAL_MS until status === 'completed' |
   * 'failed', or the 3-minute timeout fires.
   */
  const startPolling = useCallback(
    (pollUrl: string, direction?: string | null, roomType?: string, projectId?: string) => {
      pollDeadlineRef.current = Date.now() + POLL_TIMEOUT_MS;

      const tick = async () => {
        if (Date.now() > pollDeadlineRef.current) {
          setError('Analysis is taking longer than expected. Please try again.');
          setIsAnalyzing(false);
          return;
        }

        try {
          const res = await fetch(pollUrl);
          const data = await res.json();

          if (!res.ok) {
            setError(data.message || data.error || `Polling failed (${res.status})`);
            setIsAnalyzing(false);
            return;
          }

          const status: string = data.status ?? 'pending';

          if (status === 'completed') {
            // The /status route returns the scored result inside data.result
            const resultPayload = data.result ?? data;
            setAnalysis(mapResponseToAnalysis(resultPayload, projectId, direction, roomType));
            setIsAnalyzing(false);
            return;
          }

          if (status === 'failed') {
            setError(data.error || data.message || 'Vastu analysis failed on worker.');
            setIsAnalyzing(false);
            return;
          }

          // Still pending / running — schedule next tick
          pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        } catch (err: any) {
          setError(err.message || 'Network error while polling for result.');
          setIsAnalyzing(false);
        }
      };

      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    },
    [],
  );

  const analyze = useCallback(async (params?: UseVastuParams) => {
    const merged = { ...initialParams, ...params };
    cancelPoll();
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await fetch('/api/vastu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: merged.imageUrl ?? undefined,
          roomType: merged.roomType,
          direction: merged.direction ?? undefined,
          language: merged.language ?? 'en',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || `Request failed (${res.status})`);
        setIsAnalyzing(false);
        return;
      }

      // ── Drive (async) mode ─────────────────────────────────────────────────
      // Response shape: { success, mode: 'drive', jobId, status: 'pending', pollUrl }
      if (data.mode === 'drive' && data.pollUrl) {
        // isAnalyzing stays true while we poll — the loading UI remains active.
        startPolling(data.pollUrl, merged.direction, merged.roomType, merged.projectId);
        return;
      }

      // ── Local (synchronous) mode ───────────────────────────────────────────
      // Response shape: { success, analysis, score, issues, suggestions, detectedElements }
      setAnalysis(mapResponseToAnalysis(data, merged.projectId, merged.direction, merged.roomType));
      setIsAnalyzing(false);

    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      setIsAnalyzing(false);
    }
  }, [initialParams, cancelPoll, startPolling]);

  return { analyze, analysis, isAnalyzing, error };
}
