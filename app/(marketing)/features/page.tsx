// app/(marketing)/features/page.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Wand2,
  Paintbrush,
  Eraser,
  ScanLine,
  Replace,
  Maximize2,
  Layers,
  Palette,
  Home,
  Building2,
  TreePine,
  Sofa,
  Sun,
  Moon,
  Camera,
  Download,
  Share2,
  History,
  Star,
  Zap,
  Shield,
  Clock,
  Globe,
  Smartphone,
  Chrome,
  CreditCard,
  Users,
  BarChart3,
  Lock,
  Compass,
  IndianRupee,
  Calculator,
  MapPin,
  FileText,
  Ruler,
  Lightbulb,
  ArrowRight,
  Check,
  Play,
  ChevronRight,
  Boxes,
  PenTool,
  Move3D,
  Glasses,
  RefreshCcw,
  Brush,
  ImagePlus,
  SlidersHorizontal,
  Eye,
  Target,
  Award,
  TrendingUp,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Feature categories
const featureCategories = [
  { id: "all", name: "All Features", icon: Boxes },
  { id: "ai-design", name: "AI Design", icon: Wand2 },
  { id: "editing", name: "Editing Tools", icon: PenTool },
  { id: "vastu", name: "Vastu Shastra", icon: Compass },
  { id: "cost", name: "Cost Calculator", icon: Calculator },
  { id: "platform", name: "Platform", icon: Layers }
];

// All 32+ features
const allFeatures = [
  // AI Design Features
  {
    id: "room-redesign",
    category: "ai-design",
    name: "AI Room Redesign",
    description: "Transform any room instantly with AI. Upload a photo and watch it transform into your dream space in seconds.",
    icon: Wand2,
    color: "violet",
    highlight: true,
    details: [
      "Upload any room photo",
      "Choose from 400+ styles",
      "Get results in 10-15 seconds",
      "Photorealistic renders"
    ]
  },
  {
    id: "style-transfer",
    category: "ai-design",
    name: "Style Transfer",
    description: "Apply any design style to your space. From minimalist to maximalist, traditional to contemporary.",
    icon: Palette,
    color: "blue",
    highlight: false,
    details: [
      "400+ design styles",
      "Regional Indian styles",
      "Custom color palettes",
      "Mix multiple styles"
    ]
  },
  {
    id: "empty-room-design",
    category: "ai-design",
    name: "Empty Room Furnishing",
    description: "Fill empty rooms with perfectly styled furniture and decor. AI understands room dimensions and scale.",
    icon: Sofa,
    color: "emerald",
    highlight: true,
    details: [
      "Auto furniture placement",
      "Scale-aware design",
      "Multiple layout options",
      "Budget-based suggestions"
    ]
  },
  {
    id: "sketch-to-render",
    category: "ai-design",
    name: "Sketch to Render",
    description: "Turn hand-drawn sketches or floor plans into photorealistic 3D renders. Perfect for architects and designers.",
    icon: PenTool,
    color: "orange",
    highlight: false,
    details: [
      "Hand-drawn sketch support",
      "Floor plan conversion",
      "Multiple angle renders",
      "Professional quality"
    ]
  },
  {
    id: "exterior-design",
    category: "ai-design",
    name: "Exterior Design",
    description: "Redesign home exteriors, facades, gardens, and landscapes with stunning AI-generated visualizations.",
    icon: Building2,
    color: "cyan",
    highlight: false,
    details: [
      "Facade redesign",
      "Garden & landscaping",
      "Outdoor living spaces",
      "Material visualization"
    ]
  },
  {
    id: "outdoor-spaces",
    category: "ai-design",
    name: "Outdoor & Garden",
    description: "Design beautiful patios, balconies, terraces, and gardens. Perfect for Indian homes and weather conditions.",
    icon: TreePine,
    color: "green",
    highlight: false,
    details: [
      "Balcony designs",
      "Terrace gardens",
      "Patio styling",
      "Plant suggestions"
    ]
  },
  {
    id: "lighting-design",
    category: "ai-design",
    name: "Lighting Simulation",
    description: "Visualize different lighting conditions - day, night, warm, cool. See how your space looks at any time.",
    icon: Sun,
    color: "amber",
    highlight: false,
    details: [
      "Day/night simulation",
      "Warm/cool lighting",
      "Natural light analysis",
      "Fixture suggestions"
    ]
  },
  {
    id: "color-change",
    category: "ai-design",
    name: "Color Exploration",
    description: "Instantly change wall colors, flooring, and accent colors. Experiment without any commitment.",
    icon: Paintbrush,
    color: "pink",
    highlight: false,
    details: [
      "Wall color changes",
      "Flooring colors",
      "Accent exploration",
      "Color harmony tools"
    ]
  },

  // Editing Tools
  {
    id: "smart-inpainting",
    category: "editing",
    name: "Smart Inpainting",
    description: "Brush over any area to regenerate it. Perfect for fixing specific parts without redoing the entire design.",
    icon: Brush,
    color: "violet",
    highlight: true,
    details: [
      "Precision brush tool",
      "Area-specific regeneration",
      "Multiple inpaint options",
      "Seamless blending"
    ]
  },
  {
    id: "object-removal",
    category: "editing",
    name: "Object Removal",
    description: "Remove unwanted furniture, clutter, or objects from photos. AI fills the space naturally.",
    icon: Eraser,
    color: "red",
    highlight: false,
    details: [
      "One-click removal",
      "Smart fill algorithm",
      "Multiple object support",
      "Clean background"
    ]
  },
  {
    id: "object-replacement",
    category: "editing",
    name: "Object Replacement",
    description: "Replace specific items - swap a sofa, change a table, update light fixtures while keeping everything else.",
    icon: Replace,
    color: "blue",
    highlight: true,
    details: [
      "Select & replace",
      "Style matching",
      "Size adjustment",
      "Realistic integration"
    ]
  },
  {
    id: "image-enhancement",
    category: "editing",
    name: "4K Enhancement",
    description: "Upscale and enhance any render to 4K resolution. Perfect for presentations and printing.",
    icon: Maximize2,
    color: "emerald",
    highlight: false,
    details: [
      "4K upscaling",
      "Detail enhancement",
      "Noise reduction",
      "Color correction"
    ]
  },
  {
    id: "before-after",
    category: "editing",
    name: "Before/After Slider",
    description: "Interactive comparison slider to showcase transformations. Great for client presentations.",
    icon: SlidersHorizontal,
    color: "indigo",
    highlight: false,
    details: [
      "Interactive slider",
      "Side-by-side view",
      "Export comparisons",
      "Share directly"
    ]
  },
  {
    id: "batch-processing",
    category: "editing",
    name: "Batch Processing",
    description: "Process multiple rooms or images at once. Save hours on large projects.",
    icon: Layers,
    color: "orange",
    highlight: false,
    details: [
      "Multi-image upload",
      "Consistent styling",
      "Queue management",
      "Bulk download"
    ]
  },
  {
    id: "history-versions",
    category: "editing",
    name: "Version History",
    description: "Access all previous versions and iterations. Never lose a great idea.",
    icon: History,
    color: "slate",
    highlight: false,
    details: [
      "Unlimited history",
      "Version comparison",
      "One-click restore",
      "Cloud sync"
    ]
  },
  {
    id: "custom-prompt",
    category: "editing",
    name: "Custom Prompts",
    description: "Write custom AI prompts for complete creative control. Advanced users can fine-tune every detail.",
    icon: FileText,
    color: "purple",
    highlight: false,
    details: [
      "Text-based control",
      "Prompt templates",
      "Advanced parameters",
      "Save favorites"
    ]
  },

  // Vastu Shastra Features
  {
    id: "vastu-analysis",
    category: "vastu",
    name: "Vastu Score Analysis",
    description: "Get a comprehensive 0-100 Vastu score for any room or floor plan. AI analyzes 120+ Vastu rules.",
    icon: Compass,
    color: "violet",
    highlight: true,
    details: [
      "0-100 Vastu score",
      "120+ Vastu rules",
      "Direction analysis",
      "Element balancing"
    ]
  },
  {
    id: "vastu-suggestions",
    category: "vastu",
    name: "Auto-Fix Suggestions",
    description: "AI provides actionable suggestions to improve Vastu compliance. From furniture placement to color recommendations.",
    icon: Lightbulb,
    color: "amber",
    highlight: true,
    details: [
      "Placement corrections",
      "Color suggestions",
      "Element recommendations",
      "Priority ranking"
    ]
  },
  {
    id: "vastu-compass",
    category: "vastu",
    name: "Digital Vastu Compass",
    description: "Interactive compass overlay showing directional energy flow. Understand your space orientation instantly.",
    icon: Target,
    color: "emerald",
    highlight: false,
    details: [
      "8 directions analysis",
      "Energy flow mapping",
      "Zone identification",
      "Interactive overlay"
    ]
  },
  {
    id: "vastu-report",
    category: "vastu",
    name: "Detailed Vastu Report",
    description: "Download comprehensive PDF reports with room-by-room Vastu analysis. Perfect for consultations.",
    icon: FileText,
    color: "blue",
    highlight: false,
    details: [
      "PDF export",
      "Room-wise analysis",
      "Remedies included",
      "Shareable reports"
    ]
  },
  {
    id: "vastu-remedies",
    category: "vastu",
    name: "Vastu Remedies",
    description: "Traditional and modern remedies for Vastu defects. From simple adjustments to design changes.",
    icon: Shield,
    color: "orange",
    highlight: false,
    details: [
      "Traditional remedies",
      "Modern solutions",
      "Cost-effective options",
      "DIY guides"
    ]
  },

  // Cost Calculator Features
  {
    id: "instant-estimate",
    category: "cost",
    name: "Instant Cost Estimate",
    description: "Get real-time renovation cost estimates as you design. Updates instantly with every change.",
    icon: Calculator,
    color: "emerald",
    highlight: true,
    details: [
      "Real-time calculation",
      "Per-design estimates",
      "Material breakdown",
      "Labor included"
    ]
  },
  {
    id: "city-pricing",
    category: "cost",
    name: "City-Wise Pricing",
    description: "Accurate pricing based on your city. Mumbai rates differ from Bangalore - we account for that.",
    icon: MapPin,
    color: "blue",
    highlight: true,
    details: [
      "50+ Indian cities",
      "Local labor rates",
      "Regional materials",
      "Market updates"
    ]
  },
  {
    id: "material-breakdown",
    category: "cost",
    name: "Material Breakdown",
    description: "Detailed breakdown of every material - flooring, paint, fixtures. Compare brands and quality levels.",
    icon: Ruler,
    color: "orange",
    highlight: false,
    details: [
      "Brand comparisons",
      "Quality tiers",
      "Quantity estimates",
      "Vendor suggestions"
    ]
  },
  {
    id: "currency-toggle",
    category: "cost",
    name: "Multi-Currency",
    description: "View costs in ₹ (INR) or $ (USD). Perfect for NRIs planning renovations back home.",
    icon: IndianRupee,
    color: "amber",
    highlight: false,
    details: [
      "INR & USD support",
      "Real-time conversion",
      "NRI-friendly",
      "Export in any currency"
    ]
  },
  {
    id: "cost-comparison",
    category: "cost",
    name: "Design Comparison",
    description: "Compare costs across different design options. Make budget-informed decisions.",
    icon: BarChart3,
    color: "violet",
    highlight: false,
    details: [
      "Side-by-side comparison",
      "Cost difference analysis",
      "Budget optimization",
      "Save comparisons"
    ]
  },

  // Platform Features
  {
    id: "project-management",
    category: "platform",
    name: "Project Management",
    description: "Organize all your design projects in one place. Create folders, add notes, track progress.",
    icon: Boxes,
    color: "slate",
    highlight: false,
    details: [
      "Unlimited projects",
      "Folder organization",
      "Notes & comments",
      "Progress tracking"
    ]
  },
  {
    id: "team-collaboration",
    category: "platform",
    name: "Team Collaboration",
    description: "Invite team members, share projects, collaborate in real-time. Perfect for design firms.",
    icon: Users,
    color: "blue",
    highlight: false,
    details: [
      "Team workspaces",
      "Role permissions",
      "Real-time sync",
      "Comment threads"
    ]
  },
  {
    id: "export-options",
    category: "platform",
    name: "Multiple Export Formats",
    description: "Download renders in various formats - JPG, PNG, PDF. Different resolutions for different needs.",
    icon: Download,
    color: "emerald",
    highlight: false,
    details: [
      "JPG, PNG, PDF",
      "Multiple resolutions",
      "Bulk download",
      "Print-ready files"
    ]
  },
  {
    id: "chrome-extension",
    category: "platform",
    name: "Chrome Extension",
    description: "Redesign any room you find online. Right-click on any room image and transform it instantly.",
    icon: Chrome,
    color: "amber",
    highlight: true,
    details: [
      "Right-click redesign",
      "Pinterest integration",
      "Houzz compatible",
      "One-click save"
    ]
  },
  {
    id: "mobile-app",
    category: "platform",
    name: "Mobile PWA",
    description: "Full-featured mobile app. Design on-the-go from your phone or tablet.",
    icon: Smartphone,
    color: "pink",
    highlight: false,
    details: [
      "iOS & Android",
      "Camera integration",
      "Offline mode",
      "Push notifications"
    ]
  },
  {
    id: "api-access",
    category: "platform",
    name: "Developer API",
    description: "Integrate Removation.ai into your own applications. Full REST API with documentation.",
    icon: Zap,
    color: "orange",
    highlight: false,
    details: [
      "REST API",
      "Webhook support",
      "SDKs available",
      "Rate limiting"
    ]
  },
  {
    id: "analytics",
    category: "platform",
    name: "Usage Analytics",
    description: "Track your design usage, popular styles, and trends. Insights to improve your workflow.",
    icon: BarChart3,
    color: "indigo",
    highlight: false,
    details: [
      "Usage statistics",
      "Style preferences",
      "Team reports",
      "Export data"
    ]
  },
  {
    id: "security",
    category: "platform",
    name: "Enterprise Security",
    description: "Bank-grade encryption, GDPR compliant, SOC2 certified. Your designs are safe with us.",
    icon: Lock,
    color: "slate",
    highlight: false,
    details: [
      "End-to-end encryption",
      "GDPR compliant",
      "SOC2 certified",
      "Data residency options"
    ]
  }
];

// Stats data
const stats = [
  { number: "32+", label: "Powerful Features" },
  { number: "400+", label: "Design Styles" },
  { number: "120+", label: "Vastu Rules" },
  { number: "<15s", label: "Render Time" }
];

// Get color classes
const getColorClasses = (color: string) => {
  const colors: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
    violet: {
      bg: "bg-violet-100 dark:bg-violet-900/30",
      text: "text-violet-600 dark:text-violet-400",
      border: "border-violet-200 dark:border-violet-800",
      gradient: "from-violet-500 to-violet-600"
    },
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
      gradient: "from-blue-500 to-blue-600"
    },
    emerald: {
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      text: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      gradient: "from-emerald-500 to-emerald-600"
    },
    orange: {
      bg: "bg-orange-100 dark:bg-orange-900/30",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800",
      gradient: "from-orange-500 to-orange-600"
    },
    amber: {
      bg: "bg-amber-100 dark:bg-amber-900/30",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
      gradient: "from-amber-500 to-amber-600"
    },
    red: {
      bg: "bg-red-100 dark:bg-red-900/30",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
      gradient: "from-red-500 to-red-600"
    },
    pink: {
      bg: "bg-pink-100 dark:bg-pink-900/30",
      text: "text-pink-600 dark:text-pink-400",
      border: "border-pink-200 dark:border-pink-800",
      gradient: "from-pink-500 to-pink-600"
    },
    cyan: {
      bg: "bg-cyan-100 dark:bg-cyan-900/30",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-cyan-200 dark:border-cyan-800",
      gradient: "from-cyan-500 to-cyan-600"
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-200 dark:border-green-800",
      gradient: "from-green-500 to-green-600"
    },
    indigo: {
      bg: "bg-indigo-100 dark:bg-indigo-900/30",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-200 dark:border-indigo-800",
      gradient: "from-indigo-500 to-indigo-600"
    },
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-200 dark:border-purple-800",
      gradient: "from-purple-500 to-purple-600"
    },
    slate: {
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-600 dark:text-slate-400",
      border: "border-slate-200 dark:border-slate-700",
      gradient: "from-slate-500 to-slate-600"
    }
  };
  return colors[color] || colors.violet;
};

// Feature Card Component
const FeatureCard = ({ feature, index }: { feature: typeof allFeatures[0]; index: number }) => {
  const colors = getColorClasses(feature.color);

  return (
    <motion.div variants={scaleIn}>
      <Card className={`h-full overflow-hidden hover:shadow-xl transition-all duration-300 group border-2 hover:${colors.border} relative`}>
        {feature.highlight && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gradient-to-r from-violet-500 to-orange-500 text-white border-0">
              <Star className="w-3 h-3 mr-1" />
              Popular
            </Badge>
          </div>
        )}
        <CardContent className="p-6">
          <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            <feature.icon className={`w-6 h-6 ${colors.text}`} />
          </div>

          <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
            {feature.name}
          </h3>

          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
            {feature.description}
          </p>

          <ul className="space-y-2">
            {feature.details.map((detail, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Check className={`w-4 h-4 ${colors.text} flex-shrink-0`} />
                {detail}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Highlighted Feature Section Component
const HighlightedFeature = ({
  feature,
  reversed = false
}: {
  feature: typeof allFeatures[0];
  reversed?: boolean;
}) => {
  const colors = getColorClasses(feature.color);

  return (
    <div className={`grid lg:grid-cols-2 gap-12 items-center ${reversed ? 'lg:flex-row-reverse' : ''}`}>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={reversed ? fadeInRight : fadeInLeft}
        className={reversed ? 'lg:order-2' : ''}
      >
        <Badge className={`mb-4 ${colors.bg} ${colors.text}`}>
          <feature.icon className="w-3 h-3 mr-1" />
          {feature.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>

        <h3 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
          {feature.name}
        </h3>

        <p className="text-lg text-slate-600 dark:text-slate-300 mb-6">
          {feature.description}
        </p>

        <ul className="space-y-3 mb-8">
          {feature.details.map((detail, i) => (
            <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${colors.gradient} flex items-center justify-center flex-shrink-0`}>
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
              {detail}
            </li>
          ))}
        </ul>

        <Button className={`bg-gradient-to-r ${colors.gradient} hover:opacity-90`}>
          Try {feature.name}
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={reversed ? fadeInLeft : fadeInRight}
        className={`relative ${reversed ? 'lg:order-1' : ''}`}
      >
        <div className={`aspect-[4/3] rounded-2xl bg-gradient-to-br ${colors.gradient} p-1`}>
          <div className="w-full h-full rounded-xl bg-slate-900/90 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-10 h-10 text-white" />
              </div>
              <p className="text-white/80 text-lg">
                Interactive Demo
              </p>
              <Button variant="secondary" size="sm" className="mt-4">
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className={`absolute -bottom-6 ${reversed ? '-left-6' : '-right-6'} w-32 h-32 bg-gradient-to-br ${colors.gradient} opacity-20 rounded-full blur-2xl`} />
      </motion.div>
    </div>
  );
};

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFeatures = activeCategory === "all"
    ? allFeatures
    : allFeatures.filter(f => f.category === activeCategory);

  // Get highlight features for detailed sections
  const highlightFeatures = allFeatures.filter(f => f.highlight);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <Sparkles className="w-3 h-3 mr-1" />
                32+ Powerful Features
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-violet-700 to-orange-600 dark:from-white dark:via-violet-400 dark:to-orange-400 bg-clip-text text-transparent"
            >
              Everything You Need to
              <br />
              Design Your Dream Home
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              From AI-powered room redesign to Vastu analysis and real-time cost calculations.
              The most comprehensive interior design platform built for India.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800">
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-16"
          >
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="sticky top-16 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto scrollbar-hide py-4">
            <div className="flex gap-2 min-w-max justify-center">
              {featureCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className={`rounded-full ${
                    activeCategory === category.id
                      ? "bg-violet-600 hover:bg-violet-700 text-white"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <category.icon className="w-4 h-4 mr-1.5" />
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Highlighted Features (Deep Dive) */}
      {activeCategory === "all" && (
        <section className="py-20 lg:py-28">
          <div className="container mx-auto px-4">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                <Star className="w-3 h-3 mr-1" />
                Signature Features
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
                What Makes Us Different
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Deep dive into our most powerful capabilities that set us apart from every other design tool.
              </p>
            </motion.div>

            <div className="space-y-24">
              {highlightFeatures.slice(0, 6).map((feature, index) => (
                <HighlightedFeature
                  key={feature.id}
                  feature={feature}
                  reversed={index % 2 === 1}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Features Grid */}
      <section className="py-20 lg:py-28 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              {activeCategory === "all" ? "All Features" : featureCategories.find(c => c.id === activeCategory)?.name}
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {filteredFeatures.length} feature{filteredFeatures.length !== 1 ? 's' : ''} to power your design journey
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={staggerContainer}
              className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredFeatures.map((feature, index) => (
                <FeatureCard key={feature.id} feature={feature} index={index} />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* India-Specific Features */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              🇮🇳 Made for India
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Built Specifically for Indian Homes
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Features that no other platform offers—because they don't understand Indian homes like we do.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Vastu Integration */}
            <motion.div variants={scaleIn}>
              <Card className="h-full border-2 border-violet-200 dark:border-violet-800 bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-slate-900">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/25">
                    <Compass className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                    Vastu Shastra AI
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    World's first AI that understands ancient Vastu principles. Get a 0-100 score
                    with every design and actionable fixes.
                  </p>
                  <ul className="space-y-2">
                    {["120+ Vastu rules analyzed", "Direction-based suggestions", "Element balancing", "Remedy recommendations"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Check className="w-4 h-4 text-violet-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Cost Calculator */}
            <motion.div variants={scaleIn}>
              <Card className="h-full border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/30 dark:to-slate-900">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/25">
                    <IndianRupee className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                    Real-Time Cost Calculator
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    Instant renovation costs in ₹ and $. Prices updated for 50+ Indian cities
                    with material and labor breakdown.
                  </p>
                  <ul className="space-y-2">
                    {["City-wise pricing (Mumbai, Delhi, etc.)", "Material cost breakdown", "Labor estimates included", "GST calculation"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Check className="w-4 h-4 text-orange-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Regional Styles */}
            <motion.div variants={scaleIn}>
              <Card className="h-full border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/25">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">
                    400+ Indian Styles
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-6">
                    From Rajasthani haveli to Kerala traditional, Punjabi farmhouse to
                    South Indian temple architecture.
                  </p>
                  <ul className="space-y-2">
                    {["Regional design styles", "Festival-themed decor", "Traditional + Modern fusion", "Custom color palettes"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Check className="w-4 h-4 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="mb-4 bg-white/10 text-white">
              <TrendingUp className="w-3 h-3 mr-1" />
              Why Switch to Removation.ai
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How We Compare
            </h2>
            <p className="text-lg text-slate-300">
              See why thousands of Indians are choosing Removation.ai over other platforms
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={scaleIn}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-white/5 border-white/10 backdrop-blur">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 font-medium text-slate-300">Feature</th>
                        <th className="text-center p-4">
                          <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center mb-2">
                              <Home className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold">Removation.ai</span>
                          </div>
                        </th>
                        <th className="text-center p-4 text-slate-400">
                          <span className="font-medium">Others</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: "AI Room Redesign", us: true, others: true },
                        { feature: "Vastu Shastra Analysis", us: true, others: false },
                        { feature: "Real-Time Cost Calculator (₹)", us: true, others: false },
                        { feature: "400+ Indian Design Styles", us: true, others: false },
                        { feature: "City-Wise Pricing (50+ cities)", us: true, others: false },
                        { feature: "Render Time < 15 seconds", us: true, others: true },
                        { feature: "Hindi + English Support", us: true, others: false },
                        { feature: "Chrome Extension", us: true, others: true },
                        { feature: "Mobile PWA", us: true, others: true },
                        { feature: "Razorpay + UPI Payment", us: true, others: false },
                        { feature: "Team Collaboration", us: true, others: true },
                        { feature: "Free Plan Available", us: true, others: true }
                      ].map((row, index) => (
                        <tr key={row.feature} className="border-b border-white/5">
                          <td className="p-4 text-slate-300">{row.feature}</td>
                          <td className="p-4 text-center">
                            {row.us ? (
                              <div className="inline-flex w-6 h-6 rounded-full bg-emerald-500/20 items-center justify-center">
                                <Check className="w-4 h-4 text-emerald-400" />
                              </div>
                            ) : (
                              <div className="inline-flex w-6 h-6 rounded-full bg-red-500/20 items-center justify-center">
                                <span className="text-red-400">✕</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {row.others ? (
                              <div className="inline-flex w-6 h-6 rounded-full bg-slate-500/20 items-center justify-center">
                                <Check className="w-4 h-4 text-slate-400" />
                              </div>
                            ) : (
                              <div className="inline-flex w-6 h-6 rounded-full bg-red-500/20 items-center justify-center">
                                <span className="text-red-400">✕</span>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="mb-4">
              <Zap className="w-3 h-3 mr-1" />
              Integrations
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Works With Your Favorite Tools
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Seamlessly integrates with the platforms you already use
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-6"
          >
            {[
              { name: "Pinterest", icon: "📌" },
              { name: "Houzz", icon: "🏠" },
              { name: "Google Drive", icon: "📁" },
              { name: "Dropbox", icon: "📦" },
              { name: "Canva", icon: "🎨" },
              { name: "Figma", icon: "✏️" },
              { name: "AutoCAD", icon: "📐" },
              { name: "SketchUp", icon: "🔷" }
            ].map((integration) => (
              <motion.div
                key={integration.name}
                variants={scaleIn}
                className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="text-2xl">{integration.icon}</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {integration.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-violet-600 via-violet-700 to-orange-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center text-white"
          >
            <motion.div variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                Start your free trial today
              </div>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
            >
              Ready to Transform Your Space?
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-xl opacity-90 mb-8"
            >
              Join 50,000+ homeowners and designers who are already creating
              stunning spaces with Removation.ai
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-white text-violet-700 hover:bg-slate-100 text-lg px-8"
                asChild
              >
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
                asChild
              >
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-6 mt-10 text-sm opacity-80"
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                5 free designs
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Cancel anytime
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}