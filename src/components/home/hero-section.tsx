"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ShieldCheck, Star, Users, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const POPULAR_TAGS = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Mason (Mistri)",
  "Painter",
  "Helper / Labourer",
  "Welder",
];

const CITIES = [
  "All Cities",
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
  const [selectedCity, setSelectedCity] = React.useState("All Cities");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (tradeQuery.trim()) params.set("search", tradeQuery.trim());
    if (selectedCity && selectedCity !== "All Cities") params.set("city", selectedCity);
    router.push(`/workers?${params.toString()}`);
  };

  const handleTagClick = (tag: string) => {
    const cleanTag = tag.split(" ")[0]; // Get primary word
    router.push(`/workers?category=${encodeURIComponent(cleanTag)}`);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-slate-50 pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background glowing blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-brand-200/30 to-amber-200/20 blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Trust Pill */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm border border-slate-200/80">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-brand-600 font-bold">100% Aadhaar-Verified</span>
            <span className="text-slate-300">•</span>
            <span>Zero Agency Commissions</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.15]">
            Hire Verified Workers &amp; Skilled Tradesmen{" "}
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-amber-500 bg-clip-text text-transparent">
              In Minutes
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Directly connect with local electricians, plumbers, masons, painters, and general daily-wage workers for your home, commercial site, or construction project.
          </p>

          {/* Unified Search Box */}
          <form
            onSubmit={handleSearch}
            className="mt-8 mx-auto max-w-2xl rounded-2xl bg-white p-2.5 sm:p-3 shadow-xl shadow-slate-200/60 border border-slate-200 flex flex-col sm:flex-row gap-2.5"
          >
            {/* Skill / Trade search */}
            <div className="relative flex-1 flex items-center">
              <Search className="pointer-events-none absolute left-3.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="What skill do you need? (e.g. Plumber, Mason)"
                value={tradeQuery}
                onChange={(e) => setTradeQuery(e.target.value)}
                className="w-full rounded-xl bg-transparent py-2.5 pl-11 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>

            {/* City selector */}
            <div className="relative sm:w-44 border-t sm:border-t-0 sm:border-l border-slate-200 flex items-center">
              <MapPin className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full appearance-none rounded-xl bg-transparent py-2.5 pl-10 pr-6 text-sm text-slate-700 focus:outline-none font-medium cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Submit Button */}
            <Button
              type="submit"
              size="lg"
              variant="primary"
              className="sm:px-7 rounded-xl font-semibold shadow-md shadow-brand-500/30"
            >
              Search Workers
            </Button>
          </form>

          {/* Popular Tag Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1">Popular:</span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm border border-slate-200 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Micro Trust Points */}
          <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Government ID Verified</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Direct Phone Connect</span>
            </div>
            <div className="flex items-center gap-2 col-span-2 sm:col-span-1 justify-center sm:justify-start">
              <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Standard Daily Rates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
