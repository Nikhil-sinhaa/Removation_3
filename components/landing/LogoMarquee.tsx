"use client";

export function LogoMarquee() {
  const logos = [
    { name: "Razorpay", type: "tech" },
    { name: "AWS", type: "tech" },
    { name: "Google Cloud", type: "tech" },
    { name: "UploadThing", type: "tech" },
    { name: "Product Hunt", type: "tech" },
    { name: "Mumbai", type: "city" },
    { name: "Bangalore", type: "city" },
    { name: "Delhi", type: "city" },
    { name: "Pune", type: "city" },
    { name: "Chennai", type: "city" },
  ];

  // Duplicate items for seamless infinite scroll
  const marqueeLogos = [...logos, ...logos];

  return (
    <section className="bg-black py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
        <p className="text-xs font-semibold tracking-widest text-white/30 uppercase">
          Integrating industry leading tech & serving top metro regions
        </p>
      </div>

      <div className="marquee-container opacity-40 hover:opacity-100 transition-opacity duration-300">
        <div className="animate-marquee-right">
          {marqueeLogos.map((logo, index) => (
            <div
              key={index}
              className="mx-10 flex items-center justify-center whitespace-nowrap cursor-default"
            >
              {logo.type === "tech" ? (
                <span className="text-lg font-bold tracking-tight text-white/80 grayscale">
                  {logo.name}
                </span>
              ) : (
                <span className="text-sm font-semibold tracking-wider uppercase text-purple-400 border border-purple-500/30 px-3 py-1 rounded">
                  {logo.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
