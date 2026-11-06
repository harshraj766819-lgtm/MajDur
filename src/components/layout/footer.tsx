import * as React from "react";
import Link from "next/link";
import { Hammer, ShieldCheck, HeartHandshake, Phone, Mail, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-lg shadow-brand-500/30">
                <Hammer className="h-6 w-6 stroke-[2.2]" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Maj<span className="text-brand-400">Dur</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              MajDur is India&apos;s trusted platform connecting verified daily-wage
              workers, skilled tradesmen, and commercial contractors with homes,
              businesses, and construction projects.
            </p>
            <div className="pt-2 flex flex-col gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>100% Aadhaar & Background Verified Profiles</span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-brand-400" />
                <span>Fair Minimum Wages & Direct Transparent Payments</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Worker Trades
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/workers?category=Electrician" className="hover:text-brand-400 transition-colors">
                  Electricians
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Plumber" className="hover:text-brand-400 transition-colors">
                  Plumbers
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Carpenter" className="hover:text-brand-400 transition-colors">
                  Carpenters
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Mason" className="hover:text-brand-400 transition-colors">
                  Masons (Mistri)
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Painter" className="hover:text-brand-400 transition-colors">
                  Painters
                </Link>
              </li>
              <li>
                <Link href="/workers?category=Labourer" className="hover:text-brand-400 transition-colors">
                  Daily Wage Labour
                </Link>
              </li>
            </ul>
          </div>

          {/* For Contractors & Users */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Solutions
            </h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/jobs/new" className="hover:text-brand-400 transition-colors">
                  Post a Daily Requirement
                </Link>
              </li>
              <li>
                <Link href="/contractors" className="hover:text-brand-400 transition-colors">
                  Bulk Contractor Hiring
                </Link>
              </li>
              <li>
                <Link href="/workers" className="hover:text-brand-400 transition-colors">
                  Find Immediate Workers
                </Link>
              </li>
              <li>
                <Link href="/auth/register?role=WORKER" className="hover:text-brand-400 transition-colors">
                  Worker Registration
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-brand-400 transition-colors">
                  Wage Guidance Matrix
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
              Contact & Support
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-brand-400 shrink-0" />
                <span>+91 1800-MAJDUR (Toll Free)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-brand-400 shrink-0" />
                <span>support@majdur.in</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-brand-400 shrink-0 mt-0.5" />
                <span>New Delhi • Mumbai • Bengaluru • Patna</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} MajDur Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/safety" className="hover:text-slate-300 transition-colors">
              Worker Safety Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
