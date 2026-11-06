"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Hammer, 
  Menu, 
  X, 
  Search, 
  UserCircle2, 
  Briefcase, 
  HardHat, 
  Sparkles,
  MapPin,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-400 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Hammer className="h-6 w-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  Maj<span className="text-brand-500">Dur</span>
                </span>
                <span className="hidden sm:inline-block rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 border border-brand-200/60">
                  India
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-medium text-slate-500">
                Kaam Bhi, Samman Bhi
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600">
            <Link
              href="/workers"
              className="rounded-lg px-3.5 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Find Workers
            </Link>
            <Link
              href="/jobs"
              className="rounded-lg px-3.5 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Post a Job
            </Link>
            <Link
              href="/categories"
              className="rounded-lg px-3.5 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/contractors"
              className="rounded-lg px-3.5 py-2 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1.5"
            >
              <HardHat className="h-4 w-4 text-brand-600" />
              For Contractors
            </Link>
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/api/health"
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
            title="Check API & Database Health"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live System
          </Link>

          <Link href="/auth/login">
            <Button variant="ghost" size="md" className="font-semibold text-slate-700">
              Sign In
            </Button>
          </Link>

          <Link href="/auth/register">
            <Button
              variant="outline"
              size="md"
              className="border-brand-500 text-brand-600 hover:bg-brand-50 hover:text-brand-700 font-semibold"
            >
              Hire Workers
            </Button>
          </Link>

          <Link href="/auth/register?role=WORKER">
            <Button
              variant="primary"
              size="md"
              className="shadow-brand-500/25"
              leftIcon={<HardHat className="h-4 w-4" />}
            >
              Join as Worker
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/workers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
            >
              Find Workers
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/jobs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
            >
              Post a Job
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/categories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
            >
              Browse Categories
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/contractors"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-slate-700 hover:bg-slate-100"
            >
              For Contractors
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              href="/api/health"
              target="_blank"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50"
            >
              System Health Status
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </Link>
          </nav>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2.5">
            <Link href="/auth/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" fullWidth size="lg">
                Hire Workers (Customer)
              </Button>
            </Link>
            <Link href="/auth/register?role=WORKER" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" fullWidth size="lg" leftIcon={<HardHat className="h-4 w-4" />}>
                Join as Worker / Contractor
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
