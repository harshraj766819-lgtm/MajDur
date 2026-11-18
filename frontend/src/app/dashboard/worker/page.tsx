"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  HardHat, 
  Briefcase, 
  Star, 
  IndianRupee, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Loader2, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Layers,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight,
  Check,
  X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  fetchWorkerDashboard, 
  updateWorkerAvailability, 
  updateWorkerWorkStatus,
  WorkerDashboardData 
} from "@/lib/api";

export default function WorkerDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [data, setData] = React.useState<WorkerDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [updatingAvailability, setUpdatingAvailability] = React.useState(false);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const loadDashboard = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load worker dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadDashboard();
      }
    }
  }, [user, authLoading, router, loadDashboard]);

  const handleToggleAvailability = async () => {
    if (!data) return;
    try {
      setUpdatingAvailability(true);
      const newStatus = !data.stats.isAvailable;
      await updateWorkerAvailability(newStatus);
      setData((prev) => prev ? {
        ...prev,
        stats: { ...prev.stats, isAvailable: newStatus },
        profile: { ...prev.profile, isAvailable: newStatus }
      } : null);
    } catch (err: any) {
      alert(err.message || "Failed to toggle availability");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, status: "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED") => {
    try {
      setActionLoadingId(bookingId);
      await updateWorkerWorkStatus(bookingId, { status });
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Failed to update booking status");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Worker Portal & Work Queue...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="text-zinc-400 text-sm mb-6 text-center max-w-md">{error}</p>
        <Button onClick={loadDashboard} variant="default">Try Again</Button>
      </div>
    );
  }

  const { user: workerUser, profile, stats, recentBookings, matchingJobs, recentNotifications } = data;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Worker Header Card */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 h-48 w-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-[#D4AF37]/20">
                <HardHat className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    {workerUser.name}
                  </h1>
                  {stats.isVerified ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Verified Worker
                    </span>
                  ) : (
                    <Link href="/dashboard/worker/verification" className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-colors">
                      KYC Verification Needed
                    </Link>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1 font-semibold text-[#D4AF37]">
                    <Layers className="h-3.5 w-3.5" />
                    {profile.category || "General Worker"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                    +91 {workerUser.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                    {profile.locationCity}, India
                  </span>
                  <span className="flex items-center gap-1 text-zinc-300 font-medium">
                    <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
                    {profile.experienceYears || 1} Years Exp.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Availability Status Toggle */}
              <button
                type="button"
                disabled={updatingAvailability}
                onClick={handleToggleAvailability}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
                  stats.isAvailable
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                }`}
              >
                {updatingAvailability ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <span className={`h-2.5 w-2.5 rounded-full ${stats.isAvailable ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                )}
                {stats.isAvailable ? "Available for Work" : "Temporarily Offline"}
              </button>

              <Link href="/dashboard/worker/onboarding">
                <Button variant="outline" size="sm" className="border-[#333] hover:border-[#D4AF37] text-xs">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-[#D4AF37]" />
                  Onboarding Wizard
                </Button>
              </Link>

              <Link href="/dashboard/worker/profile">
                <Button variant="default" size="sm" className="text-xs">
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-[#141414] border-[#222]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Earnings</p>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-white mt-2">
                ₹{stats.totalEarnings.toLocaleString("en-IN")}
              </p>
              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Pending: ₹{stats.pendingEarnings.toLocaleString("en-IN")}</span>
                <Link href="/dashboard/worker/earnings" className="text-[#D4AF37] hover:underline">
                  Ledger →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#222]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Work</p>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-white mt-2">{stats.activeWorkCount}</p>
              <p className="text-[11px] text-zinc-400 mt-2">Ongoing on-site jobs</p>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#222]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">New Requests</p>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-amber-400 mt-2">{stats.pendingRequestsCount}</p>
              <p className="text-[11px] text-zinc-400 mt-2">Awaiting your response</p>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#222]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Completed Jobs</p>
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-white mt-2">{stats.completedWorkCount}</p>
              <p className="text-[11px] text-zinc-400 mt-2">Verified completed work</p>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#222]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Customer Rating</p>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-[#D4AF37] flex items-center justify-center">
                  <Star className="h-4 w-4 fill-[#D4AF37]" />
                </div>
              </div>
              <p className="text-2xl font-black text-[#D4AF37] mt-2">
                {stats.rating > 0 ? stats.rating.toFixed(1) : "New"}
              </p>
              <p className="text-[11px] text-zinc-400 mt-2">{stats.totalReviews} genuine reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Navigation Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <Link href="/dashboard/worker/skills" className="p-3 bg-[#141414] hover:bg-[#1a1a1a] border border-[#222] rounded-xl flex items-center gap-2.5 transition-colors group">
            <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37] group-hover:scale-110 transition-transform">
              <HardHat className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Skills Matrix</p>
              <p className="text-[10px] text-zinc-400">Manage trades</p>
            </div>
          </Link>

          <Link href="/dashboard/worker/rates" className="p-3 bg-[#141414] hover:bg-[#1a1a1a] border border-[#222] rounded-xl flex items-center gap-2.5 transition-colors group">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <IndianRupee className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Daily Rates</p>
              <p className="text-[10px] text-zinc-400">₹{profile.dailyRate || 800} / day</p>
            </div>
          </Link>

          <Link href="/dashboard/worker/service-areas" className="p-3 bg-[#141414] hover:bg-[#1a1a1a] border border-[#222] rounded-xl flex items-center gap-2.5 transition-colors group">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Service Radius</p>
              <p className="text-[10px] text-zinc-400">{profile.serviceRadiusKm || 25} km range</p>
            </div>
          </Link>

          <Link href="/dashboard/worker/jobs" className="p-3 bg-[#141414] hover:bg-[#1a1a1a] border border-[#222] rounded-xl flex items-center gap-2.5 transition-colors group">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Briefcase className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Find Jobs</p>
              <p className="text-[10px] text-zinc-400">Open proposals</p>
            </div>
          </Link>

          <Link href="/dashboard/worker/applications" className="p-3 bg-[#141414] hover:bg-[#1a1a1a] border border-[#222] rounded-xl flex items-center gap-2.5 transition-colors group">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Applications</p>
              <p className="text-[10px] text-zinc-400">{stats.totalApplicationsCount} bids placed</p>
            </div>
          </Link>

          <Link href="/dashboard/worker/earnings" className="p-3 bg-[#141414] hover:bg-[#1a1a1a] border border-[#222] rounded-xl flex items-center gap-2.5 transition-colors group">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Statement</p>
              <p className="text-[10px] text-zinc-400">Download PDF</p>
            </div>
          </Link>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Recent Bookings & Assignments */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Work Assignments</h2>
                <p className="text-xs text-zinc-400">Direct booking requests from customers and contractors</p>
              </div>
              <Link href="/dashboard/worker/bookings" className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold">
                View All Work ({recentBookings.length}) →
              </Link>
            </div>

            {recentBookings.length === 0 ? (
              <div className="bg-[#141414] border border-[#222] rounded-xl p-8 text-center">
                <Briefcase className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="font-bold text-white text-sm">No Booking Requests Yet</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Keep your availability toggled on and explore open jobs in the marketplace to get hired quickly.
                </p>
                <Link href="/dashboard/worker/jobs" className="inline-block mt-4">
                  <Button size="sm">Explore Open Jobs</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentBookings.map((b) => (
                  <div key={b.id} className="bg-[#141414] border border-[#222] hover:border-[#333] rounded-xl p-4 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#D4AF37]">{b.bookingNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === "REQUESTED" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                            b.status === "ACCEPTED" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                            b.status === "IN_PROGRESS" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                            b.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                            "bg-zinc-800 text-zinc-400"
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1">{b.serviceCategory}</h4>
                        <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-zinc-500" />
                          {b.address}, {b.city}
                        </p>
                      </div>

                      <div className="text-right sm:self-center flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                        <span className="text-base font-black text-white">₹{b.totalAmount}</span>
                        <span className="text-[11px] text-zinc-400">{b.totalDays} Days ({b.dailyRate}/day)</span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-[#222] flex items-center justify-between">
                      <div className="text-xs text-zinc-400">
                        Customer: <span className="text-white font-medium">{b.customer?.name}</span>
                        {b.customer?.phone && <span className="ml-2 text-zinc-500">+91 {b.customer.phone}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        {b.status === "REQUESTED" && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                              disabled={actionLoadingId === b.id}
                              onClick={() => handleStatusUpdate(b.id, "REJECTED")}
                            >
                              <X className="h-3.5 w-3.5 mr-1" /> Decline
                            </Button>
                            <Button 
                              size="sm" 
                              variant="default" 
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                              disabled={actionLoadingId === b.id}
                              onClick={() => handleStatusUpdate(b.id, "ACCEPTED")}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Accept Work
                            </Button>
                          </>
                        )}

                        {b.status === "ACCEPTED" && (
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white"
                            disabled={actionLoadingId === b.id}
                            onClick={() => handleStatusUpdate(b.id, "IN_PROGRESS")}
                          >
                            Start Work (In Progress)
                          </Button>
                        )}

                        {b.status === "IN_PROGRESS" && (
                          <Button 
                            size="sm" 
                            variant="default" 
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                            disabled={actionLoadingId === b.id}
                            onClick={() => handleStatusUpdate(b.id, "COMPLETED")}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark as Completed
                          </Button>
                        )}

                        <Link href="/dashboard/worker/bookings">
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-zinc-400 hover:text-white">
                            Details →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Matching Marketplace Jobs */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Recommended Open Jobs</h3>
                  <p className="text-xs text-zinc-400">Jobs matching your trade category in {profile.locationCity}</p>
                </div>
                <Link href="/dashboard/worker/jobs" className="text-xs text-[#D4AF37] hover:underline font-semibold">
                  Browse All Jobs →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {matchingJobs.length === 0 ? (
                  <p className="text-xs text-zinc-500 col-span-2">No matching open jobs found at this moment.</p>
                ) : (
                  matchingJobs.map((j) => (
                    <div key={j.id} className="bg-[#141414] border border-[#222] rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span className="font-semibold text-[#D4AF37]">{j.categoryName}</span>
                          <span>{j.city}</span>
                        </div>
                        <h4 className="font-bold text-white text-sm mt-1 line-clamp-1">{j.title}</h4>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{j.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#222] flex items-center justify-between">
                        <div>
                          <span className="text-xs text-zinc-500">Budget:</span>
                          <span className="ml-1 text-sm font-bold text-white">₹{j.budget}</span>
                        </div>
                        <Link href={`/dashboard/worker/jobs`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-[#333] hover:border-[#D4AF37]">
                            Apply Now
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Feeds & Actions */}
          <div className="space-y-6">
            
            {/* Quick Profile Summary Card */}
            <Card className="bg-[#141414] border-[#222]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Professional Setup</span>
                  <Link href="/dashboard/worker/profile" className="text-xs text-[#D4AF37] hover:underline font-normal">
                    Edit
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#222]">
                  <span className="text-zinc-400">Primary Trade</span>
                  <span className="text-white font-semibold">{profile.category}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#222]">
                  <span className="text-zinc-400">Daily Service Rate</span>
                  <span className="text-emerald-400 font-bold">₹{profile.dailyRate || 800} / day</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#222]">
                  <span className="text-zinc-400">Hourly Rate</span>
                  <span className="text-white font-semibold">₹{profile.hourlyRate || 100} / hr</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#222]">
                  <span className="text-zinc-400">Service Coverage</span>
                  <span className="text-white font-semibold">{profile.serviceRadiusKm} km around {profile.locationCity}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-400">KYC Status</span>
                  <span className={stats.isVerified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {stats.isVerified ? "Approved (Aadhaar Verified)" : "Pending Review"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Notifications Feed */}
            <Card className="bg-[#141414] border-[#222]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white flex items-center justify-between">
                  <span>Recent Notifications</span>
                  <Link href="/dashboard/worker/notifications" className="text-xs text-[#D4AF37] hover:underline font-normal">
                    View All
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentNotifications.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-3 text-center">No notifications yet.</p>
                ) : (
                  <div className="space-y-3">
                    {recentNotifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-lg bg-[#1a1a1a] border border-[#272727] text-xs">
                        <p className="font-bold text-white">{n.title}</p>
                        <p className="text-zinc-400 text-[11px] mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-zinc-500 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}
