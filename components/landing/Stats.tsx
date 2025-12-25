'use client';

import { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const stats = [
  {
    value: 50000,
    suffix: '+',
    label: 'Happy Users',
    description: 'Designers & homeowners worldwide',
  },
  {
    value: 2,
    suffix: 'M+',
    label: 'Renders Generated',
    description: 'And counting every day',
  },
  {
    value: 400,
    suffix: '+',
    label: 'Design Styles',
    description: 'From minimalist to maximalist',
  },
  {
    value: 15,
    suffix: 's',
    label: 'Average Render Time',
    description: 'Lightning-fast AI processing',
  },
  {
    value: 98,
    suffix: '%',
    label: 'Customer Satisfaction',
    description: 'Based on user feedback',
  },
  {
    value: 50,
    suffix: '+',
    label: 'Indian Cities',
    description: 'Cost data coverage',
  },
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export function Stats() {
  return (
    <section className="py-24 bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-600/10 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-slate-400">
            Numbers that speak for themselves
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-white font-medium mb-1">{stat.label}</div>
              <div className="text-slate-500 text-sm">{stat.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}