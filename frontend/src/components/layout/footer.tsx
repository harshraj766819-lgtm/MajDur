import * as React from "react";
import Link from "next/link";
import { Hammer, ShieldCheck, HeartHandshake, Phone, Mail, MapPin, Code2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#222222] bg-[#0c0c0c] text-zinc-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-300 text-black font-black shadow-lg shadow-[#D4AF37]/20">
                <Hammer className="h-6 w-6 stroke-[2.4]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Maj<span className="text-[#D4AF37]">Dur</span>
              </span>
            </div>
            <p className="text-sm font-medium text-[#D4AF37]">
              Find Work. Hire Workers. Build Your Future.
            </p>
            <p className="text-sm leading-relaxed text-zinc-400 max-w-sm">
              India&apos;s premier workforce and skilled services marketplace connecting verified tradesmen, daily-wage workers, and commercial contractors with homes and projects.
            </p>
            <div className="pt-2 flex flex-col gap-2 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>100% Aadhaar &amp; Background Verified Profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-[#D4AF37]" />
                <span>Fair Minimum Wages &amp; Transparent Direct Payments</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Worker Trades
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
              <li>
                <Link href="/workers?category=Electrician" className="hover:text-[#D4AF37] transition-colors">
                  Electricians
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Plumber" className="hover:text-[#D4AF37] transition-colors">
                  Plumbers
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Carpenter" className="hover:text-[#D4AF37] transition-colors">
                  Carpenters
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Mason" className="hover:text-[#D4AF37] transition-colors">
                  Masons (Mistri)
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Painter" className="hover:text-[#D4AF37] transition-colors">
                  Painters
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Labourer" className="hover:text-[#D4AF37] transition-colors">
                  Daily Wage Labour
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Solutions
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm text-zinc-400">
              <li>
                <Link href="/jobs/new" className="hover:text-[#D4AF37] transition-colors">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/contractors" className="hover:text-[#D4AF37] transition-colors">
                  Bulk Contractor Hiring
                </Link>
              </li>
              <li>
                <Link href="/workers" className="hover:text-[#D4AF37] transition-colors">
                  Find Immediate Workers
                </Link>
              </li>
              <li>
                <Link href="/auth/register?role=WORKER" className="hover:text-[#D4AF37] transition-colors">
                  Worker Registration
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-[#D4AF37] transition-colors">
                  Wage Guidance Matrix
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact &amp; Support
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-zinc-400">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>+91 1800-MAJDUR (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-[#D4AF37] shrink-0" />
                <span>support@majdur.in</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>New Delhi • Mumbai • Bengaluru • Patna</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar with Developer Credit */}
        <div className="mt-12 border-t border-[#1e1e1e] pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
            <p>© {new Date().getFullYear()} MajDur Technologies Pvt. Ltd. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-zinc-400 font-medium bg-[#181818] px-3 py-1 rounded-full border border-[#2a2a2a]">
              <Code2 className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>Developed by <strong className="text-white">Harsh Singh</strong></span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-zinc-300 transition-colors">
              Privacy
            </Link>
            <Link href="/safety" className="hover:text-zinc-300 transition-colors">
              Worker Safety
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
