"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const BACKGROUND_IMAGES = [
  "/images/hero-after.jpg",
  "/images/hero-after-2.jpg",
  "/images/hero-after-3.jpg",
];

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-black flex items-center justify-center">
      {/* Crossfading room image background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 0.65, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${BACKGROUND_IMAGES[currentIndex]})` }}
          />
        </AnimatePresence>

        {/* Dark overlays for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/60 z-10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.7)_80%)] z-10" />
      </div>

      {/* Centered content */}
      <div className="relative z-20 max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wider text-white/80 uppercase">
            Trusted by 2,800+ Indian homeowners
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]"
        >
          Transform Any Room <br />
          <span className="text-purple-400">with AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg sm:text-xl text-white/60 font-medium leading-relaxed max-w-xl mb-10"
        >
          No credit card required. Start with your first render free.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-base font-bold py-6 px-8 rounded-full border border-white/10 flex items-center justify-center gap-2 group">
              <span>Try It Free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>

          <Link href="#how-it-works" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-base font-bold py-6 px-8 rounded-full flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 text-purple-400 fill-purple-400" />
              <span>See How It Works</span>
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Slide dots */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {BACKGROUND_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`rounded-full transition-all duration-300 ${
              i === currentIndex ? "w-6 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30"
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Fade into next section */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent z-20 pointer-events-none" />
    </div>
  );
}
