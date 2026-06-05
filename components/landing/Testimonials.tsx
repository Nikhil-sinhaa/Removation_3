"use client";

import { motion } from "framer-motion";

interface TestimonialItem {
  quote: string;
  author: string;
  location: string;
}

const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    quote: "Used the Room Changer to finalise my living room colour. Saved me from repainting twice. Worth every credit.",
    author: "Priya M.",
    location: "Mumbai",
  },
  {
    quote: "Booked a designer through Removation after seeing my AI render. They executed it exactly as shown. Couldn't be happier.",
    author: "Rahul S.",
    location: "Bangalore",
  },
  {
    quote: "Showed 15 Vastu-compliant designs to my in-laws in one evening. We finally agreed on one!",
    author: "Anita K.",
    location: "Chennai",
  },
];

export function Testimonials() {
  return (
    <section className="bg-black py-24 px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-20">
          <span className="text-[#7c3aed] text-sm font-semibold uppercase tracking-wider mb-2 block">
            Homeowner Stories
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Real experiences from across India
          </h2>
        </div>

        {/* 3-Column Desktop / Stack Mobile Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {TESTIMONIALS_DATA.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.15 }}
              className="flex flex-col justify-between"
            >
              {/* Simple elegant quote */}
              <p className="text-lg sm:text-xl text-white font-medium leading-relaxed mb-6 italic before:content-['“'] after:content-['”']">
                {item.quote}
              </p>

              {/* Author Attribution */}
              <div className="text-sm font-semibold tracking-wider text-white/40 uppercase">
                — {item.author}, <span className="text-purple-400">{item.location}</span>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}