"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HardHat,
  Users2,
  Building2,
  MapPin,
  PlusCircle,
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  X,
  Phone,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import {
  fetchContractorProjects,
  fetchProjectSites,
  fetchSiteTeams,
  createSiteTeam,
  fetchSiteWorkers,
  assignWorkerToSite,
  transferWorkerAssignment,
  CommercialProject,
  CommercialSite,
  SiteTeam,
  WorkerAssignmentItem,
} from "@/lib/api";

function TeamsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSiteId = searchParams.get("siteId") || "";

  const { user, loading: authLoading } = useAuth();

  const [projects, setProjects] = React.useState<CommercialProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [sites, setSites] = React.useState<CommercialSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>(preSiteId);

  const [teams, setTeams] = React.useState<SiteTeam[]>([]);
  const [workers, setWorkers] = React.useState<WorkerAssignmentItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Create Team Modal
  const [showTeamModal, setShowTeamModal] = React.useState(false);
  const [teamName, setTeamName] = React.useState("");
  const [teamTrade, setTeamTrade] = React.useState("Mason");
  const [teamLeadName, setTeamLeadName] = React.useState("");
  const [teamLeadPhone, setTeamLeadPhone] = React.useState("");
  const [teamShift, setTeamShift] = React.useState<"MORNING" | "DAY" | "NIGHT">("DAY");
  const [creatingTeam, setCreatingTeam] = React.useState(false);

  // Transfer Worker Modal
  const [showTransferModal, setShowTransferModal] = React.useState(false);
  const [selectedAssignment, setSelectedAssignment] = React.useState<WorkerAssignmentItem | null>(null);
  const [targetSiteId, setTargetSiteId] = React.useState("");
  const [transferReason, setTransferReason] = React.useState("");
  const [transferring, setTransferring] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/teams");
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        initData();
      }
    }
  }, [user, authLoading, router]);

  async function initData() {
    try {
      setLoading(true);
      const projList = await fetchContractorProjects();
      setProjects(projList);

      if (projList.length > 0) {
        const firstProjId = projList[0].id;
        setSelectedProjectId(firstProjId);
        const siteList = await fetchProjectSites(firstProjId);
        setSites(siteList);

        const targetSite = preSiteId || (siteList.length > 0 ? siteList[0].id : "");
        if (targetSite) {
          setSelectedSiteId(targetSite);
          await loadSiteData(targetSite);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProjectChange(projId: string) {
    setSelectedProjectId(projId);
    try {
      const siteList = await fetchProjectSites(projId);
      setSites(siteList);
      if (siteList.length > 0) {
        setSelectedSiteId(siteList[0].id);
        await loadSiteData(siteList[0].id);
      } else {
        setSelectedSiteId("");
        setTeams([]);
        setWorkers([]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSiteChange(siteId: string) {
    setSelectedSiteId(siteId);
    await loadSiteData(siteId);
  }

  async function loadSiteData(siteId: string) {
    try {
      const [teamsData, workersData] = await Promise.all([
        fetchSiteTeams(siteId),
        fetchSiteWorkers(siteId),
      ]);
      setTeams(teamsData);
      setWorkers(workersData);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSiteId) return;

    try {
      setCreatingTeam(true);
      await createSiteTeam(selectedSiteId, {
        name: teamName,
        trade: teamTrade,
        teamLeaderName: teamLeadName,
        teamLeaderPhone: teamLeadPhone,
        shift: teamShift,
      });

      setShowTeamModal(false);
      setTeamName("");
      setTeamLeadName("");
      setTeamLeadPhone("");
      await loadSiteData(selectedSiteId);
    } catch (err: any) {
      alert(err.message || "Failed to create team");
    } finally {
      setCreatingTeam(false);
    }
  }

  function openTransferModal(assignment: WorkerAssignmentItem) {
    setSelectedAssignment(assignment);
    const availableTargets = sites.filter((s) => s.id !== selectedSiteId);
    if (availableTargets.length > 0) {
      setTargetSiteId(availableTargets[0].id);
    }
    setTransferReason("");
    setShowTransferModal(true);
  }

  async function handleTransferSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAssignment || !targetSiteId) {
      alert("Please select a target destination site");
      return;
    }

    try {
      setTransferring(true);
      await transferWorkerAssignment(selectedAssignment.id, {
        targetSiteId,
        reason: transferReason || "Operational workforce reallocation",
      });

      setShowTransferModal(false);
      await loadSiteData(selectedSiteId);
      alert(`Worker ${selectedAssignment.worker?.name} successfully transferred!`);
    } catch (err: any) {
      alert(err.message || "Failed to transfer worker");
    } finally {
      setTransferring(false);
    }
  }

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Teams & Workforce Allocations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Teams & Workforce" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <HardHat className="h-8 w-8 text-[#D4AF37]" /> Teams & Workforce Allocations
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Structure specialized trade squads, assign team leads, and transfer workers across construction sites.
            </p>
          </div>

          <Button
            onClick={() => setShowTeamModal(true)}
            disabled={!selectedSiteId}
            variant="default"
            className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Create Site Squad / Team
          </Button>
        </div>

        {/* Project & Site Selector Bar */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-xs text-zinc-400">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="h-9 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.projectCode} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-zinc-400">Site:</span>
              <select
                value={selectedSiteId}
                onChange={(e) => handleSiteChange(e.target.value)}
                className="h-9 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.siteCode} — {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span>
              Active Squads: <strong className="text-white">{teams.length}</strong>
            </span>
            <span>
              Deployed Workers: <strong className="text-emerald-400">{workers.length}</strong>
            </span>
          </div>
        </div>

        {/* Squads / Teams Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users2 className="h-5 w-5 text-amber-400" /> Site Trade Squads
          </h2>

          {teams.length === 0 ? (
            <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 text-center text-xs text-zinc-500">
              No specialized squads created on this site yet. Click &quot;Create Site Squad&quot; to group workers under a foreman.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teams.map((t) => (
                <div key={t.id} className="p-4 rounded-2xl bg-[#141414] border border-[#272727] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF37]/15 text-[#D4AF37]">
                      {t.trade}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-semibold">{t.shift} SHIFT</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{t.name}</h3>
                  {t.teamLeaderName && (
                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" /> Lead: {t.teamLeaderName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Workers Roster */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#272727]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HardHat className="h-5 w-5 text-emerald-400" /> Active Site Workforce Roster ({workers.length})
            </h2>
            <span className="text-xs text-zinc-400">Showing all workers actively deployed to this site</span>
          </div>

          {workers.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No workers allocated to this site yet. Accept workers from the Bulk Recruitment drives to allocate them.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800">
                    <th className="pb-3 font-semibold">Worker Name</th>
                    <th className="pb-3 font-semibold">Trade</th>
                    <th className="pb-3 font-semibold">Team / Squad</th>
                    <th className="pb-3 font-semibold">Daily Wage</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Transfer Site</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {workers.map((w) => (
                    <tr key={w.id} className="hover:bg-zinc-900/40">
                      <td className="py-3 font-medium text-white">
                        {w.worker?.name}
                        <span className="block text-[11px] text-zinc-400">{w.worker?.phone}</span>
                      </td>
                      <td className="py-3 font-semibold text-zinc-300">{w.trade}</td>
                      <td className="py-3 text-zinc-400">{w.team?.name || "General Civil"}</td>
                      <td className="py-3 font-bold text-[#D4AF37]">₹{w.dailyWage}/day</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.status === "ACTIVE"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openTransferModal(w)}
                          disabled={sites.length <= 1}
                          className="h-7 px-2 text-xs text-blue-400 hover:bg-blue-500/10 gap-1"
                        >
                          <ArrowRightLeft className="h-3 w-3" /> Reallocate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Create Site Squad */}
        {showTeamModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <HardHat className="h-5 w-5 text-[#D4AF37]" /> Create Site Squad / Team
                </h3>
                <button onClick={() => setShowTeamModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Squad Name</label>
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. Alpha Civil & Masonry Squad"
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Trade Specialty</label>
                    <Input
                      value={teamTrade}
                      onChange={(e) => setTeamTrade(e.target.value)}
                      placeholder="e.g. Mason"
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Shift</label>
                    <select
                      value={teamShift}
                      onChange={(e: any) => setTeamShift(e.target.value)}
                      className="w-full h-9 px-2 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                    >
                      <option value="MORNING">MORNING (6 AM - 2 PM)</option>
                      <option value="DAY">DAY (8 AM - 5 PM)</option>
                      <option value="NIGHT">NIGHT (8 PM - 5 AM)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Team Leader / Head Mason Name</label>
                  <Input
                    value={teamLeadName}
                    onChange={(e) => setTeamLeadName(e.target.value)}
                    placeholder="e.g. Master Mason Vikram"
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Team Leader Phone</label>
                  <Input
                    value={teamLeadPhone}
                    onChange={(e) => setTeamLeadPhone(e.target.value)}
                    placeholder="e.g. 9811000000"
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowTeamModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingTeam} size="sm" variant="default" className="bg-[#D4AF37] text-black font-bold">
                    {creatingTeam ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Squad"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Transfer Worker Between Sites */}
        {showTransferModal && selectedAssignment && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-blue-400" /> Reallocate Worker to Site
                </h3>
                <button onClick={() => setShowTransferModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-500">Worker</span>
                  <p className="text-sm font-bold text-white">{selectedAssignment.worker?.name}</p>
                  <p className="text-xs text-[#D4AF37] font-semibold">{selectedAssignment.trade} • ₹{selectedAssignment.dailyWage}/day</p>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Target Destination Site</label>
                  <select
                    value={targetSiteId}
                    onChange={(e) => setTargetSiteId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                  >
                    {sites
                      .filter((s) => s.id !== selectedSiteId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.siteCode} — {s.name} ({s.city})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Reason for Site Transfer</label>
                  <Input
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    placeholder="e.g. Urgent masonry reinforcement needed at Retail Plaza"
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowTransferModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={transferring}
                    size="sm"
                    variant="default"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold"
                  >
                    {transferring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Transfer"}
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

export default function TeamsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <TeamsPageContent />
    </React.Suspense>
  );
}

