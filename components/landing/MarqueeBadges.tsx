"use client";

export function MarqueeBadges() {
  const items = [
    "Powered by Razorpay ✓",
    "RTX 4060 Local AI ✓",
    "Verified Designers ✓",
    "2,800+ Homeowners ✓",
    "Bangalore · Mumbai · Delhi · Pune ✓",
  ];

  // Double items for seamless infinite scroll
  const marqueeItems = [...items, ...items];

  return (
    <section className="bg-black py-8 border-y border-white/5 overflow-hidden">
      <div className="marquee-container">
        <div className="animate-marquee-left">
          {marqueeItems.map((item, index) => (
            <div
              key={index}
              className="mx-6 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold tracking-wider uppercase text-white/80 whitespace-nowrap flex items-center justify-center cursor-default transition-colors duration-200"
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
