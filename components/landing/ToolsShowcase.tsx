"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ToolTab {
  id: string;
  name: string;
  beforeImage: string;
  afterImage: string;
  description: string;
  link: string;
}

const TOOLS_DATA: ToolTab[] = [
  {
    id: "room-changer",
    name: "Room Changer",
    beforeImage: "/images/hero-before.jpg",
    afterImage: "/images/hero-after.jpg",
    description: "Swap wall colors, materials, and themes while keeping the room structure perfectly intact.",
    link: "/room-changer",
  },
  {
    id: "full-redesign",
    name: "Full Redesign",
    beforeImage: "/images/hero-before-2.jpg",
    afterImage: "/images/hero-after-2.jpg",
    description: "Re-imagine the entire layout, furniture style, lighting, and layout of any room from scratch.",
    link: "/room-changer", // or /redesign
  },
  {
    id: "furniture-placement",
    name: "Furniture Placement",
    beforeImage: "/images/hero-before-3.jpg",
    afterImage: "/images/hero-after-3.jpg",
    description: "Drag-and-drop new furniture items directly into your room and let AI blend shadows and lighting seamlessly.",
    link: "/furniture-placement",
  },
  {
    id: "ceiling-changer",
    name: "Ceiling Changer",
    beforeImage: "/images/hero-before.jpg",
    afterImage: "/images/hero-after.jpg",
    description: "Change false ceiling layouts, drop lighting elements, and inspect beautiful wooden and POP integrations.",
    link: "/ceiling-changer",
  },
  {
    id: "object-removal",
    name: "Object Removal",
    beforeImage: "/images/hero-before-2.jpg",
    afterImage: "/images/hero-after-2.jpg",
    description: "Erase cluttered items, unwanted wiring, or old furniture in seconds with smart LaMa-inpaint technology.",
    link: "/furniture-remover",
  },
];

export function ToolsShowcase() {
  const [activeTab, setActiveTab] = useState<string>("room-changer");
  const currentTool = TOOLS_DATA.find((t) => t.id === activeTab) || TOOLS_DATA[0];

  // BeforeAfter slider logic
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMove]);

  return (
    <section className="bg-black py-24 px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Headline */}
        <div className="max-w-4xl mb-16">
          <span className="text-[#7c3aed] text-sm font-semibold uppercase tracking-wider mb-2 block">
            Powerful AI Architecture
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Design / Repaint / Furnish / Render / Redesign — from first idea to finished look
          </h2>
        </div>

        {/* Tab Selector Bar */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-10 scrollbar-thin border-b border-white/10">
          {TOOLS_DATA.map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setActiveTab(tool.id);
                setSliderPosition(50);
              }}
              className={`px-6 py-3 rounded-full text-sm font-semibold tracking-wide whitespace-nowrap border transition-all duration-300 ${
                activeTab === tool.id
                  ? "bg-[#7c3aed] text-white border-[#7c3aed]"
                  : "bg-white/5 text-white/50 border-white/10 hover:text-white hover:border-white/20"
              }`}
            >
              {tool.name}
            </button>
          ))}
        </div>

        {/* Showcase Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: The BeforeAfter Slider (8 cols) */}
          <div className="lg:col-span-8">
            <div
              ref={containerRef}
              className="relative aspect-video rounded-2xl overflow-hidden cursor-ew-resize select-none border border-white/10 group"
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
            >
              {/* After Image (Background) */}
              <div className="absolute inset-0 bg-[#0f0f0f]">
                <Image
                  src={currentTool.afterImage}
                  alt={`${currentTool.name} After`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  priority
                />
                <div className="absolute bottom-4 right-4 px-3.5 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-xs text-white/80 font-bold uppercase tracking-wider border border-white/10">
                  After Render
                </div>
              </div>

              {/* Before Image (Clipped overlay) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <Image
                  src={currentTool.beforeImage}
                  alt={`${currentTool.name} Before`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  priority
                />
                <div className="absolute bottom-4 left-4 px-3.5 py-1.5 rounded-lg bg-black/80 backdrop-blur-md text-xs text-white/80 font-bold uppercase tracking-wider border border-white/10">
                  Before Photo
                </div>
              </div>

              {/* Slider boundary line */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-2xl cursor-ew-resize z-30"
                style={{ left: `calc(${sliderPosition}% - 1px)` }}
              >
                {/* Drag pill handle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <div className="flex items-center gap-1 text-black">
                    <ChevronLeft className="w-4 h-4 fill-black" />
                    <ChevronRight className="w-4 h-4 fill-black" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Description & Link (4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-center">
            <span className="flex items-center gap-1.5 text-purple-400 font-semibold uppercase text-xs tracking-wider mb-3">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Tool Spotlight</span>
            </span>
            <h3 className="text-3xl font-bold text-white mb-4 tracking-tight">
              {currentTool.name}
            </h3>
            <p className="text-base text-white/60 font-medium leading-relaxed mb-8">
              {currentTool.description}
            </p>
            <Link href={currentTool.link}>
              <button className="flex items-center gap-2 group text-white text-base font-bold py-3 px-6 rounded-full bg-white/5 border border-white/10 hover:bg-purple-600 hover:border-purple-600 transition-all duration-300">
                <span>Try this tool</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}
