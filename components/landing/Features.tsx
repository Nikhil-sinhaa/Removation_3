'use client';

import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Wand2, 
  Paintbrush, 
  Camera, 
  Layers, 
  Zap,
  Palette,
  Home,
  Sun,
  DollarSign,
  Compass,
  Sofa,
  Building,
  Eraser,
  ImagePlus,
  PenTool,
  Maximize,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const features = [
  {
    icon: Wand2,
    title: 'AI Room Redesign',
    description: 'Transform any room with 400+ design styles in seconds using advanced AI.',
    color: 'from-violet-500 to-purple-500',
    tag: 'Most Popular',
  },
  {
    icon: Compass,
    title: 'Vastu Shastra Engine',
    description: 'Get instant Vastu scores and AI-powered suggestions for optimal energy flow.',
    color: 'from-orange-500 to-red-500',
    tag: 'India Exclusive',
  },
  {
    icon: DollarSign,
    title: 'Cost Calculator',
    description: 'Real-time renovation cost breakdown with materials, labor, and city-wise pricing.',
    color: 'from-green-500 to-emerald-500',
    tag: '₹ & $ Support',
  },

  {
    icon: Paintbrush,
    title: 'Inpainting',
    description: 'Select any area and describe what you want - AI fills it perfectly.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Sofa,
    title: 'Furniture Replace',
    description: 'Swap individual furniture pieces while keeping room context intact.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: ImagePlus,
    title: 'Fill Empty Room',
    description: 'Add furniture and decor to empty rooms with intelligent placement.',
    color: 'from-teal-500 to-green-500',
  },
  {
    icon: PenTool,
    title: 'Sketch to Render',
    description: 'Turn rough sketches into photorealistic interior designs instantly.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Building,
    title: 'Exterior Design',
    description: 'Transform home exteriors, gardens, and outdoor spaces with AI.',
    color: 'from-slate-500 to-gray-500',
  },
  {
    icon: Maximize,
    title: '4K Upscaling',
    description: 'Enhance any render to ultra-high resolution for presentations.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: RefreshCw,
    title: 'Style Transfer',
    description: 'Apply the style of one room to another maintaining structure.',
    color: 'from-fuchsia-500 to-pink-500',
  },
  {
    icon: Layers,
    title: 'Batch Processing',
    description: 'Transform multiple rooms at once with consistent styling.',
    color: 'from-yellow-500 to-amber-500',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Features() {
  return (
    <section id="features" className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-900/10 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-violet-600/20 text-violet-300 border-violet-500/30">
            <Sparkles className="w-4 h-4 mr-2" />
            32+ AI Features
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Every Tool You Need to
            <span className="block bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              Design Perfect Spaces
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            From quick redesigns to complex renovations, Removation.ai has 
            the most comprehensive AI toolkit for interior design.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={item}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl blur-xl -z-10"
                style={{
                  background: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`,
                }}
              />
              <div className="h-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition-all duration-300">
                {feature.tag && (
                  <Badge className="absolute -top-2 right-4 bg-gradient-to-r from-violet-600 to-cyan-600 text-white text-xs">
                    {feature.tag}
                  </Badge>
                )}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-slate-400">
            And many more features including{' '}
            <span className="text-white">Virtual Staging</span>,{' '}
            <span className="text-white">Color Palette Extraction</span>,{' '}
            <span className="text-white">Material Recognition</span>, and{' '}
            <span className="text-white">Floor Plan Generation</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}