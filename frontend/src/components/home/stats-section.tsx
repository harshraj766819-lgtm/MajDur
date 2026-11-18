"use client";

import * as React from "react";
import { Users2, CheckCircle2, Building2, Layers } from "lucide-react";
import { fetchPlatformStats, PlatformStats } from "@/lib/api";

export function StatsSection() {
  const [stats, setStats] = React.useState<PlatformStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchPlatformStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load platform stats:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const items = [
    {
      label: "Registered Workers",
      value: stats ? stats.registeredWorkers.toLocaleString("en-IN") : "--",
      description: "Aadhaar verified tradesmen & helpers",
      icon: Users2,
      color: "text-[#D4AF37] bg-[#D4AF37]/10 border-[#D4AF37]/25",
    },
    {
      label: "Completed Jobs",
      value: stats ? stats.completedJobs.toLocaleString("en-IN") : "--",
      description: "Successfully delivered projects & tasks",
      icon: CheckCircle2,
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    },
    {
      label: "Active Contractors",
      value: stats ? stats.activeContractors.toLocaleString("en-IN") : "--",
      description: "Civil builders & project managers",
      icon: Building2,
      color: "text-purple-400 bg-purple-500/10 border-purple-500/25",
    },
    {
      label: "Service Categories",
      value: stats ? stats.totalCategories.toLocaleString("en-IN") : "32",
      description: "Standardized construction & home trades",
      icon: Layers,
      color: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    },
  ];

  return (
    <section className="border-b border-[#1c1c1c] bg-[#121212] py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {items.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-5 rounded-2xl bg-[#181818] border border-[#242424] hover:border-[#D4AF37]/40 transition-colors shadow-sm"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${stat.color}`}
                >
                  <Icon className="h-6 w-6 stroke-[2]" />
                </div>
                <div className="min-w-0">
                  {loading ? (
                    <div className="h-8 w-16 bg-white/10 rounded-lg animate-pulse mb-1" />
                  ) : (
                    <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      {stat.value}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm font-bold text-zinc-200">
                    {stat.label}
                  </p>
                  <p className="text-[11px] text-zinc-500 mt-0.5 hidden sm:block truncate">
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
