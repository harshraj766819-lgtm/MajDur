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
    <section className="py-16 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <Badge variant="brand" className="mb-2">
              Browse Skilled Trades
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Find Experienced Workers By Trade
            </h2>
            <p className="mt-2 text-base text-slate-600 max-w-xl">
              Transparent daily rates, verified experience, and ready for immediate deployment.
            </p>
          </div>
          <Link
            href="/categories"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all categories
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
                className="group relative rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors duration-200">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400 group-hover:text-brand-600 transition-colors">
                      {cat.activeCount}+ Active
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-2">
                    {cat.hindiName}
                  </p>
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Avg. Daily Wage</span>
                  <span className="font-bold text-slate-900">
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
