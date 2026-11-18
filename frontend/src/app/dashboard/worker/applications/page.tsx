"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Briefcase, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  IndianRupee, 
  Loader2, 
  AlertCircle,
  FileText,
  UserCheck,
  Ban
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { fetchWorkerApplications, withdrawJobApplication, JobApplicationItem } from "@/lib/api";

export default function WorkerApplicationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [applications, setApplications] = React.useState<JobApplicationItem[]>([]);
  const [selectedTab, setSelectedTab] = React.useState<string>("ALL");
  const [loading, setLoading] = React.useState(true);
  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const loadApps = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerApplications(selectedTab);
      setApplications(res);
    } catch (err: any) {
      setError(err.message || "Failed to load job applications");
    } finally {
      setLoading(false);
    }
  }, [selectedTab]);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/applications");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadApps();
      }
    }
  }, [user, authLoading, router, loadApps]);

  const handleWithdraw = async (id: string, jobTitle: string) => {
    if (!confirm(`Are you sure you want to withdraw your proposal for "${jobTitle}"?`)) return;
    try {
      setActionLoadingId(id);
      setError(null);
      await withdrawJobApplication(id);
      setSuccess(`Application for "${jobTitle}" was successfully withdrawn.`);
      await loadApps();
    } catch (err: any) {
      setError(err.message || "Failed to withdraw application");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Job Applications...</p>
      </div>
    );
  }

  const tabs = ["ALL", "PENDING", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN"];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
              <span>/</span>
              <span className="text-white">Job Applications</span>
            </div>
            <h1 className="text-2xl font-black text-white">Submitted Proposals & Applications</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Track status updates, client responses, and manage your active bids.
            </p>
          </div>

          <Link href="/dashboard/worker/jobs">
            <Button size="sm" className="font-bold text-xs">
              <Briefcase className="h-4 w-4 mr-1.5" /> Find More Jobs
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
              {tab === "ALL" ? "All Applications" : tab}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {applications.length === 0 ? (
          <div className="bg-[#141414] border border-[#222] rounded-2xl p-12 text-center">
            <FileText className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Applications Found</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
              You haven&apos;t placed any bids under this filter tab yet.
            </p>
            <Link href="/dashboard/worker/jobs" className="inline-block mt-4">
              <Button size="sm">Browse Open Jobs</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="bg-[#141414] border border-[#222] rounded-xl p-5 flex flex-col justify-between"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 uppercase">
                        {app.job.categoryName}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        app.status === "ACCEPTED" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                        app.status === "SHORTLISTED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        app.status === "REJECTED" ? "bg-rose-500/20 text-rose-400 border-rose-500/30" :
                        app.status === "WITHDRAWN" ? "bg-zinc-800 text-zinc-400 border-zinc-700" :
                        "bg-amber-500/20 text-amber-300 border-amber-500/30"
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1.5">{app.job.title}</h3>
                    <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-zinc-500" />
                      {app.job.city} • Posted by {app.job.poster?.name}
                    </p>
                  </div>

                  <div className="text-right sm:self-center">
                    <span className="text-xs text-zinc-500 block">Your Proposed Rate</span>
                    <span className="text-lg font-black text-white">₹{app.proposedRate}</span>
                  </div>
                </div>

                {app.coverNote && (
                  <div className="mt-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#262626] text-xs text-zinc-300">
                    <span className="text-zinc-500 font-semibold block mb-0.5">Your Cover Note:</span>
                    {app.coverNote}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-[#222] flex items-center justify-between text-xs text-zinc-500">
                  <span>Applied on: {new Date(app.createdAt).toLocaleDateString("en-IN")}</span>

                  {["PENDING", "SHORTLISTED"].includes(app.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actionLoadingId === app.id}
                      onClick={() => handleWithdraw(app.id, app.job.title)}
                      className="h-7 text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                    >
                      {actionLoadingId === app.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Ban className="h-3 w-3 mr-1" />}
                      Withdraw Proposal
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

