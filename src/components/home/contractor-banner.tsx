import * as React from "react";
import Link from "next/link";
import { HardHat, Users, CheckCircle, ArrowRight, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContractorBanner() {
  return (
    <section className="py-16 bg-slate-900 text-white relative overflow-hidden">
      {/* Decorative gradient glow */}
      <div className="absolute right-0 bottom-0 w-96 h-96 bg-brand-500/10 blur-3xl rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl bg-gradient-to-r from-slate-800 to-slate-850 border border-slate-700/80 p-8 sm:p-12 lg:flex lg:items-center lg:justify-between gap-10">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-500/20 px-3.5 py-1 text-xs font-semibold text-brand-400 border border-brand-500/30">
              <HardHat className="h-4 w-4" />
              <span>For Contractors, Builders &amp; Site Incharges</span>
            </div>

            <h3 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Need 10 to 100+ Workers for Your Site?
            </h3>

            <p className="text-slate-300 text-base leading-relaxed">
              MajDur for Contractors gives you enterprise-grade bulk labor deployment, dedicated site coordinators, GST invoicing, and replacement guarantees within 4 hours.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-400 shrink-0" />
                <span>On-demand skilled gangs &amp; mistris</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-400 shrink-0" />
                <span>Consolidated weekly/monthly GST billing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-400 shrink-0" />
                <span>Pre-screened identity and safety adherence</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-brand-400 shrink-0" />
                <span>Zero hassle contractor dashboard</span>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link href="/contractors">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-lg shadow-brand-500/25"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Contractor Solutions
              </Button>
            </Link>
            <Link href="/auth/register?role=CONTRACTOR">
              <Button
                variant="outline"
                size="lg"
                className="w-full bg-slate-800 text-white border-slate-600 hover:bg-slate-700 font-bold"
              >
                Register as Contractor
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
