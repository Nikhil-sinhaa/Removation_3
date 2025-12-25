'use client';

import { motion } from 'framer-motion';
import { Upload, Wand2, Sparkles, Download, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload Your Room',
    description: 'Take a photo of any room or upload an existing image. Our AI works with any quality.',
    color: 'from-blue-500 to-cyan-500',
    details: ['JPG, PNG, HEIC supported', 'Any room type', 'Any lighting condition'],
  },
  {
    number: '02',
    icon: Wand2,
    title: 'Choose Your Style',
    description: 'Select from 400+ design styles, set room type, and customize with Vastu preferences.',
    color: 'from-violet-500 to-purple-500',
    details: ['400+ curated styles', 'Vastu compliance options', 'Budget-based filtering'],
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'AI Transforms',
    description: 'Our AI generates multiple stunning variations in under 15 seconds with cost estimates.',
    color: 'from-orange-500 to-red-500',
    details: ['< 15 second renders', 'Multiple variations', 'Instant cost breakdown'],
  },
  {
    number: '04',
    icon: Download,
    title: 'Download & Share',
    description: 'Export in 4K, share with clients, or continue refining with our editing tools.',
    color: 'from-green-500 to-emerald-500',
    details: ['4K export option', 'Direct client sharing', 'PDF report generation'],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-600/50 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-600/50 to-transparent" />
      
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <Badge className="mb-4 bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
            Simple Process
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            From Photo to Dream Room
            <span className="block bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              In 4 Easy Steps
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            No design skills needed. Just upload, customize, and let AI do the magic.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-green-500 opacity-20 -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative"
              >
                {/* Arrow Connector (Hidden on mobile/tablet) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-8 -right-4 z-10">
                    <ArrowRight className="w-8 h-8 text-slate-700" />
                  </div>
                )}

                <div className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700 hover:border-slate-600 rounded-2xl p-8 h-full transition-all duration-300 hover:transform hover:-translate-y-2">
                  {/* Step Number */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-5xl font-bold text-slate-800 group-hover:text-slate-700 transition-colors">
                      {step.number}
                    </span>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 mb-6">
                    {step.description}
                  </p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-full px-6 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400 font-medium">Live Demo</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <span className="text-slate-400">
              Try it now with our sample images
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}