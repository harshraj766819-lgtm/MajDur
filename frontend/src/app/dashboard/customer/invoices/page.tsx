"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Hammer, 
  ArrowLeft, 
  FileText, 
  Download, 
  CheckCircle2, 
  IndianRupee, 
  Loader2, 
  Calendar, 
  Search,
  ExternalLink 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { fetchCustomerInvoices, downloadInvoicePdf, Invoice } from "@/lib/api";

export default function CustomerInvoicesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [invoices, setInvoices] = React.useState<Invoice[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/customer/invoices");
      } else if (user.role !== "CUSTOMER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, loading, router]);

  const loadInvoices = React.useCallback(async () => {
    try {
      setDataLoading(true);
      const data = await fetchCustomerInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error("Error loading invoices:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user, loadInvoices]);

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    try {
      setDownloadingId(invoiceId);
      await downloadInvoicePdf(invoiceId, invoiceNumber);
    } catch (err: any) {
      alert(err.message || "Failed to download PDF invoice");
    } finally {
      setDownloadingId(null);
    }
  };

  const totalSpent = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs">Loading tax invoices &amp; receipts...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/customer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Tax Invoices &amp; Wage Receipts</h1>
            <p className="text-xs text-zinc-400 mt-1">Download official PDF receipts for all verified completed labour contracts</p>
          </div>

          <div className="p-4 rounded-xl bg-[#141414] border border-[#272727] text-left sm:text-right">
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Total Invoiced Amount</span>
            <span className="text-xl font-black text-white">₹{totalSpent.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* Invoices List */}
        {dataLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            <p className="text-xs">Fetching verified receipts...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-[#2b2b2b] bg-[#111111]">
            <FileText className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-white">No Invoices Generated Yet</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Invoices are automatically generated when a booked worker completes their assigned task.
            </p>
            <div className="mt-4">
              <Link href="/dashboard/customer/bookings">
                <Button variant="primary" size="sm" className="bg-[#D4AF37] text-black font-bold">
                  View Active Bookings
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#141414] border border-[#272727] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#191919] border-b border-[#252525] text-zinc-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Booking Ref</th>
                    <th className="py-3.5 px-4">Service Category</th>
                    <th className="py-3.5 px-4">Worker</th>
                    <th className="py-3.5 px-4">Date Issued</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020] text-zinc-300">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-4 px-4 font-mono text-[#D4AF37]">
                        <Link href={`/dashboard/customer/bookings/${inv.bookingId}`} className="hover:underline">
                          {inv.booking?.bookingNumber}
                        </Link>
                      </td>
                      <td className="py-4 px-4 font-medium text-white">
                        {inv.booking?.serviceCategory || "General Labour"}
                      </td>
                      <td className="py-4 px-4 text-zinc-300">
                        {inv.booking?.worker?.name || "Assigned Worker"}
                      </td>
                      <td className="py-4 px-4 text-zinc-400">
                        {new Date(inv.issuedAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-4 px-4 font-black text-white">
                        ₹{inv.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {inv.paidAt ? "PAID" : "COMPLETED"}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Button
                          onClick={() => handleDownload(inv.id, inv.invoiceNumber)}
                          disabled={downloadingId === inv.id}
                          variant="outline"
                          size="sm"
                          className="border-[#383838] text-zinc-300 hover:text-white text-xs"
                          leftIcon={downloadingId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        >
                          {downloadingId === inv.id ? "Generating..." : "Download PDF"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

