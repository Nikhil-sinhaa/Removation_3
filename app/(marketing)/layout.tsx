// // app/(marketing)/layout.tsx
// import { Navbar } from "@/components/layout/Navbar";
// import { Footer } from "@/components/layout/Footer";

// export default function MarketingLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
//       <Navbar />
//       <main className="flex-1">{children}</main>
//       <Footer />
//     </div>
//   );
// }
// app/(marketing)/layout.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Home, 
  Menu, 
  X, 
  ChevronDown,
  Sparkles,
  BookOpen,
  Users,
  Mail,
  Compass,
  IndianRupee,
  Wand2,
  Layers,
  ArrowRight,
  Star,
  Phone,
  MapPin,
  Twitter,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
  Globe,
  Heart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Navigation Links
const navLinks = [
  { name: "Home", href: "/" },
  { 
    name: "Features", 
    href: "/features",
    megaMenu: true,
    sections: [
      {
        title: "AI Design Tools",
        items: [
          { name: "Room Redesign", description: "Transform any room instantly", icon: Wand2, href: "/features#room-redesign" },
          { name: "Style Transfer", description: "400+ design styles", icon: Layers, href: "/features#style-transfer" },
          { name: "Empty Room Furnishing", description: "Fill rooms with furniture", icon: Home, href: "/features#empty-room" },
        ]
      },
      {
        title: "India Exclusive",
        items: [
          { name: "Vastu Shastra AI", description: "0-100 Vastu score", icon: Compass, href: "/features#vastu" },
          { name: "Cost Calculator", description: "Real-time ₹ estimates", icon: IndianRupee, href: "/features#cost" },
        ]
      }
    ]
  },
  { name: "Pricing", href: "/pricing" },
  { name: "Browse Designers", href: "/designers" },
  { name: "Blog", href: "/blog" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

// Footer Links
const footerLinks = {
  product: [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "AI Room Redesign", href: "/features#room-redesign" },
    { name: "Vastu Analysis", href: "/features#vastu" },
    { name: "Cost Calculator", href: "/features#cost" },
    { name: "Chrome Extension", href: "/chrome-extension" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Press Kit", href: "/press" },
    { name: "Contact", href: "/contact" },
  ],
  resources: [
    { name: "Help Center", href: "/help" },
    { name: "Design Guide", href: "/blog/design-guide" },
    { name: "Vastu Guide", href: "/blog/vastu-guide" },
    { name: "API Docs", href: "/docs/api" },
    { name: "Community", href: "/community" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
    { name: "Refund Policy", href: "/refund" },
  ]
};

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "https://twitter.com/removation" },
  { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/removation" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com/removation.ai" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com/@removation" },
  { name: "Facebook", icon: Facebook, href: "https://facebook.com/removation" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-violet-600 to-orange-500 text-white py-2 px-4 text-center text-sm">
        <div className="container mx-auto flex items-center justify-center gap-2 flex-wrap">
          <Sparkles className="w-4 h-4" />
          <span>
            <strong>New:</strong> Vastu Shastra AI Engine is now live! Get your free Vastu score.
          </span>
          <Link 
            href="/features#vastu" 
            className="underline hover:no-underline font-medium inline-flex items-center gap-1"
          >
            Learn more
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Header */}
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg shadow-sm border-b border-slate-200 dark:border-slate-800" 
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-shadow">
                <Home className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <span className="text-lg lg:text-xl font-bold text-slate-900 dark:text-white">
                Removation<span className="text-violet-600">.ai</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavigationMenu>
                <NavigationMenuList>
                  {navLinks.map((link) => (
                    <NavigationMenuItem key={link.name}>
                      {link.megaMenu ? (
                        <>
                          <NavigationMenuTrigger className="h-10 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400">
                            {link.name}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <div className="w-[500px] p-6">
                              <div className="grid grid-cols-2 gap-6">
                                {link.sections?.map((section) => (
                                  <div key={section.title}>
                                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                                      {section.title}
                                    </h3>
                                    <div className="space-y-2">
                                      {section.items.map((item) => (
                                        <NavigationMenuLink key={item.name} asChild>
                                          <Link
                                            href={item.href}
                                            className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                                          >
                                            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-200 dark:group-hover:bg-violet-900/50 transition-colors">
                                              <item.icon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <div>
                                              <p className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                                {item.name}
                                              </p>
                                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                {item.description}
                                              </p>
                                            </div>
                                          </Link>
                                        </NavigationMenuLink>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                                <Link
                                  href="/features"
                                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-violet-50 to-orange-50 dark:from-violet-950/50 dark:to-orange-950/50 hover:from-violet-100 hover:to-orange-100 dark:hover:from-violet-950 dark:hover:to-orange-950 transition-colors group"
                                >
                                  <div>
                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">
                                      Explore all 32+ features
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                      Everything you need to design your dream home
                                    </p>
                                  </div>
                                  <ArrowRight className="w-5 h-5 text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                              </div>
                            </div>
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <Link
                          href={link.href}
                          className={`h-10 px-4 flex items-center text-sm font-medium transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 ${
                            pathname === link.href
                              ? "text-violet-600 dark:text-violet-400"
                              : "text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {link.name}
                        </Link>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 shadow-lg shadow-violet-500/25" asChild>
                <Link href="/sign-up">
                  Start Free
                  <Sparkles className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm p-0">
                <SheetHeader className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center">
                      <Home className="w-4 h-4 text-white" />
                    </div>
                    <span>Removation.ai</span>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-80px)]">
                  {/* Mobile Navigation */}
                  <div className="flex-1 overflow-y-auto p-4">
                    <Accordion type="single" collapsible className="w-full">
                      {navLinks.map((link, index) => (
                        link.megaMenu ? (
                          <AccordionItem key={link.name} value={`item-${index}`}>
                            <AccordionTrigger className="text-base font-medium">
                              {link.name}
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                {link.sections?.map((section) => (
                                  <div key={section.title}>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                      {section.title}
                                    </p>
                                    <div className="space-y-1">
                                      {section.items.map((item) => (
                                        <Link
                                          key={item.name}
                                          href={item.href}
                                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                                          onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                          <item.icon className="w-4 h-4 text-violet-600" />
                                          <span className="text-sm">{item.name}</span>
                                        </Link>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ) : (
                          <div key={link.name} className="py-3 border-b border-slate-200 dark:border-slate-800">
                            <Link
                              href={link.href}
                              className={`text-base font-medium ${
                                pathname === link.href
                                  ? "text-violet-600 dark:text-violet-400"
                                  : "text-slate-900 dark:text-white"
                              }`}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {link.name}
                            </Link>
                          </div>
                        )
                      ))}
                    </Accordion>
                  </div>

                  {/* Mobile CTA */}
                  <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <Button className="w-full bg-gradient-to-r from-violet-600 to-violet-700" asChild>
                      <Link href="/sign-up">
                        Start Free
                        <Sparkles className="ml-2 w-4 h-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/sign-in">Sign In</Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        {/* Main Footer */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Removation.ai</span>
              </Link>
              <p className="text-slate-400 text-sm mb-6 max-w-xs">
                AI-powered interior design with Vastu Shastra intelligence. 
                Transform your space in seconds, the Indian way.
              </p>
              
              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-violet-600 flex items-center justify-center transition-colors"
                    aria-label={social.name}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-3">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link 
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Bar */}
        <div className="border-t border-slate-800">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                <a href="mailto:hello@removation.ai" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  hello@removation.ai
                </a>
                <a href="tel:+918001234567" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  +91 800-123-4567
                </a>
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Bangalore, India
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Globe className="w-4 h-4" />
                <select className="bg-transparent border-0 text-slate-400 focus:ring-0 cursor-pointer">
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
              <p>
                © {new Date().getFullYear()} Removation.ai. All rights reserved.
              </p>
              <p className="flex items-center gap-1">
                Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> in India 🇮🇳
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}