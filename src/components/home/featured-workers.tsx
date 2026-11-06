"use client";

import * as React from "react";
import Link from "next/link";
import { Star, ShieldCheck, MapPin, Briefcase, Phone, ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <section className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <Badge variant="success" className="mb-2">
              Verified &amp; Available Today
            </Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Featured Skilled Workers Near You
            </h2>
            <p className="mt-2 text-base text-slate-600 max-w-xl">
              Pre-vetted craftsmen with proven track records and transparent customer feedback.
            </p>
          </div>
          <Link
            href="/workers"
            className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors"
          >
            Explore all 25,000+ workers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_WORKERS.map((worker) => (
            <div
              key={worker.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Avatar, Name, Verification */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-slate-200 border-2 border-brand-500/30 flex items-center justify-center font-bold text-slate-700 text-lg">
                      {worker.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-tight">
                        {worker.name}
                      </h4>
                      <p className="text-xs text-brand-600 font-semibold mt-0.5">
                        {worker.role}
                      </p>
                    </div>
                  </div>
                  {worker.isVerified && (
                    <span
                      title="Govt ID & Background Verified"
                      className="inline-flex text-emerald-600 bg-emerald-50 p-1 rounded-full"
                    >
                      <ShieldCheck className="h-5 w-5" />
                    </span>
                  )}
                </div>

                {/* Rating & Location */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-y border-slate-100 py-2.5">
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span>{worker.rating}</span>
                    <span className="text-slate-400 font-normal">
                      ({worker.reviewsCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{worker.city}</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {worker.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>{worker.completedJobs} Jobs</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{worker.experienceYears} Yrs Exp</span>
                  </div>
                </div>
              </div>

              {/* Bottom: Rate & CTA */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Daily Rate</span>
                  <span className="text-lg font-black text-slate-900">
                    ₹{worker.dailyRate}
                    <span className="text-xs font-normal text-slate-500">/day</span>
                  </span>
                </div>
                <Link href={`/workers/${worker.id}`}>
                  <Button size="sm" variant="primary" className="font-semibold">
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
