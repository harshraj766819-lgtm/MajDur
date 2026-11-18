"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  IndianRupee, 
  Clock, 
  ShieldCheck, 
  Loader2, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { fetchWorkerRates, updateWorkerRates } from "@/lib/api";

export default function WorkerRatesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [dailyRate, setDailyRate] = React.useState<number>(850);
  const [hourlyRate, setHourlyRate] = React.useState<number>(120);
  const [recommendedDailyRate, setRecommendedDailyRate] = React.useState<number>(800);
  const [category, setCategory] = React.useState<string>("Electrician");

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadRates = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerRates();
      setDailyRate(res.dailyRate);
      setHourlyRate(res.hourlyRate);
      setRecommendedDailyRate(res.recommendedDailyRate);
      setCategory(res.category);
    } catch (err: any) {
      setError(err.message || "Failed to load rate settings");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/rates");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadRates();
      }
    }
  }, [user, authLoading, router, loadRates]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (dailyRate < 300 || dailyRate > 30000) {
        throw new Error("Daily rate must be between ₹300 and ₹30,000.");
      }
      if (hourlyRate < 40 || hourlyRate > 5000) {
        throw new Error("Hourly rate must be between ₹40 and ₹5,000.");
      }

      await updateWorkerRates({ dailyRate: Number(dailyRate), hourlyRate: Number(hourlyRate) });
      setSuccess("Your service rates have been successfully updated!");
    } catch (err: any) {
      setError(err.message || "Failed to update rates");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Rate Configuration...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
            <span>/</span>
            <span className="text-white">Rates Configuration</span>
          </div>
          <h1 className="text-2xl font-black text-white">Daily & Hourly Pricing Matrix</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Configure transparent, market-competitive pricing for direct customer bookings in {category}.
          </p>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}
        {success && <Alert variant="success" title="Success">{success}</Alert>}

        {/* Pricing Recommendation Advisory */}
        <div className="bg-[#141414] border border-[#272727] rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-[#D4AF37] shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-white">Category Wage Guideline: {category}</p>
            <p className="text-zinc-400 mt-0.5">
              The recommended base daily wage for a skilled {category} in your region is approximately{" "}
              <span className="text-white font-bold">₹{recommendedDailyRate} / day</span> (8-hour standard shift). 
              Confirmed booking contracts lock prices at the time of agreement.
            </p>
          </div>
        </div>

        {/* Rate Editor Form */}
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="bg-[#141414] border-[#222]">
            <CardHeader>
              <CardTitle className="text-base text-white">Standard Service Rates (INR ₹)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Daily Rate Input */}
                <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#282828] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <IndianRupee className="h-4 w-4 text-[#D4AF37]" /> Daily Service Rate *
                    </label>
                    <span className="text-[11px] text-zinc-500">8 Hours shift</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold text-base">₹</span>
                    <Input
                      type="number"
                      min={300}
                      max={30000}
                      value={dailyRate}
                      onChange={(e) => setDailyRate(Number(e.target.value))}
                      className="pl-8 text-lg font-bold text-white bg-[#141414]"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Default daily booking charge displayed to customers on your public profile.
                  </p>
                </div>

                {/* Hourly Rate Input */}
                <div className="p-4 rounded-xl bg-[#1a1a1a] border border-[#282828] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-blue-400" /> Hourly Rate (Overtime / Short Jobs)
                    </label>
                    <span className="text-[11px] text-zinc-500">Per hour</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-zinc-400 font-bold text-base">₹</span>
                    <Input
                      type="number"
                      min={40}
                      max={5000}
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(Number(e.target.value))}
                      className="pl-8 text-lg font-bold text-white bg-[#141414]"
                      required
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Calculated for minor diagnostics or maintenance visits lasting under 4 hours.
                  </p>
                </div>

              </div>

              {/* Pricing Policy Box */}
              <div className="p-4 rounded-xl bg-[#121212] border border-[#222] text-xs space-y-1.5 text-zinc-400">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" /> Price Protection Guarantee
                </p>
                <p>• Updates to your rates only apply to new incoming booking requests.</p>
                <p>• Confirmed or ongoing bookings cannot be modified retroactively.</p>
                <p>• Customers pay 100% of your confirmed daily rate without hidden platform cuts.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Link href="/dashboard/worker">
                  <Button type="button" variant="outline">Back to Dashboard</Button>
                </Link>
                <Button type="submit" disabled={saving} className="font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Rates
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

      </div>
    </div>
  );
}

