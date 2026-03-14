'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    id: 1,
    name: 'Priya Sharma',
    role: 'Interior Designer',
    company: 'Design Studio Mumbai',
    location: 'Mumbai, India',
    image: '/images/testimonials/priya.jpg',
    content: 'Removation.ai has completely transformed how I work with clients. The Vastu feature is a game-changer for my Indian clients. I can now present 10x more options in a single consultation.',
    rating: 5,
    projectsCompleted: '200+',
    featured: true,
  },
  {
    id: 2,
    name: 'Rajesh Patel',
    role: 'Real Estate Developer',
    company: 'Patel Properties',
    location: 'Ahmedabad, India',
    image: '/images/testimonials/rajesh.jpg',
    content: 'The cost calculator saves us weeks of back-and-forth with contractors. We now provide instant renovation quotes to our buyers. This has increased our sales conversion by 40%.',
    rating: 5,
    projectsCompleted: '50+',
  },
  {
    id: 3,
    name: 'Sarah Chen',
    role: 'Architect',
    company: 'Chen & Associates',
    location: 'Singapore',
    image: '/images/testimonials/sarah.jpg',
    content: 'The AI quality is stunning. My clients can\'t believe these are AI-generated images. The speed allows us to iterate quickly and close deals faster.',
    rating: 5,
    projectsCompleted: '150+',
  },
  {
    id: 4,
    name: 'Amit Verma',
    role: 'Homeowner',
    company: '',
    location: 'Delhi, India',
    image: '/images/testimonials/amit.jpg',
    content: 'As someone renovating my home, this tool helped me visualize exactly what I wanted before spending a single rupee. The Vastu suggestions were bonus!',
    rating: 5,
    projectsCompleted: '1',
  },
  {
    id: 5,
    name: 'Meera Krishnan',
    role: 'Staging Professional',
    company: 'Perfect Staging Co',
    location: 'Bangalore, India',
    image: '/images/testimonials/meera.jpg',
    content: 'Virtual staging with Removation.ai has replaced physical staging for 80% of our listings. The ROI is incredible - each listing now costs 90% less to stage.',
    rating: 5,
    projectsCompleted: '500+',
  },
  {
    id: 6,
    name: 'David Thompson',
    role: 'Property Manager',
    company: 'Thompson Rentals',
    location: 'London, UK',
    image: '/images/testimonials/david.jpg',
    content: 'We use Removation.ai for all our rental property marketing. The before/after comparisons help tenants visualize the potential, leading to faster rentals.',
    rating: 5,
    projectsCompleted: '100+',
  },
];

export function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoplay]);

  const handlePrev = () => {
    setAutoplay(false);
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setAutoplay(false);
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge className="mb-4 bg-orange-600/20 text-orange-300 border-orange-500/30">
            <Star className="w-4 h-4 mr-2 fill-current" />
            Loved by 50,000+ Users
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Hear From Our
            <span className="block bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              Happy Customers
            </span>
          </h2>
        </motion.div>

        {/* Main Testimonial Carousel */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="sync">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-8 md:p-12">
                {/* Quote Icon */}
                <Quote className="w-12 h-12 text-violet-500/30 mb-6" />
                
                {/* Content */}
                <p className="text-xl md:text-2xl text-white leading-relaxed mb-8">
                  "{testimonials[activeIndex].content}"
                </p>

                {/* Author */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                      {testimonials[activeIndex].name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">
                        {testimonials[activeIndex].name}
                      </h4>
                      <p className="text-slate-400 text-sm">
                        {testimonials[activeIndex].role}
                        {testimonials[activeIndex].company && ` at ${testimonials[activeIndex].company}`}
                      </p>
                      <p className="text-slate-500 text-xs">
                        {testimonials[activeIndex].location}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {Array.from({ length: testimonials[activeIndex].rating }).map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">
                      {testimonials[activeIndex].projectsCompleted} projects completed
                    </span>
                  </div>
                </div>

                {/* Featured Badge */}
                {testimonials[activeIndex].featured && (
                  <Badge className="absolute -top-3 right-8 bg-gradient-to-r from-violet-600 to-cyan-600">
                    Featured Review
                  </Badge>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="rounded-full border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setAutoplay(false);
                    setActiveIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? 'w-8 bg-gradient-to-r from-violet-500 to-cyan-500'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="rounded-full border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mini Testimonial Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {testimonials.map((testimonial, index) => (
            <button
              key={testimonial.id}
              onClick={() => {
                setAutoplay(false);
                setActiveIndex(index);
              }}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                index === activeIndex
                  ? 'bg-slate-800 border-violet-500'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold mb-2">
                {testimonial.name.charAt(0)}
              </div>
              <p className="text-xs text-white font-medium truncate">
                {testimonial.name}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {testimonial.location}
              </p>
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}