"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  Hammer, 
  ArrowLeft, 
  Star, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Briefcase, 
  IndianRupee, 
  Calendar, 
  ShieldCheck, 
  User, 
  Phone, 
  MessageSquare, 
  Loader2, 
  Sparkles,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchWorkerProfile, createBookingRequest, ReviewItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function WorkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const workerId = params.id as string;

  const [worker, setWorker] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Booking Form State
  const [startDate, setStartDate] = React.useState("");
  const [days, setDays] = React.useState(1);
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isBooking, setIsBooking] = React.useState(false);
  const [bookingError, setBookingError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadWorker() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchWorkerProfile(workerId);
        setWorker(data);
        setCity(data.locationCity || "Delhi NCR");
        setStartDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
      } catch (err: any) {
        setError(err.message || "Failed to load worker profile.");
      } finally {
        setLoading(false);
      }
    }
    if (workerId) {
      loadWorker();
    }
  }, [workerId]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/login?redirect=/workers/${workerId}`);
      return;
    }
    setBookingError(null);

    if (!startDate || !address || !city) {
      setBookingError("Please enter start date, address, and city.");
      return;
    }

    try {
      setIsBooking(true);
      const booking = await createBookingRequest({
        workerId: worker.userId || worker.user.id,
        serviceCategory: worker.category,
        startDate: new Date(startDate).toISOString(),
        totalDays: days,
        address,
        city,
        notes: notes || undefined,
      });

      router.push(`/dashboard/customer/bookings/${booking.id}`);
    } catch (err: any) {
      setBookingError(err.message || "Failed to submit booking request.");
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-xs">Loading verified worker profile...</p>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
        <h2 className="text-xl font-bold">Worker Profile Not Found</h2>
        <p className="text-xs text-zinc-400 mt-1">{error || "The requested artisan profile does not exist."}</p>
        <Link href="/workers" className="mt-4">
          <Button variant="outline" size="sm" className="border-[#383838]">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const reviews: ReviewItem[] = worker.reviews || [];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/workers"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Worker Directory
          </Link>
        </div>

        {/* Worker Header Card */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 h-64 w-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="h-24 w-24 rounded-3xl bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-black flex items-center justify-center font-black text-3xl shadow-xl shadow-[#D4AF37]/20 shrink-0">
                {worker.user?.name?.charAt(0) || "W"}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{worker.user?.name}</h1>
                  {worker.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified Artisan
                    </span>
                  )}
                  {worker.isAvailable ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400">
                      Booked / Busy
                    </span>
                  )}
                </div>

                <p className="text-base text-[#D4AF37] font-bold">
                  {worker.category} {worker.categoryRef?.hindiName && `(${worker.categoryRef.hindiName})`}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                    {worker.locationCity}, India
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5 text-zinc-500" />
                    {worker.experienceYears} Years Experience
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="h-3.5 w-3.5 fill-amber-400" />
                    {worker.rating || "5.0"} ({reviews.length} reviews)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1c1c1c] border border-[#2a2a2a] text-center sm:text-right">
              <span className="text-xs uppercase tracking-wider text-zinc-400 block">Daily Wage</span>
              <span className="text-2xl font-black text-white">₹{worker.dailyRate || 800}</span>
              <span className="text-[11px] text-zinc-500 block">Standard 8-hour shift</span>
            </div>
          </div>
        </div>

        {/* 2-Column Content: Profile Details & Booking Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column: Bio, Skills & Customer Reviews */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* About / Bio */}
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-bold text-white">Professional Background</h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {worker.bio || `${worker.user?.name} is a certified and experienced ${worker.category} operating in ${worker.locationCity}. Dedicated to quality workmanship, site punctuality, and safety standards.`}
              </p>

              {/* Skills */}
              {worker.workerSkills && worker.workerSkills.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Specialized Trade Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {worker.workerSkills.map((ws: any) => (
                      <span
                        key={ws.id}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#1c1c1c] border border-[#2e2e2e] text-zinc-200"
                      >
                        {ws.skill?.name || "General"}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Reviews Section */}
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Customer Reviews &amp; Ratings</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Verified feedback from customers with completed work contracts</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span>{worker.rating || "5.0"}</span>
                  <span className="text-zinc-500 text-xs">({reviews.length})</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10 px-4 rounded-xl border border-dashed border-[#2b2b2b] bg-[#111111]">
                  <MessageSquare className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">No customer reviews yet.</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Book {worker.user?.name} and be the first to submit a review upon job completion!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl bg-[#191919] border border-[#262626] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-[#272727] text-white flex items-center justify-center font-bold text-xs">
                            {r.reviewer?.name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-white block">{r.reviewer?.name || "Customer"}</span>
                            <span className="text-[10px] text-zinc-500">{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < r.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {r.comment && (
                        <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                          &quot;{r.comment}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Column: Instant Booking Request Form */}
          <div className="space-y-6">
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-7 shadow-xl space-y-5 sticky top-24">
              <div>
                <h3 className="text-base font-bold text-white">Hire {worker.user?.name}</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Direct booking without middleman commissions</p>
              </div>

              {bookingError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {bookingError}
                </div>
              )}

              <form onSubmit={handleBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Estimated Work Days
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={days}
                    onChange={(e) => setDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full h-11 px-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Noida"
                    className="w-full h-11 px-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Service Street Address
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter site location"
                    className="w-full p-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Work Scope Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Special requirements, materials on site..."
                    className="w-full p-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>

                {/* Real-time Wage Computation */}
                <div className="p-3.5 rounded-xl bg-[#191919] border border-[#2a2a2a] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-400">Total Wage Estimate:</span>
                    <p className="text-[10px] text-zinc-500">₹{worker.dailyRate || 800} × {days} day(s)</p>
                  </div>
                  <div className="text-base font-black text-white">
                    ₹{((worker.dailyRate || 800) * days).toLocaleString("en-IN")}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={isBooking}
                  className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold shadow-lg shadow-[#D4AF37]/20"
                >
                  {isBooking ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting Request...
                    </span>
                  ) : (
                    "Confirm & Send Request"
                  )}
                </Button>
              </form>

              <div className="pt-2 text-center text-[11px] text-zinc-500">
                Payment is only made upon satisfactory work completion.
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

