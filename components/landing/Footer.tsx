"use client";

import Link from "next/link";
import { Home, Twitter, Linkedin, Instagram, Youtube, Heart } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const columns = [
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Careers", href: "/careers" },
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Tools",
      links: [
        { label: "Room Changer", href: "/room-changer" },
        { label: "Ceiling Changer", href: "/ceiling-changer" },
        { label: "Furniture Remover", href: "/furniture-remover" },
        { label: "Furniture Placement", href: "/furniture-placement" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Design Guide", href: "/blog/design-guide" },
        { label: "Vastu Guide", href: "/blog/vastu-guide" },
        { label: "API Docs", href: "/docs/api" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Refund Policy", href: "/refund" },
        { label: "Cookie Policy", href: "/cookies" },
      ],
    },
  ];

  const socialLinks = [
    { name: "Instagram", icon: Instagram, href: "https://instagram.com/removation.ai" },
    { name: "Twitter", icon: Twitter, href: "https://twitter.com/removation" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/removation" },
    { name: "YouTube", icon: Youtube, href: "https://youtube.com/@removation" },
  ];

  return (
    <footer className="bg-[#050505] border-t border-white/5 text-white/80 py-16 px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8 pb-16">
          {/* Logo Section */}
          <div className="col-span-2 md:pr-8">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-violet-600 flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Removation<span className="text-purple-500">.ai</span>
              </span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed max-w-sm">
              Photorealistic AI room redesigns & Vastu-compliant energy scoring for Indian homes. Transform your spaces instantly and book verified local decorators.
            </p>
          </div>

          {/* Links Columns */}
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold tracking-wider text-white uppercase mb-4">
                {column.title}
              </h3>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/40 hover:text-white transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-white/30">
          <p>© {currentYear} Removation.ai. All rights reserved.</p>
          
          <div className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>in India 🇮🇳</span>
          </div>

          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-white/10 hover:border-white/20 bg-white/5 flex items-center justify-center hover:text-white transition-colors duration-200"
                aria-label={social.name}
              >
                <social.icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
