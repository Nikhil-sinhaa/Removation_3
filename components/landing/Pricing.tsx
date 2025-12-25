'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Zap, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    description: 'Perfect for trying out Removation.ai',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: Sparkles,
    color: 'from-slate-500 to-slate-600',
    features: [
      { text: '5 renders per month', included: true },
      { text: 'Basic styles (50+)', included: true },
      { text: 'Standard quality output', included: true },
      { text: 'Vastu Score (basic)', included: true },
      { text: 'Cost estimates (basic)', included: true },
      { text: 'Community support', included: true },
      { text: 'HD export', included: false },
      { text: 'Object removal', included: false },
      { text: 'Inpainting', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'For designers and professionals',
    monthlyPrice: 29,
    yearlyPrice: 290,
    icon: Zap,
    color: 'from-violet-500 to-cyan-500',
    features: [
      { text: 'Unlimited renders', included: true },
      { text: 'All 400+ styles', included: true },
      { text: '4K quality output', included: true },
      { text: 'Full Vastu analysis', included: true },
      { text: 'Detailed cost breakdown', included: true },
      { text: 'Priority support', included: true },
      { text: 'HD & 4K export', included: true },
      { text: 'Object removal', included: true },
      { text: 'Inpainting & editing', included: true },
      { text: 'API access (1000 calls/mo)', included: true },
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Teams',
    description: 'For agencies and enterprises',
    monthlyPrice: 99,
    yearlyPrice: 990,
    perUser: true,
    icon: Building2,
    color: 'from-orange-500 to-red-500',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Team collaboration', included: true },
      { text: 'Shared project library', included: true },
      { text: 'Custom branding', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'SSO integration', included: true },
      { text: 'Custom API limits', included: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Invoice billing', included: true },
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <Badge className="mb-4 bg-green-600/20 text-green-300 border-green-500/30">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Choose Your
            <span className="block bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h2>
          <p className="text-lg text-slate-400 mb-8">
            Start free, upgrade when you need more. All plans include our core AI features.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isYearly ? 'text-white' : 'text-slate-500'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm ${isYearly ? 'text-white' : 'text-slate-500'}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                Save 20%
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-gradient-to-r from-violet-600 to-cyan-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <div className={`h-full bg-slate-800/50 backdrop-blur-sm border rounded-2xl p-8 transition-all duration-300 hover:transform hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-violet-500/50 shadow-lg shadow-violet-600/20' 
                  : 'border-slate-700 hover:border-slate-600'
              }`}>
                {/* Plan Icon & Name */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <plan.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-slate-400">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-slate-400">
                        /{isYearly ? 'year' : 'month'}
                        {plan.perUser && '/user'}
                      </span>
                    )}
                  </div>
                  {plan.monthlyPrice > 0 && (
                    <p className="text-sm text-slate-500 mt-1">
                      {isYearly 
                        ? `₹${(plan.yearlyPrice * 83).toLocaleString()}/year` 
                        : `₹${(plan.monthlyPrice * 83).toLocaleString()}/month`
                      }
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-slate-300' : 'text-slate-600'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link href={plan.monthlyPrice === 0 ? '/sign-up' : '/sign-up?plan=' + plan.name.toLowerCase()}>
                  <Button
                    className={`w-full group ${
                      plan.popular
                        ? 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                    size="lg"
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-slate-500 text-sm">
            All plans include a 7-day money-back guarantee. No questions asked.
            <br />
            Need a custom plan? <Link href="/contact" className="text-violet-400 hover:text-violet-300">Contact us</Link>
          </p>
        </motion.div>
      </div>
    </section>
  );
}