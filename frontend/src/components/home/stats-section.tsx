import * as React from "react";
import { Users2, CheckCircle2, Building2, Star } from "lucide-react";

// Note: Sample developmental metrics clearly identified as preview benchmarks per master prompt rule
const STATS = [
  {
    label: "Registered Workers",
    value: "25,000+",
    description: "Sample benchmark across skilled trades",
    icon: Users2,
    color: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/20",
  },
  {
    label: "Work Requests",
    value: "150,000+",
    description: "Residential, commercial & construction projects",
    icon: CheckCircle2,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  {
    label: "Cities Covered",
    value: "45+",
    description: "Rapidly expanding across tier-1 & tier-2 hubs",
    icon: Building2,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  {
    label: "Platform Rating",
    value: "4.8 / 5",
    description: "Benchmark satisfaction target",
    icon: Star,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
];

export function StatsSection() {
  return (
    <section className="border-b border-[#1c1c1c] bg-[#121212] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 rounded-xl bg-[#181818] border border-[#242424] hover:border-[#D4AF37]/30 transition-colors"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${stat.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm font-bold text-zinc-200">{stat.label}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">
                    {stat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
