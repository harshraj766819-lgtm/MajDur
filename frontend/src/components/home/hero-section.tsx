"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, ShieldCheck, CheckCircle2, HardHat, Briefcase, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const POPULAR_TAGS = [
  "Electrician",
  "Plumber",
  "Mason (Mistri)",
  "Carpenter",
  "Painter",
  "General Labour",
  "Tile Worker",
  "Welder",
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
  const [areaOrPincode, setAreaOrPincode] = React.useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tradeQuery.trim()) params.set("search", tradeQuery.trim());
    if (selectedCity && selectedCity !== "All India") params.set("city", selectedCity);
    if (areaOrPincode.trim()) params.set("area", areaOrPincode.trim());
    router.push(`/workers?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    const cleanTag = tag.split(" ")[0];
    router.push(`/workers?category=${encodeURIComponent(cleanTag)}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#141414] via-[#101010] to-[#0d0d0d] pt-14 pb-20 lg:pt-24 lg:pb-32 border-b border-[#1c1c1c]">
      {/* Background radial gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] bg-gradient-to-b from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto space-y-7">
          {/* Tagline / Trust Pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#181818] px-4 py-1.5 text-xs sm:text-sm font-semibold text-zinc-300 shadow-md border border-[#2a2a2a]">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[#D4AF37] font-bold">MajDur Marketplace</span>
            <span className="text-zinc-600">•</span>
            <span>Find Work. Hire Workers. Build Your Future.</span>
          </div>

          {/* Main Headline according to Section 9 */}
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.12]">
            Find Skilled Workers.{" "}
            <span className="bg-gradient-to-r from-[#D4AF37] via-amber-200 to-[#F3E5AB] bg-clip-text text-transparent">
              Get Work Done.
            </span>
          </h1>

          {/* Description according to Section 9 */}
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Connect with skilled professionals, trusted workers and service providers across India. Transparent wages, direct connect and verified profiles.
          </p>

          {/* Primary & Secondary CTAs from Section 9 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/workers">
              <Button
                size="lg"
                variant="primary"
                className="w-full sm:w-auto px-8 bg-[#D4AF37] hover:bg-[#C5A028] text-black font-black text-base shadow-xl shadow-[#D4AF37]/25"
                leftIcon={<Search className="h-5 w-5" />}
              >
                Find a Worker
              </Button>
            </Link>
            <Link href="/jobs">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-8 border-zinc-700 bg-[#181818] text-white hover:bg-[#222222] hover:border-[#D4AF37] font-bold text-base"
                leftIcon={<Briefcase className="h-5 w-5 text-[#D4AF37]" />}
              >
                Find a Job
              </Button>
            </Link>
          </div>

          {/* Search Box according to Section 9 (Category, City, Area, PIN code) */}
          <form
            onSubmit={handleSearch}
            className="mt-8 mx-auto max-w-3xl rounded-2xl bg-[#181818] p-3 shadow-2xl border border-[#2a2a2a] flex flex-col md:flex-row gap-2.5"
          >
            {/* Category / Trade query */}
            <div className="relative flex-1 flex items-center">
              <Search className="pointer-events-none absolute left-3.5 h-5 w-5 text-zinc-500" />
              <input
                type="text"
                placeholder="Category or Skill (e.g. Electrician, Mason)"
                value={tradeQuery}
                onChange={(e) => setTradeQuery(e.target.value)}
                className="w-full rounded-xl bg-transparent py-2.5 pl-11 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>

            {/* City dropdown */}
            <div className="relative md:w-44 border-t md:border-t-0 md:border-l border-[#2a2a2a] flex items-center">
              <MapPin className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-500" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full appearance-none rounded-xl bg-transparent py-2.5 pl-10 pr-6 text-sm text-zinc-200 focus:outline-none font-medium cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-[#181818] text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Area / PIN Code input */}
            <div className="relative md:w-48 border-t md:border-t-0 md:border-l border-[#2a2a2a] flex items-center">
              <input
                type="text"
                placeholder="Area / PIN code"
                value={areaOrPincode}
                onChange={(e) => setAreaOrPincode(e.target.value)}
                className="w-full rounded-xl bg-transparent py-2.5 px-3.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="md:px-7 rounded-xl font-bold bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-md shadow-[#D4AF37]/20"
            >
              Search
            </Button>
          </form>

          {/* Popular Tag Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 mr-1">Trending:</span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="rounded-full bg-[#181818] px-3 py-1 text-xs font-medium text-zinc-300 border border-[#2a2a2a] hover:border-[#D4AF37] hover:text-white transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Trust points */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto text-xs font-medium text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span>Aadhaar Verified Tradesmen</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span>Direct Phone Connect</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1 justify-center sm:justify-start">
              <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span>Zero Middleman Cut</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
