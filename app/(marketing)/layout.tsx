import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white antialiased selection:bg-purple-600/30 selection:text-purple-200">
      <Navbar />
      <main className="flex-1 bg-black">{children}</main>
      <Footer />
    </div>
  );
}