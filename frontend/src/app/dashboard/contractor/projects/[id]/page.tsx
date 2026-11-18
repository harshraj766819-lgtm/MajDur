"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  MapPin,
  Calendar,
  Users2,
  HardHat,
  IndianRupee,
  Briefcase,
  PlusCircle,
  FileCheck2,
  ReceiptIndianRupee,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ContractorNav } from "@/components/contractor-nav";
import {
  fetchContractorProjectDetails,
  updateContractorProject,
  deleteContractorProject,
  downloadGstInvoicePdf,
  CommercialProject,
} from "@/lib/api";

export default function CommercialProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const { user, loading: authLoading } = useAuth();

  const [project, setProject] = React.useState<CommercialProject | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = React.useState(false);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push(`/login?redirect=/dashboard/contractor/projects/${projectId}`);
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else if (projectId) {
        loadProject();
      }
    }
  }, [user, authLoading, projectId, router]);

  async function loadProject() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchContractorProjectDetails(projectId);
      setProject(data);
    } catch (err: any) {
      setError(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!project) return;
    try {
      setStatusUpdating(true);
      const updated = await updateContractorProject(project.id, { status: newStatus });
      setProject((prev) => (prev ? { ...prev, status: updated.status } : null));
    } catch (err: any) {
      alert(err.message || "Failed to update project status");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDelete() {
    if (!project) return;
    if (!confirm(`Are you sure you want to delete project ${project.projectCode}? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteContractorProject(project.id);
      router.push("/dashboard/contractor/projects");
    } catch (err: any) {
      alert(err.message || "Failed to delete project");
    }
  }

  async function handleDownloadPdf(invoiceId: string, invoiceNumber: string) {
    try {
      setDownloadingId(invoiceId);
      await downloadGstInvoicePdf(invoiceId, invoiceNumber);
    } catch (err: any) {
      alert(err.message || "Failed to download PDF");
    } finally {
      setDownloadingId(null);
    }
  }

  if (authLoading || (loading && !project)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Commercial Project Hub...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 p-8 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-rose-400" />
        <h2 className="text-xl font-bold">Error Loading Project</h2>
        <p className="text-sm text-zinc-400">{error || "Project not found"}</p>
        <Link href="/dashboard/contractor/projects">
          <Button variant="outline">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Commercial Projects" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Top bar with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/contractor/projects"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#D4AF37] px-2 py-0.5 rounded bg-[#D4AF37]/15">
                  {project.projectCode}
                </span>
                <h1 className="text-2xl font-extrabold text-white">{project.name}</h1>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Client: <strong className="text-zinc-200">{project.clientName}</strong> • {project.city},{" "}
                {project.state}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-zinc-400">Status:</span>
              <select
                value={project.status}
                disabled={statusUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-[#D4AF37] focus:outline-none cursor-pointer"
              >
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="RECRUITMENT_OPEN">RECRUITMENT OPEN</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="ON_HOLD">ON HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-9"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Project Metrics Summary Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#272727]">
            <span className="text-xs text-zinc-400 font-medium">Commercial Budget</span>
            <p className="text-xl font-extrabold text-[#D4AF37] mt-1">
              ₹{Number(project.budget).toLocaleString("en-IN")}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#272727]">
            <span className="text-xs text-zinc-400 font-medium">Workforce Headcount</span>
            <p className="text-xl font-extrabold text-white mt-1">{project.totalWorkforceNeeded} Workers</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#272727]">
            <span className="text-xs text-zinc-400 font-medium">Sub-Sites</span>
            <p className="text-xl font-extrabold text-white mt-1">{project.sites?.length || 1} Sites</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141414] border border-[#272727]">
            <span className="text-xs text-zinc-400 font-medium">Timeline</span>
            <p className="text-xs font-semibold text-zinc-200 mt-1">
              {new Date(project.startDate).toLocaleDateString("en-IN")} →{" "}
              {project.endDate ? new Date(project.endDate).toLocaleDateString("en-IN") : "Ongoing"}
            </p>
          </div>
        </div>

        {/* Description & Trade Requirements */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-white">Project Scope & Specifications</h2>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{project.description}</p>

          <div className="pt-4 border-t border-zinc-800">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Required Skilled Trades:
            </span>
            <div className="flex flex-wrap gap-2">
              {project.requiredTrades.map((trade) => (
                <span
                  key={trade}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-zinc-800/80 text-zinc-200 border border-zinc-700"
                >
                  {trade}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Construction Sub-Sites */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#272727]">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Construction Sites ({project.sites?.length || 0})</h2>
            </div>
            <Link href={`/dashboard/contractor/sites?projectId=${project.id}`}>
              <Button size="sm" variant="default" className="bg-[#D4AF37] text-black hover:bg-amber-400 text-xs font-bold gap-1.5 h-8">
                <PlusCircle className="h-3.5 w-3.5" /> Add Sub-Site
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {project.sites && project.sites.length > 0 ? (
              project.sites.map((site: any) => (
                <div key={site.id} className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#D4AF37]">{site.siteCode}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                      {site.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{site.name}</h3>
                  <p className="text-xs text-zinc-400">{site.address}, {site.city}</p>
                  <div className="pt-2 text-xs text-zinc-500 flex items-center justify-between">
                    <span>{site._count?.workerAssignments || 0} Workers Deployed</span>
                    <span>{site._count?.dailyReports || 0} Daily Reports</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 col-span-3 py-4 text-center">
                No sub-sites registered yet.
              </p>
            )}
          </div>
        </div>

        {/* Bulk Recruitment Drives */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#272727]">
            <div className="flex items-center gap-2">
              <Users2 className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Bulk Recruitment Drives ({project.recruitmentRequests?.length || 0})
              </h2>
            </div>
            <Link href={`/dashboard/contractor/recruitment?projectId=${project.id}`}>
              <Button size="sm" variant="default" className="bg-[#D4AF37] text-black hover:bg-amber-400 text-xs font-bold gap-1.5 h-8">
                <PlusCircle className="h-3.5 w-3.5" /> Launch Bulk Drive
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {project.recruitmentRequests && project.recruitmentRequests.length > 0 ? (
              project.recruitmentRequests.map((req: any) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#D4AF37]">{req.requestNumber}</span>
                      <span className="text-sm font-bold text-white">{req.title}</span>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Target: {req.totalWorkersNeeded} Workers @ ₹{req.dailyRate}/day | Shift: {req.shiftType}
                    </p>
                  </div>

                  <Link href={`/dashboard/contractor/recruitment?projectId=${project.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs border-zinc-700">
                      Manage Applicants
                    </Button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-4 text-center">
                No recruitment drives launched for this project yet.
              </p>
            )}
          </div>
        </div>

        {/* GST Invoices attached to this project */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#272727]">
            <div className="flex items-center gap-2">
              <ReceiptIndianRupee className="h-5 w-5 text-teal-400" />
              <h2 className="text-base font-bold text-white">Project GST Invoices</h2>
            </div>
            <Link href={`/dashboard/contractor/invoices?projectId=${project.id}`}>
              <Button size="sm" variant="default" className="bg-[#D4AF37] text-black hover:bg-amber-400 text-xs font-bold gap-1.5 h-8">
                <PlusCircle className="h-3.5 w-3.5" /> Issue GST Invoice
              </Button>
            </Link>
          </div>

          <div className="overflow-x-auto">
            {project.gstInvoices && project.gstInvoices.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800">
                    <th className="pb-3 font-semibold">Invoice No</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Taxable</th>
                    <th className="pb-3 font-semibold">Grand Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {project.gstInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-zinc-900/40">
                      <td className="py-3 font-mono font-bold text-[#D4AF37]">{inv.invoiceNumber}</td>
                      <td className="py-3 text-zinc-400">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 text-zinc-300">₹{Number(inv.taxableAmount).toLocaleString("en-IN")}</td>
                      <td className="py-3 font-bold text-white">₹{Number(inv.grandTotal).toLocaleString("en-IN")}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300">
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={downloadingId === inv.id}
                          onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                          className="h-8 text-[#D4AF37] gap-1 text-xs"
                        >
                          {downloadingId === inv.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-zinc-500 py-4 text-center">No invoices issued for this project yet.</p>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-[#272727] text-center text-xs text-zinc-500">
          <p>MajDur B2B Workforce & Commercial Contracting Platform • Developed by Harsh Singh</p>
        </div>
      </div>
    </div>
  );
}

