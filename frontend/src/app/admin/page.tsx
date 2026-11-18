"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Hammer, 
  ShieldAlert, 
  Users, 
  HardHat, 
  Building2, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Loader2, 
  Lock, 
  KeyRound, 
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  Search
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { fetchPlatformStats, PlatformStats } from "@/lib/api";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [stats, setStats] = React.useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = React.useState(true);
  const [rbacTestResult, setRbacTestResult] = React.useState<string | null>(null);
  const [testingRbac, setTestingRbac] = React.useState(false);

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/admin");
      } else if (user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    async function loadStats() {
      try {
        setStatsLoading(true);
        const data = await fetchPlatformStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setStatsLoading(false);
      }
    }
    if (user && user.role === "ADMIN") {
      loadStats();
    }
  }, [user]);

  const handleTestRbac = async () => {
    try {
      setTestingRbac(true);
      setRbacTestResult(null);
      const res = await fetch("http://localhost:5000/api/admin/test-rbac", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setRbacTestResult(`RBAC 200 OK: ${data.message} (Role: ${data.authenticatedUser?.role})`);
      } else {
        setRbacTestResult(`RBAC Error ${res.status}: ${data.message}`);
      }
    } catch (err: any) {
      setRbacTestResult(`RBAC Network Error: ${err.message}`);
    } finally {
      setTestingRbac(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Validating Admin Credentials &amp; Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Admin Header */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 h-40 w-40 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-red-500 text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/20">
                <Lock className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    MajDur Admin Console
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    SUPER ADMIN ACCESS
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span>Authorized Administrator: <strong className="text-zinc-200">{user.name}</strong></span>
                  <span>•</span>
                  <span>Phone: +91 {user.phone}</span>
                  {user.email && (
                    <>
                      <span>•</span>
                      <span>Email: {user.email}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="http://localhost:5000/api/health"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#1a1a1a] text-zinc-300 border border-[#2f2f2f] hover:border-[#D4AF37] transition-colors"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Backend Status (MongoDB Atlas)
              </a>

              <Button
                onClick={logout}
                variant="outline"
                size="md"
                className="border-[#333333] text-zinc-300 hover:text-white hover:bg-[#222222]"
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Platform Core Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#141414] border border-[#272727] rounded-xl p-5 hover:border-[#383838] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Registered Workers</span>
              <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                <HardHat className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {statsLoading ? "..." : stats?.registeredWorkers ?? 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Live MongoDB worker records</p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-xl p-5 hover:border-[#383838] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Contractors</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <Building2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {statsLoading ? "..." : stats?.activeContractors ?? 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Verified company entities</p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-xl p-5 hover:border-[#383838] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Categories</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {statsLoading ? "..." : stats?.totalCategories ?? 32}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">32 exact trade classifications</p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-xl p-5 hover:border-[#383838] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed Jobs</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {statsLoading ? "..." : stats?.completedJobs ?? 0}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Audited marketplace transactions</p>
          </div>
        </div>

        {/* Security & RBAC Verification Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Role-Based Access Control (RBAC) Diagnostics</h2>
                  <p className="text-xs text-zinc-400">Execute verified authentication handshake with backend endpoint /api/admin/test-rbac</p>
                </div>
                <Button
                  onClick={handleTestRbac}
                  disabled={testingRbac}
                  size="sm"
                  variant="primary"
                  className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold text-xs"
                  leftIcon={testingRbac ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                >
                  Test RBAC Authorization
                </Button>
              </div>

              {rbacTestResult && (
                <div className={`p-4 rounded-xl text-xs font-mono border ${
                  rbacTestResult.startsWith("RBAC 200") 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                  {rbacTestResult}
                </div>
              )}

              <div className="mt-6 border-t border-[#222222] pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Registered Security Policies
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#191919] border border-[#292929]">
                    <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      JWT Access Tokens
                    </div>
                    <p className="text-zinc-400 text-[11px]">15-minute validity signed with HMAC-SHA256.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#191919] border border-[#292929]">
                    <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Rotating Refresh Tokens
                    </div>
                    <p className="text-zinc-400 text-[11px]">7-day sessions stored with SHA-256 hash in MongoDB.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#191919] border border-[#292929]">
                    <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      OTP Anti-Abuse
                    </div>
                    <p className="text-zinc-400 text-[11px]">60-second cooldown + 5 attempts max with SHA-256 hash.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#191919] border border-[#292929]">
                    <div className="font-semibold text-white flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                      Argon2 / Bcrypt Hashing
                    </div>
                    <p className="text-zinc-400 text-[11px]">Salt factor 12. Password hashes never returned in API.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Management Links */}
          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">Administration Links</h2>
              <div className="space-y-2">
                <Link
                  href="/categories"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#191919] hover:bg-[#222222] border border-[#292929] transition-colors"
                >
                  <div className="text-xs font-bold text-white">Manage 32 Categories</div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </Link>

                <Link
                  href="/workers"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#191919] hover:bg-[#222222] border border-[#292929] transition-colors"
                >
                  <div className="text-xs font-bold text-white">Worker Verification Queue</div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </Link>

                <Link
                  href="/design-system"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#191919] hover:bg-[#222222] border border-[#292929] transition-colors"
                >
                  <div className="text-xs font-bold text-white">Design System &amp; Tokens</div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </Link>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#191919] border border-[#2d2d2d] text-xs">
              <h3 className="font-bold text-white mb-1.5">Developer Attribution</h3>
              <p className="text-zinc-400 leading-relaxed">
                Platform developed by <strong className="text-zinc-200">Harsh Singh</strong> for the Indian labour marketplace. All modules are secured with enterprise-grade authorization controls.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

