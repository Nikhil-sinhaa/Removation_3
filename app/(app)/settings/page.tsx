// app/(app)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Bell,
  Globe,
  CreditCard,
  Shield,
  Key,
  Palette,
  Monitor,
  Moon,
  Sun,
  Trash2,
  Download,
  LogOut,
  ChevronRight,
  Check,
  AlertTriangle,
  Loader2,
  Camera,
  Mail,
  Phone,
  MapPin,
  Building,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Zap,
  Crown,
  IndianRupee,
  DollarSign,
  Cpu,
  Cloud,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/components/ui/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { CreditBalance } from "@/components/payment/CreditBalance";
import { cn } from "@/lib/utils";
import { useTheme as useNextTheme } from "next-themes";
import { useUserStore } from "@/stores/user-store";

// Settings sections for navigation
const settingsSections = [
  { id: "profile", icon: User },
  { id: "notifications", icon: Bell },
  { id: "appearance", icon: Palette },
  { id: "language", icon: Globe },
  { id: "billing", icon: CreditCard },
  { id: "security", icon: Shield },
  { id: "api", icon: Key },
  { id: "data", icon: Download },
  { id: "gpu", icon: Cpu },
];

// Theme options
const themeOptions = [
  { value: "light", labelKey: "set_app_theme_light", icon: Sun },
  { value: "dark", labelKey: "set_app_theme_dark", icon: Moon },
  { value: "system", labelKey: "set_app_theme_system", icon: Monitor },
];

// Currency options
const currencyOptions = [
  { value: "INR", label: "Indian Rupee (₹)", symbol: "₹", icon: IndianRupee },
  { value: "USD", label: "US Dollar ($)", symbol: "$", icon: DollarSign },
];

// Subscription plans for reference
const plans = [
  {
    id: "free",
    name: "Free",
    nameHi: "मुफ़्त",
    price: 0,
    priceINR: 0,
    credits: 5,
    features: ["5 renders/month", "Basic styles", "720p export"],
  },
  {
    id: "pro",
    name: "Pro",
    nameHi: "प्रो",
    price: 29,
    priceINR: 2399,
    credits: 100,
    features: ["100 renders/month", "All 400+ styles", "4K export", "Vastu AI", "Cost Calculator"],
    popular: true,
  },
  {
    id: "teams",
    name: "Teams",
    nameHi: "टीम",
    price: 99,
    priceINR: 8199,
    credits: 500,
    features: ["500 renders/user/month", "Team collaboration", "API access", "Priority support"],
  },
];

// ── t('gpu_title') Panel ─────────────────────────────────────────────────────────────
type GPUModeType = 'local' | 'auto' | 'cloud';
interface GPUStatus {
  mode: GPUModeType;
  cloudUrl: string;
  localAlive: boolean;
  cloudAlive: boolean;
  activeSource: 'local' | 'cloud' | 'none';
  statusMessage: string;
  localVramFree?: number;
  cloudVramFree?: number;
}

function GPUModePanel() {
  const { t } = useLanguage();
  const [mode, setMode]         = useState<GPUModeType>('local');
  const [cloudUrl, setCloudUrl] = useState('');
  const [gpuStatus, setGPUStatus] = useState<GPUStatus | null>(null);
  const [saving, setSaving]     = useState(false);
  const [checking, setChecking] = useState(false);
  const [saved, setSaved]       = useState(false);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res  = await fetch('/api/settings/gpu/status');
      const data = await res.json();
      setGPUStatus(data);
    } finally { setChecking(false); }
  };

  useEffect(() => {
    fetch('/api/settings/gpu')
      .then(r => r.json())
      .then(d => { setMode(d.mode || 'local'); setCloudUrl(d.cloudUrl || ''); });
    checkStatus();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/settings/gpu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, cloudUrl }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      checkStatus();
    } finally { setSaving(false); }
  };

  const needsUrl = mode === 'cloud' || mode === 'auto';
  const bannerColor =
    gpuStatus?.activeSource === 'cloud' ? 'text-green-400 bg-green-900/20 border-green-700' :
    gpuStatus?.activeSource === 'local' ? 'text-yellow-400 bg-yellow-900/20 border-yellow-700' :
    'text-red-400 bg-red-900/20 border-red-700';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          t('gpu_title')
        </CardTitle>
        <CardDescription>
          t('gpu_desc')
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Live status banner */}
        <div className={`rounded-lg px-4 py-3 border text-sm flex items-center justify-between ${bannerColor}`}>
          <span>{checking ? t('gpu_check_status') : (gpuStatus?.statusMessage ?? 'Unknown')}</span>
          <button onClick={checkStatus} disabled={checking} className="opacity-70 hover:opacity-100 ml-2">
            <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Mode selector — 3 cards */}
        <div>
          <p className="text-sm font-medium mb-3">t('gpu_select_source')</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {([
              { id: 'local', labelKey: 'gpu_local_only', subKey: 'gpu_local_sub', icon: Cpu, color: 'purple' },
              { id: 'auto',  labelKey: 'gpu_auto', subKey: 'gpu_auto_sub', icon: Cloud, color: 'blue' },
              { id: 'cloud', labelKey: 'gpu_cloud_only', subKey: 'gpu_cloud_sub', icon: Cloud, color: 'blue' },
            ] as const).map(opt => {
              const active = mode === opt.id;
              const border = active
                ? (opt.color === 'purple' ? 'border-purple-500 bg-purple-950/30' : 'border-blue-500 bg-blue-950/30')
                : 'border-border hover:border-muted-foreground';
              const stat = opt.id === 'local' ? gpuStatus?.localAlive
                         : opt.id === 'cloud' ? gpuStatus?.cloudAlive : undefined;
              return (
                <button key={opt.id} onClick={() => setMode(opt.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${border}`}>
                  <opt.icon size={18} className={active ? (opt.color === 'purple' ? 'text-purple-400' : 'text-blue-400') : 'text-muted-foreground'} />
                  <div className="text-sm font-semibold mt-1">{t(opt.labelKey)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t(opt.subKey)}</div>
                  {stat !== undefined && (
                    <div className={`text-xs mt-1 flex items-center gap-1 ${stat ? 'text-green-400' : 'text-red-400'}`}>
                      {stat ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      {stat ? t('gpu_online') : t('gpu_offline')}
                      {opt.id === 'local' && stat && gpuStatus?.localVramFree ? ` · ${gpuStatus.localVramFree}MB` : ''}
                      {opt.id === 'cloud' && stat && gpuStatus?.cloudVramFree ? ` · ${gpuStatus.cloudVramFree}MB` : ''}
                    </div>
                  )}
                  {opt.id === 'auto' && <div className="text-xs text-blue-400 mt-1">t('gpu_recommended')</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Cloud URL input */}
        {needsUrl && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">t('gpu_colab_url')</label>
            <input
              type="text"
              value={cloudUrl}
              onChange={e => setCloudUrl(e.target.value)}
              placeholder="https://abc123.trycloudflare.com"
              className="w-full rounded-lg border bg-muted px-4 py-2.5 text-base font-mono min-h-[44px] focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              t('gpu_colab_help')
            </p>
            {mode === 'cloud' && cloudUrl && !gpuStatus?.cloudAlive && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <XCircle size={12} /> t('gpu_colab_unreachable')
              </p>
            )}
          </div>
        )}

        {/* Description */}
        <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          {mode === 'local' && t('gpu_desc_local')}
          {mode === 'auto' && t('gpu_desc_auto')}
          {mode === 'cloud' && t('gpu_desc_cloud')}
        </div>

        {/* Connection details */}
        {gpuStatus && (
          <div className="space-y-2 rounded-lg border p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">t('gpu_connection_details')</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">t('gpu_local_gpu')</span>
              <span className={gpuStatus.localAlive ? 'text-green-400' : 'text-red-400'}>
                {gpuStatus.localAlive ? `🟢 localhost:8188${gpuStatus.localVramFree ? ` · ${gpuStatus.localVramFree}MB` : ''}` : t('gpu_not_running')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">t('gpu_cloud_gpu')</span>
              <span className={gpuStatus.cloudAlive ? 'text-green-400' : gpuStatus.cloudUrl ? 'text-red-400' : 'text-muted-foreground'}>
                {gpuStatus.cloudAlive ? `🟢 Colab T4${gpuStatus.cloudVramFree ? ` · ${gpuStatus.cloudVramFree}MB` : ''}` : gpuStatus.cloudUrl ? t('gpu_not_reachable') : t('gpu_no_url_set')}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-1">
              <span className="text-muted-foreground">t('gpu_currently_routing')</span>
              <span className="font-medium">
                {gpuStatus.activeSource === 'cloud' ? t('gpu_cloud_t4') : gpuStatus.activeSource === 'local' ? t('gpu_local_rtx') : t('gpu_none')}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} disabled={saving}>
          {saving  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> t('gpu_saving')</> :
           saved   ? <><Check className="h-4 w-4 mr-2" /> t('gpu_saved')</> :
                     <><Check className="h-4 w-4 mr-2" /> t('gpu_save_btn')</>}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SettingsPage() {
  const { user, isLoading, logout } = useAuth();
  const isSignedIn = !!user;
  const { language, setLanguage, t } = useLanguage();
  const { theme: nextTheme, setTheme: setNextTheme } = useNextTheme();
  const userStore = useUserStore();

  const [activeSection, setActiveSection] = useState("profile");
  const [sectionRenderKey, setSectionRenderKey] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    city: "",
    country: "India",
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    theme: "system",
    currency: "INR",
    measurementUnit: "sqft",
    defaultStyle: "modern",
    autoVastu: true,
    autoCost: true,
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailRenders: true,
    emailNewsletter: false,
    emailTips: true,
    pushRenders: true,
    pushUpdates: false,
    smsAlerts: false,
    soundEnabled: true,
    browserNotificationsEnabled: false,
  });

  // Load preferences from Zustand store on mount
  useEffect(() => {
    if (userStore.preferences) {
      setPreferences({
        theme: userStore.preferences.theme || "system",
        currency: userStore.preferences.currency || "INR",
        measurementUnit: "sqft",
        defaultStyle: userStore.preferences.defaultStyle || "modern",
        autoVastu: userStore.preferences.vastuEnabled ?? true,
        autoCost: userStore.preferences.costPanelEnabled ?? true,
      });
      setNotifications({
        emailRenders: userStore.preferences.emailNotifications ?? true,
        emailNewsletter: userStore.preferences.marketingEmails ?? false,
        emailTips: userStore.preferences.showTips ?? true,
        pushRenders: true,
        pushUpdates: false,
        smsAlerts: false,
        soundEnabled: userStore.preferences.soundEnabled ?? true,
        browserNotificationsEnabled: userStore.preferences.browserNotificationsEnabled ?? false,
      });
    }
  }, [userStore.preferences]);

  // Subscription info — loaded from /api/user
  const [subscription, setSubscription] = useState({
    plan: "free",
    status: "active",
    credits: 0,
    creditsTotal: 10,
    renewalDate: "",
    billingCycle: "monthly",
  });

  // API Key — loaded from server (after regenerate), initially empty
  const [apiKey, setApiKey] = useState("");

  // Load user data and real subscription from DB
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: "",
        company: "",
        city: "",
        country: "India",
      });
    }

    // Fetch real subscription data
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        const sub = data.subscription;
        if (sub) {
          setSubscription({
            plan: sub.plan || "free",
            status: sub.status || "active",
            credits: sub.credits ?? data.credits ?? 0,
            creditsTotal: sub.plan === "pro" ? 100 : sub.plan === "team" ? 500 : 10,
            renewalDate: sub.currentPeriodEnd
              ? new Date(sub.currentPeriodEnd).toISOString().split("T")[0]
              : "",
            billingCycle: "monthly",
          });
        }
      })
      .catch(() => {
        // Non-fatal — keep default state
      });
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      toast({
        title: t('set_prof_updated_title'),
        description: t('set_prof_updated_desc'),
      });
    } catch (error) {
      toast({
        title: t('set_prof_error_title'),
        description: t('set_prof_error_desc'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle preferences save
  const handlePreferencesSave = async () => {
    setIsSaving(true);
    try {
      // Update Zustand user store
      userStore.setPreferences({
        theme: preferences.theme as any,
        currency: preferences.currency as any,
        defaultStyle: preferences.defaultStyle,
        vastuEnabled: preferences.autoVastu,
        costPanelEnabled: preferences.autoCost,
        emailNotifications: notifications.emailRenders,
        marketingEmails: notifications.emailNewsletter,
        showTips: notifications.emailTips,
        soundEnabled: notifications.soundEnabled,
        browserNotificationsEnabled: notifications.browserNotificationsEnabled,
      });

      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, notifications }),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      toast({
        title: t('set_notif_saved_title'),
        description: t('set_notif_saved_desc'),
      });
    } catch (error) {
      toast({
        title: t('set_prof_error_title'),
        description: t('set_notif_error_desc'),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Regenerate API key (server-side)
  const handleRegenerateApiKey = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/api-key", { method: "POST" });
      if (!response.ok) throw new Error("Failed to generate key");
      const data = await response.json();
      setApiKey(data.key);

      toast({
        title: t('set_api_regen_title'),
        description: t('set_api_regen_desc'),
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to regenerate API key.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Copy API key
  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast({
      title: t('set_api_copied_title'),
      description: t('set_api_copied_desc'),
    });
  };

  // Export data — downloads JSON + HTML report
  const handleExportData = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/export", { method: "POST" });
      if (!response.ok) throw new Error("Export failed");

      const result = await response.json();
      const dateStr = new Date().toISOString().split("T")[0];

      // Download JSON
      const jsonBlob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
      const jsonUrl  = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement("a");
      jsonLink.href = jsonUrl;
      jsonLink.download = `removation-export-${dateStr}.json`;
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      URL.revokeObjectURL(jsonUrl);

      // Download HTML report
      const htmlBlob = new Blob([result.htmlReport], { type: "text/html" });
      const htmlUrl  = URL.createObjectURL(htmlBlob);
      const htmlLink = document.createElement("a");
      htmlLink.href = htmlUrl;
      htmlLink.download = `removation-report-${dateStr}.html`;
      document.body.appendChild(htmlLink);
      htmlLink.click();
      document.body.removeChild(htmlLink);
      URL.revokeObjectURL(htmlUrl);

      setExportStatus({ completedAt: new Date().toISOString() });
      toast({
        title: t('set_data_toast_title'),
        description: t('set_data_toast_desc'),
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Deletion request state
  const [deletionReason, setDeletionReason]       = useState("");
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [pendingDeletion, setPendingDeletion]       = useState<{ _id: string; createdAt: string } | null>(null);
  const [deletionLoading, setDeletionLoading]       = useState(false);
  const [exportStatus, setExportStatus]             = useState<{ completedAt?: string } | null>(null);

  // Load pending deletion request + last export on mount
  useEffect(() => {
    fetch('/api/user/delete-request')
      .then(r => r.json())
      .then(d => { if (d.request) setPendingDeletion(d.request); })
      .catch(() => {});
    fetch('/api/user/export')
      .then(r => r.json())
      .then(d => { if (d.request?.processedAt) setExportStatus({ completedAt: d.request.processedAt }); })
      .catch(() => {});
  }, []);

  const handleDeleteAccount = async () => {
    setDeletionLoading(true);
    try {
      const res = await fetch('/api/user/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deletionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setPendingDeletion({ _id: data.requestId, createdAt: new Date().toISOString() });
      setDeletionDialogOpen(false);
      setDeletionReason("");
      toast({
        title: t('set_del_toast_title'),
        description: t('set_del_toast_desc'),
      });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to submit request.",
        variant: "destructive",
      });
    } finally {
      setDeletionLoading(false);
    }
  };

  const handleCancelDeletion = async () => {
    try {
      await fetch('/api/user/delete-request', { method: 'DELETE' });
      setPendingDeletion(null);
      toast({
        title: t('set_del_cancel_title'),
        description: t('set_del_cancel_desc'),
      });
    } catch {
      toast({ title: "Error", description: "Failed to cancel request.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">
                {t('set_title')}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t('set_desc')}
              </p>
            </div>
            <CreditBalance />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-64 flex-shrink-0">
            {/* Mobile: horizontal scrollable tab strip */}
            <nav className="flex lg:hidden overflow-x-auto gap-2 pb-2 mb-4 scrollbar-hide snap-x snap-mandatory">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSectionRenderKey(prev => prev + 1);
                    setActiveSection(section.id);
                  }}
                  className={cn(
                    "flex-shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[44px]",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <section.icon className="h-4 w-4 flex-shrink-0" />
                  {t('set_sect_' + section.id)}
                </button>
              ))}
              <button
                onClick={() => logout()}
                className="flex-shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium min-h-[44px] text-red-500 bg-red-50 dark:bg-red-950/20 whitespace-nowrap"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {t('set_signout')}
              </button>
            </nav>

            {/* Desktop: vertical sticky nav */}
            <nav className="hidden lg:flex flex-col space-y-1 sticky top-28">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSectionRenderKey(prev => prev + 1);
                    setActiveSection(section.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <section.icon className="h-5 w-5" />
                  <span className="font-medium">
                    {t('set_sect_' + section.id)}
                  </span>
                  {activeSection === section.id && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </button>
              ))}
              <Separator className="my-4" />
              <button
                onClick={() => logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">
                  {t('set_signout')}
                </span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-3xl">
            <AnimatePresence mode="sync">
              <motion.div
                key={`${activeSection}-${sectionRenderKey}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Profile Section */}
                {activeSection === "profile" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {t('set_prof_title')}
                      </CardTitle>
                      <CardDescription>
                        {t('set_prof_desc')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar */}
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border-4 border-primary/10">
                          <AvatarImage src={user?.imageUrl} />
                          <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/60 text-white">
                            {profile.firstName?.[0]}{profile.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Button variant="outline" size="sm">
                            <Camera className="h-4 w-4 mr-2" />
                            {t('set_prof_change_photo')}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {t('set_prof_photo_limit')}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Form Fields */}
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">
                            {t('set_prof_fname')}
                          </Label>
                          <Input
                            id="firstName"
                            value={profile.firstName}
                            onChange={(e) =>
                              setProfile({ ...profile, firstName: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">
                            {t('set_prof_lname')}
                          </Label>
                          <Input
                            id="lastName"
                            value={profile.lastName}
                            onChange={(e) =>
                              setProfile({ ...profile, lastName: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">
                          <Mail className="h-4 w-4 inline mr-2" />
                          {t('set_prof_email')}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="w-full"
                          autoComplete="email"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('set_prof_email_hint')}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          <Phone className="h-4 w-4 inline mr-2" />
                          {t('set_prof_phone')}
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profile.phone}
                          onChange={(e) =>
                            setProfile({ ...profile, phone: e.target.value })
                          }
                          placeholder="+91 98765 43210"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">
                          <Building className="h-4 w-4 inline mr-2" />
                          {t('set_prof_company')}
                        </Label>
                        <Input
                          id="company"
                          value={profile.company}
                          onChange={(e) =>
                            setProfile({ ...profile, company: e.target.value })
                          }
                          placeholder={t('set_prof_optional')}
                        />
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="city">
                            <MapPin className="h-4 w-4 inline mr-2" />
                            {t('set_prof_city')}
                          </Label>
                          <Input
                            id="city"
                            value={profile.city}
                            onChange={(e) =>
                              setProfile({ ...profile, city: e.target.value })
                            }
                            placeholder="Mumbai"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">
                            {t('set_prof_country')}
                          </Label>
                          <Select
                            value={profile.country}
                            onValueChange={(value) =>
                              setProfile({ ...profile, country: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="India">🇮🇳 India</SelectItem>
                              <SelectItem value="USA">🇺🇸 United States</SelectItem>
                              <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
                              <SelectItem value="UAE">🇦🇪 UAE</SelectItem>
                              <SelectItem value="Singapore">🇸🇬 Singapore</SelectItem>
                              <SelectItem value="Australia">🇦🇺 Australia</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleProfileUpdate} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {t('set_prof_save')}
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {/* Notifications Section */}
                {activeSection === "notifications" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        {t('set_notif_title')}
                      </CardTitle>
                      <CardDescription>
                        {t('set_notif_desc')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Email Notifications */}
                      <div>
                        <h3 className="font-semibold mb-4">
                          {t('set_notif_email')}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {t('set_notif_render_title')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t('set_notif_render_desc')}
                              </p>
                            </div>
                            <Switch
                              checked={notifications.emailRenders}
                              onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, emailRenders: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {t('set_notif_tips_title')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t('set_notif_tips_desc')}
                              </p>
                            </div>
                            <Switch
                              checked={notifications.emailTips}
                              onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, emailTips: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {t('set_notif_newsletter_title')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t('set_notif_newsletter_desc')}
                              </p>
                            </div>
                            <Switch
                              checked={notifications.emailNewsletter}
                              onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, emailNewsletter: checked })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Push & Sound Notifications */}
                      <div>
                        <h3 className="font-semibold mb-4">
                          {t('set_notif_push_sound')}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {t('set_notif_push_render_title')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t('set_notif_push_render_desc')}
                              </p>
                            </div>
                            <Switch
                              checked={notifications.pushRenders}
                              onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, pushRenders: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {t('set_notif_desktop_push_title')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t('set_notif_desktop_push_desc')}
                              </p>
                            </div>
                            <Switch
                              checked={notifications.browserNotificationsEnabled}
                              onCheckedChange={async (checked) => {
                                if (checked && typeof window !== 'undefined' && 'Notification' in window) {
                                  const permission = await window.Notification.requestPermission();
                                  if (permission !== 'granted') {
                                    toast({
                                      title: t('set_notif_perm_denied_title'),
                                      description: t('set_notif_perm_denied_desc'),
                                      variant: "destructive"
                                    });
                                    setNotifications({ ...notifications, browserNotificationsEnabled: false });
                                    return;
                                  }
                                }
                                setNotifications({ ...notifications, browserNotificationsEnabled: checked });
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {t('set_notif_sound_title')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t('set_notif_sound_desc')}
                              </p>
                            </div>
                            <Switch
                              checked={notifications.soundEnabled}
                              onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, soundEnabled: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {t('set_notif_updates_title')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {t('set_notif_updates_desc')}
                              </p>
                            </div>
                            <Switch
                              checked={notifications.pushUpdates}
                              onCheckedChange={(checked) =>
                                setNotifications({ ...notifications, pushUpdates: checked })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* SMS Notifications */}
                      <div>
                        <h3 className="font-semibold mb-4">
                          {t('set_notif_sms')}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {t('set_notif_sms_critical_title')}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t('set_notif_sms_critical_desc')}
                            </p>
                          </div>
                          <Switch
                            checked={notifications.smsAlerts}
                            onCheckedChange={(checked) =>
                              setNotifications({ ...notifications, smsAlerts: checked })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handlePreferencesSave} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {t('set_notif_save')}
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {/* Appearance Section */}
                {activeSection === "appearance" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        {t('set_app_title')}
                      </CardTitle>
                      <CardDescription>
                        {t('set_app_desc')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Theme Selection */}
                      <div>
                        <Label className="text-base font-semibold">
                          {t('set_app_theme')}
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          {t('set_app_theme_desc')}
                        </p>
                        <RadioGroup
                          value={preferences.theme}
                          onValueChange={(value) => {
                            setPreferences({ ...preferences, theme: value });
                            setNextTheme(value);
                          }}
                          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                        >
                          {themeOptions.map((theme) => (
                            <div key={theme.value}>
                              <RadioGroupItem
                                value={theme.value}
                                id={theme.value}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={theme.value}
                                className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                              >
                                <theme.icon className="mb-3 h-6 w-6" />
                                {t(theme.labelKey)}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <Separator />

                      {/* Default Style */}
                      <div className="space-y-2">
                        <Label>
                          {t('set_app_style')}
                        </Label>
                        <Select
                          value={preferences.defaultStyle}
                          onValueChange={(value) =>
                            setPreferences({ ...preferences, defaultStyle: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="modern">Modern Minimalist</SelectItem>
                            <SelectItem value="contemporary">Contemporary</SelectItem>
                            <SelectItem value="traditional">Traditional Indian</SelectItem>
                            <SelectItem value="scandinavian">Scandinavian</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                            <SelectItem value="bohemian">Bohemian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Auto Vastu */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {t('set_app_vastu')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('set_app_vastu_desc')}
                          </p>
                        </div>
                        <Switch
                          checked={preferences.autoVastu}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, autoVastu: checked })
                          }
                        />
                      </div>

                      {/* Auto Cost */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {t('set_app_cost')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('set_app_cost_desc')}
                          </p>
                        </div>
                        <Switch
                          checked={preferences.autoCost}
                          onCheckedChange={(checked) =>
                            setPreferences({ ...preferences, autoCost: checked })
                          }
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handlePreferencesSave} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {t('set_prof_save')}
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {/* Language & Region Section */}
                {activeSection === "language" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        {t('set_lang_title')}
                      </CardTitle>
                      <CardDescription>
                        {t('set_lang_desc')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Language */}
                      <div className="space-y-2">
                        <Label>{t('set_lang_label')}</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setLanguage("en")}
                            className={cn(
                              "p-4 rounded-lg border-2 transition-all text-left",
                              language === "en"
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🇬🇧</span>
                              <div>
                                <p className="font-medium">English</p>
                                <p className="text-sm text-muted-foreground">
                                  United States
                                </p>
                              </div>
                            </div>
                            {language === "en" && (
                              <Check className="h-5 w-5 text-primary mt-2" />
                            )}
                          </button>
                          <button
                            onClick={() => setLanguage("hi")}
                            className={cn(
                              "p-4 rounded-lg border-2 transition-all text-left",
                              language === "hi"
                                ? "border-primary bg-primary/5"
                                : "border-muted hover:border-primary/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">🇮🇳</span>
                              <div>
                                <p className="font-medium">हिंदी</p>
                                <p className="text-sm text-muted-foreground">
                                  भारत
                                </p>
                              </div>
                            </div>
                            {language === "hi" && (
                              <Check className="h-5 w-5 text-primary mt-2" />
                            )}
                          </button>
                        </div>
                      </div>

                      <Separator />

                      {/* Currency */}
                      <div className="space-y-2">
                        <Label>{t('set_lang_currency')}</Label>
                        <RadioGroup
                          value={preferences.currency}
                          onValueChange={(value) =>
                            setPreferences({ ...preferences, currency: value })
                          }
                          className="grid grid-cols-2 gap-4"
                        >
                          {currencyOptions.map((currency) => (
                            <div key={currency.value}>
                              <RadioGroupItem
                                value={currency.value}
                                id={currency.value}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={currency.value}
                                className="flex items-center gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent cursor-pointer peer-data-[state=checked]:border-primary"
                              >
                                <currency.icon className="h-5 w-5" />
                                <div>
                                  <p className="font-medium">{currency.label}</p>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Measurement Unit */}
                      <div className="space-y-2">
                        <Label>
                          {t('set_lang_unit')}
                        </Label>
                        <Select
                          value={preferences.measurementUnit}
                          onValueChange={(value) =>
                            setPreferences({ ...preferences, measurementUnit: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sqft">Square Feet (sq ft)</SelectItem>
                            <SelectItem value="sqm">Square Meters (m²)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handlePreferencesSave} disabled={isSaving}>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-2" />
                        )}
                        {t('set_prof_save')}
                      </Button>
                    </CardFooter>
                  </Card>
                )}

                {/* Billing Section */}
                {activeSection === "billing" && (
                  <div className="space-y-6">
                    {/* Current Plan */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5" />
                          {t('set_bill_title')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary rounded-lg">
                              <Crown className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold">
                                  {t('plan_' + subscription.plan)}
                                </h3>
                                <Badge variant="default" className="bg-primary">
                                  {t('set_bill_active')}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                {language === "hi" ? `₹${plans.find(p => p.id === subscription.plan)?.priceINR}/माह` : `$${plans.find(p => p.id === subscription.plan)?.price}/month`}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline">
                            {t('set_bill_change_plan')}
                          </Button>
                        </div>

                        {/* Credits Usage */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {t('set_bill_usage')}
                            </span>
                            <span className="text-muted-foreground">
                              {subscription.credits} / {subscription.creditsTotal}
                            </span>
                          </div>
                          <Progress
                            value={(subscription.credits / subscription.creditsTotal) * 100}
                            className="h-2"
                          />
                          <p className="text-sm text-muted-foreground mt-2">
                            {`${t('set_bill_renews')}${new Date(subscription.renewalDate).toLocaleDateString(language === "hi" ? "hi-IN" : "en-US")}`}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button variant="outline">
                            <Zap className="h-4 w-4 mr-2" />
                            {t('set_bill_buy_credits')}
                          </Button>
                          <Button variant="ghost" className="text-muted-foreground">
                            {t('set_bill_history')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {t('set_bill_methods')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded">
                              <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">•••• •••• •••• 4242</p>
                              <p className="text-sm text-muted-foreground">
                                Expires 12/26
                              </p>
                            </div>
                          </div>
                          <Badge>{t('set_bill_default')}</Badge>
                        </div>

                        <Button variant="outline" className="w-full">
                          {t('set_bill_add_method')}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Security Section */}
                {activeSection === "security" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        {t('set_sec_title')}
                      </CardTitle>
                      <CardDescription>
                        {t('set_sec_desc')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Password */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {t('set_sec_pwd')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('set_sec_pwd_changed')}
                          </p>
                        </div>
                        <Button variant="outline">
                          {t('set_sec_change')}
                        </Button>
                      </div>

                      <Separator />

                      {/* Two Factor */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {t('set_sec_2fa')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {t('set_sec_2fa_desc')}
                          </p>
                        </div>
                        <Switch />
                      </div>

                      <Separator />

                      {/* Active Sessions */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="font-medium">
                            {t('set_sec_sessions')}
                          </p>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            {t('set_sec_logout_all')}
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Monitor className="h-5 w-5" />
                              <div>
                                <p className="font-medium">Chrome on Windows</p>
                                <p className="text-xs text-muted-foreground">
                                  Mumbai, India • {t('set_sec_active_now')}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              {t('set_sec_current')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* API Access Section */}
                {activeSection === "api" && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        {t('set_api_title')}
                      </CardTitle>
                      <CardDescription>
                        {t('set_api_desc')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                              {t('set_api_secure_title')}
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              {t('set_api_secure_desc')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{t('set_api_key_label')}</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showApiKey ? "text" : "password"}
                              value={apiKey}
                              readOnly
                              className="pr-10 font-mono"
                            />
                            <button
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2"
                            >
                              {showApiKey ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                            </button>
                          </div>
                          <Button variant="outline" onClick={handleCopyApiKey}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline">
                              <RefreshCw className="h-4 w-4 mr-2" />
                              {t('set_api_regenerate')}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {t('set_api_confirm_title')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('set_api_confirm_desc')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {t('set_api_cancel')}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleRegenerateApiKey}>
                                {t('set_api_yes_regen')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="ghost" asChild>
                          <a
                            href="https://docs.removation.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('set_api_docs')}
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Data & Privacy Section */}
                {activeSection === "data" && (
                  <div className="space-y-6">
                    {/* Data Export */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Download className="h-5 w-5" />
                          {t('set_data_title')}
                        </CardTitle>
                        <CardDescription>
                          {t('set_data_desc')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {exportStatus?.completedAt && (
                          <p className="text-sm text-muted-foreground">
                            {t('set_data_last_export')}{" "}
                            {new Date(exportStatus.completedAt).toLocaleDateString()}
                          </p>
                        )}
                        <Button onClick={handleExportData} disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          {t('set_data_btn')}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          {t('set_data_format_desc')}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Account Deletion */}
                    <Card className="border-red-200 dark:border-red-900">
                      <CardHeader>
                        <CardTitle className="text-red-500 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          {t('set_del_title')}
                        </CardTitle>
                        <CardDescription>
                          {t('set_del_desc')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {pendingDeletion ? (
                          <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                              <div>
                                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                                  {t('set_del_pending_title')}
                                </p>
                                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                                  {t('set_del_pending_submitted')}{" "}
                                  {new Date(pendingDeletion.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelDeletion}
                              className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-950"
                            >
                              {t('set_del_cancel_btn')}
                            </Button>
                          </div>
                        ) : (
                          <Dialog open={deletionDialogOpen} onOpenChange={setDeletionDialogOpen}>
                            <Button
                              variant="destructive"
                              onClick={() => setDeletionDialogOpen(true)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t('set_del_btn')}
                            </Button>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {t('set_del_dialog_title')}
                                </DialogTitle>
                                <DialogDescription>
                                  {t('set_del_dialog_desc')}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-3 py-2">
                                <Label htmlFor="deletion-reason">
                                  {t('set_del_reason_label')}
                                </Label>
                                <Textarea
                                  id="deletion-reason"
                                  value={deletionReason}
                                  onChange={e => setDeletionReason(e.target.value)}
                                  placeholder={t('set_del_reason_placeholder')}
                                  rows={3}
                                />
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeletionDialogOpen(false)}>
                                  {t('set_api_cancel')}
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleDeleteAccount}
                                  disabled={deletionLoading}
                                >
                                  {deletionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                  {t('set_del_submit_btn')}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* t('gpu_title') Section */}
                {activeSection === "gpu" && <GPUModePanel />}

              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}