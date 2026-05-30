"use client";

import Image from "next/image";
import { Sparkles, Upload, Palette } from "lucide-react";

interface StepItem {
  number: string;
  icon: any;
  title: string;
  description: string;
  image: string;
}

const STEPS_DATA: StepItem[] = [
  {
    number: "01",
    icon: Upload,
    title: "Upload your room photo",
    description: "Any room, any angle. JPG or PNG. Takes 10 seconds.",
    image: "/samples/living-room.jpg",
  },
  {
    number: "02",
    icon: Palette,
    title: "Pick a style or color",
    description: "40+ presets including Asian Paints colors and design styles.",
    image: "/samples/bedroom.jpg",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Get your AI render in 30s",
    description: "Download it, save it, or book a designer to make it real.",
    image: "/images/hero-after-2.jpg",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-black py-24 px-6 lg:px-8 border-t border-white/5 relative overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-20">
          <span className="text-[#7c3aed] text-sm font-semibold uppercase tracking-wider mb-2 block">
            Simplifying Redecoration
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Turn your ideas into reality today
          </h2>
        </div>

        {/* 3 Steps Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative">
          
          {/* Connector Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/3 left-0 right-0 h-px bg-white/10 z-0 pointer-events-none" />

          {STEPS_DATA.map((step, index) => {
            const IconComponent = step.icon;

            return (
              <div key={index} className="flex flex-col relative z-10 group h-full">
                
                {/* Image Showcase */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-white/10 mb-8 bg-[#0a0a0a]">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 1024px) 100vw, 400px"
                  />
                  <div className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 border border-[#7c3aed]/30 flex items-center justify-center text-[#7c3aed] flex-shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-purple-400 transition-colors">
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base text-white/50 font-medium leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}