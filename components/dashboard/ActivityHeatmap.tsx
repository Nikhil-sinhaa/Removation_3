'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Flame, TrendingUp } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DayData {
  date: string;
  count: number;
}

interface ActivityData {
  year: number;
  days: DayData[];
  activeDays: number;
  currentStreak: number;
  maxStreak: number;
  availableYears: number[];
}

interface HoverInfo {
  date: string;
  count: number;
  x: number;
  y: number;
}

// ─── Color scale (violet palette matching dashboard accent) ──────────────────
// Sourced from Tailwind's violet scale used throughout the dashboard
const COLOR_EMPTY = '#ede9fe'; // violet-100
const LEVEL_COLORS = ['#c4b5fd', '#a78bfa', '#7c3aed', '#5b21b6'] as const;
// Level 1: violet-300 (1 render), 2: violet-400 (2-3), 3: violet-600 (4-6), 4: violet-800 (7+)

function getCellColor(count: number): string {
  if (count === 0) return COLOR_EMPTY;
  if (count === 1) return LEVEL_COLORS[0];
  if (count <= 3) return LEVEL_COLORS[1];
  if (count <= 6) return LEVEL_COLORS[2];
  return LEVEL_COLORS[3];
}

// ─── Grid constants ───────────────────────────────────────────────────────────

const CELL = 11;
const GAP = 2;
const STRIDE = CELL + GAP;
const LEFT_PAD = 28; // room for day labels
const TOP_PAD = 20;  // room for month labels
const RIGHT_PAD = 6;
const BOTTOM_PAD = 4;

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Show label only for Mon, Wed, Fri (rows 1, 3, 5; Sunday=0)
const DAY_LABEL_ROWS: { row: number; label: string }[] = [
  { row: 1, label: 'Mon' },
  { row: 3, label: 'Wed' },
  { row: 5, label: 'Fri' },
];

// ─── Calendar math ────────────────────────────────────────────────────────────

interface CalendarCell {
  date: string;
  count: number;
  col: number;
  row: number; // 0=Sun … 6=Sat
}

function buildCalendar(year: number, dayMap: Map<string, number>): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const startDow = jan1.getUTCDay(); // day-of-week offset for the first column
  const dec31 = new Date(Date.UTC(year, 11, 31));
  const totalDays = Math.round((dec31.getTime() - jan1.getTime()) / 86400000) + 1;

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(Date.UTC(year, 0, 1 + i));
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    cells.push({
      date: dateStr,
      count: dayMap.get(dateStr) ?? 0,
      col: Math.floor((i + startDow) / 7),
      row: d.getUTCDay(),
    });
  }

  return cells;
}

function getMonthLabelCols(year: number): { col: number; label: string }[] {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const startDow = jan1.getUTCDay();
  return MONTH_NAMES.map((label, m) => {
    const first = new Date(Date.UTC(year, m, 1));
    const dayOffset = Math.round((first.getTime() - jan1.getTime()) / 86400000);
    return { col: Math.floor((dayOffset + startDow) / 7), label };
  });
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActivityHeatmap() {
  const [data, setData] = useState<ActivityData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async (y: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/dashboard/activity?year=${y}`);
      if (res.ok) setData(await res.json());
    } catch {
      // non-critical widget — silently ignore network errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(year); }, [year, fetchData]);

  // ── Loading state ──
  if (isLoading) {
    return (
      <Card className="border-gray-100">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-500" />
            Render Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-12 w-28 rounded-xl" />
              <Skeleton className="h-12 w-28 rounded-xl" />
              <Skeleton className="h-12 w-28 rounded-xl" />
            </div>
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const dayMap = new Map(data.days.map(d => [d.date, d.count]));
  const cells = buildCalendar(year, dayMap);
  const monthLabels = getMonthLabelCols(year);
  const numCols = cells.reduce((m, c) => Math.max(m, c.col), 0) + 1;

  const svgW = LEFT_PAD + numCols * STRIDE + RIGHT_PAD;
  const svgH = TOP_PAD + 7 * STRIDE + BOTTOM_PAD;

  const isEmpty = data.activeDays === 0;

  return (
    <Card className="border-gray-100">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-500" />
            Render Activity
          </CardTitle>
          {data.availableYears.length > 0 && (
            <select
              value={year}
              onChange={e => {
                setYear(Number(e.target.value));
                setHover(null);
              }}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer"
            >
              {data.availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* ── Stats row ── */}
        <div className="flex gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-none mb-0.5">Active days</p>
              <p className="text-sm font-bold text-gray-900">{data.activeDays}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-none mb-0.5">Current streak</p>
              <p className="text-sm font-bold text-gray-900">
                {data.currentStreak} {data.currentStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-none mb-0.5">Longest streak</p>
              <p className="text-sm font-bold text-gray-900">
                {data.maxStreak} {data.maxStreak === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Grid or empty state ── */}
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Activity className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-medium text-gray-600">No activity yet</p>
            <p className="text-xs text-gray-400 mt-1">Start creating to build your activity streak</p>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative overflow-x-auto"
            onMouseLeave={() => setHover(null)}
          >
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              width="100%"
              style={{ display: 'block', minWidth: Math.min(svgW, 400) }}
              aria-label={`Activity heatmap for ${year}`}
            >
              {/* Day-of-week labels */}
              {DAY_LABEL_ROWS.map(({ row, label }) => (
                <text
                  key={label}
                  x={LEFT_PAD - 4}
                  y={TOP_PAD + row * STRIDE + CELL * 0.75}
                  fontSize="8"
                  fill="#9ca3af"
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {label}
                </text>
              ))}

              {/* Month labels */}
              {monthLabels.map(({ col, label }) => (
                <text
                  key={label}
                  x={LEFT_PAD + col * STRIDE}
                  y={TOP_PAD - 6}
                  fontSize="9"
                  fill="#6b7280"
                >
                  {label}
                </text>
              ))}

              {/* Day cells */}
              {cells.map(cell => (
                <rect
                  key={cell.date}
                  x={LEFT_PAD + cell.col * STRIDE}
                  y={TOP_PAD + cell.row * STRIDE}
                  width={CELL}
                  height={CELL}
                  rx={2}
                  ry={2}
                  fill={getCellColor(cell.count)}
                  style={{ cursor: cell.count > 0 ? 'pointer' : 'default' }}
                  onMouseEnter={e => {
                    const container = containerRef.current;
                    if (!container) return;
                    const rect = container.getBoundingClientRect();
                    setHover({
                      date: cell.date,
                      count: cell.count,
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseLeave={() => setHover(null)}
                />
              ))}
            </svg>

            {/* Floating tooltip */}
            {hover && (
              <div
                className="pointer-events-none absolute z-20 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap"
                style={{
                  left: hover.x + 8,
                  top: hover.y - 36,
                }}
              >
                {hover.count === 0
                  ? `No renders on ${fmtDate(hover.date)}`
                  : `${hover.count} render${hover.count !== 1 ? 's' : ''} on ${fmtDate(hover.date)}`}
                {/* Caret */}
                <span
                  className="absolute left-3 -bottom-1 w-2 h-2 bg-gray-900 rotate-45"
                  style={{ clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }}
                />
              </div>
            )}

            {/* Color legend */}
            <div className="flex items-center gap-1.5 mt-3 justify-end">
              <span className="text-xs text-gray-400">Less</span>
              {[COLOR_EMPTY, ...LEVEL_COLORS].map((color, i) => (
                <svg key={i} width={CELL} height={CELL} style={{ display: 'block' }}>
                  <rect width={CELL} height={CELL} rx={2} fill={color} />
                </svg>
              ))}
              <span className="text-xs text-gray-400">More</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
