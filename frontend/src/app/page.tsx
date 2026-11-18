import { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { StatsSection } from "@/components/home/stats-section";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedWorkers } from "@/components/home/featured-workers";
import { HowItWorks } from "@/components/home/how-it-works";
import { ContractorBanner } from "@/components/home/contractor-banner";
import { FAQSection } from "@/components/home/faq-section";

export const metadata: Metadata = {
  title: "MajDur — Find Work. Hire Workers. Build Your Future.",
  description:
    "India's premier blue-collar & skilled workforce marketplace connecting homeowners, builders, and contractors with Aadhaar-verified craftsmen across 32 specialized trades. Developed by Harsh Singh.",
  keywords: [
    "MajDur",
    "Harsh Singh",
    "hire workers in India",
    "electrician near me",
    "plumber near me",
    "mason mistri",
    "contractor hiring",
    "daily wage labour",
    "Aadhaar verified workers",
  ],
  openGraph: {
    title: "MajDur — Find Work. Hire Workers. Build Your Future.",
    description:
      "India's premier marketplace for verified blue-collar tradesmen and contractors.",
    locale: "en_IN",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Module 1: Hero Section */}
      <HeroSection />

      {/* Module 4: Real Platform Statistics */}
      <StatsSection />

      {/* Module 2: 32 Dynamic Trade Categories */}
      <CategoryGrid />

      {/* Module 3: Featured Workers from MongoDB */}
      <FeaturedWorkers />

      {/* Module 5: How It Works */}
      <HowItWorks />

      {/* Module 6: Contractor Recruitment Banner */}
      <ContractorBanner />

      {/* Module 7: FAQ Accordion */}
      <FAQSection />
    </div>
  );
}
