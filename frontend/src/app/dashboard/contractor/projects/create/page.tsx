"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  IndianRupee,
  Users2,
  MapPin,
  Calendar,
  Briefcase,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import { createContractorProject } from "@/lib/api";

const AVAILABLE_TRADES = [
  "Mason",
  "Construction Labour",
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Welder",
  "Tile Worker",
  "POP Worker",
  "False Ceiling Worker",
  "Bar Bender",
  "Rigger",
  "Shuttering Carpenter",
  "Civil Foreman",
  "Safety Supervisor",
];

export default function CreateCommercialProjectPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Form State
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState<string>("COMMERCIAL");
  const [clientName, setClientName] = React.useState("");
  const [city, setCity] = React.useState("New Delhi");
  const [state, setState] = React.useState("Delhi");
  const [pincode, setPincode] = React.useState("110001");
  const [address, setAddress] = React.useState("");
  const [budget, setBudget] = React.useState<number | string>(5000000);
  const [totalWorkforceNeeded, setTotalWorkforceNeeded] = React.useState<number | string>(50);
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = React.useState("");
  const [selectedTrades, setSelectedTrades] = React.useState<string[]>([
    "Mason",
    "Construction Labour",
    "Electrician",
  ]);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/projects/create");
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      }
    }
  }, [user, authLoading, router]);

  function toggleTrade(trade: string) {
    if (selectedTrades.includes(trade)) {
      setSelectedTrades(selectedTrades.filter((t) => t !== trade));
    } else {
      setSelectedTrades([...selectedTrades, trade]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const created = await createContractorProject({
        name,
        description,
        category,
        clientName,
        city,
        state,
        pincode,
        address: address || `${city}, ${state}`,
        budget: Number(budget),
        totalWorkforceNeeded: Number(totalWorkforceNeeded),
        startDate,
        endDate: endDate || null,
        requiredTrades: selectedTrades,
        status: "PUBLISHED",
      });

      router.push(`/dashboard/contractor/projects/${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create commercial project");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Commercial Projects" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/contractor/projects"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
                <Building2 className="h-7 w-7 text-[#D4AF37]" /> Create Commercial Project
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Setup high-scale project infrastructure, workforce quotas, and auto-provision Site 01.
              </p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Project Details */}
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-[#272727] pb-3 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-[#D4AF37]" /> Commercial Project Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-300">
                  Project Title / Name <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Connaught Metro Hub & Commercial Arcade"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Client / Developer / PSU Entity <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g. Delhi Metro Rail Corp / DLF Ltd / Shapoorji"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Commercial Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="COMMERCIAL">Commercial Complex</option>
                  <option value="INFRASTRUCTURE">Civil & Infrastructure (Metro, Roads, Flyovers)</option>
                  <option value="INDUSTRIAL">Industrial & Manufacturing Factory</option>
                  <option value="RESIDENTIAL">High-Rise Residential Society</option>
                  <option value="RENOVATION">Commercial Fit-Out & Renovation</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Total Project Budget (INR) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">₹</span>
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="5000000"
                    required
                    className="pl-8 bg-zinc-900 border-zinc-700 text-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Total Workforce Quota (10–100+ Workers) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Users2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    type="number"
                    value={totalWorkforceNeeded}
                    onChange={(e) => setTotalWorkforceNeeded(e.target.value)}
                    placeholder="50"
                    min={1}
                    required
                    className="pl-9 bg-zinc-900 border-zinc-700 text-white font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Target Completion Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Detailed Scope of Construction Work <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Include architectural specifications, total floor area, RCC structure details, safety standards, and project deliverables..."
                required
                className="w-full p-3 rounded-md bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Card 2: Trade Specialization Requirements */}
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 space-y-4">
            <h2 className="text-base font-bold text-white border-b border-[#272727] pb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users2 className="h-5 w-5 text-amber-400" /> Required Trade Categories
              </span>
              <span className="text-xs text-zinc-400">({selectedTrades.length} Trades Selected)</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {AVAILABLE_TRADES.map((trade) => {
                const isSelected = selectedTrades.includes(trade);
                return (
                  <button
                    key={trade}
                    type="button"
                    onClick={() => toggleTrade(trade)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all ${
                      isSelected
                        ? "bg-[#D4AF37]/20 border border-[#D4AF37] text-white"
                        : "bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    }`}
                  >
                    <span>{trade}</span>
                    {isSelected && <Check className="h-4 w-4 text-[#D4AF37]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Location */}
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-[#272727] pb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-400" /> Site 01 & Primary Project Location
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Construction Site Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot No 12, Sector 62, Institutional Area"
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  City <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="New Delhi"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">State</label>
                <Input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Delhi"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">PIN Code</label>
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="110001"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/dashboard/contractor/projects">
              <Button type="button" variant="ghost" className="text-zinc-400 hover:text-white">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              disabled={saving}
              variant="default"
              className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold px-8 gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Launching Project..." : "Publish Commercial Project"}
            </Button>
          </div>
        </form>

        <div className="pt-6 border-t border-[#272727] text-center text-xs text-zinc-500">
          <p>MajDur B2B Workforce & Commercial Contracting Platform • Developed by Harsh Singh</p>
        </div>
      </div>
    </div>
  );
}

