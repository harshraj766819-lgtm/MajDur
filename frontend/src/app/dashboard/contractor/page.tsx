"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users2,
  HardHat,
  ShieldCheck,
  ReceiptIndianRupee,
  CalendarCheck,
  FileCheck2,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock,
  Phone,
  FileText,
  Download,
  AlertCircle,
  BriefcaseBusiness,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ContractorNav } from "@/components/contractor-nav";
import {
  fetchContractorDashboard,
  downloadGstInvoicePdf,
  ContractorDashboardData,
} from "@/lib/api";

export default function ContractorDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [dashboardData, setDashboardData] = React.useState<ContractorDashboardData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor");
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadDashboard();
      }
    }
  }, [user, authLoading, router]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchContractorDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Dashboard error:", err);
      setError(err.message || "Failed to load contractor dashboard data");
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf(invoiceId: string, invoiceNumber: string) {
    try {
      setDownloadingId(invoiceId);
      await downloadGstInvoicePdf(invoiceId, invoiceNumber);
    } catch (err: any) {
      alert(err.message || "Failed to download PDF invoice");
    } finally {
      setDownloadingId(null);
    }
  }

  if (authLoading || (loading && !dashboardData)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Enterprise Contractor Dashboard...</p>
      </div>
    );
  }

  const contractor = dashboardData?.contractor;
  const stats = dashboardData?.stats || {
    totalProjects: 0,
    activeProjects: 0,
    totalSites: 0,
    activeSites: 0,
    allocatedWorkers: 0,
    activeSupervisors: 0,
    totalSupervisors: 0,
    totalInvoices: 0,
    totalInvoiced: 0,
    totalInvoicedAmount: 0,
    outstandingAmount: 0,
    pendingInvoicesCount: 0,
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      {/* Contractor Navigation */}
      <ContractorNav activeTab="Overview" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Contractor Profile Hero Banner */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 h-64 w-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-200 text-black flex items-center justify-center font-black text-2xl shadow-xl shadow-[#D4AF37]/20 flex-shrink-0">
                <Building2 className="h-9 w-9 sm:h-11 sm:w-11" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {contractor?.companyName || user?.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40">
                    B2B Enterprise Contractor
                  </span>
                  {contractor?.isVerified && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="h-3 w-3" /> Verified Business
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-zinc-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                  <span>
                    Proprietor: <strong className="text-zinc-200">{contractor?.ownerName || user?.name}</strong>
                  </span>
                  <span>
                    GSTIN: <span className="font-mono text-amber-300 font-semibold">{contractor?.gstNumber || contractor?.gstin || "Pending Registration"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                    {contractor?.city}, {contractor?.state}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard/contractor/projects/create">
                <Button variant="default" className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold gap-2">
                  <PlusCircle className="h-4 w-4" />
                  New Project
                </Button>
              </Link>
              <Link href="/dashboard/contractor/recruitment">
                <Button variant="outline" className="border-zinc-700 hover:border-zinc-500 text-zinc-200 gap-2">
                  <Users2 className="h-4 w-4 text-[#D4AF37]" />
                  Bulk Recruitment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 6 Key Operational & Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Projects Card */}
          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Commercial Projects</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{stats.totalProjects}</span>
              <span className="text-xs font-medium text-emerald-400">
                ({stats.activeProjects} Active On-Site)
              </span>
            </div>
            <Link
              href="/dashboard/contractor/projects"
              className="mt-4 text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              Manage all projects <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Active Sites Card */}
          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Multi-Sites</span>
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <MapPin className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{stats.totalSites}</span>
              <span className="text-xs font-medium text-amber-400">
                ({stats.activeSites} Sites Operating)
              </span>
            </div>
            <Link
              href="/dashboard/contractor/sites"
              className="mt-4 text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              View site locations <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Allocated Workforce Card */}
          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Deployed Workforce</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <HardHat className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{stats.allocatedWorkers}</span>
              <span className="text-xs font-medium text-zinc-400">Workers Assigned</span>
            </div>
            <Link
              href="/dashboard/contractor/teams"
              className="mt-4 text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              Workforce & team allocations <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Site Supervisors Card */}
          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Site Supervisors</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">{stats.activeSupervisors}</span>
              <span className="text-xs font-medium text-purple-400">Engineers & Leads</span>
            </div>
            <Link
              href="/dashboard/contractor/supervisors"
              className="mt-4 text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              Assign supervisors <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Total Invoiced Card */}
          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total B2B Invoiced</span>
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <ReceiptIndianRupee className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white">
                ₹{Number(stats.totalInvoiced || 0).toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-medium text-zinc-400">
                ({stats.totalInvoices} Invoices)
              </span>
            </div>
            <Link
              href="/dashboard/contractor/invoices"
              className="mt-4 text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              View billing statements <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Outstanding B2B Balance Card */}
          <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 relative overflow-hidden group hover:border-[#D4AF37]/50 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Pending Receivables</span>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-rose-400">
                ₹{Number(stats.outstandingAmount || 0).toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-medium text-rose-400/80">
                ({stats.pendingInvoicesCount} Unsettled)
              </span>
            </div>
            <Link
              href="/dashboard/contractor/invoices"
              className="mt-4 text-xs font-semibold text-[#D4AF37] hover:underline flex items-center gap-1"
            >
              Track payments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Quick Action Operations Hub */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Operations & Workforce Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/dashboard/contractor/projects/create"
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/60 hover:bg-zinc-800/80 flex flex-col items-center text-center gap-2.5 transition-all group"
            >
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-[#D4AF37]/20 group-hover:text-[#D4AF37]">
                <Building2 className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200">New Project</span>
            </Link>

            <Link
              href="/dashboard/contractor/recruitment"
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/60 hover:bg-zinc-800/80 flex flex-col items-center text-center gap-2.5 transition-all group"
            >
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-[#D4AF37]/20 group-hover:text-[#D4AF37]">
                <Users2 className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200">Recruit 10-100+</span>
            </Link>

            <Link
              href="/dashboard/contractor/sites"
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/60 hover:bg-zinc-800/80 flex flex-col items-center text-center gap-2.5 transition-all group"
            >
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-[#D4AF37]/20 group-hover:text-[#D4AF37]">
                <MapPin className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200">Add Site</span>
            </Link>

            <Link
              href="/dashboard/contractor/attendance"
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/60 hover:bg-zinc-800/80 flex flex-col items-center text-center gap-2.5 transition-all group"
            >
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-[#D4AF37]/20 group-hover:text-[#D4AF37]">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200">Site Attendance</span>
            </Link>

            <Link
              href="/dashboard/contractor/reports"
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/60 hover:bg-zinc-800/80 flex flex-col items-center text-center gap-2.5 transition-all group"
            >
              <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 group-hover:bg-[#D4AF37]/20 group-hover:text-[#D4AF37]">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200">Daily Report</span>
            </Link>

            <Link
              href="/dashboard/contractor/invoices"
              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-[#D4AF37]/60 hover:bg-zinc-800/80 flex flex-col items-center text-center gap-2.5 transition-all group"
            >
              <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 group-hover:bg-[#D4AF37]/20 group-hover:text-[#D4AF37]">
                <ReceiptIndianRupee className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold text-zinc-200">GST Invoice</span>
            </Link>
          </div>
        </div>

        {/* Two-Column Section: Active Projects & Daily Progress Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Projects Feed */}
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#272727]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#D4AF37]" /> Active Projects
                </h3>
                <Link
                  href="/dashboard/contractor/projects"
                  className="text-xs font-semibold text-[#D4AF37] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {dashboardData?.recentProjects && dashboardData.recentProjects.length > 0 ? (
                  dashboardData.recentProjects.map((proj: any) => (
                    <div
                      key={proj.id}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#D4AF37] font-semibold">{proj.projectCode}</span>
                          <span className="text-xs font-semibold text-zinc-300">{proj.name}</span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          Client: <span className="text-zinc-300 font-medium">{proj.clientName}</span> | Budget: ₹
                          {Number(proj.budget).toLocaleString("en-IN")}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          {proj.status}
                        </span>
                        <p className="text-[11px] text-zinc-500 mt-1">{proj._count?.sites || 1} Sites</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-zinc-500 text-sm">
                    No active commercial projects found. Click &quot;New Project&quot; to begin.
                  </div>
                )}
              </div>
            </div>

            <Link href="/dashboard/contractor/projects/create" className="pt-4 block">
              <Button variant="outline" className="w-full border-zinc-800 text-zinc-300 hover:text-white">
                Launch New Commercial Project
              </Button>
            </Link>
          </div>

          {/* Daily Progress Reports Feed */}
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#272727]">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-teal-400" /> Recent Daily Progress Reports
                </h3>
                <Link
                  href="/dashboard/contractor/reports"
                  className="text-xs font-semibold text-[#D4AF37] hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {dashboardData?.recentReports && dashboardData.recentReports.length > 0 ? (
                  dashboardData.recentReports.map((report: any) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-200">
                          {report.site?.name || "Main Site"}
                        </span>
                        <span className="text-xs font-extrabold text-teal-400">
                          {report.progressPercentage}% Completed
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">{report.completedWork}</p>
                      <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                        <span>Workforce Present: {report.workforcePresent} Workers</span>
                        <span>{new Date(report.reportDate).toLocaleDateString("en-IN")}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-zinc-500 text-sm">
                    No daily reports submitted yet. Submit a progress report from the Attendance & Reports section.
                  </div>
                )}
              </div>
            </div>

            <Link href="/dashboard/contractor/reports" className="pt-4 block">
              <Button variant="outline" className="w-full border-zinc-800 text-zinc-300 hover:text-white">
                Submit Today&apos;s Daily Work Report
              </Button>
            </Link>
          </div>
        </div>

        {/* Recent B2B GST Invoices */}
        <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#272727]">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ReceiptIndianRupee className="h-5 w-5 text-[#D4AF37]" /> Recent B2B GST Invoices
            </h3>
            <Link
              href="/dashboard/contractor/invoices"
              className="text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              All Invoices
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            {dashboardData?.recentInvoices && dashboardData.recentInvoices.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-400 border-b border-zinc-800">
                    <th className="pb-3 font-semibold">Invoice No</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Client Name</th>
                    <th className="pb-3 font-semibold">Tax Type</th>
                    <th className="pb-3 font-semibold">Grand Total</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {dashboardData.recentInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-zinc-900/40">
                      <td className="py-3 font-mono font-bold text-[#D4AF37]">{inv.invoiceNumber}</td>
                      <td className="py-3 text-zinc-400">
                        {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-3 text-zinc-200 font-medium">{inv.recipientName}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.taxType === "INTRA_STATE"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-purple-500/10 text-purple-400"
                          }`}
                        >
                          {inv.taxType === "INTRA_STATE" ? "CGST + SGST" : "IGST"}
                        </span>
                      </td>
                      <td className="py-3 font-extrabold text-white">
                        ₹{Number(inv.grandTotal).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paymentStatus === "PAID"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={downloadingId === inv.id}
                          onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                          className="h-8 px-2 text-[#D4AF37] hover:text-amber-200 hover:bg-zinc-800 gap-1 text-xs"
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
              <div className="text-center py-8 text-zinc-500 text-sm">
                No invoices created yet. Generate professional B2B invoices with automatic CGST/SGST/IGST calculation.
              </div>
            )}
          </div>
        </div>

        {/* Footer Credit */}
        <div className="pt-6 border-t border-[#272727] text-center text-xs text-zinc-500">
          <p>
            MajDur B2B Workforce & Commercial Contracting Platform • Developed by Harsh Singh
          </p>
        </div>
      </div>
    </div>
  );
}
