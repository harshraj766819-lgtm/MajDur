"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users2,
  Building2,
  PlusCircle,
  CheckCircle2,
  Clock,
  HardHat,
  IndianRupee,
  Search,
  Filter,
  Check,
  X,
  Loader2,
  AlertCircle,
  ChevronDown,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import {
  fetchContractorProjects,
  fetchProjectRecruitment,
  createProjectRecruitment,
  updateRecruitmentApplicationStatus,
  CommercialProject,
  RecruitmentRequestItem,
} from "@/lib/api";

function RecruitmentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedProjectId = searchParams.get("projectId") || "";

  const { user, loading: authLoading } = useAuth();

  const [projects, setProjects] = React.useState<CommercialProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(preSelectedProjectId);
  const [recruitmentDrives, setRecruitmentDrives] = React.useState<RecruitmentRequestItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // New Drive Modal / Form Toggle
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  // New Drive Form State
  const [driveTitle, setDriveTitle] = React.useState("");
  const [totalWorkersNeeded, setTotalWorkersNeeded] = React.useState<number | string>(50);
  const [dailyRate, setDailyRate] = React.useState<number | string>(850);
  const [shiftType, setShiftType] = React.useState("DAY");
  const [workingHours, setWorkingHours] = React.useState<number | string>(9);
  const [requiredExperience, setRequiredExperience] = React.useState<number | string>(2);
  const [notes, setNotes] = React.useState("");
  const [recruitmentDeadline, setRecruitmentDeadline] = React.useState("");

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/recruitment");
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadProjectsAndDrives();
      }
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (selectedProjectId) {
      loadDrivesForProject(selectedProjectId);
    }
  }, [selectedProjectId]);

  async function loadProjectsAndDrives() {
    try {
      setLoading(true);
      setError(null);
      const projList = await fetchContractorProjects();
      setProjects(projList);

      const targetId = selectedProjectId || (projList.length > 0 ? projList[0].id : "");
      if (targetId) {
        setSelectedProjectId(targetId);
        await loadDrivesForProject(targetId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load projects and drives");
    } finally {
      setLoading(false);
    }
  }

  async function loadDrivesForProject(projId: string) {
    try {
      const drives = await fetchProjectRecruitment(projId);
      setRecruitmentDrives(drives);
    } catch (err: any) {
      console.error(err);
    }
  }

  async function handleCreateDrive(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) {
      alert("Please select a commercial project first");
      return;
    }

    try {
      setCreating(true);
      await createProjectRecruitment(selectedProjectId, {
        title: driveTitle,
        totalWorkersNeeded: Number(totalWorkersNeeded),
        dailyRate: Number(dailyRate),
        shiftType,
        workingHours: Number(workingHours),
        requiredExperienceYears: Number(requiredExperience),
        recruitmentDeadline: recruitmentDeadline || null,
        notes: notes || null,
      });

      setShowCreateModal(false);
      setDriveTitle("");
      await loadDrivesForProject(selectedProjectId);
    } catch (err: any) {
      alert(err.message || "Failed to create recruitment drive");
    } finally {
      setCreating(false);
    }
  }

  async function handleApplicationStatus(appId: string, status: string) {
    try {
      await updateRecruitmentApplicationStatus(appId, status);
      if (selectedProjectId) {
        await loadDrivesForProject(selectedProjectId);
      }
    } catch (err: any) {
      alert(err.message || "Failed to update application status");
    }
  }

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Bulk Workforce Drives...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Bulk Recruitment" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Users2 className="h-8 w-8 text-[#D4AF37]" /> Bulk Worker Recruitment (10–100+ Workers)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Launch enterprise hiring drives across skilled trade trades, track applications, and allocate to sites.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Launch Bulk Drive
          </Button>
        </div>

        {/* Project Selector Bar */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Building2 className="h-5 w-5 text-[#D4AF37] flex-shrink-0" />
            <span className="text-xs font-semibold text-zinc-300">Select Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-[#D4AF37] w-full sm:w-80 cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-zinc-400 font-medium">
            Active Drives for this Project: <strong className="text-white">{recruitmentDrives.length}</strong>
          </span>
        </div>

        {/* Recruitment Drives List */}
        {recruitmentDrives.length === 0 ? (
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-12 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <Users2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Recruitment Drives Launched</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Launch a bulk hiring drive to recruit 10, 50, or 100+ skilled masons, electricians, and labourers for this
              project.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="default"
              className="bg-[#D4AF37] text-black font-bold"
            >
              Launch First Drive
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {recruitmentDrives.map((drive) => {
              const metrics = drive.metrics || {
                totalWorkersNeeded: drive.totalWorkersNeeded,
                applicationsReceived: drive.applications?.length || 0,
                workersShortlisted: 0,
                workersAccepted: 0,
                remainingVacancies: drive.totalWorkersNeeded,
                completionPercentage: 0,
              };

              return (
                <div
                  key={drive.id}
                  className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#272727] pb-5">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                          {drive.requestNumber}
                        </span>
                        <h2 className="text-xl font-bold text-white">{drive.title}</h2>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        Shift: <strong>{drive.shiftType}</strong> ({drive.workingHours} Hours/Day) • Wage:{" "}
                        <strong className="text-[#D4AF37]">₹{drive.dailyRate}/Day</strong> • Experience:{" "}
                        {drive.requiredExperienceYears}+ Years
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-xs text-zinc-400 font-medium">Fulfillment Status</span>
                        <p className="text-lg font-black text-white">
                          {metrics.workersAccepted} / {metrics.totalWorkersNeeded} Filled
                        </p>
                      </div>
                      <div className="w-24 bg-zinc-800 rounded-full h-3 overflow-hidden border border-zinc-700">
                        <div
                          className="bg-[#D4AF37] h-full transition-all duration-300"
                          style={{ width: `${metrics.completionPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4 Stats Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                      <span className="text-[11px] text-zinc-400 font-medium">Target Quota</span>
                      <p className="text-xl font-bold text-white mt-1">{metrics.totalWorkersNeeded} Workers</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                      <span className="text-[11px] text-zinc-400 font-medium">Applied</span>
                      <p className="text-xl font-bold text-blue-400 mt-1">{metrics.applicationsReceived}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                      <span className="text-[11px] text-zinc-400 font-medium">Shortlisted</span>
                      <p className="text-xl font-bold text-amber-400 mt-1">{metrics.workersShortlisted}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                      <span className="text-[11px] text-zinc-400 font-medium">Open Vacancies</span>
                      <p className="text-xl font-bold text-emerald-400 mt-1">{metrics.remainingVacancies}</p>
                    </div>
                  </div>

                  {/* Applicants Table */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-zinc-200">Candidate Applications for this Drive</h3>
                    {drive.applications && drive.applications.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-zinc-400 border-b border-zinc-800">
                              <th className="pb-3 font-semibold">Worker Name</th>
                              <th className="pb-3 font-semibold">Trade</th>
                              <th className="pb-3 font-semibold">Rate</th>
                              <th className="pb-3 font-semibold">Status</th>
                              <th className="pb-3 font-semibold text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/60">
                            {drive.applications.map((app: any) => (
                              <tr key={app.id} className="hover:bg-zinc-900/40">
                                <td className="py-3 font-medium text-white">
                                  {app.worker?.name || "Skilled Craftsman"}
                                  <span className="block text-[11px] text-zinc-400">{app.worker?.phone}</span>
                                </td>
                                <td className="py-3 text-zinc-300 font-semibold">{app.trade}</td>
                                <td className="py-3 font-bold text-[#D4AF37]">₹{app.proposedRate}/day</td>
                                <td className="py-3">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      app.status === "ACCEPTED"
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : app.status === "SHORTLISTED"
                                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                        : app.status === "REJECTED"
                                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                        : "bg-zinc-800 text-zinc-400"
                                    }`}
                                  >
                                    {app.status}
                                  </span>
                                </td>
                                <td className="py-3 text-right space-x-1.5">
                                  {app.status !== "ACCEPTED" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleApplicationStatus(app.id, "ACCEPTED")}
                                      className="h-7 px-2 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                    >
                                      Accept
                                    </Button>
                                  )}
                                  {app.status !== "SHORTLISTED" && app.status !== "ACCEPTED" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleApplicationStatus(app.id, "SHORTLISTED")}
                                      className="h-7 px-2 text-xs bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                                    >
                                      Shortlist
                                    </Button>
                                  )}
                                  {app.status !== "REJECTED" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleApplicationStatus(app.id, "REJECTED")}
                                      className="h-7 px-2 text-xs text-rose-400 hover:bg-rose-500/10"
                                    >
                                      Reject
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 py-3">No workers have applied to this drive yet.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Launch New Bulk Recruitment Drive */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Users2 className="h-5 w-5 text-[#D4AF37]" /> Launch Bulk Recruitment Drive
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Drive Title</label>
                  <Input
                    value={driveTitle}
                    onChange={(e) => setDriveTitle(e.target.value)}
                    placeholder="e.g. Masonry & Civil Workforce Drive (50 Workers)"
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Total Workers (Quota)</label>
                    <Input
                      type="number"
                      value={totalWorkersNeeded}
                      onChange={(e) => setTotalWorkersNeeded(e.target.value)}
                      min={1}
                      max={500}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Daily Wage Rate (₹)</label>
                    <Input
                      type="number"
                      value={dailyRate}
                      onChange={(e) => setDailyRate(e.target.value)}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Shift Type</label>
                    <select
                      value={shiftType}
                      onChange={(e) => setShiftType(e.target.value)}
                      className="w-full h-9 px-2 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                    >
                      <option value="DAY">DAY SHIFT (8:00 AM - 5:00 PM)</option>
                      <option value="NIGHT">NIGHT SHIFT (8:00 PM - 5:00 AM)</option>
                      <option value="ROTATIONAL">ROTATIONAL SHIFT</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Shift Hours</label>
                    <Input
                      type="number"
                      value={workingHours}
                      onChange={(e) => setWorkingHours(e.target.value)}
                      min={6}
                      max={12}
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Notes & Site Facilities</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Safety helmet provided, on-site drinking water, weekly cash payout available."
                    className="w-full p-2 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreateModal(false)}
                    className="text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    size="sm"
                    variant="default"
                    className="bg-[#D4AF37] text-black font-bold gap-1.5"
                  >
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlusCircle className="h-3.5 w-3.5" />}
                    Launch Drive
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-[#272727] text-center text-xs text-zinc-500">
          <p>MajDur B2B Workforce & Commercial Contracting Platform • Developed by Harsh Singh</p>
        </div>
      </div>
    </div>
  );
}

export default function BulkRecruitmentPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <RecruitmentPageContent />
    </React.Suspense>
  );
}

