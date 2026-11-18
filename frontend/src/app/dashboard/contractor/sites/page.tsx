"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MapPin,
  Building2,
  PlusCircle,
  Users2,
  HardHat,
  FileCheck2,
  CalendarCheck,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import {
  fetchContractorProjects,
  fetchProjectSites,
  createProjectSite,
  CommercialProject,
  CommercialSite,
} from "@/lib/api";

function SitesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedProjectId = searchParams.get("projectId") || "";

  const { user, loading: authLoading } = useAuth();

  const [projects, setProjects] = React.useState<CommercialProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = React.useState<string>(preSelectedProjectId);
  const [sites, setSites] = React.useState<CommercialSite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // New Site Modal
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  // Form State
  const [siteCode, setSiteCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("New Delhi");
  const [pincode, setPincode] = React.useState("110001");
  const [siteManager, setSiteManager] = React.useState("");

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/sites");
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadProjectsAndSites();
      }
    }
  }, [user, authLoading, router]);

  React.useEffect(() => {
    if (selectedProjectId) {
      loadSites(selectedProjectId);
    }
  }, [selectedProjectId]);

  async function loadProjectsAndSites() {
    try {
      setLoading(true);
      setError(null);
      const projList = await fetchContractorProjects();
      setProjects(projList);

      const targetId = selectedProjectId || (projList.length > 0 ? projList[0].id : "");
      if (targetId) {
        setSelectedProjectId(targetId);
        await loadSites(targetId);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  async function loadSites(projId: string) {
    try {
      const data = await fetchProjectSites(projId);
      setSites(data);
      setSiteCode(`SITE-${String(data.length + 1).padStart(2, "0")}`);
    } catch (err: any) {
      console.error(err);
    }
  }

  async function handleCreateSite(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProjectId) return;

    try {
      setCreating(true);
      await createProjectSite(selectedProjectId, {
        siteCode,
        name,
        address,
        city,
        pincode,
        siteManager: siteManager || null,
        status: "ACTIVE",
      });

      setShowCreateModal(false);
      setName("");
      setAddress("");
      setSiteManager("");
      await loadSites(selectedProjectId);
    } catch (err: any) {
      alert(err.message || "Failed to create site");
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || (loading && projects.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Construction Sites...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Multi-Sites" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <MapPin className="h-8 w-8 text-[#D4AF37]" /> Multi-Site Management
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Organize multiple operational construction sites, basements, blocks, and retail plazas under commercial
              contracts.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Add Sub-Site
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
            Active Sub-Sites: <strong className="text-white">{sites.length}</strong>
          </span>
        </div>

        {/* Sites Grid */}
        {sites.length === 0 ? (
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-12 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <MapPin className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Sites Registered</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Add your first construction sub-site, tower block, or phase under this commercial project.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="default"
              className="bg-[#D4AF37] text-black font-bold"
            >
              Add Site
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sites.map((site) => (
              <div
                key={site.id}
                className="bg-[#141414] border border-[#272727] hover:border-[#D4AF37]/50 rounded-3xl p-6 flex flex-col justify-between transition-all group shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                      {site.siteCode}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {site.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                      {site.name}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0 mt-0.5" />
                      <span>
                        {site.address}, {site.city} - {site.pincode}
                      </span>
                    </p>
                    {site.siteManager && (
                      <p className="text-xs text-zinc-500 mt-1">Manager: {site.siteManager}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-800/80 text-center">
                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase block">Workers</span>
                      <span className="text-sm font-bold text-white">
                        {site._count?.workerAssignments || 0}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase block">Teams</span>
                      <span className="text-sm font-bold text-amber-400">{site._count?.teams || 0}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <span className="text-[10px] text-zinc-500 uppercase block">Reports</span>
                      <span className="text-sm font-bold text-teal-400">{site._count?.dailyReports || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800 flex items-center justify-between">
                  <Link href={`/dashboard/contractor/attendance?siteId=${site.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-400 hover:text-white gap-1">
                      <CalendarCheck className="h-3.5 w-3.5" /> Attendance
                    </Button>
                  </Link>

                  <Link href={`/dashboard/contractor/reports?siteId=${site.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-[#D4AF37] hover:text-amber-200 gap-1">
                      <FileCheck2 className="h-3.5 w-3.5" /> Reports
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add New Site */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl relative">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#D4AF37]" /> Register New Construction Site
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSite} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Site Code</label>
                    <Input
                      value={siteCode}
                      onChange={(e) => setSiteCode(e.target.value)}
                      placeholder="e.g. SITE-02"
                      required
                      className="bg-zinc-900 border-zinc-700 text-white font-mono text-xs h-9 uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Site Manager / Engineer</label>
                    <Input
                      value={siteManager}
                      onChange={(e) => setSiteManager(e.target.value)}
                      placeholder="e.g. Er. Amit Saxena"
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Site Name / Tower Phase</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. North Retail Plaza & Atrium"
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Site Street Address</label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Gate 4, Metro Interchange, Barakhamba Road"
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">City</label>
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="New Delhi"
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">PIN Code</label>
                    <Input
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="110001"
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>
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
                    Register Site
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

export default function MultiSitesPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        </div>
      }
    >
      <SitesPageContent />
    </React.Suspense>
  );
}

