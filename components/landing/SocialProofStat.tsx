"use client";

import { useEffect, useState } from "react";

export function SocialProofStat() {
  const [stats, setStats] = useState({ happyCustomers: 2800 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats/public");
        if (res.ok) {
          const data = await res.json();
          if (data.happyCustomers && data.happyCustomers > 0) {
            setStats({ happyCustomers: data.happyCustomers });
          }
        }
      } catch (err) {
        console.error("Failed to fetch public stats", err);
      }
    }
    fetchStats();
  }, []);

  return (
    <section className="bg-black py-16 px-6 text-center">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
        <h2 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-4">
          {stats.happyCustomers.toLocaleString()}+
        </h2>
        <p className="text-base sm:text-lg text-white/50 font-medium tracking-wide max-w-xl">
          homeowners across India — from real estate teams to interior designers
        </p>
      </div>
    </section>
  );
}
