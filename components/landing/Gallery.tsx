'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Eye, Sparkles } from 'lucide-react';

const categories = [
  'All',
  'Living Room',
  'Bedroom',
  'Kitchen',
  'Bathroom',
  'Office',
  'Exterior',
];

const galleryItems = [
  {
    id: 1,
    category: 'Living Room',
    style: 'Modern Minimalist',
    before: '/images/gallery/living-before-1.jpg',
    after: '/images/gallery/living-after-1.jpg',
    vastuScore: 94,
    cost: '₹4.2L',
  },
  {
    id: 2,
    category: 'Bedroom',
    style: 'Scandinavian',
    before: '/images/gallery/bedroom-before-1.jpg',
    after: '/images/gallery/bedroom-after-1.jpg',
    vastuScore: 88,
    cost: '₹2.8L',
  },
  {
    id: 3,
    category: 'Kitchen',
    style: 'Industrial',
    before: '/images/gallery/kitchen-before-1.jpg',
    after: '/images/gallery/kitchen-after-1.jpg',
    vastuScore: 91,
    cost: '₹5.5L',
  },
  {
    id: 4,
    category: 'Office',
    style: 'Contemporary',
    before: '/images/gallery/office-before-1.jpg',
    after: '/images/gallery/office-after-1.jpg',
    vastuScore: 96,
    cost: '₹3.1L',
  },
  {
    id: 5,
    category: 'Bathroom',
    style: 'Spa Luxury',
    before: '/images/gallery/bathroom-before-1.jpg',
    after: '/images/gallery/bathroom-after-1.jpg',
    vastuScore: 85,
    cost: '₹2.2L',
  },
  {
    id: 6,
    category: 'Exterior',
    style: 'Modern Villa',
    before: '/images/gallery/exterior-before-1.jpg',
    after: '/images/gallery/exterior-after-1.jpg',
    vastuScore: 92,
    cost: '₹15L',
  },
  {
    id: 7,
    category: 'Living Room',
    style: 'Traditional Indian',
    before: '/images/gallery/living-before-2.jpg',
    after: '/images/gallery/living-after-2.jpg',
    vastuScore: 98,
    cost: '₹3.8L',
  },
  {
    id: 8,
    category: 'Bedroom',
    style: 'Bohemian',
    before: '/images/gallery/bedroom-before-2.jpg',
    after: '/images/gallery/bedroom-after-2.jpg',
    vastuScore: 82,
    cost: '₹1.9L',
  },
];

export function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const filteredItems = activeCategory === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <Badge className="mb-4 bg-pink-600/20 text-pink-300 border-pink-500/30">
            <Eye className="w-4 h-4 mr-2" />
            AI Gallery
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            See the Magic
            <span className="block bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
              In Action
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            Real transformations created by our users. Hover to see before/after.
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              onClick={() => setActiveCategory(category)}
              className={activeCategory === category
                ? 'bg-violet-600 hover:bg-violet-700'
                : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
              }
            >
              {category}
            </Button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
              >
                {/* After Image (Default) */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800 transition-opacity duration-500"
                  style={{
                    opacity: hoveredItem === item.id ? 0 : 1,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-violet-500" />
                  </div>
                </div>

                {/* Before Image (On Hover) */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 transition-opacity duration-500"
                  style={{
                    opacity: hoveredItem === item.id ? 1 : 0,
                  }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-slate-500">Before</span>
                  </div>
                </div>

                {/* Overlay Info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-violet-600/80">{item.style}</Badge>
                      <span className="text-xs text-white/80">{item.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-400">Vastu: {item.vastuScore}</span>
                      <span className="text-white">{item.cost}</span>
                    </div>
                  </div>
                </div>

                {/* Hover Indicator */}
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-5 h-5 text-white" />
                </div>

                {/* Border Glow */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-violet-500/50 transition-colors duration-300" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* View More CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Button
            variant="outline"
            size="lg"
            className="group border-violet-500/30 text-violet-400 hover:bg-violet-600/10"
          >
            View Full Gallery
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}