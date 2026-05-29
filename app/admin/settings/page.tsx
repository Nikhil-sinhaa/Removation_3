// app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Shield,
  Key,
  Webhook,
  Globe,
  Bell,
  Database,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Info,
  Palette,
  Server,
  Mail,
  Sliders,
  Loader2,
  Coins,
  Save,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Static config sections ──────────────────────────────────────────────────
const GENERAL_SETTINGS = [
  {
    section: "Application",
    items: [
      { label: "App Name",          value: "Removation",            type: "text",    editable: false },
      { label: "Environment",       value: "Production",             type: "badge",   badge: "bg-emerald-500/10 text-emerald-400" },
      { label: "Next.js Version",   value: "14.x",                  type: "text",    editable: false },
      { label: "Node.js Runtime",   value: "Node 20 LTS",           type: "text",    editable: false },
    ],
  },
  {
    section: "Database",
    items: [
      { label: "Provider",          value: "MongoDB Atlas",          type: "text",    editable: false },
      { label: "Connection",        value: "Connected",              type: "badge",   badge: "bg-emerald-500/10 text-emerald-400" },
      { label: "ORM",               value: "Mongoose 8.x",          type: "text",    editable: false },
    ],
  },
  {
    section: "AI Infrastructure",
    items: [
      { label: "ComfyUI Host",      value: process.env.NEXT_PUBLIC_COMFYUI_URL ?? "localhost:8188", type: "text", editable: false },
      { label: "Diffusion Models",  value: "SDXL Interior v2",      type: "text",    editable: false },
      { label: "Queue Strategy",    value: "Async / Polling",       type: "text",    editable: false },
    ],
  },
  {
    section: "Storage",
    items: [
      { label: "Provider",          value: "UploadThing",           type: "text",    editable: false },
      { label: "CDN",               value: "ufs.sh edge network",   type: "text",    editable: false },
    ],
  },
  {
    section: "Payments",
    items: [
      { label: "Primary Gateway",   value: "Razorpay",              type: "text",    editable: false },
      { label: "Secondary Gateway", value: "Stripe",                type: "text",    editable: false },
      { label: "Currency",          value: "INR (₹)",               type: "text",    editable: false },
    ],
  },
];

const API_KEYS = [
  { label: "Razorpay Key ID",        envVar: "RAZORPAY_KEY_ID",          status: "configured" },
  { label: "Razorpay Secret",        envVar: "RAZORPAY_KEY_SECRET",      status: "configured" },
  { label: "Stripe Public Key",      envVar: "NEXT_PUBLIC_STRIPE_KEY",   status: "configured" },
  { label: "Stripe Secret Key",      envVar: "STRIPE_SECRET_KEY",        status: "configured" },
  { label: "UploadThing App ID",     envVar: "UPLOADTHING_APP_ID",       status: "configured" },
  { label: "UploadThing Secret",     envVar: "UPLOADTHING_SECRET",       status: "configured" },
  { label: "Pusher App ID",          envVar: "PUSHER_APP_ID",            status: "configured" },
  { label: "Pusher Secret",          envVar: "PUSHER_SECRET",            status: "configured" },
  { label: "JWT Secret",             envVar: "JWT_SECRET",               status: "configured" },
  { label: "MongoDB URI",            envVar: "MONGODB_URI",              status: "configured" },
  { label: "Google AI Key",          envVar: "GOOGLE_AI_API_KEY",        status: "configured" },
];

const WEBHOOKS = [
  { name: "Razorpay Payments",   url: "/api/webhooks/razorpay",  events: ["payment.captured", "subscription.activated", "subscription.cancelled"],  status: "active" },
  { name: "Stripe Payments",     url: "/api/webhooks/stripe",    events: ["payment_intent.succeeded", "customer.subscription.updated"],              status: "active" },
  { name: "UploadThing Events",  url: "/api/uploadthing",        events: ["file.uploaded"],                                                          status: "active" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsAdminPage() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  
  // Dynamic config states
  const [config, setConfig] = useState<{
    app_mode: 'development' | 'production';
    free_credits_on_signup: number;
    credit_costs: {
      'room-changer': number;
      'furniture-remover': number;
      'redesign': number;
    };
  }>({
    app_mode: 'development',
    free_credits_on_signup: 10,
    credit_costs: {
      'room-changer': 1,
      'furniture-remover': 1,
      'redesign': 2,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const toggleSecret = (key: string) =>
    setShowSecrets((s) => ({ ...s, [key]: !s[key] }));

  // Load configs on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch('/api/admin/config');
        if (res.ok) {
          const data = await res.json();
          setConfig({
            app_mode: data.app_mode || 'development',
            free_credits_on_signup: typeof data.free_credits_on_signup === 'number' ? data.free_credits_on_signup : 10,
            credit_costs: {
              'room-changer': data.credit_costs?.['room-changer'] ?? 1,
              'furniture-remover': data.credit_costs?.['furniture-remover'] ?? 1,
              'redesign': data.credit_costs?.['redesign'] ?? 2,
            }
          });
        }
      } catch (err) {
        console.error('Failed to load admin config', err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  // Save configs to database
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveStatus({ type: 'success', message: 'Settings saved and applied successfully!' });
      } else {
        const errData = await res.json();
        setSaveStatus({ type: 'error', message: errData.message || 'Failed to update system settings.' });
      }
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'A network error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">
          System tuning parameters, API keys, and webhook reference
        </p>
      </div>

      <Tabs defaultValue="tuning">
        <TabsList className="bg-neutral-900 border border-neutral-800">
          <TabsTrigger value="tuning" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <Sliders className="w-4 h-4 mr-2" />
            System Tuning
          </TabsTrigger>
          <TabsTrigger value="general" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <Key className="w-4 h-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <Webhook className="w-4 h-4 mr-2" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-neutral-800 data-[state=active]:text-white text-neutral-400">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* ── System Tuning & Credits Control ── */}
        <TabsContent value="tuning" className="mt-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-neutral-800 bg-neutral-900/50">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-white">System Tuning</CardTitle>
                    <CardDescription className="text-sm text-neutral-400 mt-1">
                      Configure environment execution modes, default registration credits, and pipeline rendering costs.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-400 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="text-sm">Fetching system parameters...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-6">
                    {/* Status notifications */}
                    {saveStatus && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex items-start gap-3 rounded-lg border p-4 ${
                          saveStatus.type === "success"
                            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
                            : "border-red-500/30 bg-red-500/5 text-red-300"
                        }`}
                      >
                        {saveStatus.type === "success" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{saveStatus.type === "success" ? "Success" : "Error"}</p>
                          <p className="text-xs mt-0.5 opacity-90">{saveStatus.message}</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Section 1: App Execution Mode */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-neutral-400" />
                        Application Environment Mode
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Development Card */}
                        <div
                          onClick={() => setConfig({ ...config, app_mode: 'development' })}
                          className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 flex items-start gap-3.5 hover:border-neutral-700 ${
                            config.app_mode === 'development'
                              ? 'border-indigo-500/50 bg-indigo-500/5 ring-1 ring-indigo-500/30'
                              : 'border-neutral-800 bg-neutral-950/40 opacity-70'
                          }`}
                        >
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            config.app_mode === 'development' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-neutral-800 text-neutral-500'
                          }`}>
                            <Server className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">Development Mode</span>
                              {config.app_mode === 'development' && (
                                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/30 text-[10px] px-1.5 py-0">Active</Badge>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                              Bypasses user credit limits. Perfect for local dev testing, ComfyUI tuning, and design iteration.
                            </p>
                          </div>
                        </div>

                        {/* Production Card */}
                        <div
                          onClick={() => setConfig({ ...config, app_mode: 'production' })}
                          className={`relative cursor-pointer rounded-xl border p-4 transition-all duration-200 flex items-start gap-3.5 hover:border-neutral-700 ${
                            config.app_mode === 'production'
                              ? 'border-emerald-500/50 bg-emerald-500/5 ring-1 ring-emerald-500/30'
                              : 'border-neutral-800 bg-neutral-950/40 opacity-70'
                          }`}
                        >
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            config.app_mode === 'production' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-500'
                          }`}>
                            <Globe className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">Production Mode</span>
                              {config.app_mode === 'production' && (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">Active</Badge>
                              )}
                            </div>
                            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                              Strictly validates and deducts user credit balances. Integrates fully with subscriptions and transaction records.
                            </p>
                          </div>
                        </div>
                      </div>

                      {config.app_mode === 'development' ? (
                        <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                          <p>
                            <strong>Warning:</strong> Skipping active credit deductions! Logged-in users will still be linked to renders, but zero credit fees will be applied.
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2.5 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-blue-300">
                          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p>
                            <strong>Billing Active:</strong> Users must maintain positive credit balances to request rooms or style transfers. Renders will deduct configured units below.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Section 2: User Registration Incentives */}
                    <div className="border-t border-neutral-800/80 pt-6">
                      <div className="max-w-md space-y-2.5">
                        <label htmlFor="signup_credits" className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                          <Coins className="w-4 h-4 text-neutral-400" />
                          Sign Up Incentive Credits
                        </label>
                        <p className="text-xs text-neutral-400">
                          Number of free rendering credits automatically granted to newly registered accounts.
                        </p>
                        <div className="relative">
                          <input
                            id="signup_credits"
                            type="number"
                            min="0"
                            max="500"
                            required
                            value={config.free_credits_on_signup}
                            onChange={(e) => setConfig({ ...config, free_credits_on_signup: parseInt(e.target.value) || 0 })}
                            className="flex w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Processing Fees */}
                    <div className="border-t border-neutral-800/80 pt-6 space-y-4">
                      <div>
                        <label className="text-sm font-medium text-neutral-200 flex items-center gap-2">
                          <Palette className="w-4 h-4 text-neutral-400" />
                          Rendering Task Pricing (Credits)
                        </label>
                        <p className="text-xs text-neutral-400 mt-1">
                          Configure exact credit consumption values charged per successful AI job pipeline.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Room Changer Card */}
                        <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
                          <div>
                            <span className="text-xs font-semibold text-neutral-300">Room Changer</span>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Quickly swaps colors and furniture arrangements</p>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            required
                            value={config.credit_costs['room-changer']}
                            onChange={(e) => setConfig({
                              ...config,
                              credit_costs: { ...config.credit_costs, 'room-changer': parseInt(e.target.value) || 0 }
                            })}
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                          />
                        </div>

                        {/* Furniture Remover Card */}
                        <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
                          <div>
                            <span className="text-xs font-semibold text-neutral-300">Furniture Remover</span>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Erases and patches structural interior components</p>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            required
                            value={config.credit_costs['furniture-remover']}
                            onChange={(e) => setConfig({
                              ...config,
                              credit_costs: { ...config.credit_costs, 'furniture-remover': parseInt(e.target.value) || 0 }
                            })}
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                          />
                        </div>

                        {/* Room Redesign Card */}
                        <div className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-4 space-y-3">
                          <div>
                            <span className="text-xs font-semibold text-neutral-300">Room Redesign</span>
                            <p className="text-[10px] text-neutral-500 mt-0.5">Deep multi-conditioning diffusion styling</p>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max="50"
                            required
                            value={config.credit_costs['redesign']}
                            onChange={(e) => setConfig({
                              ...config,
                              credit_costs: { ...config.credit_costs, 'redesign': parseInt(e.target.value) || 0 }
                            })}
                            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="border-t border-neutral-800/80 pt-6 flex items-center justify-end gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={saving}
                        onClick={async () => {
                          setLoading(true);
                          try {
                            const res = await fetch('/api/admin/config');
                            if (res.ok) {
                              const data = await res.json();
                              setConfig({
                                app_mode: data.app_mode || 'development',
                                free_credits_on_signup: typeof data.free_credits_on_signup === 'number' ? data.free_credits_on_signup : 10,
                                credit_costs: {
                                  'room-changer': data.credit_costs?.['room-changer'] ?? 1,
                                  'furniture-remover': data.credit_costs?.['furniture-remover'] ?? 1,
                                  'redesign': data.credit_costs?.['redesign'] ?? 2,
                                }
                              });
                              setSaveStatus({ type: 'success', message: 'Settings reloaded from database.' });
                            }
                          } catch (err) {
                            setSaveStatus({ type: 'error', message: 'Failed to reload parameters.' });
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="text-neutral-400 hover:text-white"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reload
                      </Button>
                      <Button
                        type="submit"
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all duration-200"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Tuning Parameters
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
          </TabsContent>

        {/* ── General ── */}
        <TabsContent value="general" className="mt-4 space-y-4">
          {GENERAL_SETTINGS.map((section, si) => (
            <motion.div key={si} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.05 }}>
              <Card className="border-neutral-800 bg-neutral-900/50">
                <CardHeader className="p-5 pb-3">
                  <CardTitle className="text-sm font-medium text-neutral-300">{section.section}</CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-5 space-y-1">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between py-2.5 border-b border-neutral-800 last:border-0">
                      <span className="text-sm text-neutral-400">{item.label}</span>
                      {item.type === "badge" ? (
                        <Badge variant="outline" className={`${item.badge} text-xs`}>{item.value}</Badge>
                      ) : (
                        <span className="text-sm text-white font-medium">{item.value}</span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* ── API Keys ── */}
        <TabsContent value="api-keys" className="mt-4">
          <Card className="border-neutral-800 bg-neutral-900/50">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                Environment Variables
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500 mt-1">
                All secrets are stored in environment variables and never exposed client-side.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="space-y-2">
                {API_KEYS.map((key, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center justify-between py-2.5 border-b border-neutral-800 last:border-0"
                  >
                    <div>
                      <p className="text-sm text-white">{key.label}</p>
                      <p className="text-xs text-neutral-500 font-mono">{key.envVar}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Set
                      </Badge>
                      <span className="font-mono text-xs text-neutral-600">
                        {showSecrets[key.envVar] ? "env://••••••••••••" : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-neutral-500 hover:text-neutral-300"
                        onClick={() => toggleSecret(key.envVar)}
                      >
                        {showSecrets[key.envVar] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Webhooks ── */}
        <TabsContent value="webhooks" className="mt-4 space-y-4">
          {WEBHOOKS.map((wh, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-neutral-800 bg-neutral-900/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-white">{wh.name}</p>
                      <p className="text-xs text-neutral-500 font-mono mt-0.5">{wh.url}</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      {wh.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wh.events.map((ev) => (
                      <span key={ev} className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-mono">
                        {ev}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security" className="mt-4 space-y-4">
          {[
            { icon: <Lock className="w-4 h-4 text-emerald-400" />, title: "JWT Authentication", desc: "Signed HTTP-only cookies with 7-day expiry. Secret stored in env.", status: "active" },
            { icon: <Shield className="w-4 h-4 text-emerald-400" />, title: "Role-Based Access Control", desc: "Admin, customer, designer, contractor, vendor roles. All admin routes gated with requireRole(['admin']).", status: "active" },
            { icon: <Globe className="w-4 h-4 text-emerald-400" />, title: "CORS", desc: "Next.js default CORS policy. Only same-origin API calls allowed.", status: "active" },
            { icon: <Database className="w-4 h-4 text-amber-400" />, title: "Input Validation", desc: "Server-side Mongoose schema validation on all DB writes.", status: "active" },
            { icon: <Mail className="w-4 h-4 text-emerald-400" />, title: "Email Verification", desc: "OTP-based email verification on sign-up flow.", status: "active" },
            { icon: <Bell className="w-4 h-4 text-neutral-400" />, title: "Rate Limiting", desc: "No global rate limiter configured. Add via middleware if needed.", status: "not configured", warn: true },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border-neutral-800 bg-neutral-900/50 ${item.warn ? "border-amber-500/20" : ""}`}>
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="mt-0.5">{item.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-neutral-500 mt-1">{item.desc}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={item.warn
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    }
                  >
                    {item.status}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
