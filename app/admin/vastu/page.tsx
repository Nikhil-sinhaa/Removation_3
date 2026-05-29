// app/admin/vastu/page.tsx
"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  Compass,
  Layers,
  Flame,
  Droplets,
  Wind,
  Sparkles,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VASTU_RULES, VASTU_DIRECTIONS, type VastuRule, type VastuCategory, type VastuSeverity } from "@/constants/vastu-rules";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SEVERITY_CONFIG: Record<VastuSeverity, { label: string; cls: string; icon: React.ReactNode }> = {
  critical:   { label: "Critical",   cls: "bg-red-500/10 text-red-400 border-red-500/30",        icon: <AlertTriangle className="w-3 h-3" /> },
  major:      { label: "Major",      cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",   icon: <AlertTriangle className="w-3 h-3" /> },
  minor:      { label: "Minor",      cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",     icon: <Info className="w-3 h-3" /> },
  suggestion: { label: "Suggestion", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: <Lightbulb className="w-3 h-3" /> },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  entrance:  <Home className="w-4 h-4" />,
  bedroom:   <Home className="w-4 h-4" />,
  kitchen:   <Flame className="w-4 h-4" />,
  bathroom:  <Droplets className="w-4 h-4" />,
  pooja:     <Sparkles className="w-4 h-4" />,
  living:    <Home className="w-4 h-4" />,
  study:     <BookOpen className="w-4 h-4" />,
  staircase: <Layers className="w-4 h-4" />,
  water:     <Droplets className="w-4 h-4" />,
  mirror:    <Sparkles className="w-4 h-4" />,
  furniture: <Home className="w-4 h-4" />,
  lighting:  <Flame className="w-4 h-4" />,
  plants:    <Wind className="w-4 h-4" />,
  direction: <Compass className="w-4 h-4" />,
  color:     <Sparkles className="w-4 h-4" />,
  element:   <Layers className="w-4 h-4" />,
  general:   <Info className="w-4 h-4" />,
};

const ALL_CATEGORIES = Array.from(new Set(VASTU_RULES.map((r) => r.category))).sort();

// ─── RuleCard ─────────────────────────────────────────────────────────────────
const RuleCard = ({ rule }: { rule: VastuRule }) => {
  const [expanded, setExpanded] = useState(false);
  const sev = SEVERITY_CONFIG[rule.severity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-neutral-800 rounded-xl bg-neutral-900/50 overflow-hidden hover:border-neutral-700 transition-colors"
    >
      {/* Header */}
      <button
        className="w-full p-4 text-left flex items-start gap-3"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="mt-0.5 text-neutral-400">{CATEGORY_ICONS[rule.category] ?? <Info className="w-4 h-4" />}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{rule.title}</span>
            <Badge variant="outline" className={`${sev.cls} flex items-center gap-1 text-xs`}>
              {sev.icon}
              {sev.label}
            </Badge>
            {rule.points > 0 && (
              <span className="text-xs text-neutral-500">−{rule.points} pts</span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{rule.titleHi}</p>
        </div>
        <div className="ml-2 text-neutral-500 flex-shrink-0">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-neutral-800 pt-3">
              {/* Description */}
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-neutral-300">{rule.description}</p>
                <p className="text-sm text-neutral-500 mt-1 italic">{rule.descriptionHi}</p>
              </div>

              {/* Remedy */}
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Remedy
                </p>
                <p className="text-sm text-neutral-300">{rule.remedy}</p>
                <p className="text-xs text-neutral-500 mt-1 italic">{rule.remedyHi}</p>
              </div>

              {/* Scientific reason */}
              {rule.scientificReason && (
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                  <p className="text-xs text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" /> Scientific Basis
                  </p>
                  <p className="text-sm text-neutral-300">{rule.scientificReason}</p>
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-2 pt-1">
                {rule.direction && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 flex items-center gap-1">
                    <Compass className="w-3 h-3" /> {rule.direction}
                  </span>
                )}
                {rule.element && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 capitalize">
                    {rule.element}
                  </span>
                )}
                {rule.roomTypes.map((rt) => (
                  <span key={rt} className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 capitalize">
                    {rt.replace(/-/g, " ")}
                  </span>
                ))}
                <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500">
                  ID: {rule.id}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VastuAdminPage() {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");

  // Counts per severity
  const severityCounts = useMemo(() => {
    const c: Record<string, number> = { critical: 0, major: 0, minor: 0, suggestion: 0 };
    VASTU_RULES.forEach((r) => { c[r.severity] = (c[r.severity] ?? 0) + 1; });
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return VASTU_RULES.filter((r) => {
      if (category !== "all" && r.category !== category) return false;
      if (severity !== "all" && r.severity !== severity) return false;
      if (q) {
        const hay = [r.title, r.titleHi, r.description, r.id, ...r.keywords].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, category, severity]);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vastu Rules Engine</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {VASTU_RULES.length} rules across {ALL_CATEGORIES.length} categories · read-only reference
          </p>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["critical", "major", "minor", "suggestion"] as VastuSeverity[]).map((s) => {
          const cfg = SEVERITY_CONFIG[s];
          return (
            <motion.div key={s} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}>
              <Card className="border-neutral-800 bg-neutral-900/50 cursor-pointer hover:border-neutral-700 transition-colors"
                onClick={() => setSeverity(severity === s ? "all" : s)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-neutral-500 uppercase tracking-wider">{cfg.label}</p>
                      <p className="text-2xl font-bold text-white mt-1">{severityCounts[s]}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">rules</p>
                    </div>
                    <Badge variant="outline" className={`${cfg.cls} h-8 w-8 flex items-center justify-center rounded-xl p-0`}>
                      {cfg.icon}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Direction reference ── */}
      <Card className="border-neutral-800 bg-neutral-900/50">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
            <Compass className="w-4 h-4 text-violet-400" />
            Direction Reference
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
            {VASTU_DIRECTIONS.map((d) => (
              <div key={d.direction} className="text-center p-2 rounded-lg bg-neutral-800/50">
                <p className="text-xs font-semibold text-white capitalize">{d.name.split(" ")[0]}</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">{d.nameHi}</p>
                <div
                  className="w-2 h-2 rounded-full mx-auto mt-1"
                  style={{ backgroundColor: d.color[0] === "green" ? "#22c55e" : d.color[0] === "blue" ? "#3b82f6" : d.color[0] === "red" ? "#ef4444" : d.color[0] === "white" ? "#e5e7eb" : d.color[0] === "yellow" || d.color[0] === "gold" ? "#eab308" : d.color[0] === "brown" ? "#92400e" : "#6b7280" }}
                />
                <p className="text-[10px] text-neutral-600 mt-1">{d.element}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Search rules by title, keyword, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-neutral-900 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-40 bg-neutral-900 border-neutral-700 text-neutral-300">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-700">
            <SelectItem value="all">All Categories</SelectItem>
            {ALL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-36 bg-neutral-900 border-neutral-700 text-neutral-300">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-900 border-neutral-700">
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="suggestion">Suggestion</SelectItem>
          </SelectContent>
        </Select>
        {(search || category !== "all" || severity !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            className="text-neutral-400 hover:text-white"
            onClick={() => { setSearch(""); setCategory("all"); setSeverity("all"); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* ── Results count ── */}
      <div className="text-xs text-neutral-500">
        Showing {filtered.length} of {VASTU_RULES.length} rules
      </div>

      {/* ── Rules list ── */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 text-neutral-500"
            >
              No rules match your filters.
            </motion.div>
          ) : (
            filtered.map((rule) => <RuleCard key={rule.id} rule={rule} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
