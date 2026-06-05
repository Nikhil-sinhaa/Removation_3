// app/admin/cost/page.tsx
"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Calculator,
  Layers,
  Zap,
  Clock,
  Home,
  Wrench,
  PaintBucket,
  Lightbulb,
  Droplets,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  calculateRenovationCost,
  estimateProcessingTime,
  getOperationCost,
  getMaterialPrices,
  getLaborRates,
  getCostBreakdown,
} from "@/lib/cost-engine";

// ─── Constants pulled from cost-engine ────────────────────────────────────────
const AI_OPERATIONS: Array<{ id: string; label: string; credits: number; timeEst: number; icon: React.ReactNode }> = [
  { id: "redesign",          label: "Room Redesign",      credits: getOperationCost("redesign"),          timeEst: estimateProcessingTime("redesign"),          icon: <Home className="w-4 h-4" /> },
  { id: "beautify",          label: "Beautify",           credits: getOperationCost("beautify"),          timeEst: estimateProcessingTime("beautify"),          icon: <PaintBucket className="w-4 h-4" /> },
  { id: "creative",          label: "Creative Mode",      credits: getOperationCost("creative"),          timeEst: estimateProcessingTime("creative"),          icon: <Lightbulb className="w-4 h-4" /> },
  { id: "furnish",           label: "Furnish Empty Room", credits: getOperationCost("furnish"),           timeEst: estimateProcessingTime("furnish"),           icon: <Home className="w-4 h-4" /> },
  { id: "fill_room",         label: "Fill Room",          credits: getOperationCost("fill_room"),         timeEst: estimateProcessingTime("fill_room"),         icon: <Layers className="w-4 h-4" /> },
  { id: "empty",             label: "Empty Room",         credits: getOperationCost("empty"),             timeEst: estimateProcessingTime("empty"),             icon: <Home className="w-4 h-4" /> },
  { id: "outdoor",           label: "Outdoor Design",     credits: getOperationCost("outdoor"),           timeEst: estimateProcessingTime("outdoor"),           icon: <Home className="w-4 h-4" /> },
  { id: "sketch_to_render",  label: "Sketch to Render",   credits: getOperationCost("sketch_to_render"),  timeEst: estimateProcessingTime("sketch_to_render"),  icon: <Layers className="w-4 h-4" /> },
  { id: "enhance",           label: "Image Enhance",      credits: getOperationCost("enhance"),           timeEst: estimateProcessingTime("enhance"),           icon: <Zap className="w-4 h-4" /> },
  { id: "inpaint",           label: "Inpainting",         credits: getOperationCost("inpaint"),           timeEst: estimateProcessingTime("inpaint"),           icon: <PaintBucket className="w-4 h-4" /> },
  { id: "remove_object",     label: "Object Removal",     credits: getOperationCost("remove_object"),     timeEst: estimateProcessingTime("remove_object"),     icon: <Layers className="w-4 h-4" /> },
  { id: "replace",           label: "Object Replace",     credits: getOperationCost("replace"),           timeEst: estimateProcessingTime("replace"),           icon: <Wrench className="w-4 h-4" /> },
];

const RENOVATION_TYPES = ["basic", "standard", "premium", "luxury"] as const;

const CITIES = ["mumbai", "delhi", "bangalore", "chennai", "hyderabad", "kolkata", "pune", "ahmedabad"];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ─── Renovation matrix ─────────────────────────────────────────────────────────
const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Office", "Dining Room"];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CostAdminPage() {
  const [selectedCity, setSelectedCity] = useState("bangalore");
  const [selectedArea, setSelectedArea] = useState(300); // sqft

  // Build renovation matrix
  const renovationMatrix = useMemo(() =>
    ROOM_TYPES.map((room) =>
      RENOVATION_TYPES.map((type) => {
        const res = calculateRenovationCost({
          roomType: room.toLowerCase().replace(/ /g, "_"),
          areaInSqft: selectedArea,
          city: selectedCity,
          renovationType: type,
          includeLabor: true,
          includeTax: true,
        });
        return res;
      })
    ),
    [selectedCity, selectedArea]
  );

  const materials = getMaterialPrices({ category: "all", city: selectedCity, currency: "INR" });
  const laborRates = getLaborRates({ city: selectedCity, currency: "INR" });

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Cost Engine</h1>
        <p className="text-sm text-neutral-400 mt-1">
          AI credit pricing, renovation cost matrix, and labor/material rates reference
        </p>
      </div>

      <Tabs defaultValue="ai-credits">
        <TabsList className="bg-neutral-900 border border-neutral-800">
          <TabsTrigger value="ai-credits" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <Zap className="w-4 h-4 mr-2" />
            AI Credits
          </TabsTrigger>
          <TabsTrigger value="renovation" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <IndianRupee className="w-4 h-4 mr-2" />
            Renovation Costs
          </TabsTrigger>
          <TabsTrigger value="materials" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <Layers className="w-4 h-4 mr-2" />
            Materials & Labor
          </TabsTrigger>
        </TabsList>

        {/* ── AI Credits tab ── */}
        <TabsContent value="ai-credits" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Cheapest Op",  value: "1 credit",   sub: "redesign, beautify…",   color: "bg-emerald-500" },
              { label: "Mid-tier Op",  value: "2 credits",  sub: "furnish, fill room…",   color: "bg-amber-500" },
              { label: "Heavy Op",     value: "3 credits",  sub: "sketch to render",       color: "bg-violet-500" },
              { label: "Total Modes",  value: `${AI_OPERATIONS.length}`, sub: "distinct AI pipelines", color: "bg-blue-500" },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }}>
                <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
                  <div className={`h-1 w-full ${s.color}`} />
                  <CardContent className="p-4">
                    <p className="text-xs text-neutral-500 uppercase tracking-wider">{s.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{s.sub}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300">AI Operation Pricing</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      {["Operation", "Credits", "Est. Time", "Credits/min"].map((h) => (
                        <th key={h} className="p-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {AI_OPERATIONS.map((op, i) => (
                      <motion.tr
                        key={op.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400">{op.icon}</span>
                            <span className="text-sm text-white">{op.label}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={
                            op.credits >= 3 ? "bg-violet-500/10 text-violet-400 border-violet-500/30" :
                            op.credits >= 2 ? "bg-amber-500/10 text-amber-400 border-amber-500/30"  :
                            "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          }>
                            {op.credits} {op.credits === 1 ? "credit" : "credits"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> ~{op.timeEst}s
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-neutral-400">
                            {(op.credits / (op.timeEst / 60)).toFixed(1)}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Renovation costs tab ── */}
        <TabsContent value="renovation" className="mt-4 space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <p className="text-xs text-neutral-500 mb-1">City</p>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCity(c)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                      selectedCity === c
                        ? "border-violet-500 bg-violet-500/10 text-violet-400"
                        : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-neutral-500 mb-1">Area: {selectedArea} sqft</p>
              <input
                type="range"
                min={100}
                max={2000}
                step={50}
                value={selectedArea}
                onChange={(e) => setSelectedArea(Number(e.target.value))}
                className="w-48 accent-violet-500"
              />
            </div>
          </div>

          <Card className="border-neutral-800 bg-neutral-900/50 overflow-hidden">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300">
                Renovation Cost Matrix — {selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)}, {selectedArea} sqft
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="p-3 text-left text-xs font-medium text-neutral-500 uppercase">Room</th>
                      {RENOVATION_TYPES.map((t) => (
                        <th key={t} className="p-3 text-left text-xs font-medium text-neutral-500 uppercase">{t}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ROOM_TYPES.map((room, ri) => (
                      <tr key={room} className="border-b border-neutral-800 hover:bg-neutral-800/20 transition-colors">
                        <td className="p-3">
                          <span className="text-sm text-white font-medium">{room}</span>
                        </td>
                        {RENOVATION_TYPES.map((_, ti) => {
                          const res = renovationMatrix[ri]?.[ti];
                          return (
                            <td key={ti} className="p-3">
                              <div>
                                <p className="text-sm font-medium text-white">{res ? formatCurrency(res.totalCost) : "—"}</p>
                                <p className="text-[11px] text-neutral-500 mt-0.5">
                                  {res ? `${res.estimatedDays}d` : ""}
                                </p>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-neutral-600 mt-3">* Includes 18% GST. Labour rate varies ±20% by project complexity.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Materials & Labor tab ── */}
        <TabsContent value="materials" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Material prices */}
            <Card className="border-neutral-800 bg-neutral-900/50">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <PaintBucket className="w-4 h-4 text-violet-400" />
                  Material Reference Prices
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-2">
                {materials.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm text-white">{m.name}</p>
                      <p className="text-xs text-neutral-500 capitalize">{m.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-emerald-400">₹{m.price}/{m.unit}</p>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Labor rates */}
            <Card className="border-neutral-800 bg-neutral-900/50">
              <CardHeader className="p-5 pb-3">
                <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  Labor Rates — {selectedCity}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-2">
                {Object.entries(laborRates).map(([trade, info], i) => (
                  <motion.div
                    key={trade}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between py-2 border-b border-neutral-800 last:border-0"
                  >
                    <span className="text-sm text-white capitalize">{trade}</span>
                    <span className="text-sm font-medium text-amber-400">
                      ₹{info.rate}/{info.unit}
                    </span>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* City multipliers */}
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300">City Cost Multipliers</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { city: "Mumbai",    mult: 1.2 },
                  { city: "Delhi",     mult: 1.15 },
                  { city: "Bangalore", mult: 1.1 },
                  { city: "Pune",      mult: 1.05 },
                  { city: "Chennai",   mult: 1.0 },
                  { city: "Hyderabad", mult: 0.95 },
                  { city: "Ahmedabad", mult: 0.95 },
                  { city: "Kolkata",   mult: 0.9 },
                ].map((c) => (
                  <div key={c.city} className="rounded-lg bg-neutral-800/50 p-3 text-center">
                    <p className="text-xs text-neutral-400">{c.city}</p>
                    <p className={`text-lg font-bold mt-1 ${c.mult > 1 ? "text-red-400" : c.mult < 1 ? "text-emerald-400" : "text-white"}`}>
                      {c.mult}×
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
