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
  ShieldCheck,
  Bell,
  Sparkles,
  LayoutDashboard,
  LogOut,
  User,
  Building2,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { user, logout } = useAuth();

  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "CUSTOMER":
        return "/dashboard/customer";
      case "WORKER":
        return "/dashboard/worker";
      case "CONTRACTOR":
        return "/dashboard/contractor";
      case "ADMIN":
        return "/admin";
      default:
        return "/";
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case "WORKER":
        return <HardHat className="h-3.5 w-3.5 text-[#D4AF37]" />;
      case "CONTRACTOR":
        return <Building2 className="h-3.5 w-3.5 text-blue-400" />;
      case "ADMIN":
        return <Lock className="h-3.5 w-3.5 text-red-400" />;
      default:
        return <User className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

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
            <Link
              href="/design-system"
              className="rounded-lg px-3.5 py-2 hover:bg-[#1c1c1c] hover:text-white transition-colors flex items-center gap-1.5 text-[#D4AF37]"
            >
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              UI Components
            </Link>
          </nav>
        </div>

        {/* Right Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="http://localhost:5000/api/health"
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#181818] text-zinc-300 border border-[#2a2a2a] hover:border-[#D4AF37] transition-colors"
            title="Backend API & MongoDB status"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            API Status
          </Link>

          {/* Theme Toggle */}
          <ThemeToggle />

          {user ? (
            /* Logged-in State */
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#272727]">
              <NotificationBell />

              <Link
                href={getDashboardPath()}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1c1c1c] border border-[#2d2d2d] hover:border-[#D4AF37] transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#272727] text-white font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white max-w-[120px] truncate">
                    {user.name}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-400 capitalize">
                    {getRoleIcon()}
                    <span>{user.role.toLowerCase()}</span>
                  </div>
                </div>
              </Link>

              <Link href={getDashboardPath()}>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold"
                  leftIcon={<LayoutDashboard className="h-3.5 w-3.5" />}
                >
                  Dashboard
                </Button>
              </Link>

              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white hover:bg-[#1f1f1f]"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            /* Logged-out State */
            <>
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
            </>
          )}
        </div>

        {/* Mobile Hamburger & Theme Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link href={getDashboardPath()}>
              <Button variant="primary" size="sm" className="bg-[#D4AF37] text-black font-bold text-xs">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-zinc-200">
                Sign In
              </Button>
            </Link>
          )}
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
          {user && (
            <div className="p-3 rounded-xl bg-[#1c1c1c] border border-[#2c2c2c] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D4AF37] text-black font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{user.name}</div>
                  <div className="text-xs text-[#D4AF37] capitalize font-medium">{user.role.toLowerCase()}</div>
                </div>
              </div>
              <Button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                variant="ghost"
                size="sm"
                className="text-zinc-400 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}

          <nav className="flex flex-col space-y-1">
            {user && (
              <Link
                href={getDashboardPath()}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-[#D4AF37] hover:bg-[#202020]"
              >
                My Dashboard
                <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
              </Link>
            )}
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
              href="/how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-zinc-200 hover:bg-[#202020]"
            >
              How It Works
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
            <Link
              href="/design-system"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-semibold text-[#D4AF37] hover:bg-[#202020]"
            >
              UI Components &amp; Tokens
              <ChevronRight className="h-4 w-4 text-[#D4AF37]" />
            </Link>
          </nav>

          {!user && (
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
          )}
        </div>
      )}
    </header>
  );
}
