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
  ArrowRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface CategoryItem {
  id: string;
  name: string;
  hindiName: string;
  slug: string;
  icon: any;
  activeCount: number;
  avgDailyRate: number;
  description: string;
}

export const POPULAR_CATEGORIES: CategoryItem[] = [
  {
    id: "electrician",
    name: "Electrician",
    hindiName: "इलेक्ट्रीशियन",
    slug: "electrician",
    icon: Zap,
    activeCount: 1240,
    avgDailyRate: 850,
    description: "Wiring, circuit breakers, appliance repair, MCB fittings",
  },
  {
    id: "plumber",
    name: "Plumber",
    hindiName: "प्लम्बर / नलसाज़",
    slug: "plumber",
    icon: Wrench,
    activeCount: 980,
    avgDailyRate: 800,
    description: "Pipe fitting, leakage repair, sanitary installations, water tank",
  },
  {
    id: "mason",
    name: "Mason (Raj Mistri)",
    hindiName: "राज मिस्त्री",
    slug: "mason",
    icon: Layers,
    activeCount: 1850,
    avgDailyRate: 950,
    description: "Brickwork, plastering, foundation, concrete casting",
  },
  {
    id: "carpenter",
    name: "Carpenter (Badhai)",
    hindiName: "बढ़ई",
    slug: "carpenter",
    icon: Hammer,
    activeCount: 760,
    avgDailyRate: 900,
    description: "Furniture making, modular kitchen, door & window framing",
  },
  {
    id: "painter",
    name: "Painter",
    hindiName: "पेंटर",
    slug: "painter",
    icon: Paintbrush,
    activeCount: 1420,
    avgDailyRate: 750,
    description: "Interior/exterior wall painting, putty, texture, polishing",
  },
  {
    id: "welder",
    name: "Welder & Fabricator",
    hindiName: "वेल्डर / लोहार",
    slug: "welder",
    icon: Flame,
    activeCount: 530,
    avgDailyRate: 900,
    description: "Metal fabrication, grill gates, railing, structural welding",
  },
  {
    id: "labourer",
    name: "Daily Wage Labourer",
    hindiName: "मजदूर (हेल्पर)",
    slug: "labourer",
    icon: Users,
    activeCount: 3200,
    avgDailyRate: 550,
    description: "Material loading, site clearing, digging, construction helper",
  },
  {
    id: "tile-marble",
    name: "Tile & Marble Worker",
    hindiName: "टाइल व मार्बल कारीगर",
    slug: "tile-marble",
    icon: HardHat,
    activeCount: 640,
    avgDailyRate: 1000,
    description: "Floor tiling, granite cutting, marble polishing & fixing",
  },
];

export function CategoryGrid() {
  return (
    <section className="py-20 bg-[#101010]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30 mb-3">
              Browse Skilled Trades
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Popular Service Categories
            </h2>
            <p className="mt-2 text-base text-zinc-400 max-w-xl">
              Transparent daily wage guidance, verified experience, and ready for immediate hire.
            </p>
          </div>
          <Link
            href="/categories"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4AF37] hover:text-[#C5A028] transition-colors"
          >
            View all 45+ categories
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {POPULAR_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/workers?category=${encodeURIComponent(cat.name)}`}
                className="group relative rounded-2xl border border-[#222222] bg-[#181818] p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#D4AF37] hover:bg-[#202020] hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#252525] text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-colors duration-200">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-500 group-hover:text-[#D4AF37] transition-colors">
                      {cat.activeCount}+ Active
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs font-medium text-[#D4AF37]/80 mb-2">
                    {cat.hindiName}
                  </p>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#262626] flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">Avg. Daily Wage</span>
                  <span className="font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                    ₹{cat.avgDailyRate} / day
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
