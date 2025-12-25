'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        q: 'What is Removation.ai?',
        a: 'Removation.ai is an AI-powered interior design platform that transforms your room photos into stunning redesigns in seconds. It includes unique features like Vastu Shastra analysis and real-time renovation cost calculation.',
      },
      {
        q: 'How does the AI transformation work?',
        a: 'Simply upload a photo of any room, select your preferred style from 400+ options, and our AI will generate multiple design variations in under 15 seconds. The AI understands room layout, lighting, and architecture to create realistic transformations.',
      },
      {
        q: 'What types of spaces can I redesign?',
        a: 'You can redesign any interior space including living rooms, bedrooms, kitchens, bathrooms, offices, and more. We also support exterior spaces like gardens, patios, and building facades.',
      },
    ],
  },
  {
    category: 'Vastu & Cost Features',
    questions: [
      {
        q: 'What is the Vastu Shastra feature?',
        a: 'Our Vastu engine analyzes your room design against 120+ traditional Vastu principles and provides a score from 0-100. It also suggests specific changes to improve energy flow and compliance with Vastu guidelines.',
      },
      {
        q: 'How accurate is the cost calculator?',
        a: 'Our cost calculator uses 2025 pricing data from 50+ Indian cities and includes material costs, labor rates, and local taxes. It provides estimates within 10-15% accuracy of actual renovation costs.',
      },
      {
        q: 'Can I get costs in both rupees and dollars?',
        a: 'Yes! Toggle between ₹ (INR) and $ (USD) with real-time currency conversion. We also support GBP, EUR, AED, and SGD.',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        q: 'What image formats are supported?',
        a: 'We support JPG, PNG, HEIC, and WebP formats. Images can be any resolution - our AI will optimize them automatically.',
      },
      {
        q: 'How long does a render take?',
        a: 'Most renders complete in 8-15 seconds. Complex transformations or high-resolution outputs may take up to 30 seconds.',
      },
      {
        q: 'Can I edit the AI-generated images?',
        a: 'Absolutely! Our editor includes inpainting, object removal, furniture replacement, and manual adjustments. You can refine any generated image to perfection.',
      },
    ],
  },
  {
    category: 'Pricing & Plans',
    questions: [
      {
        q: 'Is there a free plan?',
        a: 'Yes! Our free plan includes 5 renders per month, basic styles, and essential features. No credit card required to start.',
      },
      {
        q: 'Can I cancel my subscription anytime?',
        a: 'Yes, you can cancel anytime. You\'ll retain access until the end of your billing period. We also offer a 7-day money-back guarantee.',
      },
      {
        q: 'Do you offer team/enterprise plans?',
        a: 'Yes! Our Teams plan includes collaboration features, shared libraries, custom branding, and dedicated support. Contact us for custom enterprise pricing.',
      },
    ],
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-24 bg-slate-950 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-blue-600/20 text-blue-300 border-blue-500/30">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Frequently Asked
            <span className="block bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            Everything you need to know about Removation.ai
          </p>
        </motion.div>

        {/* FAQ Sections */}
        <div className="max-w-4xl mx-auto">
          {faqs.map((section, sectionIndex) => (
            <motion.div
              key={section.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-violet-400 mb-4">
                {section.category}
              </h3>
              <Accordion type="single" collapsible className="space-y-4">
                {section.questions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`${sectionIndex}-${index}`}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl px-6 data-[state=open]:border-violet-500/30"
                  >
                    <AccordionTrigger className="text-left text-white hover:text-violet-300 hover:no-underline py-4">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-400 pb-4">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400 mb-4">
            Still have questions?
          </p>
          <a
            href="mailto:support@removation.ai"
            className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 transition-colors"
          >
            Contact our support team →
          </a>
        </motion.div>
      </div>
    </section>
  );
}