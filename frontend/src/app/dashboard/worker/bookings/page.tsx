"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CalendarCheck2, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  X, 
  Check, 
  IndianRupee, 
  Loader2, 
  AlertCircle,
  FileText,
  Star,
  Layers,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { fetchWorkerWork, updateWorkerWorkStatus, createOrGetConversation, Booking } from "@/lib/api";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";

export default function WorkerBookingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [selectedTab, setSelectedTab] = React.useState<string>("ALL");
  const [loading, setLoading] = React.useState(true);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Completion Modal
  const [completingBooking, setCompletingBooking] = React.useState<Booking | null>(null);
  const [completionNotes, setCompletionNotes] = React.useState("");

  const loadWork = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerWork(selectedTab);
      setBookings(res);
    } catch (err: any) {
      setError(err.message || "Failed to load work bookings");
    } finally {
      setLoading(false);
    }
  }, [selectedTab]);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/bookings");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadWork();
      }
    }
  }, [user, authLoading, router, loadWork]);

  const handleUpdateStatus = async (
    bookingId: string, 
    status: "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED", 
    notes?: string
  ) => {
    try {
      setActionLoadingId(bookingId);
      setError(null);
      await updateWorkerWorkStatus(bookingId, { status, completionNotes: notes });
      setSuccess(`Work status updated to ${status}!`);
      setCompletingBooking(null);
      setCompletionNotes("");
      await loadWork();
    } catch (err: any) {
      setError(err.message || "Failed to update work status");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartChat = async (bookingId: string) => {
    try {
      const convo = await createOrGetConversation({ bookingId });
      if (convo?.id) {
        router.push(`/dashboard/messages/${convo.id}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to start chat with customer");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Work Assignments Queue...</p>
      </div>
    );
  }

  const tabs = ["ALL", "REQUESTED", "ACCEPTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
              <span>/</span>
              <span className="text-white">Work Assignments</span>
            </div>
            <h1 className="text-2xl font-black text-white">Direct Booking Contracts</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Manage client booking requests, track active site work, and record job completion.
            </p>
          </div>

          <Link href="/dashboard/worker/earnings">
            <Button variant="outline" size="sm" className="border-[#333] hover:border-emerald-500 text-xs">
              <FileText className="h-4 w-4 mr-1.5 text-emerald-400" /> View Earnings Ledger
            </Button>
          </Link>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}
        {success && <Alert variant="success" title="Success">{success}</Alert>}

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#222]">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                selectedTab === tab
                  ? "bg-[#D4AF37] text-black"
                  : "bg-[#141414] text-zinc-400 hover:text-white border border-[#272727]"
              }`}
            >
              {tab === "ALL" ? "All Bookings" : tab.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-12 text-center">
            <CalendarCheck2 className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Bookings in this Category</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Keep your availability status toggled on and check marketplace job proposals.
            </p>
            <Link href="/dashboard/worker/jobs" className="inline-block mt-4">
              <Button size="sm">Explore Open Jobs</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-[#141414] border border-[#222] rounded-xl p-5 flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#D4AF37]">{b.bookingNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        b.status === "REQUESTED" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                        b.status === "ACCEPTED" || b.status === "CONFIRMED" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                        b.status === "IN_PROGRESS" ? "bg-purple-500/20 text-purple-300 border-purple-500/30" :
                        b.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                        "bg-zinc-800 text-zinc-400 border-zinc-700"
                      }`}>
                        {b.status.replace("_", " ")}
                      </span>
                      {b.paymentStatus && b.paymentStatus !== "UNPAID" && (
                        <PaymentStatusBadge status={b.paymentStatus} />
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white mt-1.5">{b.serviceCategory}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-zinc-500" />
                      {b.address}, {b.city}
                    </p>
                  </div>

                  <div className="text-right sm:self-center">
                    <span className="text-base font-black text-white">₹{b.totalAmount}</span>
                    <span className="text-[11px] text-zinc-400 block">{b.totalDays} Days ({b.dailyRate}/day)</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-[#1a1a1a] border border-[#262626] text-xs text-zinc-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-zinc-500 block">Customer Information:</span>
                    <span className="font-semibold text-white">{b.customer?.name}</span>
                    {b.customer?.phone && <span className="ml-2 text-zinc-400">+91 {b.customer.phone}</span>}
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Scheduled Start:</span>
                    <span className="text-white font-medium">{new Date(b.startDate).toLocaleDateString("en-IN")}</span>
                  </div>
                  {b.notes && (
                    <div className="sm:col-span-2 pt-1 border-t border-[#222]">
                      <span className="text-zinc-500">Customer Notes: </span>
                      <span>{b.notes}</span>
                    </div>
                  )}
                  {b.completionNotes && (
                    <div className="sm:col-span-2 pt-1 border-t border-[#222] text-emerald-400">
                      <span className="text-zinc-500">Your Completion Notes: </span>
                      <span>{b.completionNotes}</span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="mt-4 pt-3 border-t border-[#222] flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    Booked on {new Date(b.createdAt).toLocaleDateString("en-IN")}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartChat(b.id)}
                      className="h-8 text-xs border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1" /> Chat
                    </Button>

                    {b.status === "REQUESTED" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleUpdateStatus(b.id, "REJECTED")}
                          className="h-8 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Decline
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          disabled={actionLoadingId === b.id}
                          onClick={() => handleUpdateStatus(b.id, "ACCEPTED")}
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          {actionLoadingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                          Accept Booking
                        </Button>
                      </>
                    )}

                    {(b.status === "ACCEPTED" || b.status === "CONFIRMED") && (
                      <Button
                        size="sm"
                        variant="default"
                        disabled={actionLoadingId === b.id}
                        onClick={() => handleUpdateStatus(b.id, "IN_PROGRESS")}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        {actionLoadingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                        Start Work (In Progress)
                      </Button>
                    )}

                    {b.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setCompletingBooking(b)}
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Work Completed
                      </Button>
                    )}

                    {b.status === "COMPLETED" && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Work Finished & Payout Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completion Confirmation Modal */}
        <Modal
          isOpen={Boolean(completingBooking)}
          onClose={() => setCompletingBooking(null)}
          title={`Mark Job Completed: #${completingBooking?.bookingNumber}`}
        >
          {completingBooking && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400">
                Confirm that all work agreed for <span className="text-white font-bold">{completingBooking.serviceCategory}</span> has been finished on site. This will generate an official customer invoice and credit confirmed earnings to your ledger.
              </p>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Completion Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Detail work performed, test runs conducted, or client handover notes..."
                  className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setCompletingBooking(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={actionLoadingId === completingBooking.id}
                  onClick={() => handleUpdateStatus(completingBooking.id, "COMPLETED", completionNotes)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {actionLoadingId === completingBooking.id ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Confirm & Complete Job
                </Button>
              </div>
            </div>
          )}
        </Modal>

      </div>
    </div>
  );
}

