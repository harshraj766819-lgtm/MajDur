import * as React from "react";
import Link from "next/link";
import { HardHat, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContractorBanner() {
  return (
    <section className="py-20 bg-[#0d0d0d] text-white relative overflow-hidden border-t border-[#1c1c1c]">
      {/* Decorative gradient glow */}
      <div className="absolute right-0 bottom-0 w-[500px] h-[500px] bg-[#D4AF37]/5 blur-3xl rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#181818] to-[#141414] border border-[#2a2a2a] p-8 sm:p-14 lg:flex lg:items-center lg:justify-between gap-10 shadow-2xl">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-3.5 py-1 text-xs font-semibold text-[#D4AF37] border border-[#D4AF37]/25">
              <HardHat className="h-4 w-4" />
              <span>For Commercial Contractors, Builders &amp; Site Supervisors</span>
            </div>

            <h3 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Need 10 to 100+ Workers for Your Site?
            </h3>

            <p className="text-zinc-400 text-base leading-relaxed">
              MajDur for Contractors gives you enterprise-grade bulk labor deployment, team management tools, project posting, and GST invoicing.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-sm text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>On-demand skilled gangs &amp; mistris</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>Consolidated weekly/monthly GST billing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>Pre-screened identity adherence</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>Zero hassle contractor dashboard</span>
              </div>
            </div>
          </div>

          <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <Link href="/contractors">
              <Button
                variant="primary"
                size="lg"
                className="w-full font-bold bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-lg shadow-[#D4AF37]/25"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Contractor Solutions
              </Button>
            </Link>
            <Link href="/register?role=CONTRACTOR">
              <Button
                variant="outline"
                size="lg"
                className="w-full bg-[#1c1c1c] text-white border-zinc-700 hover:bg-[#252525] font-bold"
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
