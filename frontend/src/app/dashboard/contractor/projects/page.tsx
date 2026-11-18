"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  PlusCircle,
  Search,
  Filter,
  MapPin,
  Calendar,
  Users2,
  HardHat,
  IndianRupee,
  ChevronRight,
  Loader2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import { fetchContractorProjects, CommercialProject } from "@/lib/api";

export default function ContractorProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [projects, setProjects] = React.useState<CommercialProject[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Filters
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [categoryFilter, setCategoryFilter] = React.useState("ALL");

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/projects");
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadProjects();
      }
    }
  }, [user, authLoading, router, statusFilter, categoryFilter]);

  async function loadProjects() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchContractorProjects({
        status: statusFilter,
        category: categoryFilter,
        search: search.trim() || undefined,
      });
      setProjects(data);
    } catch (err: any) {
      setError(err.message || "Failed to load commercial projects");
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    loadProjects();
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Commercial Projects" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Building2 className="h-8 w-8 text-[#D4AF37]" /> Commercial Projects
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Manage commercial developments, infrastructure sites, budgets, and workforce allotments.
            </p>
          </div>

          <Link href="/dashboard/contractor/projects/create">
            <Button variant="default" className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold gap-2">
              <PlusCircle className="h-4 w-4" />
              New Commercial Project
            </Button>
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code or client..."
              className="pl-9 bg-zinc-900 border-zinc-700 text-white text-xs h-9 w-full"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">Published</option>
                <option value="RECRUITMENT_OPEN">Recruitment Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 px-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INFRASTRUCTURE">Infrastructure</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="RESIDENTIAL">Residential</option>
                <option value="RENOVATION">Renovation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Project List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-zinc-400">
            <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
            <p className="text-sm">Loading Commercial Projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-12 text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Projects Found</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              You haven&apos;t created any commercial projects matching these criteria yet.
            </p>
            <Link href="/dashboard/contractor/projects/create">
              <Button variant="default" className="bg-[#D4AF37] text-black font-bold">
                Create First Commercial Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-[#141414] border border-[#272727] hover:border-[#D4AF37]/50 rounded-3xl p-6 flex flex-col justify-between transition-all group shadow-lg"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
                      {project.projectCode}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        project.status === "IN_PROGRESS"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : project.status === "RECRUITMENT_OPEN"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : project.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {project.status.replace("_", " ")}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                      {project.name}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 line-clamp-2">{project.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-zinc-800/80 text-xs text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-zinc-500" /> Client:
                      </span>
                      <span className="font-semibold text-zinc-200">{project.clientName}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5 text-zinc-500" /> Budget:
                      </span>
                      <span className="font-bold text-[#D4AF37]">
                        ₹{Number(project.budget).toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-zinc-500" /> Location:
                      </span>
                      <span className="text-zinc-300">
                        {project.city}, {project.state}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <HardHat className="h-3.5 w-3.5 text-zinc-500" /> Workforce Needed:
                      </span>
                      <span className="text-zinc-200 font-semibold">{project.totalWorkforceNeeded} Workers</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-zinc-500" /> Sub-Sites:
                      </span>
                      <span className="text-zinc-200 font-semibold">{project._count?.sites || 1} Sites</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-zinc-800 flex items-center justify-between">
                  <Link
                    href={`/dashboard/contractor/projects/${project.id}`}
                    className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                  >
                    View Project Hub <ChevronRight className="h-4 w-4" />
                  </Link>

                  <Link href={`/dashboard/contractor/recruitment?projectId=${project.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-400 hover:text-white">
                      Recruitment
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-6 border-t border-[#272727] text-center text-xs text-zinc-500">
          <p>MajDur B2B Workforce & Commercial Contracting Platform • Developed by Harsh Singh</p>
        </div>
      </div>
    </div>
  );
}

