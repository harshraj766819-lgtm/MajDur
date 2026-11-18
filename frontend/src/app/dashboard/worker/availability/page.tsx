"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  MapPin, 
  Phone, 
  Briefcase,
  Layers,
  ArrowRight
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { fetchWorkerAvailability, updateWorkerAvailability } from "@/lib/api";

export default function WorkerAvailabilityPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [isAvailable, setIsAvailable] = React.useState(true);
  const [upcomingBookings, setUpcomingBookings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [toggling, setToggling] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadAvailability = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerAvailability();
      setIsAvailable(res.isAvailable);
      setUpcomingBookings(res.upcomingBookings);
    } catch (err: any) {
      setError(err.message || "Failed to load availability");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/availability");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadAvailability();
      }
    }
  }, [user, authLoading, router, loadAvailability]);

  const handleToggle = async () => {
    try {
      setToggling(true);
      setError(null);
      setSuccess(null);
      const nextStatus = !isAvailable;
      await updateWorkerAvailability(nextStatus);
      setIsAvailable(nextStatus);
      setSuccess(`Your status is now: ${nextStatus ? "Available for Hiring" : "Temporarily Offline"}`);
    } catch (err: any) {
      setError(err.message || "Failed to update availability");
    } finally {
      setToggling(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Availability & Calendar Schedule...</p>
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
            <span className="text-white">Availability Management</span>
          </div>
          <h1 className="text-2xl font-black text-white">Work Schedule & Availability</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Toggle your on-demand hiring availability and review your booked job commitments.
          </p>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}
        {success && <Alert variant="success" title="Success">{success}</Alert>}

        {/* Live Status Toggle Card */}
        <Card className="bg-[#141414] border-[#222]">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className={`h-3 w-3 rounded-full ${isAvailable ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                  <h3 className="text-lg font-bold text-white">
                    {isAvailable ? "You are Available for Direct Hiring" : "You are Temporarily Offline"}
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                  {isAvailable 
                    ? "Your profile is actively visible in public worker searches and recommended for customer requests."
                    : "Your profile is hidden from new search results. Existing confirmed bookings remain active."}
                </p>
              </div>

              <Button
                onClick={handleToggle}
                disabled={toggling}
                variant={isAvailable ? "outline" : "default"}
                className={`font-bold text-xs shrink-0 ${
                  isAvailable 
                    ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300" 
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                {toggling ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                {isAvailable ? "Switch to Offline Mode" : "Go Available Online"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Committed Work Schedule */}
        <Card className="bg-[#141414] border-[#222]">
          <CardHeader>
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span>Upcoming Booked Commitments ({upcomingBookings.length})</span>
              <Link href="/dashboard/worker/bookings" className="text-xs text-[#D4AF37] hover:underline font-normal">
                View All Work →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white">No Upcoming Booked Jobs</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  When a customer books your services, their requested dates will appear in this active schedule.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((b) => (
                  <div key={b.id} className="p-4 rounded-xl bg-[#1a1a1a] border border-[#272727] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#D4AF37]">{b.bookingNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {b.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-sm mt-1">{b.serviceCategory}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Client: <span className="text-white font-medium">{b.customer?.name}</span>
                        {b.customer?.phone && <span className="ml-2 text-zinc-500">+91 {b.customer.phone}</span>}
                      </p>
                    </div>

                    <div className="text-right sm:self-center flex sm:flex-col items-center sm:items-end justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-[#D4AF37]" />
                        {new Date(b.startDate).toLocaleDateString("en-IN")}
                      </span>
                      <Link href="/dashboard/worker/bookings" className="text-xs text-[#D4AF37] hover:underline mt-1">
                        View Assignment →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

