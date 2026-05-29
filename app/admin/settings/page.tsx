// app/admin/settings/page.tsx
"use client";

import { useState } from "react";
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

  const toggleSecret = (key: string) =>
    setShowSecrets((s) => ({ ...s, [key]: !s[key] }));

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-neutral-400 mt-1">
          System configuration, API keys, and webhook reference (read-only)
        </p>
      </div>

      {/* ── Read-only notice ── */}
      <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/5 p-4">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />
        <p className="text-sm text-blue-300">
          Settings are managed via environment variables and config files. Changes require a deployment.
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="bg-neutral-900 border border-neutral-800">
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
