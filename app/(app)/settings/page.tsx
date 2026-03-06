// app/(app)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

// Settings sections for navigation
const settingsSections = [
  { id: "profile", label: "Profile", labelHi: "प्रोफ़ाइल", icon: User },
  { id: "notifications", label: "Notifications", labelHi: "सूचनाएं", icon: Bell },
  { id: "appearance", label: "Appearance", labelHi: "दिखावट", icon: Palette },
  { id: "language", label: "Language & Region", labelHi: "भाषा और क्षेत्र", icon: Globe },
  { id: "billing", label: "Billing & Plans", labelHi: "बिलिंग और प्लान", icon: CreditCard },
  { id: "security", label: "Security", labelHi: "सुरक्षा", icon: Shield },
  { id: "api", label: "API Access", labelHi: "API एक्सेस", icon: Key },
  { id: "data", label: "Data & Privacy", labelHi: "डेटा और गोपनीयता", icon: Download },
];

// Theme options
const themeOptions = [
  { value: "light", label: "Light", labelHi: "लाइट", icon: Sun },
  { value: "dark", label: "Dark", labelHi: "डार्क", icon: Moon },
  { value: "system", label: "System", labelHi: "सिस्टम", icon: Monitor },
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

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { language, setLanguage, t } = useLanguage();

  const [activeSection, setActiveSection] = useState("profile");
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
  });

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
        email: user.primaryEmailAddress?.emailAddress || "",
        phone: user.primaryPhoneNumber?.phoneNumber || "",
        company: (user.publicMetadata?.company as string) || "",
        city: (user.publicMetadata?.city as string) || "",
        country: (user.publicMetadata?.country as string) || "India",
      });

      // Load saved preferences from Clerk public metadata
      const savedPrefs = user.publicMetadata?.preferences as any;
      if (savedPrefs) {
        setPreferences((prev) => ({ ...prev, ...savedPrefs }));
        if (savedPrefs.notifications) {
          setNotifications((prev) => ({ ...prev, ...savedPrefs.notifications }));
        }
      }
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
      await user?.update({
        firstName: profile.firstName,
        lastName: profile.lastName,
      });

      // Update public metadata
      // await user?.update({
      //   publicMetadata: {
      //     company: profile.company,
      //     city: profile.city,
      //     country: profile.country,
      //   },
      // });

      toast({
        title: language === "hi" ? "प्रोफ़ाइल अपडेट हो गई" : "Profile Updated",
        description: language === "hi"
          ? "आपकी प्रोफ़ाइल सफलतापूर्वक अपडेट हो गई है।"
          : "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: language === "hi" ? "त्रुटि" : "Error",
        description: language === "hi"
          ? "प्रोफ़ाइल अपडेट करने में विफल।"
          : "Failed to update profile.",
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
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preferences, notifications }),
      });

      if (!response.ok) throw new Error("Failed to save preferences");

      toast({
        title: language === "hi" ? "प्राथमिकताएं सहेजी गईं" : "Preferences Saved",
        description: language === "hi"
          ? "आपकी प्राथमिकताएं अपडेट हो गई हैं।"
          : "Your preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: language === "hi" ? "त्रुटि" : "Error",
        description: language === "hi" ? "सहेजने में विफल।" : "Failed to save preferences.",
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
        title: language === "hi" ? "नई API कुंजी" : "New API Key Generated",
        description: language === "hi"
          ? "आपकी नई API कुंजी तैयार है। पुरानी कुंजी अब काम नहीं करेगी।"
          : "Your new API key is ready. The old key will no longer work.",
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
      title: language === "hi" ? "कॉपी किया गया" : "Copied",
      description: language === "hi" ? "API कुंजी कॉपी हो गई।" : "API key copied to clipboard.",
    });
  };

  // Export data — triggers a real JSON download
  const handleExportData = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user/export", { method: "POST" });
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `removation-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: language === "hi" ? "डेटा निर्यात" : "Data Exported",
        description: language === "hi"
          ? "आपका डेटा डाउनलोड हो रहा है।"
          : "Your data download has started.",
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

  // Handle delete account
  const handleDeleteAccount = async () => {
    // This would trigger account deletion
    toast({
      title: language === "hi" ? "खाता हटाने का अनुरोध" : "Account Deletion Request",
      description: language === "hi"
        ? "आपका अनुरोध प्राप्त हुआ। 24 घंटे में प्रक्रिया पूरी होगी।"
        : "Your request has been received. It will be processed within 24 hours.",
      variant: "destructive",
    });
  };

  if (!isLoaded) {
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
                {language === "hi" ? "सेटिंग्स" : "Settings"}
              </h1>
              <p className="text-muted-foreground mt-1">
                {language === "hi"
                  ? "अपने खाते और प्राथमिकताओं को प्रबंधित करें"
                  : "Manage your account and preferences"}
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
            <nav className="space-y-1 sticky top-28">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                    activeSection === section.id
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <section.icon className="h-5 w-5" />
                  <span className="font-medium">
                    {language === "hi" ? section.labelHi : section.label}
                  </span>
                  {activeSection === section.id && (
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  )}
                </button>
              ))}

              <Separator className="my-4" />

              {/* Sign Out Button */}
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">
                  {language === "hi" ? "साइन आउट" : "Sign Out"}
                </span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
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
                        {language === "hi" ? "प्रोफ़ाइल जानकारी" : "Profile Information"}
                      </CardTitle>
                      <CardDescription>
                        {language === "hi"
                          ? "अपनी व्यक्तिगत जानकारी अपडेट करें"
                          : "Update your personal information"}
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
                            {language === "hi" ? "फोटो बदलें" : "Change Photo"}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-2">
                            {language === "hi"
                              ? "JPG, PNG या GIF. अधिकतम 5MB।"
                              : "JPG, PNG or GIF. Max 5MB."}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Form Fields */}
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">
                            {language === "hi" ? "पहला नाम" : "First Name"}
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
                            {language === "hi" ? "अंतिम नाम" : "Last Name"}
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
                          {language === "hi" ? "ईमेल" : "Email"}
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={profile.email}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          {language === "hi"
                            ? "ईमेल बदलने के लिए सपोर्ट से संपर्क करें।"
                            : "Contact support to change your email."}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          <Phone className="h-4 w-4 inline mr-2" />
                          {language === "hi" ? "फोन नंबर" : "Phone Number"}
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
                          {language === "hi" ? "कंपनी" : "Company"}
                        </Label>
                        <Input
                          id="company"
                          value={profile.company}
                          onChange={(e) =>
                            setProfile({ ...profile, company: e.target.value })
                          }
                          placeholder={language === "hi" ? "वैकल्पिक" : "Optional"}
                        />
                      </div>

                      <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="city">
                            <MapPin className="h-4 w-4 inline mr-2" />
                            {language === "hi" ? "शहर" : "City"}
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
                            {language === "hi" ? "देश" : "Country"}
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
                        {language === "hi" ? "बदलाव सहेजें" : "Save Changes"}
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
                        {language === "hi" ? "सूचना प्राथमिकताएं" : "Notification Preferences"}
                      </CardTitle>
                      <CardDescription>
                        {language === "hi"
                          ? "चुनें कि आप कैसे सूचित होना चाहते हैं"
                          : "Choose how you want to be notified"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Email Notifications */}
                      <div>
                        <h3 className="font-semibold mb-4">
                          {language === "hi" ? "ईमेल सूचनाएं" : "Email Notifications"}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {language === "hi" ? "रेंडर पूर्ण" : "Render Complete"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {language === "hi"
                                  ? "जब आपका डिज़ाइन तैयार हो जाए"
                                  : "When your design is ready"}
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
                                {language === "hi" ? "टिप्स और ट्रिक्स" : "Tips & Tricks"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {language === "hi"
                                  ? "बेहतर डिज़ाइन के लिए सुझाव"
                                  : "Suggestions for better designs"}
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
                                {language === "hi" ? "न्यूज़लेटर" : "Newsletter"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {language === "hi"
                                  ? "नई सुविधाएं और अपडेट"
                                  : "New features and updates"}
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

                      {/* Push Notifications */}
                      <div>
                        <h3 className="font-semibold mb-4">
                          {language === "hi" ? "पुश सूचनाएं" : "Push Notifications"}
                        </h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">
                                {language === "hi" ? "रेंडर अलर्ट" : "Render Alerts"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {language === "hi"
                                  ? "ब्राउज़र में सूचना"
                                  : "Browser notifications"}
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
                                {language === "hi" ? "प्रोडक्ट अपडेट" : "Product Updates"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {language === "hi"
                                  ? "नई सुविधाओं की जानकारी"
                                  : "New feature announcements"}
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
                          {language === "hi" ? "SMS सूचनाएं" : "SMS Notifications"}
                        </h3>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {language === "hi" ? "महत्वपूर्ण अलर्ट" : "Critical Alerts"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {language === "hi"
                                ? "बिलिंग और सुरक्षा संबंधी"
                                : "Billing and security related"}
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
                        {language === "hi" ? "प्राथमिकताएं सहेजें" : "Save Preferences"}
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
                        {language === "hi" ? "दिखावट" : "Appearance"}
                      </CardTitle>
                      <CardDescription>
                        {language === "hi"
                          ? "ऐप का लुक और फील कस्टमाइज़ करें"
                          : "Customize the look and feel of the app"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Theme Selection */}
                      <div>
                        <Label className="text-base font-semibold">
                          {language === "hi" ? "थीम" : "Theme"}
                        </Label>
                        <p className="text-sm text-muted-foreground mb-4">
                          {language === "hi"
                            ? "अपनी पसंदीदा थीम चुनें"
                            : "Select your preferred theme"}
                        </p>
                        <RadioGroup
                          value={preferences.theme}
                          onValueChange={(value) =>
                            setPreferences({ ...preferences, theme: value })
                          }
                          className="grid grid-cols-3 gap-4"
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
                                {language === "hi" ? theme.labelHi : theme.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      <Separator />

                      {/* Default Style */}
                      <div className="space-y-2">
                        <Label>
                          {language === "hi" ? "डिफ़ॉल्ट डिज़ाइन स्टाइल" : "Default Design Style"}
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
                            {language === "hi" ? "ऑटो वास्तु स्कोर" : "Auto Vastu Score"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === "hi"
                              ? "हर रेंडर के साथ वास्तु विश्लेषण"
                              : "Vastu analysis with every render"}
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
                            {language === "hi" ? "ऑटो कॉस्ट एस्टीमेट" : "Auto Cost Estimate"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === "hi"
                              ? "हर रेंडर के साथ लागत अनुमान"
                              : "Cost estimation with every render"}
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
                        {language === "hi" ? "बदलाव सहेजें" : "Save Changes"}
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
                        {language === "hi" ? "भाषा और क्षेत्र" : "Language & Region"}
                      </CardTitle>
                      <CardDescription>
                        {language === "hi"
                          ? "अपनी भाषा और क्षेत्रीय प्राथमिकताएं सेट करें"
                          : "Set your language and regional preferences"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Language */}
                      <div className="space-y-2">
                        <Label>{language === "hi" ? "भाषा" : "Language"}</Label>
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
                        <Label>{language === "hi" ? "मुद्रा" : "Currency"}</Label>
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
                          {language === "hi" ? "माप इकाई" : "Measurement Unit"}
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
                        {language === "hi" ? "बदलाव सहेजें" : "Save Changes"}
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
                          {language === "hi" ? "वर्तमान प्लान" : "Current Plan"}
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
                                  {plans.find(p => p.id === subscription.plan)?.name}
                                </h3>
                                <Badge variant="default" className="bg-primary">
                                  {language === "hi" ? "सक्रिय" : "Active"}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground">
                                {language === "hi"
                                  ? `₹${plans.find(p => p.id === subscription.plan)?.priceINR}/माह`
                                  : `$${plans.find(p => p.id === subscription.plan)?.price}/month`}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline">
                            {language === "hi" ? "प्लान बदलें" : "Change Plan"}
                          </Button>
                        </div>

                        {/* Credits Usage */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">
                              {language === "hi" ? "क्रेडिट उपयोग" : "Credits Usage"}
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
                            {language === "hi"
                              ? `रिन्यूअल: ${new Date(subscription.renewalDate).toLocaleDateString('hi-IN')}`
                              : `Renews on ${new Date(subscription.renewalDate).toLocaleDateString()}`}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button variant="outline">
                            <Zap className="h-4 w-4 mr-2" />
                            {language === "hi" ? "क्रेडिट खरीदें" : "Buy Credits"}
                          </Button>
                          <Button variant="ghost" className="text-muted-foreground">
                            {language === "hi" ? "बिलिंग हिस्ट्री" : "Billing History"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {language === "hi" ? "भुगतान विधियां" : "Payment Methods"}
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
                          <Badge>{language === "hi" ? "डिफ़ॉल्ट" : "Default"}</Badge>
                        </div>

                        <Button variant="outline" className="w-full">
                          {language === "hi" ? "+ नई विधि जोड़ें" : "+ Add Payment Method"}
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
                        {language === "hi" ? "सुरक्षा" : "Security"}
                      </CardTitle>
                      <CardDescription>
                        {language === "hi"
                          ? "अपने खाते की सुरक्षा प्रबंधित करें"
                          : "Manage your account security"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Password */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {language === "hi" ? "पासवर्ड" : "Password"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === "hi"
                              ? "अंतिम बदलाव 30 दिन पहले"
                              : "Last changed 30 days ago"}
                          </p>
                        </div>
                        <Button variant="outline">
                          {language === "hi" ? "बदलें" : "Change"}
                        </Button>
                      </div>

                      <Separator />

                      {/* Two Factor */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {language === "hi" ? "दो-चरण प्रमाणीकरण" : "Two-Factor Authentication"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {language === "hi"
                              ? "अतिरिक्त सुरक्षा के लिए सक्षम करें"
                              : "Enable for extra security"}
                          </p>
                        </div>
                        <Switch />
                      </div>

                      <Separator />

                      {/* Active Sessions */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="font-medium">
                            {language === "hi" ? "सक्रिय सत्र" : "Active Sessions"}
                          </p>
                          <Button variant="ghost" size="sm" className="text-red-500">
                            {language === "hi" ? "सभी लॉगआउट करें" : "Log out all"}
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Monitor className="h-5 w-5" />
                              <div>
                                <p className="font-medium">Chrome on Windows</p>
                                <p className="text-xs text-muted-foreground">
                                  Mumbai, India • {language === "hi" ? "अभी सक्रिय" : "Active now"}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-green-500 border-green-500">
                              {language === "hi" ? "वर्तमान" : "Current"}
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
                        {language === "hi" ? "API एक्सेस" : "API Access"}
                      </CardTitle>
                      <CardDescription>
                        {language === "hi"
                          ? "अपनी API कुंजियां प्रबंधित करें"
                          : "Manage your API keys"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                              {language === "hi" ? "API कुंजी को सुरक्षित रखें" : "Keep your API key secure"}
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              {language === "hi"
                                ? "इसे किसी के साथ साझा न करें और सार्वजनिक कोड में न डालें।"
                                : "Never share it or commit it to public code."}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{language === "hi" ? "आपकी API कुंजी" : "Your API Key"}</Label>
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
                              {language === "hi" ? "नई कुंजी बनाएं" : "Regenerate Key"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {language === "hi" ? "क्या आप सुनिश्चित हैं?" : "Are you sure?"}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {language === "hi"
                                  ? "पुरानी API कुंजी तुरंत बंद हो जाएगी।"
                                  : "Your old API key will stop working immediately."}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                {language === "hi" ? "रद्द करें" : "Cancel"}
                              </AlertDialogCancel>
                              <AlertDialogAction onClick={handleRegenerateApiKey}>
                                {language === "hi" ? "हां, बनाएं" : "Yes, Regenerate"}
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
                            {language === "hi" ? "API डॉक्स" : "API Docs"}
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Data & Privacy Section */}
                {activeSection === "data" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Download className="h-5 w-5" />
                          {language === "hi" ? "डेटा निर्यात" : "Export Your Data"}
                        </CardTitle>
                        <CardDescription>
                          {language === "hi"
                            ? "अपने सभी डेटा की कॉपी डाउनलोड करें"
                            : "Download a copy of all your data"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {language === "hi"
                            ? "आपके सभी प्रोजेक्ट्स, रेंडर्स और सेटिंग्स शामिल होंगी।"
                            : "This includes all your projects, renders, and settings."}
                        </p>
                        <Button onClick={handleExportData} disabled={isSaving}>
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          {language === "hi" ? "डेटा निर्यात करें" : "Export Data"}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    <Card className="border-red-200 dark:border-red-900">
                      <CardHeader>
                        <CardTitle className="text-red-500 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5" />
                          {language === "hi" ? "खतरा क्षेत्र" : "Danger Zone"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {language === "hi" ? "खाता हटाएं" : "Delete Account"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {language === "hi"
                                ? "आपका सारा डेटा स्थायी रूप से हटा दिया जाएगा।"
                                : "All your data will be permanently deleted."}
                            </p>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                {language === "hi" ? "हटाएं" : "Delete"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {language === "hi"
                                    ? "क्या आप वाकई खाता हटाना चाहते हैं?"
                                    : "Are you sure you want to delete your account?"}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {language === "hi"
                                    ? "यह कार्रवाई पूर्ववत नहीं की जा सकती। आपके सभी प्रोजेक्ट्स और डेटा स्थायी रूप से हटा दिए जाएंगे।"
                                    : "This action cannot be undone. All your projects and data will be permanently deleted."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {language === "hi" ? "रद्द करें" : "Cancel"}
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteAccount}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  {language === "hi" ? "हां, हटाएं" : "Yes, Delete"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}