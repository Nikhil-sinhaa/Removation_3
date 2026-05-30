"use client";

import Link from "next/link";
import { Home, Brush, Building, Store, Check, ArrowRight } from "lucide-react";

interface RoleCard {
  icon: any;
  name: string;
  bullets: string[];
  link: string;
}

const ROLES_DATA: RoleCard[] = [
  {
    icon: Home,
    name: "Homeowners",
    bullets: [
      "See redesigns before spending money",
      "Try 50 styles without a designer",
      "Share renders with family before deciding",
    ],
    link: "/sign-up",
  },
  {
    icon: Brush,
    name: "Interior Designers",
    bullets: [
      "Generate client proposals in minutes",
      "Book your next client through the marketplace",
      "Showcase your portfolio to 2,800+ active users",
    ],
    link: "/marketplace?tab=designers",
  },
  {
    icon: Building,
    name: "Contractors",
    bullets: [
      "Get discovered by homeowners in your city",
      "Receive bookings with upfront payment",
      "Build verified reputation through reviews",
    ],
    link: "/marketplace?tab=contractors",
  },
  {
    icon: Store,
    name: "Vendors",
    bullets: [
      "List your tile shop, paint store, or showroom",
      "Receive inquiries from active home builders",
      "Connect with designers who recommend you",
    ],
    link: "/marketplace?tab=vendors",
  },
];

export function RoleCards() {
  return (
    <section className="bg-black py-24 px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-[#7c3aed] text-sm font-semibold uppercase tracking-wider mb-2 block">
            Designed for the Ecosystem
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Built for every Indian homeowner
          </h2>
        </div>

        {/* 4 Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ROLES_DATA.map((role, idx) => {
            const IconComp = role.icon;

            return (
              <div
                key={idx}
                className="group bg-[#0a0a0a] border border-white/5 hover:border-white/10 hover:bg-[#111111]/30 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 h-full"
              >
                <div>
                  {/* Icon & Name */}
                  <div className="flex items-center gap-3.5 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight">
                      {role.name}
                    </h3>
                  </div>

                  {/* Bullet points */}
                  <ul className="space-y-3.5 mb-8">
                    {role.bullets.map((bullet, bulletIdx) => (
                      <li key={bulletIdx} className="flex items-start gap-2.5 text-sm sm:text-base text-white/50 leading-relaxed font-medium">
                        <Check className="w-4 h-4 text-purple-400 mt-1 flex-shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Link */}
                <Link href={role.link} className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-400 hover:text-white transition-colors tracking-wide uppercase mt-4">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
