"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Hammer, 
  Menu, 
  X, 
  Search, 
  HardHat, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#222222] bg-[#101010]/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-300 text-black shadow-md shadow-[#D4AF37]/20 group-hover:scale-105 transition-transform duration-200">
              <Hammer className="h-6 w-6 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-black tracking-tight text-white">
                  Maj<span className="text-[#D4AF37]">Dur</span>
                </span>
                <span className="hidden sm:inline-block rounded-md bg-[#222222] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] border border-[#333333]">
                  India
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-medium text-zinc-400">
                Find Work. Hire Workers. Build Your Future.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-zinc-300">
            <Link
              href="/workers"
              className="rounded-lg px-3.5 py-2 hover:bg-[#1c1c1c] hover:text-white transition-colors"
            >
              Find Workers
            </Link>
            <Link
              href="/jobs"
              className="rounded-lg px-3.5 py-2 hover:bg-[#1c1c1c] hover:text-white transition-colors"
            >
              Find Jobs
            </Link>
            <Link
              href="/categories"
              className="rounded-lg px-3.5 py-2 hover:bg-[#1c1c1c] hover:text-white transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-lg px-3.5 py-2 hover:bg-[#1c1c1c] hover:text-white transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/contractors"
              className="rounded-lg px-3.5 py-2 hover:bg-[#1c1c1c] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <HardHat className="h-4 w-4 text-[#D4AF37]" />
              Contractors
            </Link>
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="http://localhost:5000/api/health"
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#181818] text-zinc-300 border border-[#2a2a2a] hover:border-[#D4AF37] transition-colors"
            title="Backend API & PostgreSQL status"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            API Status
          </Link>

          <Link href="/login">
            <Button variant="ghost" size="md" className="font-semibold text-zinc-300 hover:text-white hover:bg-[#1c1c1c]">
              Sign In
            </Button>
          </Link>

          <Link href="/register">
            <Button
              variant="outline"
              size="md"
              className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:text-white font-semibold"
            >
              Hire Workers
            </Button>
          </Link>

          <Link href="/register?role=WORKER">
            <Button
              variant="primary"
              size="md"
              className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold shadow-lg shadow-[#D4AF37]/20"
              leftIcon={<HardHat className="h-4 w-4" />}
            >
              Join as Worker
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-zinc-200">
              Sign In
            </Button>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-zinc-400 hover:bg-[#1c1c1c] hover:text-white focus:outline-none"
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
        <div className="md:hidden border-t border-[#222222] bg-[#141414] px-4 pt-3 pb-6 space-y-4 shadow-2xl">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/workers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-zinc-200 hover:bg-[#202020]"
            >
              Find Workers
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            </Link>
            <Link
              href="/jobs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-zinc-200 hover:bg-[#202020]"
            >
              Find Jobs
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            </Link>
            <Link
              href="/categories"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-zinc-200 hover:bg-[#202020]"
            >
              Browse Categories
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            </Link>
            <Link
              href="/contractors"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-zinc-200 hover:bg-[#202020]"
            >
              For Contractors
              <ChevronRight className="h-4 w-4 text-zinc-500" />
            </Link>
          </nav>

          <div className="pt-2 border-t border-[#222222] flex flex-col gap-2.5">
            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" fullWidth size="lg" className="border-[#D4AF37] text-[#D4AF37]">
                Hire Workers (Customer)
              </Button>
            </Link>
            <Link href="/register?role=WORKER" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" fullWidth size="lg" className="bg-[#D4AF37] hover:bg-[#C5A028] text-black font-bold" leftIcon={<HardHat className="h-4 w-4" />}>
                Join as Worker / Contractor
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
