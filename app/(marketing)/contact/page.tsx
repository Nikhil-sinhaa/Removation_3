// app/(marketing)/contact/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  Globe,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Building2,
  Headphones,
  FileText,
  HelpCircle,
  Zap,
  Users,
  Briefcase,
  Heart,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Types
interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  value: string;
  subValue?: string;
  href?: string;
}

interface Office {
  city: string;
  country: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  flag: string;
}

interface SupportOption {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: string;
  href: string;
  badge?: string;
  color: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// Data
const contactInfo: ContactInfo[] = [
  {
    icon: <Mail className="w-5 h-5" />,
    title: "Email Us",
    value: "hello@removation.ai",
    subValue: "We reply within 24 hours",
    href: "mailto:hello@removation.ai",
  },
  {
    icon: <Phone className="w-5 h-5" />,
    title: "Call Us",
    value: "+91 98765 43210",
    subValue: "Mon-Fri, 9am-6pm IST",
    href: "tel:+919876543210",
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: "Live Chat",
    value: "Chat with us",
    subValue: "Average response: 2 minutes",
    href: "#",
  },
  {
    icon: <Globe className="w-5 h-5" />,
    title: "Help Center",
    value: "help.removation.ai",
    subValue: "500+ articles & tutorials",
    href: "https://help.removation.ai",
  },
];

const offices: Office[] = [
  {
    city: "Mumbai",
    country: "India",
    address: "WeWork BKC, G Block, Bandra Kurla Complex, Mumbai 400051",
    phone: "+91 22 4567 8900",
    email: "mumbai@removation.ai",
    timezone: "IST (UTC+5:30)",
    flag: "🇮🇳",
  },
  {
    city: "Bangalore",
    country: "India",
    address: "91springboard, 7th Block, Koramangala, Bangalore 560095",
    phone: "+91 80 4567 8900",
    email: "bangalore@removation.ai",
    timezone: "IST (UTC+5:30)",
    flag: "🇮🇳",
  },
  {
    city: "San Francisco",
    country: "USA",
    address: "535 Mission Street, 14th Floor, San Francisco, CA 94105",
    phone: "+1 (415) 555-0123",
    email: "sf@removation.ai",
    timezone: "PST (UTC-8)",
    flag: "🇺🇸",
  },
  {
    city: "London",
    country: "UK",
    address: "1 Canada Square, Canary Wharf, London E14 5AB",
    phone: "+44 20 7946 0123",
    email: "london@removation.ai",
    timezone: "GMT (UTC+0)",
    flag: "🇬🇧",
  },
];

const supportOptions: SupportOption[] = [
  {
    icon: <Headphones className="w-6 h-6" />,
    title: "Customer Support",
    description: "Get help with your account, billing, or technical issues",
    action: "Contact Support",
    href: "/support",
    badge: "24/7",
    color: "from-violet-600 to-blue-600",
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: "Sales Inquiries",
    description: "Talk to our sales team about enterprise solutions",
    action: "Talk to Sales",
    href: "/sales",
    badge: "Enterprise",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Partnerships",
    description: "Explore partnership and integration opportunities",
    action: "Partner with Us",
    href: "/partners",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: "Press & Media",
    description: "Media inquiries, press kit, and brand assets",
    action: "Press Kit",
    href: "/press",
    color: "from-pink-500 to-rose-600",
  },
];

const faqs: FAQ[] = [
  {
    question: "How quickly can I expect a response?",
    answer: "For live chat, our average response time is under 2 minutes. Email inquiries are typically answered within 24 hours, and phone support is available Monday to Friday, 9am-6pm IST.",
  },
  {
    question: "Do you offer phone support?",
    answer: "Yes! Phone support is available for Pro and Teams subscribers. Enterprise customers get dedicated phone support with a guaranteed response time.",
  },
  {
    question: "Can I schedule a demo of Removation.ai?",
    answer: "Absolutely! You can schedule a personalized demo with our product team. We'll walk you through all features including our unique Vastu Shastra AI and Cost Calculator.",
  },
  {
    question: "How do I report a bug or request a feature?",
    answer: "You can report bugs through our Help Center or by emailing bugs@removation.ai. For feature requests, use our public roadmap at roadmap.removation.ai where you can vote on existing ideas or submit new ones.",
  },
  {
    question: "Do you have offices I can visit?",
    answer: "Yes, we have offices in Mumbai, Bangalore, San Francisco, and London. Please schedule an appointment before visiting by contacting the respective office.",
  },
  {
    question: "What languages do you support?",
    answer: "Our support team can assist you in English and Hindi. Our platform also supports both languages with automatic detection based on your preferences.",
  },
];

const socialLinks = [
  { icon: <Twitter className="w-5 h-5" />, name: "Twitter", href: "https://twitter.com/removationai", handle: "@removationai" },
  { icon: <Linkedin className="w-5 h-5" />, name: "LinkedIn", href: "https://linkedin.com/company/removationai", handle: "Removation AI" },
  { icon: <Instagram className="w-5 h-5" />, name: "Instagram", href: "https://instagram.com/removationai", handle: "@removationai" },
  { icon: <Youtube className="w-5 h-5" />, name: "YouTube", href: "https://youtube.com/@removationai", handle: "Removation AI" },
  { icon: <Facebook className="w-5 h-5" />, name: "Facebook", href: "https://facebook.com/removationai", handle: "Removation AI" },
];

const inquiryTypes = [
  "General Inquiry",
  "Technical Support",
  "Sales & Pricing",
  "Partnership",
  "Press & Media",
  "Feature Request",
  "Bug Report",
  "Billing Issue",
  "Enterprise Solutions",
  "Career Opportunities",
];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// Components
const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    inquiryType: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to send message");
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error("[ContactForm]", error);
      setIsSubmitting(false);
      // Keep form visible so user can retry
      alert(error instanceof Error ? error.message : "Failed to send message. Please try again.");
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
        <p className="text-neutral-400 mb-6">
          Thank you for reaching out. We&apos;ll get back to you within 24 hours.
        </p>
        <Button
          onClick={() => {
            setIsSubmitted(false);
            setFormData({
              name: "",
              email: "",
              company: "",
              phone: "",
              inquiryType: "",
              subject: "",
              message: "",
            });
          }}
          variant="outline"
          className="border-neutral-700"
        >
          Send Another Message
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-neutral-300">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
            className="bg-neutral-800 border-neutral-700 focus:border-violet-500"
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-neutral-300">
            Email Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
            className="bg-neutral-800 border-neutral-700 focus:border-violet-500"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company" className="text-neutral-300">
            Company Name
          </Label>
          <Input
            id="company"
            placeholder="Acme Inc."
            value={formData.company}
            onChange={(e) => handleChange("company", e.target.value)}
            className="bg-neutral-800 border-neutral-700 focus:border-violet-500"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-neutral-300">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="bg-neutral-800 border-neutral-700 focus:border-violet-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="inquiryType" className="text-neutral-300">
            Inquiry Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.inquiryType}
            onValueChange={(value) => handleChange("inquiryType", value)}
            required
          >
            <SelectTrigger className="bg-neutral-800 border-neutral-700">
              <SelectValue placeholder="Select inquiry type" />
            </SelectTrigger>
            <SelectContent>
              {inquiryTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subject" className="text-neutral-300">
            Subject <span className="text-red-500">*</span>
          </Label>
          <Input
            id="subject"
            placeholder="How can we help you?"
            value={formData.subject}
            onChange={(e) => handleChange("subject", e.target.value)}
            required
            className="bg-neutral-800 border-neutral-700 focus:border-violet-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-neutral-300">
          Message <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          placeholder="Tell us more about your inquiry..."
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          required
          rows={6}
          className="bg-neutral-800 border-neutral-700 focus:border-violet-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </>
          )}
        </Button>
        <p className="text-xs text-neutral-500">
          By submitting, you agree to our{" "}
          <Link href="/privacy" className="text-violet-400 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </form>
  );
};

const OfficeCard = ({ office, index }: { office: Office; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm hover:border-neutral-700 transition-all h-full group">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{office.flag}</span>
              <div>
                <CardTitle className="text-white">{office.city}</CardTitle>
                <CardDescription>{office.country}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30">
              <Clock className="w-3 h-3 mr-1" />
              {office.timezone}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-neutral-400 mt-1 flex-shrink-0" />
            <p className="text-sm text-neutral-300">{office.address}</p>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-neutral-400" />
            <a
              href={`tel:${office.phone.replace(/\s/g, "")}`}
              className="text-sm text-neutral-300 hover:text-violet-400 transition-colors"
            >
              {office.phone}
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-neutral-400" />
            <a
              href={`mailto:${office.email}`}
              className="text-sm text-neutral-300 hover:text-violet-400 transition-colors"
            >
              {office.email}
            </a>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4 border-neutral-700 group-hover:border-violet-500 group-hover:text-violet-400 transition-colors"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Get Directions
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SupportOptionCard = ({ option, index }: { option: SupportOption; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
    >
      <Link href={option.href}>
        <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm hover:border-neutral-700 transition-all h-full group cursor-pointer relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${option.color} text-white`}>
                {option.icon}
              </div>
              {option.badge && (
                <Badge variant="outline" className="bg-neutral-800 text-neutral-300 border-neutral-700">
                  {option.badge}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{option.title}</h3>
            <p className="text-sm text-neutral-400 mb-4">{option.description}</p>
            <div className="flex items-center text-sm font-medium text-violet-400 group-hover:text-violet-300 transition-colors">
              {option.action}
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

// Main Component
export default function ContactPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-4 bg-violet-500/10 text-violet-400 border-violet-500/30">
              <MessageSquare className="w-3 h-3 mr-1" />
              Get in Touch
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              We&apos;d Love to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-blue-400">
                Hear From You
              </span>
            </h1>
            <p className="text-lg text-neutral-400 mb-8">
              Have questions about Removation.ai? Want to partner with us?
              Our team is here to help you transform your interior design workflow.
            </p>

            {/* Quick Contact Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
              {contactInfo.map((info, index) => (
                <motion.a
                  key={info.title}
                  href={info.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="group"
                >
                  <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm hover:border-violet-500/50 transition-all h-full">
                    <CardContent className="p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto mb-3 group-hover:bg-violet-500/20 transition-colors">
                        {info.icon}
                      </div>
                      <p className="text-sm font-medium text-white">{info.title}</p>
                      <p className="text-sm text-violet-400 mt-1">{info.value}</p>
                      <p className="text-xs text-neutral-500 mt-1">{info.subValue}</p>
                    </CardContent>
                  </Card>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Send us a Message</CardTitle>
                  <CardDescription>
                    Fill out the form below and we&apos;ll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
              </Card>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Live Chat CTA */}
              <Card className="border-neutral-800 bg-gradient-to-br from-violet-900/30 to-blue-900/30 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Prefer Live Chat?</h3>
                      <p className="text-sm text-neutral-400">Get instant help from our team</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 border-2 border-neutral-900 flex items-center justify-center text-xs text-white"
                        >
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm text-neutral-400">
                      <span className="text-green-400">●</span> 5 agents online
                    </span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Live Chat
                  </Button>
                  <p className="text-xs text-neutral-500 text-center mt-3">
                    Average response time: 2 minutes
                  </p>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-violet-400" />
                    Response Times
                  </h3>
                  <div className="space-y-4">
                    {[
                      { channel: "Live Chat", time: "< 2 minutes", available: true },
                      { channel: "Email", time: "< 24 hours", available: true },
                      { channel: "Phone", time: "< 1 minute", available: true },
                      { channel: "Social Media", time: "< 4 hours", available: true },
                    ].map((item) => (
                      <div
                        key={item.channel}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-neutral-300">{item.channel}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-400">{item.time}</span>
                          {item.available && (
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="border-neutral-800 bg-neutral-900/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Follow Us</h3>
                  <div className="space-y-3">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-violet-400 transition-colors">
                            {social.icon}
                          </div>
                          <span className="text-sm text-neutral-300">{social.name}</span>
                        </div>
                        <span className="text-xs text-neutral-500">{social.handle}</span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <Zap className="w-3 h-3 mr-1" />
              Quick Access
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How Can We Help?
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              Choose the option that best fits your needs, and we&apos;ll connect you with the right team.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportOptions.map((option, index) => (
              <SupportOptionCard key={option.title} option={option} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-blue-500/10 text-blue-400 border-blue-500/30">
              <Building2 className="w-3 h-3 mr-1" />
              Our Offices
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Visit Us Worldwide
            </h2>
            <p className="text-neutral-400 max-w-2xl mx-auto">
              With offices across the globe, we&apos;re always close by to help you achieve your design goals.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {offices.map((office, index) => (
              <OfficeCard key={office.city} office={office} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 border-t border-neutral-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/30">
              <HelpCircle className="w-3 h-3 mr-1" />
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-neutral-400">
              Quick answers to common questions about contacting us.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={`faq-${index}`}
                  value={`faq-${index}`}
                  className="border border-neutral-800 rounded-lg bg-neutral-900/50 backdrop-blur-sm px-6 data-[state=open]:border-violet-500/50"
                >
                  <AccordionTrigger className="text-left text-white hover:text-violet-400 hover:no-underline py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-neutral-400 pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="border-neutral-800 bg-gradient-to-br from-violet-900/20 to-blue-900/20 backdrop-blur-sm overflow-hidden relative">
              <div className="absolute top-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <CardContent className="p-12 text-center relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Transform Your Space?
                </h2>
                <p className="text-neutral-400 mb-8 max-w-xl mx-auto">
                  Join thousands of designers, architects, and homeowners who are already using
                  Removation.ai to bring their visions to life.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/sign-up">
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 px-8"
                    >
                      Get Started Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button size="lg" variant="outline" className="border-neutral-700 px-8">
                      <Zap className="w-4 h-4 mr-2" />
                      Request Demo
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}