"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Hammer, 
  Search, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  Bookmark, 
  ShieldCheck, 
  AlertCircle,
  LogOut,
  User,
  HardHat,
  ChevronRight,
  Phone,
  Mail,
  Loader2,
  Calendar,
  IndianRupee,
  MapPin,
  Bell,
  FileText,
  Star,
  Settings,
  XCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  fetchCustomerDashboard, 
  CustomerDashboardData, 
  Booking, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from "@/lib/api";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [dashboardData, setDashboardData] = React.useState<CustomerDashboardData | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/customer");
      } else if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router]);

  const loadDashboard = React.useCallback(async () => {
    try {
      setDataLoading(true);
      setFetchError(null);
      const data = await fetchCustomerDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setFetchError(err.message || "Failed to load dashboard metrics");
    } finally {
      setDataLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user && (user.role === "CUSTOMER" || user.role === "ADMIN")) {
      loadDashboard();
    }
  }, [user, loadDashboard]);

  const handleMarkNotification = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      loadDashboard();
    } catch (err) {
      console.error("Error marking notification:", err);
    }
  };

  const handleMarkAllNotifications = async () => {
    try {
      await markAllNotificationsAsRead();
      loadDashboard();
    } catch (err) {
      console.error("Error marking all notifications:", err);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Verifying Customer Session...</p>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalBookings: 0,
    pendingBookings: 0,
    acceptedBookings: 0,
    inProgressBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalSpent: 0,
  };

  const recentBookings = dashboardData?.recentBookings || [];
  const notifications = dashboardData?.recentNotifications || [];

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "REQUESTED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING APPROVAL</span>;
      case "ACCEPTED":
      case "CONFIRMED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">ACCEPTED</span>;
      case "IN_PROGRESS":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">WORK IN PROGRESS</span>;
      case "COMPLETED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">COMPLETED</span>;
      case "CANCELLED":
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">CANCELLED</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 h-40 w-40 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-[#D4AF37]/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Welcome, {dashboardData?.profile?.name || user.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30">
                    Customer Account
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                    +91 {user.phone}
                  </span>
                  {user.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-zinc-500" />
                      {user.email}
                    </span>
                  )}
                  {user.isPhoneVerified && (
                    <span className="flex items-center gap-1 text-emerald-400 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                  {dashboardData?.profile?.customerProfile?.city && (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                      {dashboardData.profile.customerProfile.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/workers">
                <Button
                  variant="primary"
                  size="md"
                  className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold shadow-md shadow-[#D4AF37]/20"
                  leftIcon={<Search className="h-4 w-4" />}
                >
                  Hire Workers
                </Button>
              </Link>
              <Link href="/dashboard/customer/profile">
                <Button
                  variant="outline"
                  size="md"
                  className="border-[#333333] text-zinc-300 hover:text-white hover:bg-[#222222]"
                  leftIcon={<Settings className="h-4 w-4" />}
                >
                  Edit Profile
                </Button>
              </Link>
              <Button
                onClick={logout}
                variant="ghost"
                size="md"
                className="text-zinc-400 hover:text-white hover:bg-[#222222]"
                leftIcon={<LogOut className="h-4 w-4" />}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {/* Real Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#141414] border border-[#272727] rounded-xl p-5 hover:border-[#383838] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Bookings</span>
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {dataLoading ? "..." : stats.totalBookings}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">All service contracts</p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-xl p-5 hover:border-[#383838] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending Approval</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {dataLoading ? "..." : stats.pendingBookings}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Awaiting worker response</p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-xl p-5 hover:border-[#383838] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active / In Progress</span>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                <HardHat className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {dataLoading ? "..." : stats.acceptedBookings}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Underway on site</p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-xl p-5 hover:border-[#383838] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Completed Hires</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              {dataLoading ? "..." : stats.completedBookings}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Verified work completed</p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-xl p-5 hover:border-[#383838] transition-colors">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Spent</span>
              <div className="p-2 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              ₹{dataLoading ? "..." : stats.totalSpent.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">Direct wages paid</p>
          </div>
        </div>

        {/* Quick Portal Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#242424] pb-3 text-xs font-bold">
          <Link href="/dashboard/customer" className="px-3.5 py-2 rounded-lg bg-[#1f1f1f] text-white">
            Overview
          </Link>
          <Link href="/dashboard/customer/bookings" className="px-3.5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors">
            My Bookings ({stats.totalBookings})
          </Link>
          <Link href="/dashboard/customer/invoices" className="px-3.5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors">
            Tax Invoices &amp; Receipts
          </Link>
          <Link href="/dashboard/customer/reviews" className="px-3.5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors">
            Artisan Reviews
          </Link>
          <Link href="/dashboard/customer/profile" className="px-3.5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors">
            Profile &amp; Addresses
          </Link>
          <Link href="/dashboard/customer/notifications" className="px-3.5 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-[#1a1a1a] transition-colors flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </Link>
        </div>

        {/* Main 2-Column Section: Recent Bookings & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Bookings Feed (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Recent Service Requests</h2>
                  <p className="text-xs text-zinc-400">Live status of your booked skilled artisans and labour</p>
                </div>
                <Link
                  href="/dashboard/customer/bookings"
                  className="text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
                >
                  View All ({stats.totalBookings})
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {recentBookings.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-xl border border-dashed border-[#2b2b2b] bg-[#111111]">
                  <div className="mx-auto h-12 w-12 rounded-full bg-[#1c1c1c] text-zinc-500 flex items-center justify-center mb-3">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">No Booking Requests Placed Yet</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    Browse verified electricians, plumbers, masons, painters, and carpenters in your city to request services.
                  </p>
                  <div className="mt-4">
                    <Link href="/workers">
                      <Button variant="primary" size="sm" className="bg-[#D4AF37] text-black font-bold">
                        Search 32 Trade Categories
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl bg-[#181818] border border-[#262626] hover:border-[#383838] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-[#242424] text-[#D4AF37] flex items-center justify-center font-bold text-base shrink-0">
                          {b.worker?.name?.charAt(0) || "W"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{b.worker?.name || "Artisan"}</span>
                            {getStatusBadge(b.status)}
                          </div>
                          <div className="text-xs text-zinc-400 mt-0.5">
                            <span className="font-medium text-zinc-300">{b.serviceCategory}</span> • {b.city}
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                            Ref: {b.bookingNumber} • {new Date(b.startDate).toLocaleDateString("en-IN")} • {b.totalDays} day(s)
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#242424]">
                        <div className="text-sm font-black text-white">
                          ₹{b.totalAmount.toLocaleString("en-IN")}
                        </div>
                        <Link href={`/dashboard/customer/bookings/${b.id}`}>
                          <Button variant="outline" size="sm" className="border-[#383838] text-xs hover:border-[#D4AF37]">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Banner to Find Workers */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#1c1808] to-[#121212] border border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Need skilled labour on your site tomorrow?</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Discover verified masons, electricians, carpenters and painters with transparent daily wage rates.
                </p>
              </div>
              <Link href="/workers">
                <Button variant="primary" size="md" className="bg-[#D4AF37] text-black font-bold shrink-0">
                  Find Workers Now
                </Button>
              </Link>
            </div>
          </div>

          {/* Sidebar Notifications & Shortcuts (1 Col) */}
          <div className="space-y-6">
            
            {/* Notifications Feed */}
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#D4AF37]" />
                  <h2 className="text-base font-bold text-white">Notifications</h2>
                </div>
                {notifications.some((n) => !n.isRead) && (
                  <button
                    onClick={handleMarkAllNotifications}
                    className="text-[11px] font-semibold text-[#D4AF37] hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="text-xs text-zinc-500 py-6 text-center">No notifications right now.</p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkNotification(n.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                        n.isRead
                          ? "bg-[#181818] border-[#242424] text-zinc-400"
                          : "bg-[#201d14] border-[#D4AF37]/30 text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{n.title}</span>
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-[#D4AF37]" />}
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-zinc-500 mt-1 block">
                        {new Date(n.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 text-center">
                    <Link
                      href="/dashboard/customer/notifications"
                      className="text-xs font-semibold text-[#D4AF37] hover:underline"
                    >
                      View All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Card */}
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6">
              <h2 className="text-base font-bold text-white mb-4">Account Shortcuts</h2>
              <div className="space-y-2">
                <Link
                  href="/dashboard/customer/bookings"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#191919] hover:bg-[#222222] border border-[#292929] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Track Booking History</div>
                      <div className="text-[11px] text-zinc-400">View progress and past hires</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </Link>

                <Link
                  href="/dashboard/customer/invoices"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#191919] hover:bg-[#222222] border border-[#292929] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Download Tax Invoices</div>
                      <div className="text-[11px] text-zinc-400">Verified PDF receipts</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </Link>

                <Link
                  href="/dashboard/customer/reviews"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#191919] hover:bg-[#222222] border border-[#292929] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Star className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Rate Completed Hires</div>
                      <div className="text-[11px] text-zinc-400">Review genuine workmanship</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </Link>

                <Link
                  href="/dashboard/customer/profile"
                  className="flex items-center justify-between p-3 rounded-xl bg-[#191919] hover:bg-[#222222] border border-[#292929] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Manage Service Sites</div>
                      <div className="text-[11px] text-zinc-400">Saved home &amp; site addresses</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-500" />
                </Link>
              </div>
            </div>

            {/* Safety Guarantee */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#1a1708] to-[#121212] border border-[#D4AF37]/30 text-xs">
              <div className="flex items-center gap-2 text-[#D4AF37] font-bold mb-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Customer Protection Guarantee</span>
              </div>
              <p className="text-zinc-400 leading-relaxed">
                All bookings are backed by genuine artisan rate cards, zero hidden contractor commissions, and 100% digital payment receipts.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
