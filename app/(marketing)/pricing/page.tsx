// app/(marketing)/pricing/page.tsx
// Standalone pricing page — full pricing cards + feature comparison + FAQ
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Check,
  X,
  Zap,
  ArrowRight,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Shield,
  Clock,
  CreditCard,
  Users,
  Infinity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import JsonLd from "@/components/seo/JsonLd";
import { buildBreadcrumbSchema, buildFAQSchema, buildSoftwareApplicationSchema } from "@/lib/seo/schema";

// ─── Animation ──────────────────────────────────────────────────────────────
const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Types ───────────────────────────────────────────────────────────────────
type BillingCycle = "monthly" | "annual";
type Currency = "INR" | "USD";

// ─── Plan data ────────────────────────────────────────────────────────────────
const plans = [
  {
    id: "free",
    name: "Free",
    tagline: "Try it, no strings attached",
    price: { monthly: { INR: 0, USD: 0 }, annual: { INR: 0, USD: 0 } },
    cta: "Get Started Free",
    ctaHref: "/sign-up",
    popular: false,
    color: "border-white/10",
    features: [
      "3 AI renders per month",
      "Standard quality (512px)",
      "10 design styles",
      "All room types",
      "Watermarked exports",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For homeowners & ongoing projects",
    price: { monthly: { INR: 2399, USD: 29 }, annual: { INR: 1919, USD: 23 } },
    cta: "Start 7-Day Free Trial",
    ctaHref: "/sign-up?plan=pro",
    popular: true,
    color: "border-purple-500/50",
    features: [
      "Unlimited AI renders",
      "HD quality (1024px)",
      "All 400+ design styles",
      "All room types",
      "No watermarks",
      "Vastu Shastra analysis",
      "Real-time ₹ cost calculator",
      "Marketplace access",
      "Style transfer",
      "Priority support (24h)",
    ],
  },
  {
    id: "teams",
    name: "Teams",
    tagline: "For design firms & agencies",
    price: { monthly: { INR: 8199, USD: 99 }, annual: { INR: 6559, USD: 79 } },
    perUser: true,
    cta: "Contact Sales",
    ctaHref: "/contact?inquiry=enterprise",
    popular: false,
    color: "border-cyan-500/30",
    features: [
      "Unlimited AI renders",
      "4K quality (2048px)",
      "All Pro features",
      "Team collaboration",
      "White-label exports",
      "API access (10K calls/mo)",
      "Custom brand style presets",
      "Dedicated account manager",
      "SSO / SAML integration",
      "SLA guarantee",
    ],
  },
];

// ─── Comparison table rows ─────────────────────────────────────────────────
const comparisonCategories = [
  {
    category: "AI Design Tools",
    rows: [
      { feature: "AI Room Redesign", free: "3/mo", pro: "Unlimited", teams: "Unlimited" },
      { feature: "Output quality", free: "Standard", pro: "HD (1024px)", teams: "4K (2048px)" },
      { feature: "Design styles", free: "10 styles", pro: "400+ styles", teams: "400+ styles" },
      { feature: "Style Transfer", free: false, pro: true, teams: true },
      { feature: "Smart Inpainting", free: false, pro: true, teams: true },
      { feature: "Empty Room Furnishing", free: false, pro: true, teams: true },
      { feature: "Lighting Simulation", free: false, pro: true, teams: true },
      { feature: "Watermark-free exports", free: false, pro: true, teams: true },
    ],
  },
  {
    category: "Indian Market Features",
    rows: [
      { feature: "Vastu Shastra Analysis", free: false, pro: true, teams: true },
      { feature: "Real-time ₹ Cost Calculator", free: false, pro: true, teams: true },
      { feature: "City-wise material pricing", free: false, pro: true, teams: true },
      { feature: "Contractor cost breakdown", free: false, pro: true, teams: true },
    ],
  },
  {
    category: "Marketplace",
    rows: [
      { feature: "Browse verified designers", free: true, pro: true, teams: true },
      { feature: "Book designer consultations", free: false, pro: true, teams: true },
      { feature: "Book contractors", free: false, pro: true, teams: true },
      { feature: "Book vendors", free: false, pro: true, teams: true },
    ],
  },
  {
    category: "Teams & Collaboration",
    rows: [
      { feature: "Team members", free: "1", pro: "1", teams: "Unlimited" },
      { feature: "Shared projects", free: false, pro: false, teams: true },
      { feature: "White-label exports", free: false, pro: false, teams: true },
      { feature: "Custom brand presets", free: false, pro: false, teams: true },
      { feature: "API access", free: false, pro: false, teams: "10K calls/mo" },
      { feature: "SSO / SAML", free: false, pro: false, teams: true },
    ],
  },
  {
    category: "Support",
    rows: [
      { feature: "Support level", free: "Community", pro: "Priority (24h)", teams: "Dedicated manager" },
      { feature: "SLA guarantee", free: false, pro: false, teams: true },
      { feature: "Onboarding call", free: false, pro: false, teams: true },
    ],
  },
];

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: "Can I switch plans anytime?",
    a: "Yes. You can upgrade or downgrade at any time. Upgrades are immediate and prorated. Downgrades take effect at the end of your current billing period.",
  },
  {
    q: "What happens to my renders if I downgrade to Free?",
    a: "Your existing renders and projects remain accessible. You'll just be limited to 3 new renders per month going forward. Watermarks will be re-applied to new exports.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept all major UPI apps, credit/debit cards, Net Banking, and digital wallets via Razorpay. International cards are also supported.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Yes — Pro comes with a 7-day free trial. No credit card required to start. You'll be prompted to add payment details before the trial ends.",
  },
  {
    q: "What does the annual plan save me?",
    a: "Annual billing gives you 20% off — equivalent to getting 2.4 months free compared to monthly billing.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. We offer full refunds within 7 days of your first charge if you're unsatisfied. Annual plans can be refunded prorated within 30 days.",
  },
  {
    q: "Can I use Removation commercially?",
    a: "Yes. Pro and Teams plans allow commercial use — including presentations to clients, real estate staging, and agency deliverables.",
  },
  {
    q: "What's included in the Teams plan API access?",
    a: "You get 10,000 API calls per month on Teams, which covers programmatic render generation, Vastu checks, and cost calculations. Higher limits available on Enterprise.",
  },
];

// ─── Cell component ────────────────────────────────────────────────────────────
function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-green-400 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-white/20 mx-auto" />;
  return <span className="text-sm text-white/70 text-center block">{value}</span>;
}

// ─── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/5 transition-colors"
      >
        <span className="font-medium text-white pr-4">{q}</span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed border-t border-white/5 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [currency, setCurrency] = useState<Currency>("INR");

  const formatPrice = (plan: typeof plans[0]) => {
    const p = plan.price[billing][currency];
    if (p === 0) return "Free";
    return currency === "INR"
      ? `₹${p.toLocaleString("en-IN")}`
      : `$${p}`;
  };

  const periodLabel = billing === "monthly" ? "/mo" : "/mo, billed annually";

  return (
    <main className="dark min-h-screen bg-background">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 px-4 text-center relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-purple-600/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
          className="max-w-3xl mx-auto relative"
        >
          <motion.div variants={fadeInUp}>
            <Badge className="mb-4 bg-purple-600/20 text-purple-300 border-purple-500/30 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1.5" />
              Simple, transparent pricing
            </Badge>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
          >
            Plans for every{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              home & team
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Start free. Upgrade when your project needs more power.
            Cancel anytime — no questions asked.
          </motion.p>

          {/* Billing + Currency toggles */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {/* Billing toggle */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  billing === "monthly"
                    ? "bg-white text-background"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={cn(
                  "relative px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  billing === "annual"
                    ? "bg-white text-background"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                Annual
                <Badge className="absolute -top-2.5 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 leading-none">
                  -20%
                </Badge>
              </button>
            </div>

            {/* Currency toggle */}
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
              {(["INR", "USD"] as Currency[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    currency === c
                      ? "bg-white text-background"
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  {c === "INR" ? "₹ INR" : "$ USD"}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Pricing Cards ─────────────────────────────────────────────────── */}
      <section className="pb-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={cn(
                "relative rounded-2xl border p-6 flex flex-col",
                plan.popular
                  ? "border-purple-500/50 bg-gradient-to-b from-purple-900/20 to-background"
                  : `${plan.color} bg-white/[0.03]`
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 px-3 py-1 shadow-lg shadow-purple-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
                <p className="text-sm text-muted-foreground">{plan.tagline}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white">{formatPrice(plan)}</span>
                  {plan.price[billing][currency] > 0 && (
                    <span className="text-muted-foreground text-sm mb-1.5">{periodLabel}</span>
                  )}
                </div>
                {plan.perUser && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> per user
                  </p>
                )}
                {billing === "annual" && plan.price.monthly[currency] > 0 && (
                  <p className="text-xs text-green-400 mt-1">
                    Save {currency === "INR"
                      ? `₹${((plan.price.monthly[currency] - plan.price.annual[currency]) * 12).toLocaleString("en-IN")}`
                      : `$${(plan.price.monthly[currency] - plan.price.annual[currency]) * 12}`}/year
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link href={plan.ctaHref} className="mb-6">
                <Button
                  className={cn(
                    "w-full py-5 font-semibold text-base",
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/20"
                      : "bg-white/10 hover:bg-white/20 border border-white/10"
                  )}
                >
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              {/* Features */}
              <ul className="space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/80">{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Enterprise callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="max-w-6xl mx-auto mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div>
            <h3 className="font-semibold text-white mb-1">
              Need Enterprise or custom volume pricing?
            </h3>
            <p className="text-sm text-muted-foreground">
              High-volume renders, custom API limits, on-premise deployment, or VAPT compliance?
              Let&apos;s talk.
            </p>
          </div>
          <Link href="/contact?inquiry=enterprise" className="flex-shrink-0">
            <Button variant="outline" className="border-white/20 hover:bg-white/10">
              Contact Sales
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ── Trust badges ─────────────────────────────────────────────────── */}
      <section className="py-8 px-4 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { icon: <Shield className="w-5 h-5 text-green-400" />, label: "No credit card", sub: "for Free plan" },
            { icon: <Clock className="w-5 h-5 text-blue-400" />, label: "7-day free trial", sub: "on Pro" },
            { icon: <CreditCard className="w-5 h-5 text-purple-400" />, label: "Cancel anytime", sub: "no lock-in" },
            { icon: <Infinity className="w-5 h-5 text-pink-400" />, label: "Unlimited renders", sub: "on Pro & Teams" },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              {icon}
              <span className="text-sm font-medium text-white">{label}</span>
              <span className="text-xs text-muted-foreground">{sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature comparison table ──────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-white mb-3">Full feature comparison</h2>
            <p className="text-muted-foreground">Every feature, every plan — no surprises.</p>
          </motion.div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground w-1/2">
                    Feature
                  </th>
                  {plans.map((p) => (
                    <th key={p.id} className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn("font-bold text-sm", p.popular ? "text-purple-300" : "text-white")}>
                          {p.name}
                        </span>
                        {p.popular && (
                          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 text-[10px] px-1.5 py-0">
                            Popular
                          </Badge>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonCategories.map((cat) => (
                  <>
                    {/* Category header */}
                    <tr key={cat.category} className="border-b border-white/5 bg-white/[0.015]">
                      <td
                        colSpan={4}
                        className="py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        {cat.category}
                      </td>
                    </tr>
                    {/* Feature rows */}
                    {cat.rows.map((row) => (
                      <tr
                        key={row.feature}
                        className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-6 text-sm text-white/80">{row.feature}</td>
                        <td className="py-3.5 px-4">
                          <ComparisonCell value={row.free} />
                        </td>
                        <td className="py-3.5 px-4 bg-purple-900/5">
                          <ComparisonCell value={row.pro} />
                        </td>
                        <td className="py-3.5 px-4">
                          <ComparisonCell value={row.teams} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <div className="flex items-center justify-center gap-2 mb-3">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              <h2 className="text-3xl font-bold text-white">Pricing FAQ</h2>
            </div>
            <p className="text-muted-foreground">Everything you need to know before committing.</p>
          </motion.div>

          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">Still have questions?</p>
            <Link href="/contact">
              <Button variant="outline" className="border-white/20 hover:bg-white/10">
                Chat with us
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <JsonLd schemas={[
        buildBreadcrumbSchema([
          { name: "Home", item: "/" },
          { name: "Pricing", item: "/pricing" }
        ]),
        buildSoftwareApplicationSchema(),
        buildFAQSchema(faqs.map(({ q, a }) => ({ question: q, answer: a }))),
      ]} />
    </main>
  );
}
