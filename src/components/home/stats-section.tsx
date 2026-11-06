import * as React from "react";
import { Users2, CheckCircle2, Building2, Star } from "lucide-react";

const STATS = [
  {
    label: "Verified Workers",
    value: "25,000+",
    description: "Trained & background verified tradesmen",
    icon: Users2,
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    label: "Jobs Completed",
    value: "150,000+",
    description: "Successful residential & site projects",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    label: "Cities & Towns",
    value: "45+",
    description: "Active labor hubs across India",
    icon: Building2,
    color: "text-purple-600 bg-purple-50 border-purple-200",
  },
  {
    label: "Customer Rating",
    value: "4.8 / 5",
    description: "Based on 35,000+ verified customer reviews",
    icon: Star,
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
];

export function StatsSection() {
  return (
    <section className="border-y border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${stat.color}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-sm font-bold text-slate-800">{stat.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
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
