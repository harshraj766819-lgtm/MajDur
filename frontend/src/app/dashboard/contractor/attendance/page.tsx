"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarCheck,
  Building2,
  MapPin,
  Save,
  CheckCircle2,
  Clock,
  HardHat,
  Loader2,
  AlertCircle,
  Calendar,
  Users2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import {
  fetchContractorProjects,
  fetchProjectSites,
  fetchSiteWorkers,
  markSiteAttendance,
  fetchSiteAttendance,
  CommercialProject,
  CommercialSite,
  WorkerAssignmentItem,
  AttendanceRecordItem,
} from "@/lib/api";

function AttendancePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSiteId = searchParams.get("siteId") || "";

  const { user, loading: authLoading } = useAuth();

  const [projects, setProjects] = React.useState<CommercialProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [sites, setSites] = React.useState<CommercialSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>(preSiteId);
  const [selectedDate, setSelectedDate] = React.useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [workers, setWorkers] = React.useState<WorkerAssignmentItem[]>([]);
  const [attendanceMap, setAttendanceMap] = React.useState<
    Record<
      string,
      {
        status: string;
        hoursWorked: number;
        overtimeHours: number;
        notes: string;
      }
    >
  >({});

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/attendance");
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
          await loadWorkersAndAttendance(targetSite, selectedDate);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSiteChange(siteId: string) {
    setSelectedSiteId(siteId);
    await loadWorkersAndAttendance(siteId, selectedDate);
  }

  async function handleDateChange(newDate: string) {
    setSelectedDate(newDate);
    if (selectedSiteId) {
      await loadWorkersAndAttendance(selectedSiteId, newDate);
    }
  }

  async function loadWorkersAndAttendance(siteId: string, date: string) {
    try {
      setLoading(true);
      const [workersList, existingRecords] = await Promise.all([
        fetchSiteWorkers(siteId),
        fetchSiteAttendance(siteId, { date }),
      ]);

      setWorkers(workersList);

      const map: Record<string, any> = {};
      // Initialize with default or existing record
      workersList.forEach((w) => {
        const found = existingRecords.find((r) => r.workerId === w.workerId);
        if (found) {
          map[w.workerId] = {
            status: found.status,
            hoursWorked: found.hoursWorked || 8,
            overtimeHours: found.overtimeHours || 0,
            notes: found.notes || "",
          };
        } else {
          map[w.workerId] = {
            status: "PRESENT",
            hoursWorked: 8,
            overtimeHours: 0,
            notes: "",
          };
        }
      });

      setAttendanceMap(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function updateWorkerAttendance(workerId: string, field: string, val: any) {
    setAttendanceMap((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        [field]: val,
      },
    }));
  }

  async function handleSaveAttendance() {
    if (!selectedSiteId) return;

    try {
      setSaving(true);
      setSuccessMessage(null);

      const records = Object.keys(attendanceMap).map((workerId) => ({
        workerId,
        status: attendanceMap[workerId].status,
        hoursWorked: Number(attendanceMap[workerId].hoursWorked),
        overtimeHours: Number(attendanceMap[workerId].overtimeHours),
        notes: attendanceMap[workerId].notes,
      }));

      await markSiteAttendance(selectedSiteId, {
        date: selectedDate,
        records,
      });

      setSuccessMessage(`Site attendance for ${records.length} workers successfully recorded for ${selectedDate}!`);
    } catch (err: any) {
      alert(err.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  }

  // Attendance summary counts
  const presentCount = Object.values(attendanceMap).filter((a) => a.status === "PRESENT" || a.status === "OVERTIME").length;
  const absentCount = Object.values(attendanceMap).filter((a) => a.status === "ABSENT").length;
  const halfDayCount = Object.values(attendanceMap).filter((a) => a.status === "HALF_DAY").length;
  const overtimeCount = Object.values(attendanceMap).filter((a) => a.status === "OVERTIME" || a.overtimeHours > 0).length;

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Site Attendance...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Attendance" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <CalendarCheck className="h-8 w-8 text-[#D4AF37]" /> Daily Construction Site Attendance
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Mark shift muster rolls, log working hours and overtime, and monitor daily workforce turnout.
            </p>
          </div>

          <Button
            onClick={handleSaveAttendance}
            disabled={saving || workers.length === 0}
            variant="default"
            className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving Muster..." : "Save Site Attendance"}
          </Button>
        </div>

        {/* Site & Date Filter Bar */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
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

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-xs text-zinc-400">Date:</span>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="h-9 bg-zinc-900 border-zinc-700 text-xs text-white w-36"
              />
            </div>
          </div>

          {/* Quick Turnout Stats */}
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Present: {presentCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              Absent: {absentCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
              Half Day: {halfDayCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
              Overtime: {overtimeCount}
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Muster Roll Table */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#272727]">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HardHat className="h-5 w-5 text-[#D4AF37]" /> Daily Workforce Muster Roll ({workers.length} Workers)
            </h2>
            <span className="text-xs text-zinc-400">Date: {new Date(selectedDate).toLocaleDateString("en-IN")}</span>
          </div>

          {workers.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No workers allocated to this site. Assign workers from the Teams & Workforce tab to record attendance.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800">
                    <th className="pb-3 font-semibold">Worker</th>
                    <th className="pb-3 font-semibold">Trade</th>
                    <th className="pb-3 font-semibold">Turnout Status</th>
                    <th className="pb-3 font-semibold">Shift Hours</th>
                    <th className="pb-3 font-semibold">Overtime (Hrs)</th>
                    <th className="pb-3 font-semibold">Supervisor Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {workers.map((w) => {
                    const current = attendanceMap[w.workerId] || {
                      status: "PRESENT",
                      hoursWorked: 8,
                      overtimeHours: 0,
                      notes: "",
                    };

                    return (
                      <tr key={w.id} className="hover:bg-zinc-900/40">
                        <td className="py-3 font-medium text-white">
                          {w.worker?.name}
                          <span className="block text-[11px] text-zinc-400">{w.worker?.phone}</span>
                        </td>
                        <td className="py-3 font-semibold text-zinc-300">{w.trade}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            {["PRESENT", "ABSENT", "HALF_DAY", "OVERTIME"].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => updateWorkerAttendance(w.workerId, "status", st)}
                                className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                  current.status === st
                                    ? st === "PRESENT"
                                      ? "bg-emerald-500 text-black"
                                      : st === "ABSENT"
                                      ? "bg-rose-500 text-white"
                                      : st === "HALF_DAY"
                                      ? "bg-amber-500 text-black"
                                      : "bg-purple-500 text-white"
                                    : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                                }`}
                              >
                                {st.replace("_", " ")}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <Input
                            type="number"
                            value={current.hoursWorked}
                            onChange={(e) =>
                              updateWorkerAttendance(w.workerId, "hoursWorked", Number(e.target.value))
                            }
                            min={0}
                            max={16}
                            className="h-7 w-16 bg-zinc-900 border-zinc-700 text-white text-xs"
                          />
                        </td>
                        <td className="py-3">
                          <Input
                            type="number"
                            value={current.overtimeHours}
                            onChange={(e) =>
                              updateWorkerAttendance(w.workerId, "overtimeHours", Number(e.target.value))
                            }
                            min={0}
                            max={8}
                            step={0.5}
                            className="h-7 w-16 bg-zinc-900 border-zinc-700 text-white text-xs"
                          />
                        </td>
                        <td className="py-3">
                          <Input
                            value={current.notes}
                            onChange={(e) => updateWorkerAttendance(w.workerId, "notes", e.target.value)}
                            placeholder="e.g. Worked on 3rd floor slab"
                            className="h-7 bg-zinc-900 border-zinc-700 text-white text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-[#272727] text-center text-xs text-zinc-500">
          <p>MajDur B2B Workforce & Commercial Contracting Platform • Developed by Harsh Singh</p>
        </div>
      </div>
    </div>
  );
}

export default function AttendancePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <AttendancePageContent />
    </React.Suspense>
  );
}

