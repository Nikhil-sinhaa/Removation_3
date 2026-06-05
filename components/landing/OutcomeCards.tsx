"use client";

import Image from "next/image";

interface CardItem {
  image: string;
  headline: string;
  description: string;
}

const CARDS_DATA: CardItem[] = [
  {
    image: "/samples/living-room.jpg",
    headline: "See it before you spend a rupee",
    description: "Generate AI renders of your room in 30 seconds. No contractor needed to visualize.",
  },
  {
    image: "/samples/bedroom.jpg",
    headline: "Book verified designers, not strangers",
    description: "Every designer on Removation is reviewed by our team and rated by real customers.",
  },
  {
    image: "/samples/kitchen.jpg",
    headline: "Change your mind without changing everything",
    description: "Try 20 color combinations, styles, or furniture layouts. It costs 1 credit, not ₹20,000.",
  },
  {
    image: "/images/hero-after.jpg",
    headline: "Your Vastu, your style, your budget",
    description: "Every AI design respects Vastu principles automatically. No extra checklist needed.",
  },
];

export function OutcomeCards() {
  return (
    <section className="bg-black py-24 px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[#7c3aed] text-sm font-semibold uppercase tracking-wider mb-2 block">
            Guaranteed Outcomes
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Why homeowners choose Removation.ai
          </h2>
        </div>

        {/* 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CARDS_DATA.map((card, index) => (
            <div
              key={index}
              className="group bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col h-full"
            >
              {/* Image Container (60% height) */}
              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.headline}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
              </div>

              {/* Text Container (40% height) */}
              <div className="p-8 flex flex-col justify-between flex-grow bg-black">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors duration-200">
                    {card.headline}
                  </h3>
                  <p className="text-sm sm:text-base text-white/50 font-medium leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
