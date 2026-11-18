"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Hammer, 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Star, 
  MapPin, 
  Phone, 
  User, 
  Download, 
  ShieldCheck, 
  DollarSign,
  MessageSquare,
  RotateCcw,
  CreditCard,
  X
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  fetchBookingDetail, 
  cancelBookingRequest, 
  submitBookingReview, 
  downloadInvoicePdf, 
  createOrGetConversation,
  initiatePaymentRefund,
  Booking 
} from "@/lib/api";
import { RazorpayCheckoutButton } from "@/components/payments/razorpay-checkout-button";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";
import { getSocket } from "@/lib/socket";

const STEPS = [
  { key: "REQUESTED", label: "Request Placed" },
  { key: "ACCEPTED", label: "Artisan Accepted" },
  { key: "IN_PROGRESS", label: "Work In Progress" },
  { key: "COMPLETED", label: "Work Completed" },
];

export default function CustomerBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const bookingId = params.id as string;

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState("");
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);
  const [reviewError, setReviewError] = React.useState<string | null>(null);

  // Cancellation & payment states
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [paymentMessage, setPaymentMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isRefunding, setIsRefunding] = React.useState(false);

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?redirect=/dashboard/customer/bookings/${bookingId}`);
      } else if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router, bookingId]);

  const loadBooking = React.useCallback(async () => {
    try {
      setDataLoading(true);
      setError(null);
      const data = await fetchBookingDetail(bookingId);
      setBooking(data);
    } catch (err: any) {
      setError(err.message || "Failed to load booking details");
    } finally {
      setDataLoading(false);
    }
  }, [bookingId]);

  React.useEffect(() => {
    if (user && bookingId) {
      loadBooking();
    }
  }, [user, bookingId, loadBooking]);

  React.useEffect(() => {
    if (!user || !bookingId) return;
    const socket = getSocket();
    const handlePaymentUpdate = (payload: any) => {
      if (payload?.bookingId === bookingId) {
        loadBooking();
      }
    };
    socket.on("payment:updated", handlePaymentUpdate);
    return () => {
      socket.off("payment:updated", handlePaymentUpdate);
    };
  }, [user, bookingId, loadBooking]);

  const handleRequestRefund = async (paymentId: string) => {
    if (!confirm("Initiate a full Razorpay Test Mode refund for this cancelled booking?")) return;
    try {
      setIsRefunding(true);
      setPaymentMessage(null);
      await initiatePaymentRefund(paymentId, {
        reason: "Customer requested test mode refund on booking details page",
      });
      setPaymentMessage({
        type: "success",
        text: "Refund processed successfully in Razorpay Test Mode.",
      });
      await loadBooking();
    } catch (err: any) {
      setPaymentMessage({
        type: "error",
        text: err.message || "Refund could not be processed.",
      });
    } finally {
      setIsRefunding(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      setIsCancelling(true);
      await cancelBookingRequest(bookingId, "Cancelled by customer");
      loadBooking();
    } catch (err: any) {
      alert(err.message || "Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewError(null);
    try {
      setIsSubmittingReview(true);
      await submitBookingReview({
        bookingId,
        rating,
        comment: comment.trim() || undefined,
      });
      setShowReviewModal(false);
      loadBooking();
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await downloadInvoicePdf(invoiceId, invoiceNumber);
    } catch (err: any) {
      alert(err.message || "Failed to download invoice");
    }
  };

  const [isStartingChat, setIsStartingChat] = React.useState(false);

  const handleStartChat = async () => {
    try {
      setIsStartingChat(true);
      const convo = await createOrGetConversation({ bookingId });
      if (convo?.id) {
        router.push(`/dashboard/messages/${convo.id}`);
      }
    } catch (err: any) {
      alert(err.message || "Failed to start chat with artisan");
    } finally {
      setIsStartingChat(false);
    }
  };

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs">Loading booking contract...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
        <h2 className="text-xl font-bold">Booking Not Found</h2>
        <p className="text-xs text-zinc-400 mt-1">{error || "The requested booking does not exist."}</p>
        <Link href="/dashboard/customer/bookings" className="mt-4">
          <Button variant="outline" size="sm" className="border-[#383838]">
            Back to Bookings
          </Button>
        </Link>
      </div>
    );
  }

  // Calculate current progress index
  const getStepIndex = () => {
    switch (booking.status) {
      case "REQUESTED":
        return 0;
      case "ACCEPTED":
      case "CONFIRMED":
        return 1;
      case "IN_PROGRESS":
        return 2;
      case "COMPLETED":
        return 3;
      default:
        return -1;
    }
  };

  const currentStep = getStepIndex();
  const isCancelled = booking.status === "CANCELLED" || booking.status === "REJECTED";
  const existingReview = booking.reviews && booking.reviews.length > 0 ? booking.reviews[0] : null;
  const invoice = booking.invoices && booking.invoices.length > 0 ? booking.invoices[0] : null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/customer/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Bookings
          </Link>
        </div>

        {/* Booking Header Banner */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#D4AF37]">
                  {booking.bookingNumber}
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-xs text-zinc-400">
                  Booked on {new Date(booking.createdAt).toLocaleDateString("en-IN")}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
                {booking.serviceCategory} Contract
              </h1>
            </div>

            <div className="text-left sm:text-right space-y-1.5">
              <span className="text-xs text-zinc-400 uppercase tracking-wider block">Agreed Total</span>
              <span className="text-2xl font-black text-white block">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
              <div>
                <PaymentStatusBadge status={booking.paymentStatus} size="md" />
              </div>
            </div>
          </div>

          {/* Progress Timeline Stepper */}
          {!isCancelled && (
            <div className="mt-8 pt-6 border-t border-[#222222]">
              <div className="grid grid-cols-4 gap-2 text-center">
                {STEPS.map((step, idx) => {
                  const isPassed = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.key} className="space-y-2">
                      <div className="flex items-center justify-center">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                            isCurrent
                              ? "bg-[#D4AF37] text-black ring-4 ring-[#D4AF37]/20"
                              : isPassed
                              ? "bg-emerald-500 text-black"
                              : "bg-[#222222] text-zinc-500"
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                        </div>
                      </div>
                      <p className={`text-[11px] font-bold ${isPassed ? "text-white" : "text-zinc-500"}`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isCancelled && (
            <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
              <XCircle className="h-5 w-5 shrink-0" />
              <span>This booking request was cancelled. No charges were levied.</span>
            </div>
          )}
        </div>

        {/* 2-Column Details: Schedule & Worker Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column: Location, Scope & Status Trail */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Service & Schedule */}
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-7 space-y-4">
              <h2 className="text-base font-bold text-white">Work Location &amp; Schedule</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-[#191919] border border-[#242424] space-y-1">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider block">Service Address</span>
                  <p className="text-zinc-200 font-medium">{booking.address}</p>
                  <p className="text-zinc-400">{booking.city}, India</p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#191919] border border-[#242424] space-y-1">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider block">Timeline</span>
                  <p className="text-zinc-200 font-medium">
                    Start: {new Date(booking.startDate).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-zinc-400">Duration: {booking.totalDays} full day(s)</p>
                </div>
              </div>

              {booking.notes && (
                <div className="p-3.5 rounded-xl bg-[#191919] border border-[#242424] text-xs">
                  <span className="text-zinc-500 font-semibold uppercase tracking-wider block mb-1">Customer Notes</span>
                  <p className="text-zinc-300 leading-relaxed">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Status History Trail */}
            {booking.statusHistory && booking.statusHistory.length > 0 && (
              <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-7 space-y-4">
                <h2 className="text-base font-bold text-white">Activity Log &amp; Audit Trail</h2>
                <div className="space-y-3">
                  {booking.statusHistory.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 text-xs">
                      <div className="h-2 w-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white uppercase">{h.status}</span>
                          <span className="text-zinc-500 text-[10px]">
                            {new Date(h.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {new Date(h.createdAt).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                        {h.note && <p className="text-zinc-400 mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Review Section */}
            {booking.status === "COMPLETED" && (
              <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-white">Artisan Performance Review</h2>
                  {!existingReview && (
                    <Button
                      onClick={() => setShowReviewModal(true)}
                      variant="primary"
                      size="sm"
                      className="bg-[#D4AF37] text-black font-bold text-xs"
                      leftIcon={<Star className="h-3.5 w-3.5" />}
                    >
                      Write Review
                    </Button>
                  )}
                </div>

                {existingReview ? (
                  <div className="p-4 rounded-xl bg-[#191919] border border-[#242424] space-y-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < existingReview.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-2">{existingReview.rating}/5 Stars</span>
                    </div>
                    {existingReview.comment && (
                      <p className="text-xs text-zinc-300 italic pt-1">&quot;{existingReview.comment}&quot;</p>
                    )}
                    <span className="text-[10px] text-zinc-500 block">Submitted on {new Date(existingReview.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400">
                    The work has been completed! Please share your honest feedback to help this artisan build their verified platform reputation.
                  </p>
                )}
              </div>
            )}

          </div>

          {/* Sidebar Column: Worker Contact & Financials */}
          <div className="space-y-6">
            
            {/* Worker Profile Card */}
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Assigned Artisan</h3>
              
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#222222] text-[#D4AF37] flex items-center justify-center font-bold text-lg">
                  {booking.worker?.name?.charAt(0) || "W"}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{booking.worker?.name}</h4>
                  <p className="text-xs text-[#D4AF37]">{booking.serviceCategory}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-[#242424] space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">Contact:</span>
                  <span className="font-semibold">+91 {booking.worker?.phone}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-500">Daily Rate:</span>
                  <span className="font-semibold">₹{booking.dailyRate} / day</span>
                </div>
              </div>

              <Button
                onClick={handleStartChat}
                disabled={isStartingChat}
                variant="outline"
                size="sm"
                fullWidth
                className="border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-bold text-xs"
                leftIcon={isStartingChat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
              >
                {isStartingChat ? "Connecting..." : "Message Artisan"}
              </Button>
            </div>

            {/* Financial Summary & Razorpay Test Mode Payment */}
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-white flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-[#D4AF37]" />
                  Wage Breakdown &amp; Payment
                </h3>
                <PaymentStatusBadge status={booking.paymentStatus} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-zinc-400">
                  <span>Daily Wage:</span>
                  <span className="text-zinc-200">₹{booking.dailyRate}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Number of Days:</span>
                  <span className="text-zinc-200">{booking.totalDays}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Platform Commission:</span>
                  <span className="text-emerald-400 font-semibold">₹0 (Free)</span>
                </div>
                <div className="pt-2 border-t border-[#242424] flex justify-between font-black text-sm text-white">
                  <span>Grand Total:</span>
                  <span>₹{booking.totalAmount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {paymentMessage && (
                <div
                  className={`p-3 rounded-xl border text-[11px] font-medium ${
                    paymentMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/10 border-red-500/30 text-red-300"
                  }`}
                >
                  {paymentMessage.text}
                </div>
              )}

              {/* Pay Now / Retry Checkout Button */}
              {["ACCEPTED", "CONFIRMED", "IN_PROGRESS", "COMPLETED"].includes(booking.status) &&
                booking.paymentStatus !== "PAID" &&
                booking.paymentStatus !== "REFUNDED" && (
                  <div className="pt-2 border-t border-[#242424]">
                    <RazorpayCheckoutButton
                      bookingId={booking.id}
                      amount={booking.totalAmount}
                      label={
                        booking.paymentStatus === "FAILED"
                          ? `Retry Payment (₹${booking.totalAmount.toLocaleString("en-IN")})`
                          : `Pay ₹${booking.totalAmount.toLocaleString("en-IN")} with Razorpay`
                      }
                      onSuccess={() => {
                        setPaymentMessage({
                          type: "success",
                          text: "Payment verified in Razorpay Test Mode! Your booking is confirmed and receipt is ready.",
                        });
                        loadBooking();
                      }}
                      onError={(msg) => {
                        setPaymentMessage({ type: "error", text: msg });
                        loadBooking();
                      }}
                    />
                  </div>
                )}

              {booking.status === "REQUESTED" && (
                <p className="text-[11px] text-zinc-500 pt-2 border-t border-[#242424]">
                  Online payment unlocks automatically once the artisan accepts your booking request.
                </p>
              )}

              {/* Verified Payment Receipt Metadata */}
              {booking.payments && booking.payments.length > 0 && (() => {
                const settled = booking.payments.find(
                  (p) => p.status === "SUCCESS" || p.status === "REFUNDED" || p.status === "PARTIALLY_REFUNDED"
                );
                if (!settled) return null;
                return (
                  <div className="pt-3 border-t border-[#242424] space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Payment Ref:</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {settled.razorpayPaymentId || settled.razorpayOrderId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Method:</span>
                      <span className="text-zinc-200 font-semibold">
                        {settled.paymentMethod || "ONLINE"} ({settled.paymentMode})
                      </span>
                    </div>
                    {settled.refundId && (
                      <div className="flex items-center justify-between text-sky-400">
                        <span>Refund Ref:</span>
                        <span className="font-mono font-semibold">{settled.refundId}</span>
                      </div>
                    )}

                    {/* Refund button when paid booking is cancelled or disputed */}
                    {settled.status === "SUCCESS" &&
                      ["CANCELLED", "DISPUTED"].includes(booking.status) && (
                        <div className="pt-2">
                          <Button
                            type="button"
                            onClick={() => handleRequestRefund(settled.id)}
                            disabled={isRefunding}
                            variant="outline"
                            fullWidth
                            size="sm"
                            className="border-sky-500/40 text-sky-300 hover:bg-sky-500/10 text-xs font-bold"
                            leftIcon={
                              isRefunding ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="h-3.5 w-3.5" />
                              )
                            }
                          >
                            {isRefunding ? "Processing Test Refund..." : "Request Test Mode Refund"}
                          </Button>
                        </div>
                      )}

                    <Link
                      href="/dashboard/customer/payments"
                      className="block text-center text-[11px] font-semibold text-[#D4AF37] hover:underline pt-1"
                    >
                      View in Payments Ledger →
                    </Link>
                  </div>
                );
              })()}
            </div>

            {/* Invoices & Actions */}
            <div className="space-y-3">
              {invoice && (
                <Button
                  onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceNumber)}
                  variant="primary"
                  fullWidth
                  size="md"
                  className="bg-[#D4AF37] text-black font-bold text-xs"
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Download Tax Invoice ({invoice.invoiceNumber})
                </Button>
              )}

              {["REQUESTED", "ACCEPTED", "CONFIRMED"].includes(booking.status) && (
                <Button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  variant="outline"
                  fullWidth
                  size="md"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  {isCancelling ? "Cancelling Request..." : "Cancel This Booking"}
                </Button>
              )}
            </div>

          </div>
        </div>

        {/* Submit Review Modal */}
        {showReviewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl bg-[#141414] border border-[#2d2d2d] p-6 shadow-2xl space-y-5">
              <button
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <h3 className="font-bold text-lg text-white">Rate {booking.worker?.name}</h3>
                <p className="text-xs text-zinc-400 mt-1">Ref: {booking.bookingNumber} • {booking.serviceCategory}</p>
              </div>

              {reviewError && (
                <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-xs">{reviewError}</div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2 text-center">
                    Star Rating (1 to 5)
                  </label>
                  <div className="flex justify-center items-center gap-2">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        type="button"
                        key={starVal}
                        onClick={() => setRating(starVal)}
                        className="p-1 focus:outline-none transition-transform hover:scale-125"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            starVal <= rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-zinc-700"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Written Feedback (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="How was the craftsmanship, punctuality, and conduct of the artisan?"
                    className="w-full p-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={isSubmittingReview}
                  className="bg-[#D4AF37] text-black font-bold text-xs"
                >
                  {isSubmittingReview ? "Submitting Review..." : "Publish Review"}
                </Button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

