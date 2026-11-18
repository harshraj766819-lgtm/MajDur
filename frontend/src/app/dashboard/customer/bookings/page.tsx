"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Hammer, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  FileText, 
  Star, 
  HardHat, 
  Search 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { fetchCustomerBookings, cancelBookingRequest, Booking } from "@/lib/api";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";

const STATUS_TABS = [
  { id: "ALL", label: "All Bookings" },
  { id: "REQUESTED", label: "Pending" },
  { id: "ACCEPTED", label: "Accepted" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "COMPLETED", label: "Completed" },
  { id: "CANCELLED", label: "Cancelled" },
];

export default function CustomerBookingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [activeTab, setActiveTab] = React.useState("ALL");
  const [dataLoading, setDataLoading] = React.useState(true);
  const [cancellingId, setCancellingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/customer/bookings");
      } else if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router]);

  const loadBookings = React.useCallback(async () => {
    try {
      setDataLoading(true);
      const res = await fetchCustomerBookings({
        status: activeTab,
        limit: 50,
      });
      setBookings(res.bookings || []);
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setDataLoading(false);
    }
  }, [activeTab]);

  React.useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, loadBookings]);

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this booking request?")) return;
    try {
      setCancellingId(id);
      await cancelBookingRequest(id, "Cancelled by customer");
      loadBookings();
    } catch (err: any) {
      alert(err.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status: Booking["status"]) => {
    switch (status) {
      case "REQUESTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING</span>;
      case "ACCEPTED":
      case "CONFIRMED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">ACCEPTED</span>;
      case "IN_PROGRESS":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">IN PROGRESS</span>;
      case "COMPLETED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">COMPLETED</span>;
      case "CANCELLED":
      case "REJECTED":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs">Loading customer bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Link href="/workers">
            <Button variant="primary" size="sm" className="bg-[#D4AF37] text-black font-bold text-xs" leftIcon={<Search className="h-3.5 w-3.5" />}>
              Find More Workers
            </Button>
          </Link>
        </div>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">My Service Bookings</h1>
          <p className="text-xs text-zinc-400 mt-1">Track scheduled work contracts, job progress, invoices, and ratings</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#242424] pb-3 text-xs font-bold">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-[#D4AF37] text-black font-extrabold"
                  : "text-zinc-400 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {dataLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            <p className="text-xs">Loading booking records...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-[#2b2b2b] bg-[#111111]">
            <Calendar className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-white">No Bookings Found</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              There are no bookings matching the selected status filter.
            </p>
            <div className="mt-4">
              <Link href="/workers">
                <Button variant="primary" size="sm" className="bg-[#D4AF37] text-black font-bold">
                  Explore Verified Workers
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-[#141414] border border-[#272727] rounded-2xl p-5 sm:p-6 hover:border-[#383838] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#1e1e1e] text-[#D4AF37] flex items-center justify-center font-bold text-xl shrink-0">
                    {b.worker?.name?.charAt(0) || "W"}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-base text-white">{b.worker?.name}</span>
                      {getStatusBadge(b.status)}
                      {b.paymentStatus && b.paymentStatus !== "UNPAID" && (
                        <PaymentStatusBadge status={b.paymentStatus} />
                      )}
                    </div>
                    <p className="text-xs text-[#D4AF37] font-semibold">{b.serviceCategory} • {b.city}</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Site: <span className="text-zinc-300">{b.address}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 mt-1.5 font-mono">
                      <span>Ref: {b.bookingNumber}</span>
                      <span>•</span>
                      <span>Scheduled: {new Date(b.startDate).toLocaleDateString("en-IN")}</span>
                      <span>•</span>
                      <span>Duration: {b.totalDays} day(s)</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#222222]">
                  <div className="text-left lg:text-right pr-2">
                    <span className="text-lg font-black text-white">₹{b.totalAmount.toLocaleString("en-IN")}</span>
                    <span className="text-[10px] text-zinc-500 block">Total Agreed Wage</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/customer/bookings/${b.id}`}>
                      <Button variant="outline" size="sm" className="border-[#383838] text-xs hover:border-[#D4AF37]">
                        View Details
                      </Button>
                    </Link>

                    {["REQUESTED", "ACCEPTED", "CONFIRMED"].includes(b.status) && (
                      <Button
                        onClick={() => handleCancel(b.id)}
                        disabled={cancellingId === b.id}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 text-xs"
                      >
                        {cancellingId === b.id ? "Cancelling..." : "Cancel"}
                      </Button>
                    )}

                    {b.status === "COMPLETED" && (
                      <Link href={`/dashboard/customer/bookings/${b.id}`}>
                        <Button variant="primary" size="sm" className="bg-[#D4AF37] text-black font-bold text-xs" leftIcon={<Star className="h-3.5 w-3.5" />}>
                          Review
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

