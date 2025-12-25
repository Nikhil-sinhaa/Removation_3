'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Award, Clock, Users, Headphones } from 'lucide-react';

const badges = [
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your images are encrypted and never shared',
  },
  {
    icon: Lock,
    title: 'GDPR Compliant',
    description: 'We respect your data privacy rights',
  },
  {
    icon: Award,
    title: '99.9% Uptime',
    description: 'Reliable service you can count on',
  },
  {
    icon: Clock,
    title: '24/7 Processing',
    description: 'AI renders available anytime',
  },
  {
    icon: Users,
    title: '50,000+ Users',
    description: 'Trusted by designers worldwide',
  },
  {
    icon: Headphones,
    title: 'Priority Support',
    description: 'Real humans, fast responses',
  },
];

export function TrustBadges() {
  return (
    <section className="py-16 bg-slate-950 border-y border-slate-800">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
        >
          {badges.map((badge, index) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 group-hover:bg-slate-700 transition-colors mb-3">
                <badge.icon className="w-6 h-6 text-violet-400" />
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">
                {badge.title}
              </h4>
              <p className="text-xs text-slate-500">
                {badge.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}