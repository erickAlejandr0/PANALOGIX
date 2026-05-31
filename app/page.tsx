import { CtaSection } from "@/components/landing/CtaSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1f3a]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,174,239,0.1)_0%,transparent_50%)]" />

      <div className="relative">
        <Header />
        <main>
          <HeroSection />
          <StatsSection />
          <FeaturesSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
