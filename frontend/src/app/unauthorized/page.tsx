"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Hammer, 
  ShieldAlert, 
  ArrowLeft, 
  Home, 
  LayoutDashboard, 
  LogOut,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function UnauthorizedPage() {
  const router = useRouter();
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

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="flex justify-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-300 text-black shadow-md shadow-[#D4AF37]/20 group-hover:scale-105 transition-transform duration-200">
            <Hammer className="h-6 w-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-white">
                Maj<span className="text-[#D4AF37]">Dur</span>
              </span>
              <span className="rounded-md bg-[#222222] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] border border-[#333333]">
                India
              </span>
            </div>
            <p className="text-[11px] font-medium text-zinc-400">
              Find Work. Hire Workers. Build Your Future.
            </p>
          </div>
        </Link>
      </div>

      {/* Main 403 Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg my-8">
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm relative overflow-hidden text-center">
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-red-500/10 blur-2xl pointer-events-none" />

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 mb-6">
            <ShieldAlert className="h-10 w-10" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 mb-3">
            403 — Access Forbidden
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">
            Role Permission Required
          </h1>

          <p className="mt-3 text-sm text-zinc-400 leading-relaxed max-w-md mx-auto">
            You do not have the required role privileges to access this protected area.
            {user && (
              <span className="block mt-2 font-medium text-zinc-300">
                You are currently signed in as a{" "}
                <span className="text-[#D4AF37] font-bold">{user.role}</span>.
              </span>
            )}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <>
                <Link href={getDashboardPath()}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold"
                    leftIcon={<LayoutDashboard className="h-4 w-4" />}
                  >
                    Go to Your Dashboard
                  </Button>
                </Link>

                <Button
                  onClick={async () => {
                    await logout();
                    router.push("/login");
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-[#333333] text-zinc-300 hover:text-white hover:bg-[#222222]"
                  leftIcon={<LogOut className="h-4 w-4" />}
                >
                  Switch Account
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold"
                  leftIcon={<UserCheck className="h-4 w-4" />}
                >
                  Sign In with Proper Credentials
                </Button>
              </Link>
            )}

            <Link href="/">
              <Button
                variant="ghost"
                size="lg"
                className="w-full sm:w-auto text-zinc-400 hover:text-white hover:bg-[#1a1a1a]"
                leftIcon={<Home className="h-4 w-4" />}
              >
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="text-center text-xs text-zinc-600">
        MajDur Platform • Developed by Harsh Singh • All rights reserved
      </div>
    </div>
  );
}

