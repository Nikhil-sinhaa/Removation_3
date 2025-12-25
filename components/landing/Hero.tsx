'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Sparkles, Star, Upload } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const floatingAnimation = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const typewriterTexts = [
  'Transform any room in seconds',
  'Get Vastu-compliant designs',
  'Calculate renovation costs instantly',
  'Redesign with AI power',
];

export function Hero() {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentFullText = typewriterTexts[currentTextIndex];
    
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < currentFullText.length) {
          setDisplayText(currentFullText.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTextIndex((prev) => (prev + 1) % typewriterTexts.length);
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, currentTextIndex]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 360],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1 text-center lg:text-left"
          >
            {/* Announcement Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-violet-600/20 to-cyan-600/20 text-violet-300 border-violet-500/30 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                <span>India's #1 AI Interior Design Platform</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Badge>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight mb-6"
            >
              Redesign Your Home
              <span className="block mt-2 bg-gradient-to-r from-violet-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent">
                With AI Magic
              </span>
            </motion.h1>

            {/* Typewriter Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="h-8 mb-6"
            >
              <p className="text-xl text-slate-400">
                {displayText}
                <span className="animate-pulse">|</span>
              </p>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-slate-400 mb-8 max-w-xl mx-auto lg:mx-0"
            >
              Upload any room photo and get stunning AI-generated redesigns in seconds. 
              Plus, get real-time renovation costs and Vastu Shastra compliance scores.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 transition-all duration-300"
                >
                  <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Start Designing Free
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="group border-slate-700 text-slate-300 hover:bg-slate-800 px-8 py-6 text-lg rounded-xl"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-10 flex flex-col sm:flex-row items-center gap-6 justify-center lg:justify-start"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-sm text-slate-400">
                  <span className="text-white font-semibold">50,000+</span> happy designers
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Hero Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1 relative"
          >
            <motion.div
              variants={floatingAnimation}
              initial="initial"
              animate="animate"
              className="relative"
            >
              {/* Main Before/After Card */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-violet-600/20 border border-slate-700/50">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-800 to-slate-900">
                  {/* Before Image */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-xl bg-slate-700 flex items-center justify-center">
                        <Upload className="w-10 h-10 text-slate-500" />
                      </div>
                      <p className="text-slate-500">Your Room</p>
                    </div>
                  </div>
                  
                  {/* After Image Overlay */}
                  <motion.div
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ delay: 1, duration: 1.5, ease: 'easeInOut' }}
                    className="absolute inset-0 bg-gradient-to-br from-violet-900/50 to-cyan-900/50 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-white font-medium">AI Transformed</p>
                    </div>
                  </motion.div>

                  {/* Divider Line */}
                  <motion.div
                    initial={{ left: '0%' }}
                    animate={{ left: '50%' }}
                    transition={{ delay: 1, duration: 1.5, ease: 'easeInOut' }}
                    className="absolute top-0 bottom-0 w-1 bg-white/50 z-10"
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                      <ArrowRight className="w-4 h-4 text-slate-900" />
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Floating Cards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute -left-8 top-1/4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <span className="text-lg">🕉️</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Vastu Score</p>
                    <p className="text-lg font-bold text-green-400">92/100</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 1.7, duration: 0.5 }}
                className="absolute -right-8 bottom-1/4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-lg">₹</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Est. Cost</p>
                    <p className="text-lg font-bold text-white">₹2.4L</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.9, duration: 0.5 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-xl px-4 py-2 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-sm text-slate-300">Generated in 8.2s</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Trusted By */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-20 pt-12 border-t border-slate-800"
        >
          <p className="text-center text-slate-500 mb-8">Trusted by leading companies</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
            {['Livspace', 'HomeLane', 'UrbanLadder', 'Pepperfry', 'Godrej'].map((brand) => (
              <div key={brand} className="text-xl md:text-2xl font-bold text-slate-400">
                {brand}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}