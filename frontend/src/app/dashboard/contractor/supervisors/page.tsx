"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  PlusCircle,
  MapPin,
  Phone,
  Mail,
  Building2,
  HardHat,
  Loader2,
  AlertCircle,
  X,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import {
  fetchContractorSupervisors,
  createContractorSupervisor,
  fetchContractorProjects,
  fetchProjectSites,
  assignSupervisorToSite,
  SupervisorItem,
  CommercialProject,
  CommercialSite,
} from "@/lib/api";

export default function SupervisorsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [supervisors, setSupervisors] = React.useState<SupervisorItem[]>([]);
  const [projects, setProjects] = React.useState<CommercialProject[]>([]);
  const [sites, setSites] = React.useState<CommercialSite[]>([]);
  const [loading, setLoading] = React.useState(true);

  // New Supervisor Modal
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("SITE_ENGINEER");
  const [responsibilities, setResponsibilities] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // Assign Site Modal
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [assignSupervisorId, setAssignSupervisorId] = React.useState("");
  const [assignSiteId, setAssignSiteId] = React.useState("");
  const [assignRole, setAssignRole] = React.useState("LEAD_SUPERVISOR");
  const [assigning, setAssigning] = React.useState(false);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/supervisors");
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadData();
      }
    }
  }, [user, authLoading, router]);

  async function loadData() {
    try {
      setLoading(true);
      const [sups, projs] = await Promise.all([
        fetchContractorSupervisors(),
        fetchContractorProjects(),
      ]);
      setSupervisors(sups);
      setProjects(projs);

      if (projs.length > 0) {
        const allSites = await fetchProjectSites(projs[0].id);
        setSites(allSites);
        if (allSites.length > 0) {
          setAssignSiteId(allSites[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSupervisor(e: React.FormEvent) {
    e.preventDefault();
    try {
      setCreating(true);
      await createContractorSupervisor({
        name,
        phone,
        email: email || null,
        role,
        responsibilities: responsibilities || null,
      });

      setShowCreateModal(false);
      setName("");
      setPhone("");
      setEmail("");
      setResponsibilities("");
      const sups = await fetchContractorSupervisors();
      setSupervisors(sups);
    } catch (err: any) {
      alert(err.message || "Failed to create supervisor");
    } finally {
      setCreating(false);
    }
  }

  function openAssignModal(supId: string) {
    setAssignSupervisorId(supId);
    setShowAssignModal(true);
  }

  async function handleAssignSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!assignSiteId || !assignSupervisorId) return;

    try {
      setAssigning(true);
      await assignSupervisorToSite(assignSiteId, {
        supervisorId: assignSupervisorId,
        role: assignRole,
      });

      setShowAssignModal(false);
      const sups = await fetchContractorSupervisors();
      setSupervisors(sups);
      alert("Supervisor successfully assigned to site!");
    } catch (err: any) {
      alert(err.message || "Failed to assign supervisor to site");
    } finally {
      setAssigning(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Site Supervisors...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Supervisors" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <ShieldCheck className="h-8 w-8 text-[#D4AF37]" /> Site Supervisors & Engineers
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Manage your licensed site engineers, safety inspectors, quality surveyors, and foremen.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateModal(true)}
            variant="default"
            className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Register Supervisor
          </Button>
        </div>

        {/* Supervisors Grid */}
        {supervisors.length === 0 ? (
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-12 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Supervisors Registered</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Add your site engineers and foremen to oversee daily attendance and generate certified work progress
              reports.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="default"
              className="bg-[#D4AF37] text-black font-bold"
            >
              Add Supervisor
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {supervisors.map((sup) => (
              <div
                key={sup.id}
                className="bg-[#141414] border border-[#272727] hover:border-[#D4AF37]/50 rounded-3xl p-6 flex flex-col justify-between transition-all shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      {sup.role.replace("_", " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                      {sup.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">{sup.name}</h3>
                    <div className="mt-2 space-y-1 text-xs text-zinc-400">
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-zinc-500" /> +91 {sup.phone}
                      </p>
                      {sup.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-zinc-500" /> {sup.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {sup.responsibilities && (
                    <p className="text-xs text-zinc-400 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                      {sup.responsibilities}
                    </p>
                  )}

                  {/* Assigned Sites */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-800 text-xs">
                    <span className="text-zinc-500 text-[11px] font-semibold uppercase block">Assigned Sites:</span>
                    {sup.siteAssignments && sup.siteAssignments.length > 0 ? (
                      <div className="space-y-1">
                        {sup.siteAssignments.map((sa) => (
                          <div
                            key={sa.id}
                            className="flex items-center justify-between text-zinc-300 bg-zinc-900/40 px-2 py-1 rounded"
                          >
                            <span>
                              {sa.site?.siteCode} - {sa.site?.name}
                            </span>
                            <span className="text-[10px] font-bold text-[#D4AF37]">{sa.role}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-[11px]">Unassigned to any specific site</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-zinc-800">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openAssignModal(sup.id)}
                    className="w-full text-xs border-zinc-700 hover:border-zinc-500 text-zinc-300"
                  >
                    Assign to Construction Site
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Register New Supervisor */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#D4AF37]" /> Register Site Supervisor
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSupervisor} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Supervisor Full Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Er. Rajesh Kulkarni"
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Phone Number</label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. 9811000000"
                      required
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-300 font-semibold">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full h-9 px-2 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                    >
                      <option value="SITE_ENGINEER">Site Engineer</option>
                      <option value="FOREMAN">Civil Foreman</option>
                      <option value="SAFETY_OFFICER">Safety Officer</option>
                      <option value="QUALITY_SURVEYOR">Quality Surveyor</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Email Address</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@acmeinfra.com"
                    className="bg-zinc-900 border-zinc-700 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Responsibilities & Scope</label>
                  <textarea
                    value={responsibilities}
                    onChange={(e) => setResponsibilities(e.target.value)}
                    rows={2}
                    placeholder="e.g. Structural quality assurance, daily attendance marking, and material sign-offs."
                    className="w-full p-2 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={creating}
                    size="sm"
                    variant="default"
                    className="bg-[#D4AF37] text-black font-bold"
                  >
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Supervisor"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Assign Supervisor to Site */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#181818] border border-[#2a2a2a] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#D4AF37]" /> Assign Supervisor to Site
                </h3>
                <button onClick={() => setShowAssignModal(false)} className="text-zinc-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Select Construction Site</label>
                  <select
                    value={assignSiteId}
                    onChange={(e) => setAssignSiteId(e.target.value)}
                    required
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                  >
                    {sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.siteCode} — {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-300 font-semibold">Assigned On-Site Designation</label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-700 text-white text-xs"
                  >
                    <option value="LEAD_SUPERVISOR">Lead Site Supervisor</option>
                    <option value="NIGHT_SUPERVISOR">Night Shift In-Charge</option>
                    <option value="SAFETY_INSPECTOR">Safety & Compliance Inspector</option>
                    <option value="ASSISTANT_ENGINEER">Assistant Site Engineer</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={assigning}
                    size="sm"
                    variant="default"
                    className="bg-[#D4AF37] text-black font-bold"
                  >
                    {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Assignment"}
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

