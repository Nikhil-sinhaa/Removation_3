"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const CYCLING_WORDS = ["Home Design.", "Room Makeovers.", "Vastu Living."];

export function FinalCTA() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % CYCLING_WORDS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-[#111111] overflow-hidden py-32 px-6 lg:px-8 text-center border-t border-white/5">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 bg-cover bg-center blur-xl opacity-20 scale-105 z-0"
        style={{ backgroundImage: `url('/images/hero-after-3.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#111111] via-transparent to-[#111111] z-10 pointer-events-none" />

      <div className="relative z-20 max-w-4xl mx-auto flex flex-col items-center">
        <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4">
          The future of
        </h2>
        <div className="h-[1.3em] flex items-center justify-center mb-8 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={wordIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="text-4xl sm:text-6xl font-extrabold text-purple-400 tracking-tight whitespace-nowrap"
            >
              {CYCLING_WORDS[wordIndex]}
            </motion.span>
          </AnimatePresence>
        </div>

        <p className="text-lg sm:text-xl text-white/50 font-medium tracking-wide max-w-xl mb-12">
          Start free. No credit card. First render on us.
        </p>

        <Link href="/sign-up" className="mb-6">
          <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-lg font-bold py-7 px-10 rounded-full border border-white/10 shadow-2xl shadow-purple-500/20 flex items-center gap-2 group">
            <span>Create Your First Design</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </Link>

        <p className="text-xs font-semibold tracking-wider text-white/30 uppercase">
          Trusted by 2,800+ homeowners across India
        </p>
      </div>
    </section>
  );
}
