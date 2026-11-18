"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Briefcase, 
  Search, 
  MapPin, 
  IndianRupee, 
  Clock, 
  Calendar, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  SlidersHorizontal,
  ChevronRight,
  Send,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Alert } from "@/components/ui/alert";
import { fetchWorkerJobs, applyForJob, JobItem } from "@/lib/api";

const TRADE_CATEGORIES = [
  "All Trades",
  "Construction Labour", "Mason", "Electrician", "Plumber", "Carpenter",
  "Painter", "Welder", "Tile Worker", "POP Worker", "False Ceiling Worker",
  "Bar Bender", "Shuttering Worker", "Helper", "Housekeeping", "AC Technician",
  "Refrigerator Technician", "CCTV Technician", "Solar Technician", "Machine Operator",
  "Fabricator", "Glass Worker", "Aluminium Worker", "Waterproofing Worker",
  "Roofer", "Flooring Worker", "Interior Worker", "Gardner", "Pest Control Worker",
  "Driver", "Security Guard", "Heavy Equipment Operator", "General Maintenance Worker"
];

function WorkerJobsContent() {
  const searchParams = useSearchParams();

  const [jobs, setJobs] = React.useState<JobItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = React.useState(searchParams.get("category") || "All Trades");
  const [cityFilter, setCityFilter] = React.useState(searchParams.get("city") || "");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [jobTypeFilter, setJobTypeFilter] = React.useState("ALL");

  // Apply Modal state
  const [selectedJob, setSelectedJob] = React.useState<JobItem | null>(null);
  const [proposedRate, setProposedRate] = React.useState<number>(850);
  const [coverNote, setCoverNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const loadJobs = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (selectedCategory && selectedCategory !== "All Trades") params.category = selectedCategory;
      if (cityFilter.trim()) params.city = cityFilter.trim();
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (jobTypeFilter !== "ALL") params.jobType = jobTypeFilter;

      const res = await fetchWorkerJobs(params);
      setJobs(res);
    } catch (err: any) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, cityFilter, searchQuery, jobTypeFilter]);

  React.useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleOpenApplyModal = (job: JobItem) => {
    setSelectedJob(job);
    setProposedRate(job.budget || 850);
    setCoverNote("");
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await applyForJob({
        jobId: selectedJob.id,
        proposedRate: Number(proposedRate),
        coverNote: coverNote.trim() || undefined,
      });

      setSuccess(`Your application for "${selectedJob.title}" has been submitted!`);
      setSelectedJob(null);
      await loadJobs();
    } catch (err: any) {
      setError(err.message || "Failed to submit proposal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
              <span>/</span>
              <span className="text-white">Job Discovery</span>
            </div>
            <h1 className="text-2xl font-black text-white">Marketplace Job Proposals</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Explore open project requirements posted by customers and commercial contractors.
            </p>
          </div>

          <Link href="/dashboard/worker/applications">
            <Button variant="outline" className="border-[#333] hover:border-[#D4AF37] text-xs">
              <UserCheck className="h-4 w-4 mr-1.5 text-[#D4AF37]" /> My Submitted Applications
            </Button>
          </Link>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}
        {success && <Alert variant="success" title="Success">{success}</Alert>}

        {/* Filter Controls Bar */}
        <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title, keyword, or site..."
                className="pl-9 bg-[#1a1a1a]"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              >
                {TRADE_CATEGORIES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Input
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Filter by city (e.g. Delhi)"
                className="bg-[#1a1a1a]"
              />
              <Button onClick={loadJobs} variant="default" className="text-xs shrink-0 font-bold">
                Filter
              </Button>
            </div>
          </div>

          {/* Job Type Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-500 mr-1 font-medium">Work Type:</span>
            {["ALL", "ONE_TIME", "CONTRACT", "RECURRING"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setJobTypeFilter(type)}
                className={`px-3 py-1 rounded-full border text-[11px] font-bold transition-colors ${
                  jobTypeFilter === type
                    ? "bg-[#D4AF37] text-black border-[#D4AF37]"
                    : "bg-[#1a1a1a] text-zinc-400 border-[#2a2a2a] hover:border-zinc-500"
                }`}
              >
                {type === "ALL" ? "All Types" : type.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            <p className="text-sm">Fetching verified job posts...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-12 text-center">
            <Briefcase className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Jobs Found Matching Criteria</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Try changing your trade category filter, clearing your search keywords, or broadening your city selection.
            </p>
            <Button
              onClick={() => {
                setSelectedCategory("All Trades");
                setCityFilter("");
                setSearchQuery("");
                setJobTypeFilter("ALL");
              }}
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
            >
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-[#141414] border border-[#222] hover:border-[#383838] rounded-2xl p-5 flex flex-col justify-between transition-colors group shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 uppercase">
                        {job.categoryName}
                      </span>
                      <h3 className="text-base font-bold text-white mt-2 group-hover:text-[#D4AF37] transition-colors">
                        {job.title}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-lg font-black text-white">₹{job.budget}</span>
                      <span className="text-[11px] text-zinc-400 block">{job.budgetType}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                    {job.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500" />
                      {job.area ? `${job.area}, ` : ""}{job.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-500" />
                      {job.expectedDays ? `${job.expectedDays} Days` : "Short Job"}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-500">
                      Posted by {job.poster.name} ({job.poster.role})
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#222] flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {job._count?.applications || 0} Proposals received
                  </span>

                  {job.hasApplied ? (
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                      job.myApplication?.status === "ACCEPTED"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : job.myApplication?.status === "SHORTLISTED"
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : job.myApplication?.status === "REJECTED"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                    }`}>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Applied: {job.myApplication?.status || "PENDING"}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleOpenApplyModal(job)}
                      className="text-xs font-bold"
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" /> Apply Proposal
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Apply Proposal Modal */}
        <Modal
          isOpen={Boolean(selectedJob)}
          onClose={() => setSelectedJob(null)}
          title={`Apply for: ${selectedJob?.title}`}
        >
          {selectedJob && (
            <form onSubmit={handleApply} className="space-y-4">
              <div className="p-3 bg-[#1a1a1a] rounded-xl border border-[#282828] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Employer Budget:</span>
                  <span className="text-white font-bold">₹{selectedJob.budget} ({selectedJob.budgetType})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Location:</span>
                  <span className="text-white">{selectedJob.address}, {selectedJob.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Duration:</span>
                  <span className="text-white">{selectedJob.expectedDays || 1} Days estimated</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Your Proposed Rate (INR ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-zinc-400 font-bold">₹</span>
                  <Input
                    type="number"
                    min={100}
                    max={500000}
                    value={proposedRate}
                    onChange={(e) => setProposedRate(Number(e.target.value))}
                    className="pl-8 text-base font-bold text-white"
                    required
                  />
                </div>
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Enter your total quotation or daily bid for this job.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Cover Note / Message to Client
                </label>
                <textarea
                  rows={3}
                  value={coverNote}
                  onChange={(e) => setCoverNote(e.target.value)}
                  placeholder="Introduce yourself, mention relevant tools you bring, and your availability..."
                  className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setSelectedJob(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="font-bold">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Submit Application
                </Button>
              </div>
            </form>
          )}
        </Modal>

      </div>
    </div>
  );
}

export default function WorkerJobsPage() {
  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
      </div>
    }>
      <WorkerJobsContent />
    </React.Suspense>
  );
}

