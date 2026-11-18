import * as React from "react";
import Link from "next/link";
import { HardHat, CheckCircle2, ArrowRight, Building, Users2, FileText, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContractorBanner() {
  return (
    <section className="py-20 bg-[#0d0d0d] text-white relative overflow-hidden border-b border-[#1c1c1c]">
      {/* Decorative gradient glow */}
      <div className="absolute right-0 bottom-0 w-[550px] h-[550px] bg-[#D4AF37]/5 blur-3xl rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="rounded-3xl bg-gradient-to-r from-[#181818] via-[#161616] to-[#121212] border border-[#2a2a2a] p-8 sm:p-14 lg:flex lg:items-center lg:justify-between gap-12 shadow-2xl">
          <div className="max-w-2xl space-y-4">
            
            <div className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-3.5 py-1 text-xs font-semibold text-[#D4AF37] border border-[#D4AF37]/25">
              <HardHat className="h-4 w-4" />
              <span>For Commercial Contractors, Builders &amp; Site Supervisors</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Build Your Workforce with MajDur
            </h2>

            <p className="text-zinc-400 text-base leading-relaxed">
              Scale your project staffing with enterprise-grade bulk labor deployment. Recruit gangs of 10 to 100+ verified masons, steel fixers, carpenters, and helpers across major Indian urban centers.
            </p>

            {/* Core Features mandated by Module 6 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-sm text-zinc-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span><strong>Find skilled workers:</strong> On-demand gangs &amp; mistris</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span><strong>Manage workforce:</strong> Attendance &amp; site teams</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span><strong>Post projects:</strong> Turnkey civil &amp; interior contracts</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span><strong>Track hiring requests:</strong> Live applicant dashboard</span>
              </div>
            </div>

          </div>

          <div className="mt-8 lg:mt-0 flex flex-col sm:flex-row lg:flex-col gap-3.5 shrink-0 w-full lg:w-72">
            <Link href="/register?role=CONTRACTOR" className="w-full">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="font-bold bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-lg shadow-[#D4AF37]/25"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Register as Contractor
              </Button>
            </Link>
            
            <Link href="/contractors" className="w-full">
              <Button
                variant="outline"
                size="lg"
                fullWidth
                className="bg-[#1c1c1c] text-white border-zinc-700 hover:bg-[#252525] hover:border-[#D4AF37] font-bold"
              >
                Explore Contractor Tools
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
