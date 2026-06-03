// app/(marketing)/about/page.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  Target,
  Users,
  Globe,
  Award,
  Zap,
  Heart,
  Shield,
  MapPin,
  Building,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Star,
  Compass
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Team members data
const teamMembers = [
  {
    name: "Arjun Sharma",
    role: "CEO & Co-Founder",
    image: "/images/team/arjun.jpg",
    bio: "Former architect with 15+ years experience. IIT Delhi alumnus.",
    linkedin: "#"
  },
  {
    name: "Priya Patel",
    role: "CTO & Co-Founder",
    image: "/images/team/priya.jpg",
    bio: "Ex-Google AI researcher. Stanford MS in Computer Science.",
    linkedin: "#"
  },
  {
    name: "Vikram Reddy",
    role: "Head of Design",
    image: "/images/team/vikram.jpg",
    bio: "Award-winning interior designer. 500+ projects delivered.",
    linkedin: "#"
  },
  {
    name: "Neha Gupta",
    role: "VP of Engineering",
    image: "/images/team/neha.jpg",
    bio: "Ex-Amazon Principal Engineer. Building scalable AI systems.",
    linkedin: "#"
  },
  {
    name: "Rajesh Kumar",
    role: "Vastu Shastra Expert",
    image: "/images/team/rajesh.jpg",
    bio: "30+ years studying ancient Vastu principles. PhD in Architecture.",
    linkedin: "#"
  },
  {
    name: "Ananya Singh",
    role: "Head of Product",
    image: "/images/team/ananya.jpg",
    bio: "Ex-Figma Product Lead. Passionate about design tools.",
    linkedin: "#"
  }
];

// Stats data
const stats = [
  { number: "500K+", label: "Designs Generated", icon: Sparkles },
  { number: "50K+", label: "Happy Users", icon: Users },
  { number: "25+", label: "Countries Served", icon: Globe },
  { number: "98%", label: "Satisfaction Rate", icon: Heart }
];

// Values data
const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "Democratizing professional interior design for every Indian household, making beautiful spaces accessible to all."
  },
  {
    icon: Lightbulb,
    title: "Innovation First",
    description: "Pushing the boundaries of AI to create the most realistic and practical design visualizations."
  },
  {
    icon: Shield,
    title: "Cultural Respect",
    description: "Honoring India's rich heritage with authentic Vastu Shastra integration and regional design preferences."
  },
  {
    icon: Heart,
    title: "Customer Obsession",
    description: "Every feature we build starts with understanding our users' dreams and challenges."
  },
  {
    icon: TrendingUp,
    title: "Continuous Growth",
    description: "Learning from every interaction to make our AI smarter and more helpful every day."
  },
  {
    icon: Users,
    title: "Community First",
    description: "Building a vibrant community of homeowners, designers, and Vastu enthusiasts."
  }
];

// Milestones data
const milestones = [
  {
    year: "2023",
    title: "The Beginning",
    description: "Founded in Bangalore with a vision to revolutionize Indian interior design with AI."
  },
  {
    year: "2023",
    title: "Seed Funding",
    description: "Raised $2M seed round from leading Indian VCs to accelerate development."
  },
  {
    year: "2024",
    title: "Beta Launch",
    description: "Launched private beta with 1,000 early adopters. 95% positive feedback."
  },
  {
    year: "2024",
    title: "Vastu AI Engine",
    description: "Pioneered the world's first AI-powered Vastu Shastra analysis system."
  },
  {
    year: "2024",
    title: "Series A",
    description: "Raised $15M Series A to expand team and launch across India."
  },
  {
    year: "2025",
    title: "Public Launch",
    description: "Removation.ai goes live. 100K users in the first month."
  }
];

// Awards data
const awards = [
  { name: "Best AI Startup 2024", org: "TechCrunch India" },
  { name: "Innovation Award", org: "Design India Summit" },
  { name: "Top 50 Startups", org: "YourStory" },
  { name: "Best PropTech Solution", org: "NASSCOM" }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <Sparkles className="w-3 h-3 mr-1" />
                About Removation.ai
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-violet-700 to-orange-600 dark:from-white dark:via-violet-400 dark:to-orange-400 bg-clip-text text-transparent"
            >
              Reimagining Spaces with
              <br />
              AI + Indian Wisdom
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            >
              We're on a mission to make professional interior design accessible to every
              Indian household. By combining cutting-edge AI with ancient Vastu Shastra
              principles, we're creating the future of home renovation.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800">
                Join Our Journey
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline">
                View Open Positions
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-orange-500/10 mb-4">
                  <stat.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInLeft}
            >
              <Badge className="mb-4 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                Our Story
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">
                Born from a Simple Frustration
              </h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-300">
                <p>
                  In 2023, our founders Arjun and Priya were renovating their new home
                  in Bangalore. They spent months going back and forth with designers,
                  struggling to visualize ideas, and constantly worried about Vastu
                  compliance.
                </p>
                <p>
                  "Why can't I just see what my living room will look like before
                  spending lakhs?" Arjun asked. And "Why is there no tool that
                  understands Vastu?" Priya wondered.
                </p>
                <p>
                  That frustration sparked an idea: What if AI could instantly
                  visualize any design change while ensuring Vastu compliance?
                  What if everyone could afford professional-quality design
                  visualization?
                </p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  Removation.ai was born—the world's first AI interior design
                  platform built specifically for Indian homes, with Vastu
                  Shastra at its core.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInRight}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-orange-500 opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <Compass className="w-20 h-20 mx-auto mb-6 opacity-80" />
                    <p className="text-2xl font-bold mb-2">
                      "पूर्व में शुरुआत, उत्तर में समृद्धि"
                    </p>
                    <p className="text-lg opacity-90">
                      "Begin in the East, Prosper in the North"
                    </p>
                    <p className="mt-4 text-sm opacity-70">
                      — Ancient Vastu Wisdom
                    </p>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl" />
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-violet-500/20 rounded-full blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-100 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto"
          >
            {/* Mission */}
            <motion.div variants={scaleIn}>
              <Card className="h-full border-2 border-violet-200 dark:border-violet-900/50 bg-gradient-to-br from-white to-violet-50/50 dark:from-slate-900 dark:to-violet-950/30">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/25">
                    <Target className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                    Our Mission
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    To democratize professional interior design by making it
                    accessible, affordable, and culturally relevant for every
                    Indian household. We believe beautiful, Vastu-compliant
                    homes shouldn't be a luxury—they should be the norm.
                  </p>
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 border-2 border-white dark:border-slate-900"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        50K+ homes transformed
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Vision */}
            <motion.div variants={scaleIn}>
              <Card className="h-full border-2 border-orange-200 dark:border-orange-900/50 bg-gradient-to-br from-white to-orange-50/50 dark:from-slate-900 dark:to-orange-950/30">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/25">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
                    Our Vision
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    To become the world's leading AI-powered design platform
                    that bridges modern technology with ancient wisdom. We
                    envision a future where every renovation decision is
                    informed, confident, and culturally meaningful.
                  </p>
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            className="w-4 h-4 fill-orange-500 text-orange-500"
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        4.9/5 average rating
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="mb-4">What Makes Us Different</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Built for India, Loved Globally
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              We're not just another design tool. We're a cultural bridge between
              ancient wisdom and modern technology.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Vastu AI */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-violet-300 dark:hover:border-violet-700 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Compass className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                    Vastu Shastra AI
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    World's first AI that understands and applies Vastu principles.
                    Get a 0-100 Vastu score with every design and auto-fix suggestions.
                  </p>
                  <ul className="space-y-2">
                    {["120+ Vastu rules", "Direction analysis", "Element balancing", "Auto-fix suggestions"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 2: Real-Time Cost */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-300 dark:hover:border-orange-700 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                    Real-Time Cost Calculator
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    Instant renovation cost estimates in ₹ and $. Includes materials,
                    labor, and GST based on your city.
                  </p>
                  <ul className="space-y-2">
                    {["City-wise pricing", "Material breakdown", "Labor costs", "GST calculation"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature 3: Indian Styles */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={scaleIn}
            >
              <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-emerald-300 dark:hover:border-emerald-700 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                    400+ Indian Styles
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    From Rajasthani haveli to Kerala traditional, South Indian temple
                    to Punjabi farmhouse—styles that resonate with India.
                  </p>
                  <ul className="space-y-2">
                    {["Regional styles", "Festival themes", "Traditional + Modern", "Custom colors"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="mb-4">Our Values</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              What We Stand For
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              These core values guide every decision we make and every feature we build.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                variants={scaleIn}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <value.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">
                      {value.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="mb-4">Our Journey</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              From Idea to Impact
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              A look at the key milestones that shaped Removation.ai
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-orange-500 to-emerald-500 hidden md:block" />

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="space-y-8"
              >
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={`${milestone.year}-${milestone.title}`}
                    variants={fadeInUp}
                    className="relative flex gap-6 md:gap-10"
                  >
                    {/* Year bubble */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                        {milestone.year.slice(2)}
                      </div>
                    </div>

                    {/* Content */}
                    <Card className="flex-1 hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                            {milestone.year}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                          {milestone.title}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          {milestone.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-slate-100 to-white dark:from-slate-900 dark:to-slate-950">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="mb-4">Our Team</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Meet the Visionaries
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              A diverse team of architects, engineers, designers, and Vastu experts
              united by a common mission.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {teamMembers.map((member) => (
              <motion.div
                key={member.name}
                variants={scaleIn}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-0">
                    {/* Avatar placeholder */}
                    <div className="relative h-48 bg-gradient-to-br from-violet-400 to-orange-400 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">
                        {member.name}
                      </h3>
                      <p className="text-violet-600 dark:text-violet-400 font-medium mb-3">
                        {member.role}
                      </p>
                      <p className="text-slate-600 dark:text-slate-400 text-sm">
                        {member.bio}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Join team CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mt-12"
          >
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Want to join our mission?
            </p>
            <Button variant="outline" size="lg" asChild>
              <Link href="/careers">
                View Open Positions
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Awards Section */}
      <section className="py-16 border-y border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center mb-10"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Recognized Excellence
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Awards and recognition we've received
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-8"
          >
            {awards.map((award) => (
              <motion.div
                key={award.name}
                variants={scaleIn}
                className="flex items-center gap-3 px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-full"
              >
                <Award className="w-5 h-5 text-yellow-500" />
                <div className="text-left">
                  <p className="font-medium text-slate-900 dark:text-white text-sm">
                    {award.name}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {award.org}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <Badge className="mb-4">Our Offices</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
              Where We Work
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Headquartered in India, serving the world
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            {/* Bangalore HQ */}
            <motion.div variants={scaleIn}>
              <Card className="h-full text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="mb-3">Headquarters</Badge>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                    Bangalore
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    HSR Layout, Sector 4
                    <br />
                    Bangalore - 560102
                    <br />
                    Karnataka, India
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Mumbai */}
            <motion.div variants={scaleIn}>
              <Card className="h-full text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="secondary" className="mb-3">Sales Office</Badge>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                    Mumbai
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    BKC, Bandra East
                    <br />
                    Mumbai - 400051
                    <br />
                    Maharashtra, India
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Delhi */}
            <motion.div variants={scaleIn}>
              <Card className="h-full text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-8 h-8 text-white" />
                  </div>
                  <Badge variant="secondary" className="mb-3">Design Hub</Badge>
                  <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">
                    Delhi NCR
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Cyber Hub, Gurugram
                    <br />
                    Gurugram - 122002
                    <br />
                    Haryana, India
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-violet-600 via-violet-700 to-orange-600 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center text-white"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
            >
              Ready to Transform Your Space?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-xl opacity-90 mb-8"
            >
              Join 50,000+ homeowners who are already designing their dream homes
              with AI + Vastu intelligence.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button
                size="lg"
                className="bg-white text-violet-700 hover:bg-slate-100 text-lg px-8"
                asChild
              >
                <Link href="/sign-up">
                  Start Free Today
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 text-lg px-8"
                asChild
              >
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </motion.div>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-sm opacity-70"
            >
              No credit card required • 5 free designs • Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}