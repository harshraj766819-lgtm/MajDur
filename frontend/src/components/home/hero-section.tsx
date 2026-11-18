"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Briefcase, 
  Sparkles,
  Navigation,
  Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";

const POPULAR_TAGS = [
  { label: "Electrician", slug: "electrician" },
  { label: "Plumber", slug: "plumber" },
  { label: "Mason", slug: "mason" },
  { label: "Carpenter", slug: "carpenter" },
  { label: "Painter", slug: "painter" },
  { label: "Welder", slug: "welder" },
  { label: "Tile Worker", slug: "tile-worker" },
  { label: "Housekeeping", slug: "housekeeping" },
];

const CITIES = [
  "All India",
  "Delhi NCR",
  "Mumbai",
  "Bengaluru",
  "Patna",
  "Lucknow",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Ahmedabad",
];

export function HeroSection() {
  const router = useRouter();
  const [tradeQuery, setTradeQuery] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState("All India");
  const [area, setArea] = React.useState("");
  const [pincode, setPincode] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tradeQuery.trim()) params.set("search", tradeQuery.trim());
    if (selectedCity && selectedCity !== "All India") params.set("city", selectedCity);
    if (area.trim()) params.set("area", area.trim());
    if (pincode.trim()) params.set("pincode", pincode.trim());
    router.push(`/workers?${params.toString()}`);
  };

  const handleTagClick = (slug: string) => {
    router.push(`/workers?category=${encodeURIComponent(slug)}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#141414] via-[#101010] to-[#0d0d0d] pt-14 pb-20 lg:pt-24 lg:pb-32 border-b border-[#1c1c1c] text-white">
      {/* Background radial gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[520px] bg-gradient-to-b from-[#D4AF37]/15 via-[#D4AF37]/5 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-7">
          
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-4 py-1.5 text-xs sm:text-sm font-semibold text-zinc-300 shadow-md border border-[#2a2a2a]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#D4AF37] font-bold">MajDur (मजदूर) Marketplace</span>
            <span className="text-zinc-600">•</span>
            <span className="hidden sm:inline">Find Work. Hire Workers. Build Your Future.</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.12]">
            Find Skilled Workers.{" "}
            <span className="bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#F3E5AB] bg-clip-text text-transparent">
              Build Better. Work Smarter.
            </span>
          </h1>

          {/* Short Platform Description */}
          <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            India&apos;s premier workforce and skilled-worker marketplace connecting homeowners, builders, and contractors with Aadhaar-verified craftsmen across 32 specialized trades.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-1">
            <Link href="/workers">
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-auto px-8 bg-[#D4AF37] hover:bg-[#C5A028] text-black font-black text-base shadow-xl shadow-[#D4AF37]/25"
                leftIcon={<Search className="h-5 w-5" />}
              >
                Hire a Worker
              </Button>
            </Link>
            <Link href="/jobs">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 border-zinc-700 bg-[#181818] text-white hover:bg-[#222222] hover:border-[#D4AF37] font-bold text-base"
                leftIcon={<Briefcase className="h-5 w-5 text-[#D4AF37]" />}
              >
                Find Work &amp; Jobs
              </Button>
            </Link>
          </div>

          {/* Multi-field Search Form according to Module 1 */}
          <form
            onSubmit={handleSearch}
            className="mt-8 mx-auto max-w-4xl rounded-2xl bg-[#181818] p-3 shadow-2xl border border-[#2a2a2a] flex flex-col lg:flex-row gap-2.5 text-left"
          >
            {/* 1. Service / Trade query */}
            <div className="relative flex-1 flex items-center min-w-[200px]">
              <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Service or Trade (e.g. Electrician, Mason)..."
                value={tradeQuery}
                onChange={(e) => setTradeQuery(e.target.value)}
                className="w-full rounded-xl bg-transparent py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            {/* 2. City Selection */}
            <div className="relative lg:w-44 border-t lg:border-t-0 lg:border-l border-[#2a2a2a] flex items-center">
              <MapPin className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-500" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full appearance-none rounded-xl bg-transparent py-2.5 pl-9 pr-6 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-medium cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-[#181818] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Area Selection */}
            <div className="relative lg:w-40 border-t lg:border-t-0 lg:border-l border-[#2a2a2a] flex items-center">
              <Navigation className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Area / Locality"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-xl bg-transparent py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            {/* 4. PIN Code */}
            <div className="relative lg:w-32 border-t lg:border-t-0 lg:border-l border-[#2a2a2a] flex items-center">
              <Hash className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="PIN Code"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-xl bg-transparent py-2.5 pl-8 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              />
            </div>

            {/* 5. Search Button */}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="lg:px-7 rounded-xl font-bold bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-md shadow-[#D4AF37]/20"
            >
              Search
            </Button>
          </form>

          {/* Popular Search Suggestions */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 mr-1 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              Popular Trades:
            </span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag.slug}
                type="button"
                onClick={() => handleTagClick(tag.slug)}
                className="rounded-full bg-[#181818] px-3 py-1 text-xs font-medium text-zinc-300 border border-[#2a2a2a] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all cursor-pointer"
              >
                {tag.label}
              </button>
            ))}
          </div>

          {/* Trust Value Props */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto text-xs font-medium text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span>Aadhaar Verified Profiles</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span>Direct Phone Connect</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1 justify-center sm:justify-start">
              <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span>Transparent Daily Wages</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
