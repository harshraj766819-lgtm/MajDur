"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  IndianRupee, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  Loader2, 
  AlertCircle,
  CalendarCheck2,
  TrendingUp,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { fetchWorkerEarnings, downloadWorkerEarningsStatement, WorkerEarningsData } from "@/lib/api";

export default function WorkerEarningsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [earnings, setEarnings] = React.useState<WorkerEarningsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadEarnings = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerEarnings();
      setEarnings(res);
    } catch (err: any) {
      setError(err.message || "Failed to load earnings ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/earnings");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadEarnings();
      }
    }
  }, [user, authLoading, router, loadEarnings]);

  const handleDownloadStatement = async () => {
    if (!user) return;
    try {
      setDownloading(true);
      await downloadWorkerEarningsStatement(user.name);
    } catch (err: any) {
      alert(err.message || "Failed to download earnings statement");
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Verified Earnings Ledger...</p>
      </div>
    );
  }

  const summary = earnings?.summary;
  const transactions = earnings?.transactions || [];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
              <span>/</span>
              <span className="text-white">Earnings Ledger</span>
            </div>
            <h1 className="text-2xl font-black text-white">Confirmed Earnings & Financial Records</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Real-time statement derived from verified completed customer contracts and on-site work.
            </p>
          </div>

          <Button
            onClick={handleDownloadStatement}
            disabled={downloading}
            variant="default"
            size="sm"
            className="font-bold text-xs"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Download className="h-4 w-4 mr-1.5" />
            )}
            Download Official Statement (PDF)
          </Button>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-[#141414] border-[#222]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Total Confirmed Payout</p>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <IndianRupee className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-2">
                ₹{summary?.totalConfirmedEarnings.toLocaleString("en-IN") || 0}
              </p>
              <p className="text-[11px] text-emerald-400 mt-1 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Fully verified completed jobs
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#222]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending Work Value</p>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-amber-400 mt-2">
                ₹{summary?.pendingEarnings.toLocaleString("en-IN") || 0}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Under active / in-progress contracts
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#222]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Completed Contracts</p>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <CalendarCheck2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-black text-white mt-2">
                {summary?.completedJobsCount || 0}
              </p>
              <p className="text-[11px] text-zinc-400 mt-1">
                Zero platform deduction (100% payout)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Itemized Transactions Table */}
        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span>Itemized Ledger Transactions ({transactions.length})</span>
              <span className="text-xs text-zinc-400 font-normal">Indexed from MongoDB Booking & Invoice records</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No Completed Transactions Yet</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Once you accept and mark your service bookings as completed, your payouts will be logged here.
                </p>
                <Link href="/dashboard/worker/bookings" className="inline-block mt-4">
                  <Button size="sm">Go to Work Queue</Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1a1a1a] text-zinc-400 border-b border-[#282828] uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Booking Reference</th>
                      <th className="py-3 px-4">Service Category</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4">Days / Rate</th>
                      <th className="py-3 px-4 text-right">Net Payout</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222]">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-[#181818] transition-colors">
                        <td className="py-3.5 px-4 font-mono text-zinc-400">
                          {new Date(t.date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#D4AF37]">
                          {t.bookingNumber}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-white">
                          {t.serviceCategory}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-300">
                          {t.customerName}
                        </td>
                        <td className="py-3.5 px-4 text-zinc-400">
                          {t.totalDays}d @ ₹{t.dailyRate}/d
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-white text-sm">
                          ₹{t.netPayout}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {t.status}
                          </span>
                          {(t as any).razorpayPaymentId && (
                            <span className="block font-mono text-[9px] text-zinc-400 mt-1">
                              {(t as any).razorpayPaymentId}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

