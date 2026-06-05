"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS_DATA = [
  {
    q: "Is it really free to start?",
    a: "Yes. You get your first 10 credits free — no credit card required. Each AI render costs 1 credit, so you can try 10 different room styles before paying anything.",
  },
  {
    q: "How realistic are the AI renders?",
    a: "Renders are photorealistic and great for visualization and decision-making. They show accurate colors, furniture placement, and lighting. They're not architectural blueprints, so measurements and exact proportions are indicative rather than precise.",
  },
  {
    q: "Are the designers on the platform verified?",
    a: "Yes. Every designer goes through a portfolio review and admin verification before being listed. Verified designers display a badge on their profile, and every booking includes real customer reviews.",
  },
  {
    q: "What happens if I don't like my render?",
    a: "Try another style — each attempt costs just 1 credit. If a generation fails due to a technical issue on our end, your credit is automatically refunded to your account.",
  },
  {
    q: "Which cities have designers available?",
    a: "We currently have verified designers in Mumbai, Bangalore, Delhi, Pune, and Chennai. We're actively expanding to Hyderabad, Kolkata, and Ahmedabad. Check the marketplace for the latest availability in your city.",
  },
  {
    q: "Can I use renders for commercial projects?",
    a: "Yes. All renders you generate belong to you. You can use them freely for client presentations, proposals, social media, marketing materials, or any commercial purpose.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="bg-black py-24 px-6 lg:px-8 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {FAQS_DATA.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 py-1 data-[state=open]:border-white/10 transition-colors duration-200"
            >
              <AccordionTrigger className="text-left text-base sm:text-lg font-bold text-white hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm sm:text-base text-white/50 leading-relaxed font-medium pb-6">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
