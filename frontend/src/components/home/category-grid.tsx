"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Zap, 
  Wrench, 
  Hammer, 
  Paintbrush, 
  Layers, 
  Flame, 
  Users, 
  HardHat,
  ArrowRight,
  Search,
  Sparkles,
  Grid,
  Maximize,
  Link as LinkIcon,
  UserPlus,
  Wind,
  Box,
  Camera,
  Sun,
  Cpu,
  Square,
  Columns,
  Droplets,
  Home,
  Layout,
  Scissors,
  ShieldAlert,
  Truck,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { fetchCategories, Category } from "@/lib/api";

// Icon dictionary mapping backend icon string to Lucide icon component
const ICON_MAP: Record<string, LucideIcon> = {
  Zap,
  Wrench,
  Hammer,
  Paintbrush,
  Layers,
  Flame,
  Users,
  HardHat,
  Grid,
  Sparkles,
  Maximize,
  Link: LinkIcon,
  UserPlus,
  Wind,
  Box,
  Camera,
  Sun,
  Cpu,
  Square,
  Columns,
  Droplets,
  Home,
  Layout,
  Scissors,
  ShieldAlert,
  Truck,
  ShieldCheck,
  Tool: Wrench,
};

export function CategoryGrid() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter categories by search query (checks English name, Hindi name, or description)
  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.hindiName && c.hindiName.includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Display subset or full 32
  const displayedCategories = showAll || searchQuery.trim()
    ? filteredCategories
    : filteredCategories.slice(0, 12);

  return (
    <section className="py-20 bg-[#101010] border-b border-[#1c1c1c] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>32 Specialized Trade Categories</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Browse Work by Trade &amp; Skill
            </h2>
            <p className="mt-2 text-base text-zinc-400 max-w-xl">
              Explore verified craftsmen, master technicians, and construction labor organized across standard Indian workforce classifications.
            </p>
          </div>

          {/* Quick Category Filter Bar */}
          <div className="w-full lg:w-72 relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter 32 categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl bg-[#181818] border border-[#262626] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </div>
        ) : displayedCategories.length === 0 ? (
          /* Empty Search State */
          <div className="text-center py-16 p-8 rounded-2xl bg-[#141414] border border-[#222222]">
            <p className="text-zinc-400 text-sm">
              No categories found matching &quot;{searchQuery}&quot;.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="mt-4"
            >
              Clear Filter
            </Button>
          </div>
        ) : (
          /* Responsive Categories Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedCategories.map((category) => {
              const IconComponent =
                category.icon && ICON_MAP[category.icon]
                  ? ICON_MAP[category.icon]
                  : HardHat;

              const workerCount = category._count?.workerProfiles ?? 0;

              return (
                <Link
                  key={category.slug}
                  href={`/workers?category=${encodeURIComponent(category.slug)}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[#222222] bg-[#161616] p-5 hover:border-[#D4AF37]/50 hover:bg-[#1a1a1a] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#D4AF37]/5"
                >
                  <div>
                    {/* Top Row: Icon + Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#202020] text-[#D4AF37] border border-[#2a2a2a] group-hover:scale-105 group-hover:border-[#D4AF37]/40 transition-all">
                        <IconComponent className="h-5 w-5 stroke-[2.2]" />
                      </div>
                      {workerCount > 0 && (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                          {workerCount} {workerCount === 1 ? "Worker" : "Workers"}
                        </span>
                      )}
                    </div>

                    {/* Category Title & Hindi Name */}
                    <h3 className="text-base font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-snug">
                      {category.name}
                    </h3>
                    {category.hindiName && (
                      <p className="text-xs font-medium text-[#D4AF37]/90 mt-0.5">
                        {category.hindiName}
                      </p>
                    )}

                    {/* Short Description */}
                    {category.description && (
                      <p className="mt-2 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom: Wage Guidance & Arrow */}
                  <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
                    {category.baseDailyRate ? (
                      <span className="text-zinc-400 font-medium">
                        Standard:{" "}
                        <strong className="text-white font-bold">
                          ₹{category.baseDailyRate}
                        </strong>
                        <span className="text-[10px] text-zinc-500"> /day</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500">Standard Daily Rate</span>
                    )}

                    <span className="inline-flex items-center text-xs font-semibold text-[#D4AF37] group-hover:translate-x-1 transition-transform">
                      Hire
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* View All 32 Categories Toggle Button */}
        {!searchQuery && categories.length > 12 && (
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowAll(!showAll)}
              className="border-[#333333] bg-[#181818] text-white hover:border-[#D4AF37] hover:bg-[#202020] font-bold"
              rightIcon={
                showAll ? (
                  <ChevronUp className="h-4 w-4 text-[#D4AF37]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#D4AF37]" />
                )
              }
            >
              {showAll
                ? "Show Less Categories"
                : `View All ${categories.length} Trade Categories`}
            </Button>
          </div>
        )}

      </div>
    </section>
  );
}
