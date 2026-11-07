"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ShieldCheck, MapPin, Briefcase, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const FEATURED_WORKERS = [
  {
    id: "w-1",
    name: "Rameshwar Mistri",
    role: "Senior Mason (राज मिस्त्री)",
    category: "Mason",
    city: "Delhi NCR",
    state: "Delhi",
    experienceYears: 12,
    rating: 4.9,
    reviewsCount: 84,
    completedJobs: 132,
    dailyRate: 950,
    skills: ["Brickwork", "RCC Slab", "Plaster", "Boundary Wall"],
    isVerified: true,
    isAvailable: true,
  },
  {
    id: "w-2",
    name: "Mohd. Shakeel",
    role: "Licensed Electrician",
    category: "Electrician",
    city: "Mumbai",
    state: "Maharashtra",
    experienceYears: 8,
    rating: 4.8,
    reviewsCount: 62,
    completedJobs: 98,
    dailyRate: 850,
    skills: ["MCB Wiring", "Inverter Setup", "Short Circuit Repair"],
    isVerified: true,
    isAvailable: true,
  },
  {
    id: "w-3",
    name: "Karan Singh",
    role: "Master Carpenter (बढ़ई)",
    category: "Carpenter",
    city: "Bengaluru",
    state: "Karnataka",
    experienceYears: 10,
    rating: 4.9,
    reviewsCount: 47,
    completedJobs: 79,
    dailyRate: 900,
    skills: ["Modular Fitting", "Door Frames", "Wood Polish"],
    isVerified: true,
    isAvailable: true,
  },
  {
    id: "w-4",
    name: "Dinesh Prajapati",
    role: "Master Plumber & Pipefitter",
    category: "Plumber",
    city: "Patna",
    state: "Bihar",
    experienceYears: 7,
    rating: 4.7,
    reviewsCount: 39,
    completedJobs: 65,
    dailyRate: 800,
    skills: ["Leak Detection", "CPVC Piping", "Submersible Pump"],
    isVerified: true,
    isAvailable: true,
  },
];

export function FeaturedWorkers() {
  return (
    <section className="py-20 bg-[#121212] border-t border-[#1c1c1c]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 mb-3">
              Verified Profiles Preview
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Featured Skilled Workers
            </h2>
            <p className="mt-2 text-base text-zinc-400 max-w-xl">
              Pre-screened craftsmen with demonstrated track records and direct phone availability.
            </p>
          </div>
          <Link
            href="/workers"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-[#D4AF37] hover:text-[#C5A028] transition-colors"
          >
            Explore all workers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_WORKERS.map((worker) => (
            <div
              key={worker.id}
              className="rounded-2xl border border-[#222222] bg-[#181818] p-5 shadow-sm hover:border-[#D4AF37]/50 hover:bg-[#1f1f1f] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Verification */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-[#252525] border-2 border-[#D4AF37]/40 flex items-center justify-center font-bold text-[#D4AF37] text-lg">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">
                        {worker.name}
                      </h4>
                      <p className="text-xs text-[#D4AF37] font-semibold mt-0.5">
                        {worker.role}
                      </p>
                    </div>
                  </div>
                  {worker.isVerified && (
                    <span
                      title="Govt ID & Background Verified"
                      className="inline-flex text-emerald-400 bg-emerald-500/10 p-1.5 rounded-full border border-emerald-500/20"
                    >
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  )}
                </div>

                {/* Rating & Location */}
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400 border-y border-[#262626] py-2.5">
                  <div className="flex items-center gap-1 font-semibold text-zinc-200">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{worker.rating}</span>
                    <span className="text-zinc-500 font-normal">
                      ({worker.reviewsCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{worker.city}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {worker.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-[#252525] px-2 py-0.5 text-[11px] font-medium text-zinc-300 border border-[#333333]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{worker.completedJobs} Jobs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{worker.experienceYears} Yrs Exp</span>
                  </div>
                </div>
              </div>

              {/* Bottom: Rate & CTA */}
              <div className="mt-6 pt-4 border-t border-[#262626] flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-500 block">Daily Wage</span>
                  <span className="text-lg font-black text-white">
                    ₹{worker.dailyRate}
                    <span className="text-xs font-normal text-zinc-400">/day</span>
                  </span>
                </div>
                <Link href={`/workers/${worker.id}`}>
                  <Button size="sm" variant="primary" className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold">
                    Hire Now
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
