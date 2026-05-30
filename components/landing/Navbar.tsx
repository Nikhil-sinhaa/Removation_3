"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Home, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"EN" | "HI">("EN");
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "EN" ? "HI" : "EN"));
  };

  const navLinks = [
    { href: "/features", label: "Features" },
    { href: "/marketplace?tab=designers", label: "Designers" },
    { href: "/pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
          scrolled
            ? "bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5 py-4"
            : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform duration-200">
              <Home className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Removation<span className="text-purple-500">.ai</span>
            </span>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium tracking-wide transition-colors hover:text-white ${
                  pathname === link.href ? "text-white" : "text-white/60"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-xs font-semibold tracking-wider text-white/50 hover:text-white transition-colors uppercase py-1.5 px-3 border border-white/10 rounded-full bg-white/5"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language}</span>
            </button>

            {isSignedIn ? (
              <Link href="/dashboard">
                <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold px-5 py-2.5 rounded-full border border-white/10 shadow-lg shadow-purple-500/10 transition-all duration-300">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-semibold text-white/60 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/sign-up">
                  <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold px-5 py-2.5 rounded-full border border-white/10 shadow-lg shadow-purple-500/10 transition-all duration-300 flex items-center gap-1.5 group/btn">
                    <span>Try Free</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Hamburger (Mobile) */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-xs font-semibold tracking-wider text-white/50 hover:text-white transition-colors uppercase py-1 px-2.5 border border-white/10 rounded-full bg-white/5"
            >
              <Globe className="w-3 h-3" />
              <span>{language}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[72px] z-50 md:hidden bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-white/5 px-6 py-8"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-lg font-medium tracking-wide transition-colors ${
                    pathname === link.href ? "text-white" : "text-white/60"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="h-px bg-white/5 my-2" />
              {isSignedIn ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-base font-semibold py-3 rounded-xl">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center text-base font-semibold text-white/60 hover:text-white py-2"
                  >
                    Sign In
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-base font-semibold py-3 rounded-xl flex items-center justify-center gap-1.5">
                      <span>Try Free</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
