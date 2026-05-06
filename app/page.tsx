"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useInView, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useAuth } from '@/hooks/useAuth';
// TODO: Remnant Clerk imports: useAuth
import {
  ArrowRight,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Download,
  Globe,
  Home,
  ImageIcon,
  Lightbulb,
  MousePointerClick,
  Palette,
  Play,
  Plus,
  Sparkles,
  Star,
  Wand2,
  Zap,
  IndianRupee,
  Compass,
  Building2,
  Sofa,
  Bath,
  UtensilsCrossed,
  Bed,
  TreePine,
  Paintbrush,
  Layers,
  SunMedium,
  Moon,
  Menu,
  X,
  Upload,
  Eye,
  Clock,
  Users,
  Award,
  Shield,
  Smartphone,
  Chrome,
  Heart,
  Share2,
  Maximize2,
  RotateCcw,
  Settings,
  Sliders,
  Target,
  TrendingUp,
  Cpu,
  Boxes,
  GraduationCap,
  Briefcase,
  Building,
  HomeIcon,
  Store,
  Warehouse,
  PenTool,
  Move,
  Eraser,
  Brush,
  Scan,
  Camera,
  Video,
  Monitor,
  Tablet,
  Mail,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Github,
  Facebook,
  MessageCircle,
  HelpCircle,
  BookOpen,
  FileText,
  ExternalLink,
  ArrowUpRight,
  CircleCheck,
  DollarSign,
  Calculator,
  Ruler,
  Hammer,
  PaintBucket,
  Armchair,
  Lamp,
  Frame,
  Flower2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ============================================
// ANIMATION VARIANTS
// ============================================

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const fadeInDown = {
  initial: { opacity: 0, y: -30 },
  animate: { opacity: 1, y: 0 },
};

const fadeInLeft = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
};

const fadeInRight = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0 },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// ============================================
// CUSTOM HOOKS
// ============================================

function useMousePosition() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, []);

  return mousePosition;
}

function useCountUp(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * (end - start) + start));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVisible, end, duration, start]);

  return { count, ref };
}

// ============================================
// PARTICLE BACKGROUND COMPONENT
// ============================================

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosition = useMousePosition();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
    }> = [];

    const createParticles = () => {
      const particleCount = Math.min(50, Math.floor(window.innerWidth / 30));
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    };

    createParticles();

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle, index) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Mouse interaction
        const dx = mousePosition.x - particle.x;
        const dy = mousePosition.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
          particle.x -= dx * 0.01;
          particle.y -= dy * 0.01;
        }

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139, 92, 246, ${particle.opacity})`;
        ctx.fill();

        // Draw connections
        particles.forEach((otherParticle, otherIndex) => {
          if (index === otherIndex) return;
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * (1 - distance / 120)})`;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [mousePosition]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}

// ============================================
// GRADIENT ORB COMPONENT
// ============================================

function GradientOrb({ 
  className, 
  color = "purple" 
}: { 
  className?: string; 
  color?: "purple" | "pink" | "blue" | "green" 
}) {
  const colorMap = {
    purple: "from-purple-600/30 to-violet-600/30",
    pink: "from-pink-600/30 to-rose-600/30",
    blue: "from-blue-600/30 to-cyan-600/30",
    green: "from-green-600/30 to-emerald-600/30",
  };

  return (
    <div
      className={cn(
        "absolute rounded-full blur-3xl animate-pulse-slow",
        `bg-gradient-to-br ${colorMap[color]}`,
        className
      )}
    />
  );
}

// ============================================
// NAVBAR COMPONENT
// ============================================

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#gallery", label: "Gallery" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-background/80 backdrop-blur-2xl border-b border-white/5 shadow-lg shadow-purple-500/5"
            : "bg-transparent"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div 
                className="relative w-10 h-10"
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 rounded-xl shadow-lg shadow-purple-500/30" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">
                  R
                </div>
              </motion.div>
              <span className="text-xl font-bold text-white hidden sm:block">
                Removation
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">.ai</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm text-muted-foreground hover:text-white transition-colors group"
                >
                  <span className="relative z-10">{link.label}</span>
                  <span className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/5 transition-colors" />
                </Link>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {isSignedIn ? (
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300">
                    Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="hidden sm:block">
                    <Button variant="ghost" className="text-muted-foreground hover:text-white hover:bg-white/5">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300">
                      <span className="hidden sm:inline">Get Started Free</span>
                      <span className="sm:hidden">Start Free</span>
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-muted-foreground hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-16 z-40 lg:hidden"
          >
            <div className="bg-background/95 backdrop-blur-2xl border-b border-white/5 shadow-2xl">
              <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-3 px-4 text-lg text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navLinks.length * 0.1 }}
                  className="pt-4 border-t border-white/5"
                >
                  <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-white/10 mb-3">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600">
                      Get Started Free
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// BEFORE/AFTER SLIDER COMPONENT
// ============================================

function BeforeAfterSlider({ 
  beforeImage, 
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 1024px"
}: { 
  beforeImage: string; 
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  priority?: boolean;
  sizes?: string;
}) {
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
    <div
      ref={containerRef}
      className="relative aspect-video rounded-2xl overflow-hidden cursor-ew-resize select-none group"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* After Image (Background) */}
      <div className="absolute inset-0">
        <Image
          src={afterImage}
          alt="After"
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
        />
        <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-sm text-white font-medium">
          {afterLabel}
        </div>
      </div>

      {/* Before Image (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={beforeImage}
          alt="Before"
          fill
          sizes={sizes}
          className="object-cover"
          priority={priority}
        />
        <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-sm text-white font-medium">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `calc(${sliderPosition}% - 2px)` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
          <div className="flex items-center gap-1 text-gray-800">
            <ChevronLeft className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// ANIMATED COUNTER COMPONENT
// ============================================

function AnimatedCounter({ 
  value, 
  suffix = "", 
  prefix = "" 
}: { 
  value: number; 
  suffix?: string; 
  prefix?: string;
}) {
  const { count, ref } = useCountUp(value, 2000);
  
  return (
    <div ref={ref} className="text-4xl sm:text-5xl font-bold text-white">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
}

// ============================================
// FLOATING ELEMENTS COMPONENT
// ============================================

function FloatingElements() {
  return (
    <>
      {/* Top Left */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute top-32 left-8 hidden lg:block"
      >
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl"
        >
          <Home className="w-10 h-10 text-purple-400" />
        </motion.div>
      </motion.div>

      {/* Top Right */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="absolute top-48 right-12 hidden lg:block"
      >
        <motion.div
          animate={{ 
            y: [0, 12, 0],
            rotate: [0, -5, 0]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600/20 to-rose-600/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl"
        >
          <Palette className="w-8 h-8 text-pink-400" />
        </motion.div>
      </motion.div>

      {/* Bottom Left */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="absolute bottom-48 left-16 hidden xl:block"
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            x: [0, 5, 0]
          }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl"
        >
          <Wand2 className="w-7 h-7 text-indigo-400" />
        </motion.div>
      </motion.div>

      {/* Right Side - Vastu */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="absolute top-1/3 right-8 hidden xl:block"
      >
        <motion.div
          animate={{ 
            y: [0, 8, 0],
            rotate: [0, 360]
          }}
          transition={{ 
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" }
          }}
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-600/20 to-orange-600/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl"
        >
          <Compass className="w-7 h-7 text-amber-400" />
        </motion.div>
      </motion.div>

      {/* Bottom Right - Cost */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="absolute bottom-1/3 right-20 hidden xl:block"
      >
        <motion.div
          animate={{ 
            y: [0, -12, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl"
        >
          <IndianRupee className="w-8 h-8 text-green-400" />
        </motion.div>
      </motion.div>
    </>
  );
}

// ============================================
// HERO SECTION
// ============================================

function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  const [currentStyle, setCurrentStyle] = useState(0);
  const styles = [
    "Modern Minimalist",
    "Scandinavian",
    "Industrial Chic",
    "Bohemian",
    "Japanese Zen",
    "Art Deco",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStyle((prev) => (prev + 1) % styles.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [styles.length]);

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 hero-grid opacity-30" />
      
      {/* Gradient Orbs */}
      <GradientOrb className="w-[600px] h-[600px] -top-64 -left-64" color="purple" />
      <GradientOrb className="w-[500px] h-[500px] -bottom-32 -right-32" color="pink" />
      <GradientOrb className="w-[400px] h-[400px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" color="blue" />

      {/* Floating Elements */}
      <FloatingElements />

      <motion.div style={{ y }} className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center"
          >
            {/* Badge */}
            <motion.div variants={fadeInUp} className="mb-6">
              <Badge className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border-purple-500/30 px-4 py-2 text-sm backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                #1 AI Interior Design Platform in India
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 text-balance leading-tight"
            >
              Transform Any Space with{" "}
              <span className="relative">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                  AI-Powered
                </span>
              </span>{" "}
              Design
            </motion.h1>

            {/* Dynamic Style Text */}
            <motion.div variants={fadeInUp} className="mb-4 h-10">
              <AnimatePresence mode="sync">
                <motion.p
                  key={currentStyle}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl sm:text-2xl text-purple-300"
                >
                  Try <span className="font-semibold">{styles[currentStyle]}</span> style →
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* Subheadline */}
            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10"
            >
              Upload a photo, pick from 400+ styles, and watch AI redesign your room in seconds.
              Get instant renovation costs in ₹ & $ with Vastu Shastra compliance scores.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            >
              <Link href="/ai-design">
                <Button
                  className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-lg px-8 py-6 rounded-xl shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 group"
                >
                  <span className="relative z-10 flex items-center">
                    Try AI Design Studio
                    <Zap className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl backdrop-blur-sm group"
              >
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Social Proof Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-3xl mx-auto mb-16"
            >
              {[
                { value: 500000, suffix: "+", label: "Rooms Designed" },
                { value: 400, suffix: "+", label: "Design Styles" },
                { value: 50000, suffix: "+", label: "Happy Users" },
                { value: 4.9, suffix: "★", label: "User Rating", isDecimal: true },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    {stat.isDecimal ? stat.value : <AnimatedCounter value={stat.value} />}
                    {stat.isDecimal && stat.value}
                    {stat.suffix}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Hero Image with Before/After */}
            <motion.div
              variants={scaleIn}
              className="relative max-w-5xl mx-auto"
            >
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-500/10">
                <BeforeAfterSlider
                  beforeImage="/images/hero-before.jpg"
                  afterImage="/images/hero-after.jpg"
                  beforeLabel="Original Room"
                  afterLabel="AI Redesigned"
                  priority={true}
                />

                {/* Overlay Info Badges */}
                <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10">
                      <span className="text-white font-medium text-sm sm:text-base">Modern Minimalist</span>
                    </div>
                    <div className="hidden sm:flex px-4 py-2 rounded-xl bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30">
                      <span className="text-green-400 font-medium text-sm flex items-center gap-2">
                        <Compass className="w-4 h-4" />
                        Vastu: 92/100
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30">
                    <span className="text-purple-300 font-medium text-sm flex items-center gap-2">
                      <IndianRupee className="w-4 h-4" />
                      Est: ₹4,50,000
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating UI Cards */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.2, duration: 0.5 }}
                className="absolute -left-6 top-1/4 hidden lg:block"
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-white/10 shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <Wand2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Style Applied</div>
                      <div className="text-white font-medium">Minimalist</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.4, duration: 0.5 }}
                className="absolute -right-6 top-1/3 hidden lg:block"
              >
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-white/10 shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                      <Compass className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Vastu Score</div>
                      <div className="text-white font-medium flex items-center gap-1">
                        92/100 <Check className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6, duration: 0.5 }}
                className="absolute -right-4 bottom-1/4 hidden xl:block"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="p-4 rounded-2xl bg-card/90 backdrop-blur-xl border border-white/10 shadow-2xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                      <IndianRupee className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Est. Cost</div>
                      <div className="text-white font-medium">₹4.5 Lakhs</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Render Time Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.8, duration: 0.3 }}
                className="absolute -bottom-4 left-1/2 -translate-x-1/2"
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30">
                  <Zap className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Generated in 8.2 seconds</span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center gap-2 text-muted-foreground cursor-pointer"
          onClick={() => {
            document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <span className="text-sm">Scroll to explore</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================
// TRUSTED BY SECTION
// ============================================

function TrustedBySection() {
  const logos = [
    { name: "Google", icon: "G" },
    { name: "Microsoft", icon: "M" },
    { name: "Airbnb", icon: "A" },
    { name: "Uber", icon: "U" },
    { name: "Netflix", icon: "N" },
    { name: "Spotify", icon: "S" },
    { name: "Stripe", icon: "S" },
    { name: "Figma", icon: "F" },
  ];

  return (
    <section className="py-12 border-y border-white/5 bg-gradient-to-r from-transparent via-purple-900/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-muted-foreground text-sm mb-8">
          Trusted by designers and homeowners at
        </p>
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll gap-12">
            {[...logos, ...logos].map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors flex-shrink-0"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-bold">
                  {logo.icon}
                </div>
                <span className="text-lg font-semibold">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// FEATURES SECTION
// ============================================

function FeaturesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: <Wand2 className="w-6 h-6" />,
      title: "AI Room Redesign",
      description: "Transform any room with 400+ design styles in seconds. Modern, Traditional, Bohemian, and more.",
      color: "purple",
      gradient: "from-purple-600/20 to-violet-600/20",
      borderColor: "border-purple-500/20",
      iconBg: "from-purple-600 to-violet-600",
    },
    {
      icon: <Compass className="w-6 h-6" />,
      title: "Vastu Shastra AI",
      description: "Get 0-100 Vastu compliance score with auto-fix suggestions. First-ever AI Vastu integration.",
      color: "amber",
      gradient: "from-amber-600/20 to-orange-600/20",
      borderColor: "border-amber-500/20",
      iconBg: "from-amber-500 to-orange-500",
      badge: "🇮🇳 Indian Exclusive",
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Real-Time Cost Calculator",
      description: "Instant renovation estimates in ₹ & $. Material, labor, and tax breakdown by city.",
      color: "green",
      gradient: "from-green-600/20 to-emerald-600/20",
      borderColor: "border-green-500/20",
      iconBg: "from-green-500 to-emerald-500",
      badge: "🇮🇳 Indian Exclusive",
    },
    {
      icon: <Brush className="w-6 h-6" />,
      title: "Smart Inpainting",
      description: "Brush over furniture to replace or remove. AI understands context and fills naturally.",
      color: "blue",
      gradient: "from-blue-600/20 to-cyan-600/20",
      borderColor: "border-blue-500/20",
      iconBg: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Fill Empty Rooms",
      description: "Upload an empty room and AI furnishes it completely based on your chosen style.",
      color: "indigo",
      gradient: "from-indigo-600/20 to-purple-600/20",
      borderColor: "border-indigo-500/20",
      iconBg: "from-indigo-500 to-purple-500",
    },
    {
      icon: <SunMedium className="w-6 h-6" />,
      title: "Lighting Simulation",
      description: "See your design in morning, afternoon, evening, and night lighting conditions.",
      color: "yellow",
      gradient: "from-yellow-600/20 to-amber-600/20",
      borderColor: "border-yellow-500/20",
      iconBg: "from-yellow-500 to-amber-500",
    },
    {
      icon: <TreePine className="w-6 h-6" />,
      title: "Exterior & Landscaping",
      description: "Design gardens, patios, facades, and outdoor spaces with the same AI power.",
      color: "teal",
      gradient: "from-teal-600/20 to-green-600/20",
      borderColor: "border-teal-500/20",
      iconBg: "from-teal-500 to-green-500",
    },
    {
      icon: <Maximize2 className="w-6 h-6" />,
      title: "4K Upscaling",
      description: "Export renders in stunning 4K resolution for professional presentations.",
      color: "rose",
      gradient: "from-rose-600/20 to-pink-600/20",
      borderColor: "border-rose-500/20",
      iconBg: "from-rose-500 to-pink-500",
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-900/5 to-background" />
      <GradientOrb className="w-[800px] h-[800px] -left-96 top-0 opacity-30" color="purple" />
      <GradientOrb className="w-[600px] h-[600px] -right-64 bottom-0 opacity-20" color="pink" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 mb-4">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            32 Powerful Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Design Better
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            From AI room redesign to real-time cost estimation. All the tools professionals use, now for everyone.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div
                className={cn(
                  "relative h-full p-6 rounded-2xl border backdrop-blur-sm transition-all duration-300",
                  "bg-gradient-to-br hover:bg-gradient-to-br",
                  feature.gradient,
                  feature.borderColor,
                  "hover:border-opacity-40 hover:shadow-lg hover:shadow-purple-500/5",
                  "hover:-translate-y-1"
                )}
              >
                {feature.badge && (
                  <div className="absolute -top-3 right-4">
                    <Badge className="bg-gradient-to-r from-amber-600/30 to-orange-600/30 text-amber-300 border-amber-500/30 text-xs shadow-lg">
                      {feature.badge}
                    </Badge>
                  </div>
                )}

                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                    "bg-gradient-to-br shadow-lg",
                    feature.iconBg,
                    "group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300"
                  )}
                >
                  <div className="text-white">{feature.icon}</div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>

                <div className="mt-4 flex items-center text-sm text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Features CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <Link href="/features">
            <Button
              variant="outline"
              size="lg"
              className="border-white/10 text-white hover:bg-white/5 group"
            >
              View All 32 Features
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// ROOM TYPES SECTION
// ============================================

function RoomTypesSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const roomTypes = [
    { icon: <Sofa className="w-7 h-7" />, name: "Living Room", count: "120K+", color: "from-purple-600 to-violet-600" },
    { icon: <Bed className="w-7 h-7" />, name: "Bedroom", count: "98K+", color: "from-pink-600 to-rose-600" },
    { icon: <UtensilsCrossed className="w-7 h-7" />, name: "Kitchen", count: "76K+", color: "from-amber-500 to-orange-500" },
    { icon: <Bath className="w-7 h-7" />, name: "Bathroom", count: "54K+", color: "from-blue-500 to-cyan-500" },
    { icon: <Building2 className="w-7 h-7" />, name: "Office", count: "43K+", color: "from-indigo-600 to-purple-600" },
    { icon: <TreePine className="w-7 h-7" />, name: "Outdoor", count: "32K+", color: "from-green-500 to-emerald-500" },
  ];

  return (
    <section className="py-20 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Design Any Room Type
          </h2>
          <p className="text-muted-foreground text-lg">
            From cozy bedrooms to stunning outdoor spaces — AI handles it all
          </p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {roomTypes.map((room, index) => (
            <motion.div
              key={room.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group cursor-pointer"
            >
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 backdrop-blur-sm text-center transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
                <div
                  className={cn(
                    "w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-white",
                    "bg-gradient-to-br shadow-lg",
                    room.color,
                    "group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300"
                  )}
                >
                  {room.icon}
                </div>
                <h3 className="font-semibold text-white mb-1">{room.name}</h3>
                <p className="text-sm text-muted-foreground">{room.count} designs</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// HOW IT WORKS SECTION
// ============================================

function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const steps = [
    {
      number: "01",
      title: "Upload Your Photo",
      description: "Snap a photo of any room or upload an existing image. Works with any angle, lighting, or quality.",
      icon: <Upload className="w-7 h-7" />,
      color: "from-purple-600 to-violet-600",
    },
    {
      number: "02",
      title: "Choose Your Style",
      description: "Pick from 400+ design styles including Modern, Scandinavian, Industrial, Indian Traditional & more.",
      icon: <Palette className="w-7 h-7" />,
      color: "from-pink-600 to-rose-600",
    },
    {
      number: "03",
      title: "AI Magic in Seconds",
      description: "Our AI redesigns your room in under 15 seconds with photorealistic, stunning results.",
      icon: <Wand2 className="w-7 h-7" />,
      color: "from-amber-500 to-orange-500",
    },
    {
      number: "04",
      title: "Get Cost & Vastu",
      description: "See detailed renovation costs in ₹/$ and Vastu compliance score with improvement tips.",
      icon: <Calculator className="w-7 h-7" />,
      color: "from-green-500 to-emerald-500",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-900/5 to-background" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 mb-4">
            Simple Process
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your space in four simple steps
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-600/0 via-purple-600/50 to-purple-600/0 hidden lg:block" />

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className="relative group"
              >
                <div className="relative p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-2">
                  {/* Step Number */}
                  <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-400">{step.number}</span>
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5",
                      "bg-gradient-to-br shadow-lg",
                      step.color,
                      "group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300"
                    )}
                  >
                    {step.icon}
                  </div>

                  <h3 className="text-xl font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Connector Arrow (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="absolute top-24 -right-4 hidden lg:flex items-center justify-center z-10">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                      <ChevronRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center mt-16"
        >
          <Link href="/sign-up">
            <Button
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25"
            >
              Try It Free Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// GALLERY SECTION
// ============================================

function GallerySection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { id: "all", label: "All" },
    { id: "living", label: "Living Room" },
    { id: "bedroom", label: "Bedroom" },
    { id: "kitchen", label: "Kitchen" },
    { id: "outdoor", label: "Outdoor" },
  ];

  const galleryItems = [
    { id: 1, category: "living", style: "Modern Minimalist", before: "/images/gallery/living-before-1.jpg", after: "/images/gallery/living-after-1.jpg" },
    { id: 2, category: "bedroom", style: "Scandinavian", before: "/images/gallery/bedroom-before-1.jpg", after: "/images/gallery/bedroom-after-1.jpg" },
    { id: 3, category: "kitchen", style: "Industrial", before: "/images/gallery/kitchen-before-1.jpg", after: "/images/gallery/kitchen-after-1.jpg" },
    { id: 4, category: "outdoor", style: "Tropical", before: "/images/gallery/outdoor-before-1.jpg", after: "/images/gallery/outdoor-after-1.jpg" },
    { id: 5, category: "living", style: "Bohemian", before: "/images/gallery/living-before-2.jpg", after: "/images/gallery/living-after-2.jpg" },
    { id: 6, category: "bedroom", style: "Japanese Zen", before: "/images/gallery/bedroom-before-2.jpg", after: "/images/gallery/bedroom-after-2.jpg" },
  ];

  const filteredItems = activeCategory === "all" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeCategory);

  return (
    <section id="gallery" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 mb-4">
            <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
            Design Gallery
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Real Transformations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what our AI can do with real room photos
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300",
                activeCategory === category.id
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                  : "bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10"
              )}
            >
              {category.label}
            </button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
                  <BeforeAfterSlider
                    beforeImage={item.before}
                    afterImage={item.after}
                    beforeLabel="Before"
                    afterLabel={item.style}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* View More */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <Link href="/gallery">
            <Button variant="outline" size="lg" className="border-white/10 text-white hover:bg-white/5">
              View Full Gallery
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// INDIAN EXCLUSIVE SECTION
// ============================================

function IndianExclusiveSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-orange-900/5 to-background" />
      <GradientOrb className="w-[600px] h-[600px] -left-48 top-0 opacity-20" color="green" />
      <GradientOrb className="w-[500px] h-[500px] -right-32 bottom-0 opacity-20" color="purple" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <Badge className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 text-amber-300 border-amber-500/30 mb-4">
            🇮🇳 Made for India
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            India-First Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built by Indians, for Indian homes. Features no competitor offers.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Vastu Feature */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="relative p-8 rounded-3xl bg-gradient-to-br from-amber-600/10 to-orange-600/10 border border-amber-500/20 backdrop-blur-sm"
          >
            <div className="absolute top-6 right-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Compass className="w-8 h-8 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4 pr-20">
              Vastu Shastra AI Engine
            </h3>
            <p className="text-muted-foreground mb-6">
              The world's first AI that understands Vastu principles. Get instant compliance scores and actionable suggestions.
            </p>

            <div className="space-y-4">
              {[
                "0-100 Vastu compliance score",
                "120+ Vastu rules analyzed",
                "Auto-fix suggestions",
                "Direction-based room optimization",
                "Element balance analysis",
              ].map((feature, index) => (
                <div key={`vastu-feature-${index}`} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>

            {/* Sample Vastu Score */}
            <div className="mt-8 p-6 rounded-2xl bg-black/20 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground">Living Room Vastu Score</span>
                <span className="text-2xl font-bold text-amber-400">87/100</span>
              </div>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={isInView ? { width: "87%" } : {}}
                  transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                💡 Tip: Move the study desk to the East wall for +8 points
              </p>
            </div>
          </motion.div>

          {/* Cost Calculator Feature */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 }}
            className="relative p-8 rounded-3xl bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-500/20 backdrop-blur-sm"
          >
            <div className="absolute top-6 right-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <IndianRupee className="w-8 h-8 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-white mb-4 pr-20">
              Real-Time Cost Calculator
            </h3>
            <p className="text-muted-foreground mb-6">
              Instant renovation cost estimates with city-specific pricing. Know your budget before starting.
            </p>

            <div className="space-y-4">
              {[
                "2024-25 material prices",
                "City-specific labor rates",
                "GST & tax breakdown",
                "Multiple quality tiers",
                "Export PDF estimates",
              ].map((feature, index) => (
                <div key={`cost-feature-${index}`} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>

            {/* Sample Cost Breakdown */}
            <div className="mt-8 p-6 rounded-2xl bg-black/20 border border-white/5">
              <div className="text-muted-foreground mb-4">Living Room Renovation</div>
              <div className="space-y-3">
                {[
                  { label: "Materials", value: "₹2,50,000" },
                  { label: "Labor", value: "₹1,20,000" },
                  { label: "GST (18%)", value: "₹66,600" },
                ].map((item, index) => (
                  <div key={`item-${index}`} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
                <div className="pt-3 border-t border-white/10 flex justify-between">
                  <span className="text-white font-medium">Total</span>
                  <span className="text-xl font-bold text-green-400">₹4,36,600</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================
// PRICING SECTION
// ============================================

function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isAnnual, setIsAnnual] = useState(true);
  const [currency, setCurrency] = useState<"USD" | "INR">("USD");

  const plans = [
    {
      name: "Free",
      description: "Perfect for trying out Removation",
      price: { monthly: { USD: 0, INR: 0 }, annual: { USD: 0, INR: 0 } },
      features: [
        "5 AI renders per month",
        "Standard quality",
        "10 design styles",
        "Basic room types",
        "Watermarked exports",
      ],
      cta: "Get Started",
      ctaVariant: "outline" as const,
      popular: false,
    },
    {
      name: "Pro",
      description: "For homeowners & small projects",
      price: { monthly: { USD: 29, INR: 2399 }, annual: { USD: 290, INR: 23990 } },
      features: [
        "100 AI renders per month",
        "HD quality exports",
        "All 400+ design styles",
        "All room types",
        "Vastu analysis",
        "Cost calculator",
        "No watermarks",
        "Priority support",
      ],
      cta: "Start Pro Trial",
      ctaVariant: "default" as const,
      popular: true,
    },
    {
      name: "Teams",
      description: "For professionals & agencies",
      price: { monthly: { USD: 99, INR: 8199 }, annual: { USD: 990, INR: 81990 } },
      priceLabel: "per user",
      features: [
        "Unlimited AI renders",
        "4K quality exports",
        "All Pro features",
        "Team collaboration",
        "White-label exports",
        "API access",
        "Custom styles",
        "Dedicated support",
        "SSO integration",
      ],
      cta: "Contact Sales",
      ctaVariant: "outline" as const,
      popular: false,
    },
  ];

  const currencySymbol = currency === "USD" ? "$" : "₹";
  const currentPrice = (plan: typeof plans[0]) => {
    const priceObj = isAnnual ? plan.price.annual : plan.price.monthly;
    return priceObj[currency];
  };

  return (
    <section id="pricing" className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-purple-900/5 to-background" />
      <GradientOrb className="w-[800px] h-[800px] left-1/2 -translate-x-1/2 top-0 opacity-20" color="purple" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 mb-4">
            Simple Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free, upgrade when you need more power
          </p>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Billing Toggle */}
            <div className="flex items-center gap-3">
              <span className={cn("text-sm transition-colors", !isAnnual ? "text-white" : "text-muted-foreground")}>
                Monthly
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={cn(
                  "relative w-14 h-8 rounded-full transition-colors",
                  isAnnual ? "bg-gradient-to-r from-purple-600 to-pink-600" : "bg-white/20"
                )}
              >
                <motion.div
                  animate={{ x: isAnnual ? 26 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md"
                />
              </button>
              <span className={cn("text-sm transition-colors", isAnnual ? "text-white" : "text-muted-foreground")}>
                Annual{" "}
                <span className="text-green-400 text-xs font-medium">(Save 17%)</span>
              </span>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-2 p-1 rounded-full bg-white/5 border border-white/10">
              <button
                onClick={() => setCurrency("USD")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  currency === "USD"
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                $ USD
              </button>
              <button
                onClick={() => setCurrency("INR")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                  currency === "INR"
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:text-white"
                )}
              >
                ₹ INR
              </button>
            </div>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              className={cn(
                "relative rounded-3xl p-8 backdrop-blur-sm transition-all duration-300",
                plan.popular
                  ? "bg-gradient-to-b from-purple-600/20 to-pink-600/10 border-2 border-purple-500/30 shadow-xl shadow-purple-500/10"
                  : "bg-white/5 border border-white/10 hover:border-white/20"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 shadow-lg">
                    Most Popular
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">
                    {currencySymbol}
                    {currentPrice(plan).toLocaleString()}
                  </span>
                  {plan.price.monthly.USD > 0 && (
                    <span className="text-muted-foreground">
                      /{isAnnual ? "year" : "month"}
                      {plan.priceLabel && ` ${plan.priceLabel}`}
                    </span>
                  )}
                </div>
                {isAnnual && plan.price.monthly.USD > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {currencySymbol}
                    {Math.round(currentPrice(plan) / 12).toLocaleString()}/month billed annually
                  </p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={`${feature}-${idx}`} className="flex items-start gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                      plan.popular ? "bg-purple-500/20" : "bg-white/10"
                    )}>
                      <Check className={cn("w-3.5 h-3.5", plan.popular ? "text-purple-400" : "text-green-400")} />
                    </div>
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  "w-full py-6 font-medium",
                  plan.popular
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25"
                    : "bg-white/10 hover:bg-white/20 border border-white/10"
                )}
              >
                {plan.cta}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Secure payments powered by
          </p>
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {["Stripe", "Razorpay", "UPI", "Cards", "Net Banking"].map((method) => (
              <div
                key={method}
                className="px-4 py-2 rounded-lg bg-white/5 text-muted-foreground text-sm"
              >
                {method}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// TESTIMONIALS SECTION
// ============================================

function TestimonialsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeIndex, setActiveIndex] = useState(0);

  const testimonials = [
    {
      name: "Priya Sharma",
      role: "Interior Designer",
      location: "Mumbai",
      content: "Removation has completely transformed how I present concepts to clients. The Vastu integration is a game-changer for Indian projects! I've saved 20+ hours per week on mockups.",
      rating: 5,
      image: "/images/testimonials/avatar-1.jpg",
    },
    {
      name: "Rahul Gupta",
      role: "Homeowner",
      location: "Delhi",
      content: "The cost calculator saved me from so many surprises. I knew exactly what my renovation would cost before starting. Ended up saving ₹2 lakhs!",
      rating: 5,
      image: "/images/testimonials/avatar-2.jpg",
    },
    {
      name: "Ananya Reddy",
      role: "Architect",
      location: "Bangalore",
      content: "400+ styles and the quality is incredible. My clients love seeing realistic previews of their future spaces. This is the future of design presentations.",
      rating: 5,
      image: "/images/testimonials/avatar-3.jpg",
    },
    {
      name: "Vikram Singh",
      role: "Real Estate Agent",
      location: "Pune",
      content: "Virtual staging with Removation sells properties 40% faster. The ROI on Pro plan is incredible. Every realtor needs this tool.",
      rating: 5,
      image: "/images/testimonials/avatar-4.jpg",
    },
    {
      name: "Meera Iyer",
      role: "Interior Design Student",
      location: "Chennai",
      content: "As a student, the free tier is perfect for learning. I've designed over 50 rooms and learned so much about different styles!",
      rating: 5,
      image: "/images/testimonials/avatar-5.jpg",
    },
    {
      name: "Arjun Kapoor",
      role: "Contractor",
      location: "Jaipur",
      content: "The cost breakdown feature is incredibly accurate for Indian markets. It's become my go-to tool for client estimates.",
      rating: 5,
      image: "/images/testimonials/avatar-6.jpg",
    },
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 mb-4">
            <Heart className="w-3.5 h-3.5 mr-1.5" />
            Customer Love
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Loved by 50,000+ Users
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our customers are saying about Removation
          </p>
        </motion.div>

        {/* Featured Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-12"
        >
          <AnimatePresence mode="sync">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-purple-500/20 backdrop-blur-sm"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-purple-500/20">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v7h-10zm-14 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v7h-10z" />
                </svg>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                  {testimonials[activeIndex].name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <h4 className="text-white font-semibold">{testimonials[activeIndex].name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {testimonials[activeIndex].role} • {testimonials[activeIndex].location}
                  </p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                "{testimonials[activeIndex].content}"
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Testimonial Dots */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {testimonials.map((_, index) => (
            <button
              key={`testimonial-nav-${index}`}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                activeIndex === index
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 w-8"
                  : "bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>

        {/* More Testimonials Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600/20 to-pink-600/20 flex items-center justify-center">
                  <div className="text-white font-medium">
                    {testimonial.name.charAt(0)}
                  </div>
                </div>
                <div>
                  <h4 className="text-white font-medium text-sm">{testimonial.name}</h4>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                "{testimonial.content}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// FAQ SECTION
// ============================================

function FAQSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How accurate is the AI room redesign?",
      answer: "Our AI achieves 95%+ accuracy in matching architectural elements and furniture placement. It understands room geometry, lighting, and context to create photorealistic renders that maintain the original room's structure while transforming its style."
    },
    {
      question: "Can I use Removation for commercial projects?",
      answer: "Yes! Our Teams plan is specifically designed for professionals. You get unlimited renders, 4K exports, white-label options, and API access. Many interior designers, architects, and real estate agencies use Removation professionally."
    },
    {
      question: "How does the Vastu Shastra feature work?",
      answer: "Our AI analyzes room layout, furniture placement, directions, and elements against 120+ Vastu rules. It provides a 0-100 compliance score with specific suggestions like 'Move bed to south-west' or 'Add green plant in north-east for prosperity.'"
    },
    {
      question: "Is my data and uploaded photos secure?",
      answer: "Absolutely. We use military-grade encryption, never store photos longer than needed, and never use your data to train our AI without explicit permission. All data processing happens on secure servers with strict access controls."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit/debit cards via Stripe, UPI, Net Banking, and digital wallets via Razorpay. Enterprise customers can request invoice-based billing. We support both monthly and annual billing cycles."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel anytime from your account settings. If you cancel, you'll keep access until the end of your billing period. We offer prorated refunds for annual plans within the first 30 days."
    }
  ];

  return (
    <section id="faq" className="py-24 relative overflow-hidden" ref={ref}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30 mb-4">
            <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
            FAQ
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about Removation
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={`faq-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={cn(
                  "w-full p-6 rounded-2xl text-left transition-all duration-300",
                  openIndex === index
                    ? "bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20"
                    : "bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10"
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-white text-lg">
                    {faq.question}
                  </h3>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-purple-400 transition-transform duration-300",
                    openIndex === index && "rotate-180"
                  )} />
                </div>
                <motion.div
                  initial={false}
                  animate={{ height: openIndex === index ? "auto" : 0, opacity: openIndex === index ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <p className="pt-4 text-muted-foreground border-t border-white/5 mt-4">
                    {faq.answer}
                  </p>
                </motion.div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* Still have questions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.7 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-6">
            Still have questions? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
                <MessageCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </Link>
            <Link href="/docs">
              <Button variant="ghost" className="text-muted-foreground hover:text-white">
                <BookOpen className="mr-2 h-4 w-4" />
                Documentation
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// CTA SECTION
// ============================================

function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative overflow-hidden" ref={ref}>
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600" />
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-20" />
      
      {/* Animated Orbs */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-pink-500/10 blur-3xl"
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden"
        >
          {/* Content */}
          <div className="relative text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Badge className="bg-white/20 text-white border-white/30 mb-4 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Limited Time Offer
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Ready to Transform Your Space?
              </h2>
              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
                Join 50,000+ users who are already designing their dream spaces with AI. 
                Start for free, no credit card required.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
            >
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-white text-purple-600 hover:bg-white/90 text-lg px-8 py-6 shadow-2xl"
                >
                  Start Designing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6"
                >
                  Talk to Sales
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ delay: 0.6 }}
              className="text-white/60 text-sm"
            >
              <div className="flex flex-wrap items-center justify-center gap-6 mb-4">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  No credit card required
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  5 free AI renders
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Cancel anytime
                </span>
              </div>
              <p>Get started in 30 seconds • No design experience needed</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// FOOTER
// ============================================

function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Gallery", href: "#gallery" },
      { label: "API", href: "/api" },
      { label: "Roadmap", href: "/roadmap" },
    ],
    Company: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
      { label: "Press", href: "/press" },
    ],
    Resources: [
      { label: "Documentation", href: "/docs" },
      { label: "Help Center", href: "/help" },
      { label: "Community", href: "/community" },
      { label: "Partners", href: "/partners" },
      { label: "Status", href: "/status" },
    ],
    Legal: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Security", href: "/security" },
      { label: "Cookies", href: "/cookies" },
      { label: "Compliance", href: "/compliance" },
    ],
  };

  const socialLinks = [
    { icon: <Twitter className="w-5 h-5" />, href: "https://twitter.com/removation", label: "Twitter" },
    { icon: <Linkedin className="w-5 h-5" />, href: "https://linkedin.com/company/removation", label: "LinkedIn" },
    { icon: <Instagram className="w-5 h-5" />, href: "https://instagram.com/removation.ai", label: "Instagram" },
    { icon: <Youtube className="w-5 h-5" />, href: "https://youtube.com/removation", label: "YouTube" },
    { icon: <Github className="w-5 h-5" />, href: "https://github.com/removation", label: "GitHub" },
  ];

  return (
    <footer className="py-12 border-t border-white/5 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="grid lg:grid-cols-6 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 rounded-xl shadow-lg" />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">
                  R
                </div>
              </div>
              <span className="text-xl font-bold text-white">
                Removation<span className="text-purple-400">.ai</span>
              </span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Transform any space with AI-powered design. Real-time cost estimates and Vastu compliance built for India.
            </p>
            <div className="flex items-center gap-3">
              <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                🇮🇳 Made in India
              </Badge>
              <Badge variant="outline" className="border-white/10 text-muted-foreground">
                <Globe className="w-3 h-3 mr-1" />
                Global
              </Badge>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-white mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm text-muted-foreground">
            © {currentYear} Removation.ai. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              🌐 Available in: English | हिंदी
            </span>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-8 border-t border-white/5">
          <div className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground">
            🏆 Product Hunt #1 of the Day
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground">
            🚀 Backed by Y Combinator S25
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground">
            🔐 SOC 2 Type II Certified
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-white/5 text-xs text-muted-foreground">
            ⚡ 99.9% Uptime SLA
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <main className="dark min-h-screen bg-background overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-pink-600 z-50 origin-left"
        style={{ scaleX }}
      />

      {/* Particle Background */}
      <ParticleBackground />

      {/* Navbar */}
      <Navbar />

      {/* Sections */}
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
      <RoomTypesSection />
      <HowItWorksSection />
      <GallerySection />
      <IndianExclusiveSection />
      <PricingSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <Footer />

      {/* Back to Top Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: { delay: 2 }
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-8 right-8 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-2xl shadow-purple-500/30 z-40"
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    </main>
  );
}

// Add missing ArrowUp component
const ArrowUp = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
  </svg>
);