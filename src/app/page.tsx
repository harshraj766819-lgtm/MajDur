import { HeroSection } from "@/components/home/hero-section";
import { StatsSection } from "@/components/home/stats-section";
import { CategoryGrid } from "@/components/home/category-grid";
import { HowItWorks } from "@/components/home/how-it-works";
import { FeaturedWorkers } from "@/components/home/featured-workers";
import { ContractorBanner } from "@/components/home/contractor-banner";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <StatsSection />
      <CategoryGrid />
      <FeaturedWorkers />
      <HowItWorks />
      <ContractorBanner />
    </div>
  );
}
