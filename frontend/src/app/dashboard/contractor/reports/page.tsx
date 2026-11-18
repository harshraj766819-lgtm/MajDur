"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FileCheck2,
  Building2,
  MapPin,
  Calendar,
  Users2,
  PlusCircle,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudSun,
  Camera,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import {
  fetchContractorProjects,
  fetchProjectSites,
  createDailyWorkReport,
  fetchSiteDailyReports,
  CommercialProject,
  CommercialSite,
  DailyWorkReportItem,
} from "@/lib/api";

function DailyReportsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSiteId = searchParams.get("siteId") || "";

  const { user, loading: authLoading } = useAuth();

  const [projects, setProjects] = React.useState<CommercialProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>("");
  const [sites, setSites] = React.useState<CommercialSite[]>([]);
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>(preSiteId);

  const [reports, setReports] = React.useState<DailyWorkReportItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  // New Report Modal
  const [showModal, setShowModal] = React.useState(false);
  const [reportDate, setReportDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [progressPercentage, setProgressPercentage] = React.useState<number | string>(15);
  const [workforcePresent, setWorkforcePresent] = React.useState<number | string>(25);
  const [completedWork, setCompletedWork] = React.useState("");
  const [issuesEncountered, setIssuesEncountered] = React.useState("");
  const [weatherCondition, setWeatherCondition] = React.useState("CLEAR");
  const [photoUrl, setPhotoUrl] = React.useState("");
  const [photos, setPhotos] = React.useState<string[]>([
    "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=600&q=80",
  ]);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/reports");
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
          await loadReports(targetSite);
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
    await loadReports(siteId);
  }

  async function loadReports(siteId: string) {
    try {
      setLoading(true);
      const data = await fetchSiteDailyReports(siteId);
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleAddPhoto() {
    if (photoUrl.trim()) {
      setPhotos([...photos, photoUrl.trim()]);
      setPhotoUrl("");
    }
  }

  function removePhoto(idx: number) {
    setPhotos(photos.filter((_, i) => i !== idx));
  }

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSiteId) return;

    try {
      setSubmitting(true);
      await createDailyWorkReport(selectedSiteId, {
        date: reportDate,
        progressPercentage: Number(progressPercentage),
        workforcePresent: Number(workforcePresent),
        completedWork,
        issuesEncountered: issuesEncountered || null,
        weatherCondition,
        photos,
      });

      setShowModal(false);
      setCompletedWork("");
      setIssuesEncountered("");
      await loadReports(selectedSiteId);
    } catch (err: any) {
      alert(err.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Daily Progress Reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Daily Reports" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <FileCheck2 className="h-8 w-8 text-[#D4AF37]" /> Daily Work Progress Reports (DPR)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Record daily civil milestones, concrete pours, structural progress, weather conditions, and site photography.
            </p>
          </div>

          <Button
            onClick={() => setShowModal(true)}
            disabled={!selectedSiteId}
            variant="default"
            className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Submit Daily Progress Report
          </Button>
        </div>

        {/* Site Selector Bar */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <MapPin className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-zinc-300">Construction Site:</span>
            <select
              value={selectedSiteId}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs sm:text-sm text-white font-medium focus:outline-none focus:border-[#D4AF37] w-full sm:w-80 cursor-pointer"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.siteCode} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-zinc-400 font-medium">
            Recorded Reports: <strong className="text-white">{reports.length}</strong>
          </span>
        </div>

        {/* Reports Timeline Feed */}
        {reports.length === 0 ? (
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-12 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <FileCheck2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Progress Reports Found</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Submit your first Daily Progress Report to log workforce turnout, work completion, and site photos.
            </p>
            <Button onClick={() => setShowModal(true)} variant="default" className="bg-[#D4AF37] text-black font-bold">
              Submit Today&apos;s DPR
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#272727] pb-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-xl text-xs font-mono font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                      {new Date(report.reportDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Site: <strong className="text-zinc-200">{report.site?.name || "Main Site"}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <CloudSun className="h-4 w-4 text-amber-400" />
                      Weather: <strong className="text-white">{report.weatherCondition || "CLEAR"}</strong>
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                      <Users2 className="h-4 w-4 text-emerald-400" />
                      Workforce: <strong className="text-white">{report.workforcePresent} Workers</strong>
                    </span>
                    <span className="px-3 py-0.5 rounded-full text-xs font-black bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {report.progressPercentage}% Completed
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    Completed Construction Works:
                  </span>
                  <p className="text-sm text-zinc-200 whitespace-pre-line leading-relaxed">{report.completedWork}</p>
                </div>

                {report.issuesEncountered && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" /> Delay / Operational Constraint:
                    </span>
                    <p>{report.issuesEncountered}</p>
                  </div>
                )}

                {/* Progress Photos */}
                {report.photos && report.photos.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Camera className="h-3.5 w-3.5 text-[#D4AF37]" /> Site Progress Photos:
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {report.photos.map((src, i) => (
                        <div key={i} className="relative h-24 w-36 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Progress photo ${i + 1}`} className="h-full w-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal: Submit DPR */}
        {showModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-[#D4AF37]" /> Submit Daily Work Progress Report
                </h3>
                <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Report Date</label>
                    <Input
                      type="date"
                      value={reportDate}
                      onChange={(e) => setReportDate(e.target.value)}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Weather Condition</label>
                    <select
                      value={weatherCondition}
                      onChange={(e) => setWeatherCondition(e.target.value)}
                      className="w-full h-9 px-2 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                    >
                      <option value="CLEAR">CLEAR / SUNNY</option>
                      <option value="RAIN">RAIN / WATERLOGGED</option>
                      <option value="EXTREME_HEAT">EXTREME HEAT (&gt;42°C)</option>
                      <option value="DUST_STORM">DUST / HIGH WINDS</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Overall Progress (%)</label>
                    <Input
                      type="number"
                      step={0.1}
                      min={0}
                      max={100}
                      value={progressPercentage}
                      onChange={(e) => setProgressPercentage(e.target.value)}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Workforce Present</label>
                    <Input
                      type="number"
                      value={workforcePresent}
                      onChange={(e) => setWorkforcePresent(e.target.value)}
                      min={1}
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">
                    Detailed Summary of Completed Works <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={completedWork}
                    onChange={(e) => setCompletedWork(e.target.value)}
                    rows={4}
                    placeholder="e.g. Footing concrete pour completed for columns C1-C12. Level 1 blockwork completed 1500 sq ft. Electrician piping embedded in slab."
                    required
                    className="w-full p-2.5 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Delays, Site Incidents, or Material Bottlenecks</label>
                  <Input
                    value={issuesEncountered}
                    onChange={(e) => setIssuesEncountered(e.target.value)}
                    placeholder="e.g. 45 min cement mixer transit delay due to traffic."
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                {/* Photo URLs */}
                <div className="space-y-2">
                  <label className="text-zinc-300 font-semibold">Site Photography URLs</label>
                  <div className="flex gap-2">
                    <Input
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                    <Button type="button" size="sm" onClick={handleAddPhoto} variant="outline" className="h-9 text-xs">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {photos.map((url, i) => (
                      <span key={i} className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-300">
                        Photo {i + 1}
                        <button type="button" onClick={() => removePhoto(i)} className="text-rose-400 hover:text-white">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    size="sm"
                    variant="default"
                    className="bg-[#D4AF37] text-black font-bold"
                  >
                    {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit DPR"}
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

export default function DailyReportsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <DailyReportsPageContent />
    </React.Suspense>
  );
}

