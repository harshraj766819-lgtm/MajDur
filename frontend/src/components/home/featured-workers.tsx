"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Star, 
  ShieldCheck, 
  MapPin, 
  Briefcase, 
  ArrowRight, 
  UserCheck, 
  Clock,
  Phone,
  HardHat
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorkerCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchFeaturedWorkers, WorkerItem } from "@/lib/api";

export function FeaturedWorkers() {
  const [workers, setWorkers] = React.useState<WorkerItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchFeaturedWorkers();
        setWorkers(data);
      } catch (err) {
        console.error("Failed to load featured workers:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <section className="py-20 bg-[#121212] border-b border-[#1c1c1c] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 mb-3">
              <ShieldCheck className="h-4 w-4" />
              <span>Real Database Verified Profiles</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Featured Skilled Workers
            </h2>
            <p className="mt-2 text-base text-zinc-400 max-w-xl">
              Verified craftsmen with confirmed identification, demonstrated experience, and direct availability.
            </p>
          </div>
          <Link
            href="/workers"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#D4AF37] hover:text-[#C5A028] transition-colors"
          >
            Explore all workers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <WorkerCardSkeleton key={idx} />
            ))}
          </div>
        ) : workers.length === 0 ? (
          /* Real Empty State */
          <div className="p-8 rounded-3xl bg-[#161616] border border-[#222222]">
            <EmptyState
              icon={HardHat}
              title="No Featured Workers Available"
              description="New verified tradesmen are currently going through onboarding and KYC verification."
              actionLabel="Browse Worker Directory"
              onAction={() => {}}
            />
          </div>
        ) : (
          /* Real Worker Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workers.map((worker) => {
              const hasRealRating = worker.rating > 0 && worker.totalReviews > 0;
              const initials = worker.user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <div
                  key={worker.id}
                  className="group flex flex-col justify-between rounded-2xl border border-[#262626] bg-[#181818] p-5 shadow-surface transition-all duration-200 hover:border-[#D4AF37]/50 hover:bg-[#1c1c1c] hover:-translate-y-1 hover:shadow-xl hover:shadow-[#D4AF37]/10"
                >
                  <div>
                    {/* Top Row: Avatar & Status */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="relative">
                        {worker.user.avatar ? (
                          <img
                            src={worker.user.avatar}
                            alt={worker.user.name}
                            className="h-14 w-14 rounded-2xl object-cover border border-[#333333]"
                          />
                        ) : (
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#2a2a2a] to-[#1c1c1c] text-white font-bold text-lg border border-[#383838]">
                            {initials}
                          </div>
                        )}
                        {worker.isAvailable && (
                          <span
                            className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-[#181818]"
                            title="Available for immediate work"
                          />
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {worker.isVerified && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/25">
                            <ShieldCheck className="h-3 w-3" />
                            Verified
                          </span>
                        )}
                        <span className="text-[11px] font-medium text-zinc-400">
                          {worker.isAvailable ? "Available" : "On Assignment"}
                        </span>
                      </div>
                    </div>

                    {/* Worker Name & Trade */}
                    <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-tight">
                      {worker.user.name}
                    </h3>
                    <p className="text-xs font-semibold text-[#D4AF37] mt-0.5">
                      {worker.category}
                      {worker.categoryRef?.hindiName ? ` (${worker.categoryRef.hindiName})` : ""}
                    </p>

                    {/* Location & Experience */}
                    <div className="mt-3 space-y-1 text-xs text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span>
                          {worker.locationCity}
                          {worker.locationState ? `, ${worker.locationState}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                        <span>{worker.experienceYears} Years Experience</span>
                      </div>
                    </div>

                    {/* Real Rating (Rendered ONLY when real data exists per Master Rule) */}
                    <div className="mt-3 pt-3 border-t border-[#222222] flex items-center justify-between text-xs">
                      {hasRealRating ? (
                        <div className="flex items-center gap-1 text-amber-400 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>{worker.rating.toFixed(1)}</span>
                          <span className="text-zinc-500 font-normal">
                            ({worker.totalReviews})
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-zinc-500">
                          New Verified Craftsman
                        </span>
                      )}

                      {worker.completedJobs > 0 && (
                        <span className="text-[11px] text-zinc-400">
                          <strong className="text-white">{worker.completedJobs}</strong> jobs done
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom: Daily Rate & CTA Button */}
                  <div className="mt-5 pt-3 border-t border-[#222222] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                        Standard Daily Rate
                      </span>
                      <span className="text-base font-black text-white">
                        ₹{worker.dailyRate ?? 800}
                        <span className="text-xs font-normal text-zinc-400"> /day</span>
                      </span>
                    </div>

                    <Link href={`/workers?id=${worker.id}`}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="font-bold bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-sm"
                      >
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
