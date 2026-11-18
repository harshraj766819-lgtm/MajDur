"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Hammer, 
  Search, 
  HardHat, 
  Star, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  SlidersHorizontal, 
  Briefcase, 
  IndianRupee, 
  ChevronRight, 
  Loader2, 
  Calendar, 
  X, 
  ShieldCheck, 
  Filter 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  fetchWorkersDirectory, 
  fetchCategories, 
  createBookingRequest, 
  Category, 
  WorkerItem 
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const CITIES = [
  "All India",
  "Delhi NCR",
  "Noida",
  "Gurugram",
  "Mumbai",
  "Bengaluru",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Patna",
  "Chandigarh",
  "Bhopal",
  "Indore",
];

function WorkersDirectoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [workers, setWorkers] = React.useState<WorkerItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pagination, setPagination] = React.useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0,
  });

  // Filter states
  const [search, setSearch] = React.useState(searchParams.get("search") || "");
  const [category, setCategory] = React.useState(searchParams.get("category") || "ALL");
  const [skill, setSkill] = React.useState("");
  const [city, setCity] = React.useState(searchParams.get("city") || "All India");
  const [area, setArea] = React.useState("");
  const [pincode, setPincode] = React.useState("");
  const [minExp, setMinExp] = React.useState("");
  const [minRate, setMinRate] = React.useState("");
  const [maxRate, setMaxRate] = React.useState("");
  const [minRating, setMinRating] = React.useState("");
  const [isAvailable, setIsAvailable] = React.useState<boolean | undefined>(undefined);
  const [isVerified, setIsVerified] = React.useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState("rating");
  const [page, setPage] = React.useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);

  // Booking Modal State
  const [selectedWorker, setSelectedWorker] = React.useState<WorkerItem | null>(null);
  const [bookStartDate, setBookStartDate] = React.useState("");
  const [bookDays, setBookDays] = React.useState(1);
  const [bookAddress, setBookAddress] = React.useState("");
  const [bookCity, setBookCity] = React.useState("");
  const [bookNotes, setBookNotes] = React.useState("");
  const [isSubmittingBooking, setIsSubmittingBooking] = React.useState(false);
  const [bookingError, setBookingError] = React.useState<string | null>(null);

  // Load categories
  React.useEffect(() => {
    async function loadCats() {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    }
    loadCats();
  }, []);

  // Fetch workers when filters change
  const loadWorkers = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchWorkersDirectory({
        search: search.trim() || undefined,
        category: category !== "ALL" ? category : undefined,
        skill: skill.trim() || undefined,
        city: city !== "All India" ? city : undefined,
        area: area.trim() || undefined,
        pincode: pincode.trim() || undefined,
        minExperience: minExp ? parseInt(minExp, 10) : undefined,
        minRate: minRate ? parseFloat(minRate) : undefined,
        maxRate: maxRate ? parseFloat(maxRate) : undefined,
        minRating: minRating ? parseFloat(minRating) : undefined,
        isAvailable,
        isVerified,
        sortBy,
        page,
        limit: 12,
      });

      setWorkers(res.workers || []);
      setPagination({
        currentPage: res.pagination?.currentPage || 1,
        totalPages: res.pagination?.totalPages || 1,
        totalResults: res.pagination?.totalResults || 0,
      });
    } catch (err) {
      console.error("Error loading workers:", err);
    } finally {
      setLoading(false);
    }
  }, [search, category, skill, city, area, pincode, minExp, minRate, maxRate, minRating, isAvailable, isVerified, sortBy, page]);

  React.useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  const handleOpenBooking = (worker: WorkerItem) => {
    if (!user) {
      router.push(`/login?redirect=/workers`);
      return;
    }
    setSelectedWorker(worker);
    setBookCity(worker.locationCity || "Delhi NCR");
    setBookStartDate(new Date(Date.now() + 86400000).toISOString().split("T")[0]);
    setBookDays(1);
    setBookAddress("");
    setBookNotes("");
    setBookingError(null);
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    setBookingError(null);

    if (!bookStartDate || !bookAddress || !bookCity) {
      setBookingError("Start date, service address, and city are mandatory.");
      return;
    }

    try {
      setIsSubmittingBooking(true);
      const booking = await createBookingRequest({
        workerId: selectedWorker.userId || selectedWorker.user.id,
        serviceCategory: selectedWorker.category,
        startDate: new Date(bookStartDate).toISOString(),
        totalDays: bookDays,
        address: bookAddress,
        city: bookCity,
        notes: bookNotes || undefined,
      });

      setSelectedWorker(null);
      router.push(`/dashboard/customer/bookings/${booking.id}`);
    } catch (err: any) {
      setBookingError(err.message || "Failed to submit booking request.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1c1c1c] border border-[#2d2d2d] text-xs font-semibold text-[#D4AF37]">
            <HardHat className="h-3.5 w-3.5" />
            <span>Verified Artisan Directory</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Find Skilled Workers in India
          </h1>
          <p className="text-sm text-zinc-400">
            Discover verified masons, electricians, carpenters, plumbers and painters with genuine ratings and transparent daily wage rates.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Input
                placeholder="Search worker or skill..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="h-4 w-4" />}
                className="bg-[#191919] border-[#303030]"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-[#191919] border border-[#303030] text-xs font-semibold text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="ALL">All 32 Trade Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name} {c.hindiName ? `(${c.hindiName})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* City Dropdown */}
            <div>
              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-[#191919] border border-[#303030] text-xs font-semibold text-white focus:border-[#D4AF37] focus:outline-none"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full h-11 px-3.5 rounded-xl bg-[#191919] border border-[#303030] text-xs font-semibold text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="rating">Sort by: Top Rated First</option>
                <option value="rate">Sort by: Daily Rate (Low to High)</option>
                <option value="experience">Sort by: Most Experienced</option>
                <option value="completedJobs">Sort by: Most Completed Hires</option>
              </select>
            </div>
          </div>

          {/* Secondary Quick Toggles & Advanced Filter Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#222222] text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={isVerified === true}
                  onChange={(e) => {
                    setIsVerified(e.target.checked ? true : undefined);
                    setPage(1);
                  }}
                  className="rounded border-[#333333] bg-[#1a1a1a] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Verified Only
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={isAvailable === true}
                  onChange={(e) => {
                    setIsAvailable(e.target.checked ? true : undefined);
                    setPage(1);
                  }}
                  className="rounded border-[#333333] bg-[#1a1a1a] text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Available Now
                </span>
              </label>

              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  showAdvancedFilters || skill || area || pincode || minExp || minRate || maxRate || minRating
                    ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]"
                    : "bg-[#1c1c1c] border-[#303030] text-zinc-300 hover:border-zinc-500"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Filters &amp; Refinements</span>
                {(skill || area || pincode || minExp || minRate || maxRate || minRating) && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#D4AF37] text-black text-[10px] font-black">
                    {[skill, area, pincode, minExp, minRate, maxRate, minRating].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>

            <div className="text-zinc-500 font-medium">
              Showing <strong className="text-white">{pagination.totalResults}</strong> verified workers
            </div>
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-[#222222] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#111111] p-4 rounded-xl border border-[#262626]">
              {/* Skill Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Specialized Skill
                </label>
                <Input
                  placeholder="e.g. RCC, Tile, Wiring"
                  value={skill}
                  onChange={(e) => {
                    setSkill(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#191919] border-[#303030] text-xs h-9"
                />
              </div>

              {/* Area / Locality */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Area / Locality
                </label>
                <Input
                  placeholder="e.g. Sector 62, Andheri"
                  value={area}
                  onChange={(e) => {
                    setArea(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#191919] border-[#303030] text-xs h-9"
                />
              </div>

              {/* PIN Code */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  6-Digit PIN Code
                </label>
                <Input
                  placeholder="e.g. 201301"
                  value={pincode}
                  maxLength={6}
                  onChange={(e) => {
                    setPincode(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#191919] border-[#303030] text-xs h-9"
                />
              </div>

              {/* Min Experience */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Minimum Experience
                </label>
                <select
                  value={minExp}
                  onChange={(e) => {
                    setMinExp(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 px-3 rounded-lg bg-[#191919] border border-[#303030] text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="">Any Experience</option>
                  <option value="1">1+ Year Experience</option>
                  <option value="3">3+ Years Experience</option>
                  <option value="5">5+ Years Experience</option>
                  <option value="10">10+ Years Experience</option>
                </select>
              </div>

              {/* Min Daily Rate */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Min Daily Wage (₹)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={minRate}
                  onChange={(e) => {
                    setMinRate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#191919] border-[#303030] text-xs h-9"
                />
              </div>

              {/* Max Daily Rate */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Max Daily Wage (₹)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 2000"
                  value={maxRate}
                  onChange={(e) => {
                    setMaxRate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-[#191919] border-[#303030] text-xs h-9"
                />
              </div>

              {/* Min Rating */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Worker Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-9 px-3 rounded-lg bg-[#191919] border border-[#303030] text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="">All Ratings</option>
                  <option value="3.5">★ 3.5 &amp; above</option>
                  <option value="4.0">★ 4.0 &amp; above</option>
                  <option value="4.5">★ 4.5 &amp; above</option>
                  <option value="4.8">★ 4.8 &amp; above</option>
                </select>
              </div>

              {/* Clear Refinements */}
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => {
                    setSkill("");
                    setArea("");
                    setPincode("");
                    setMinExp("");
                    setMinRate("");
                    setMaxRate("");
                    setMinRating("");
                    setPage(1);
                  }}
                  className="h-9 border-[#383838] text-xs text-zinc-300 hover:text-white"
                >
                  Clear Refinements
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Workers Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            <p className="text-xs">Searching verified artisans in your region...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-2xl border border-dashed border-[#2b2b2b] bg-[#111111]">
            <HardHat className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
            <h3 className="text-base font-bold text-white">No Workers Match Your Filters</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              Try choosing &quot;All India&quot; or clearing your trade filter to see available workers in adjacent districts.
            </p>
            <div className="mt-4">
              <Button
                onClick={() => {
                  setSearch("");
                  setCategory("ALL");
                  setCity("All India");
                  setSkill("");
                  setArea("");
                  setPincode("");
                  setMinExp("");
                  setMinRate("");
                  setMaxRate("");
                  setMinRating("");
                  setIsVerified(undefined);
                  setIsAvailable(undefined);
                  setPage(1);
                }}
                variant="outline"
                size="sm"
                className="border-[#383838] text-xs text-zinc-300"
              >
                Reset All Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((w) => (
              <div
                key={w.id}
                className="bg-[#141414] border border-[#272727] rounded-2xl p-6 hover:border-[#D4AF37]/50 transition-all shadow-lg flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-black flex items-center justify-center font-black text-xl shadow-md shadow-[#D4AF37]/20">
                        {w.user?.name?.charAt(0) || "W"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-base text-white group-hover:text-[#D4AF37] transition-colors">
                            {w.user?.name}
                          </h3>
                          {w.isVerified && (
                            <span title="Verified Worker">
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#D4AF37] font-semibold mt-0.5">{w.category}</p>
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-zinc-500" />
                          {w.locationCity}, India
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-white">₹{w.dailyRate || 800}</span>
                      <span className="text-[10px] text-zinc-500 block">/ 8-hr day</span>
                    </div>
                  </div>

                  {/* Rating & Stats */}
                  <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-[#191919] border border-[#242424] text-center mb-4">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <span>{w.rating || "5.0"}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">Rating</span>
                    </div>
                    <div className="border-x border-[#2a2a2a]">
                      <div className="text-xs font-bold text-white">{w.experienceYears}y</div>
                      <span className="text-[10px] text-zinc-500">Experience</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{w.completedJobs || 0}</div>
                      <span className="text-[10px] text-zinc-500">Jobs Done</span>
                    </div>
                  </div>

                  {w.bio && (
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                      {w.bio}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#222222] flex items-center gap-2">
                  <Button
                    onClick={() => handleOpenBooking(w)}
                    variant="primary"
                    size="sm"
                    fullWidth
                    className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold text-xs"
                  >
                    Hire Worker
                  </Button>
                  <Link href={`/workers/${w.userId || w.id}`} className="w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      className="border-[#333333] text-zinc-300 hover:text-white text-xs"
                    >
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
              className="border-[#333333] text-xs"
            >
              Previous
            </Button>
            <span className="text-xs text-zinc-400 px-3">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              variant="outline"
              size="sm"
              className="border-[#333333] text-xs"
            >
              Next
            </Button>
          </div>
        )}

        {/* Booking Request Modal */}
        {selectedWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-lg rounded-2xl bg-[#141414] border border-[#2d2d2d] p-6 shadow-2xl space-y-5">
              <button
                onClick={() => setSelectedWorker(null)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-[#D4AF37] text-black flex items-center justify-center font-bold text-lg">
                  {selectedWorker.user?.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Book {selectedWorker.user?.name}</h3>
                  <p className="text-xs text-[#D4AF37] font-semibold">{selectedWorker.category} • ₹{selectedWorker.dailyRate}/day</p>
                </div>
              </div>

              {bookingError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                  {bookingError}
                </div>
              )}

              <form onSubmit={handleCreateBooking} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Service Start Date
                    </label>
                    <input
                      type="date"
                      value={bookStartDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setBookStartDate(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Total Days Needed
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={bookDays}
                      onChange={(e) => setBookDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full h-11 px-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Service City
                  </label>
                  <input
                    type="text"
                    value={bookCity}
                    onChange={(e) => setBookCity(e.target.value)}
                    placeholder="e.g. Noida, Sector 62"
                    className="w-full h-11 px-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Service Street Address / Site Location
                  </label>
                  <textarea
                    rows={2}
                    value={bookAddress}
                    onChange={(e) => setBookAddress(e.target.value)}
                    placeholder="Enter complete address where work is to be performed"
                    className="w-full p-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Work Description &amp; Requirements (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={bookNotes}
                    onChange={(e) => setBookNotes(e.target.value)}
                    placeholder="Explain the job scope, materials available, or special instructions"
                    className="w-full p-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-xs focus:border-[#D4AF37] outline-none"
                  />
                </div>

                {/* Wage Computation Preview */}
                <div className="p-3.5 rounded-xl bg-[#191919] border border-[#2d2d2d] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-zinc-400">Total Estimated Wage:</span>
                    <p className="text-[10px] text-zinc-500">₹{selectedWorker.dailyRate} × {bookDays} day(s)</p>
                  </div>
                  <div className="text-base font-black text-white">
                    ₹{((selectedWorker.dailyRate || 800) * bookDays).toLocaleString("en-IN")}
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={isSubmittingBooking}
                  className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold"
                >
                  {isSubmittingBooking ? "Sending Request..." : "Confirm & Send Booking Request"}
                </Button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function WorkersDirectoryPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
          <p className="text-xs">Loading worker directory...</p>
        </div>
      }
    >
      <WorkersDirectoryContent />
    </React.Suspense>
  );
}
