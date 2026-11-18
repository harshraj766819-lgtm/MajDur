"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  IndianRupee,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  Download,
  Loader2,
  ShieldCheck,
  ExternalLink,
  Eye,
  X,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  fetchPaymentsHistory,
  fetchPaymentDetail,
  initiatePaymentRefund,
  downloadInvoicePdf,
  PaymentRecord,
  PaymentSummaryStats,
} from "@/lib/api";
import { PaymentStatusBadge } from "@/components/payments/payment-status-badge";

const STATUS_TABS = ["ALL", "SUCCESS", "PENDING", "FAILED", "REFUNDED"] as const;

export default function CustomerPaymentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [payments, setPayments] = React.useState<PaymentRecord[]>([]);
  const [summary, setSummary] = React.useState<PaymentSummaryStats | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [bannerMsg, setBannerMsg] = React.useState<string | null>(null);

  // Detail modal state
  const [selectedPayment, setSelectedPayment] = React.useState<PaymentRecord | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  // Action states
  const [refundingId, setRefundingId] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/customer/payments");
      } else if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, authLoading, router]);

  const loadPayments = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPaymentsHistory({ status: statusFilter, page: 1, limit: 30 });
      setPayments(data.payments || []);
      setSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message || "Failed to load payment history.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    if (user) {
      loadPayments();
    }
  }, [user, loadPayments]);

  const handleViewDetails = async (paymentId: string) => {
    try {
      setDetailLoading(true);
      const detail = await fetchPaymentDetail(paymentId);
      setSelectedPayment(detail);
    } catch (err: any) {
      setError(err.message || "Failed to load transaction audit trail.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRefund = async (payment: PaymentRecord) => {
    if (
      !confirm(
        `Process a full Razorpay Test Mode refund of ₹${payment.amount.toLocaleString("en-IN")} for booking ${payment.booking?.bookingNumber || ""}?`
      )
    ) {
      return;
    }

    try {
      setRefundingId(payment.id);
      setError(null);
      await initiatePaymentRefund(payment.id, {
        reason: "Customer requested test mode refund for cancelled booking",
      });
      setBannerMsg(
        `Refund of ₹${payment.amount.toLocaleString("en-IN")} processed successfully in Test Mode.`
      );
      await loadPayments();
      if (selectedPayment?.id === payment.id) {
        const refreshed = await fetchPaymentDetail(payment.id);
        setSelectedPayment(refreshed);
      }
    } catch (err: any) {
      setError(err.message || "Refund could not be processed.");
    } finally {
      setRefundingId(null);
    }
  };

  const handleDownloadReceipt = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloadingId(invoiceId);
      await downloadInvoicePdf(invoiceId, invoiceNumber);
    } catch (err: any) {
      setError(err.message || "Failed to download receipt PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs">Loading MajDur Payments Ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-[11px] font-bold text-amber-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Razorpay Test Mode • Simulated Transactions Only
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5">
              <CreditCard className="h-7 w-7 text-[#D4AF37]" />
              Payments &amp; Transaction Ledger
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Track Razorpay Test Mode payments, download verified PDF receipts, and manage refunds for your bookings.
            </p>
          </div>

          <Link href="/dashboard/customer/bookings">
            <Button
              variant="outline"
              size="sm"
              className="border-[#333] hover:border-[#D4AF37] text-xs font-bold"
            >
              View My Bookings
            </Button>
          </Link>
        </div>

        {/* Feedback Banners */}
        {bannerMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {bannerMsg}
            </span>
            <button onClick={() => setBannerMsg(null)} className="text-emerald-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Total Paid
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <IndianRupee className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">
              ₹{(summary?.totalPaidAmount || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-emerald-400 mt-1">
              {summary?.successfulCount || 0} verified transaction(s)
            </p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Pending Orders
              </span>
              <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-amber-400 mt-2">
              ₹{(summary?.pendingAmount || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              {summary?.pendingCount || 0} awaiting completion
            </p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Total Refunded
              </span>
              <div className="h-8 w-8 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center">
                <RotateCcw className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-sky-400 mt-2">
              ₹{(summary?.totalRefundedAmount || 0).toLocaleString("en-IN")}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              {summary?.refundedCount || 0} refunded booking(s)
            </p>
          </div>

          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Failed Attempts
              </span>
              <div className="h-8 w-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center">
                <XCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-white mt-2">
              {summary?.failedCount || 0}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              {summary?.totalTransactions || 0} total gateway records
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#222222]">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === tab
                  ? "bg-[#D4AF37] text-black"
                  : "bg-[#141414] text-zinc-400 hover:text-white border border-[#272727]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Payments Table / Empty State */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            <p className="text-xs">Fetching payment records...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-[#2b2b2b] bg-[#111111]">
            <Receipt className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-white">No Payments Found</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Once an artisan accepts your booking request, you can securely pay via Razorpay Test Mode from your booking details page.
            </p>
            <Link href="/dashboard/customer/bookings" className="inline-block mt-4">
              <Button size="sm" className="bg-[#D4AF37] text-black font-bold text-xs">
                Go to My Bookings
              </Button>
            </Link>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#272727] rounded-2xl overflow-hidden shadow-xl">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#191919] border-b border-[#252525] text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Payment / Order Ref</th>
                    <th className="py-3.5 px-4">Booking &amp; Artisan</th>
                    <th className="py-3.5 px-4">Method</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020] text-zinc-300">
                  {payments.map((p) => {
                    const invoice = p.booking?.invoices?.[0];
                    const canRefund =
                      p.status === "SUCCESS" &&
                      (user?.role === "ADMIN" ||
                        (p.booking && ["CANCELLED", "DISPUTED"].includes(p.booking.status)));

                    return (
                      <tr key={p.id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap text-zinc-400">
                          {new Date(p.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-mono font-bold text-white text-[11px]">
                            {p.razorpayPaymentId || p.razorpayOrderId}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-mono">
                            {p.receiptNumber || p.paymentMode}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          {p.booking ? (
                            <Link
                              href={`/dashboard/customer/bookings/${p.booking.id}`}
                              className="font-bold text-[#D4AF37] hover:underline inline-flex items-center gap-1"
                            >
                              {p.booking.bookingNumber}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                          <p className="text-[11px] text-zinc-400">
                            {p.booking?.serviceCategory} • {p.booking?.worker?.name || "Artisan"}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded bg-[#222] text-zinc-300 font-semibold text-[10px]">
                            {p.paymentMethod || "RAZORPAY"} ({p.paymentMode})
                          </span>
                        </td>
                        <td className="py-4 px-4 font-black text-white whitespace-nowrap">
                          ₹{p.amount.toLocaleString("en-IN")}
                          {p.refundAmount ? (
                            <span className="block text-[10px] font-normal text-sky-400">
                              Refunded: ₹{p.refundAmount.toLocaleString("en-IN")}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-4 px-4">
                          <PaymentStatusBadge status={p.status} />
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewDetails(p.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#222] hover:bg-[#2d2d2d] text-zinc-200 text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
                              Audit
                            </button>

                            {invoice && p.status === "SUCCESS" && (
                              <button
                                type="button"
                                disabled={downloadingId === invoice.id}
                                onClick={() => handleDownloadReceipt(invoice.id, invoice.invoiceNumber)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/30 text-[11px] font-bold inline-flex items-center gap-1"
                              >
                                {downloadingId === invoice.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Download className="h-3 w-3" />
                                )}
                                Receipt
                              </button>
                            )}

                            {canRefund && (
                              <button
                                type="button"
                                disabled={refundingId === p.id}
                                onClick={() => handleRefund(p)}
                                className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-bold inline-flex items-center gap-1"
                              >
                                {refundingId === p.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden divide-y divide-[#222]">
              {payments.map((p) => {
                const invoice = p.booking?.invoices?.[0];
                const canRefund =
                  p.status === "SUCCESS" &&
                  (user?.role === "ADMIN" ||
                    (p.booking && ["CANCELLED", "DISPUTED"].includes(p.booking.status)));

                return (
                  <div key={p.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-black text-white">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] font-mono text-zinc-400 break-all">
                          {p.razorpayPaymentId || p.razorpayOrderId}
                        </p>
                      </div>
                      <PaymentStatusBadge status={p.status} />
                    </div>

                    <div className="text-xs text-zinc-400 space-y-0.5">
                      {p.booking && (
                        <Link
                          href={`/dashboard/customer/bookings/${p.booking.id}`}
                          className="text-[#D4AF37] font-bold hover:underline block"
                        >
                          {p.booking.bookingNumber} • {p.booking.serviceCategory}
                        </Link>
                      )}
                      <p>
                        Method: {p.paymentMethod || "RAZORPAY"} ({p.paymentMode}) •{" "}
                        {new Date(p.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleViewDetails(p.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#222] text-zinc-200 text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#D4AF37]" />
                        Audit Trail
                      </button>
                      {invoice && p.status === "SUCCESS" && (
                        <button
                          type="button"
                          onClick={() => handleDownloadReceipt(invoice.id, invoice.invoiceNumber)}
                          className="px-3 py-1.5 rounded-lg bg-[#D4AF37] text-black text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Receipt PDF
                        </button>
                      )}
                      {canRefund && (
                        <button
                          type="button"
                          disabled={refundingId === p.id}
                          onClick={() => handleRefund(p)}
                          className="px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-bold inline-flex items-center gap-1"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Refund
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment Audit Detail Modal */}
        {(selectedPayment || detailLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl bg-[#141414] border border-[#2d2d2d] p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-5">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              {detailLoading || !selectedPayment ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 animate-spin text-[#D4AF37]" />
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">
                      Payment Audit Record ({selectedPayment.paymentMode} MODE)
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">
                      ₹{selectedPayment.amount.toLocaleString("en-IN")}
                    </h3>
                    <div className="mt-2">
                      <PaymentStatusBadge status={selectedPayment.status} size="md" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#191919] border border-[#252525] rounded-xl p-4">
                    <div>
                      <span className="text-zinc-500 block">Order ID</span>
                      <span className="font-mono text-zinc-200 break-all">
                        {selectedPayment.razorpayOrderId || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Payment ID</span>
                      <span className="font-mono text-emerald-400 break-all">
                        {selectedPayment.razorpayPaymentId || "Not captured"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Receipt Number</span>
                      <span className="font-mono text-zinc-200">
                        {selectedPayment.receiptNumber || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Method</span>
                      <span className="text-zinc-200 font-semibold">
                        {selectedPayment.paymentMethod || "Pending"}
                      </span>
                    </div>
                    {selectedPayment.refundId && (
                      <>
                        <div>
                          <span className="text-zinc-500 block">Refund ID</span>
                          <span className="font-mono text-sky-400 break-all">
                            {selectedPayment.refundId}
                          </span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Refund Amount</span>
                          <span className="text-sky-400 font-bold">
                            ₹{(selectedPayment.refundAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </>
                    )}
                    {selectedPayment.failureReason && (
                      <div className="sm:col-span-2">
                        <span className="text-zinc-500 block">Failure Reason</span>
                        <span className="text-red-400">{selectedPayment.failureReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Event Audit Timeline */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Cryptographic &amp; Gateway Event Log
                    </h4>
                    {selectedPayment.events && selectedPayment.events.length > 0 ? (
                      <div className="space-y-2">
                        {selectedPayment.events.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-start gap-3 p-3 rounded-xl bg-[#191919] border border-[#242424] text-xs"
                          >
                            <div className="h-2 w-2 rounded-full bg-[#D4AF37] mt-1.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-white">{ev.eventType}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#262626] text-zinc-400">
                                  {ev.source}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-0.5">
                                {new Date(ev.createdAt).toLocaleString("en-IN")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500">No events recorded yet.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

