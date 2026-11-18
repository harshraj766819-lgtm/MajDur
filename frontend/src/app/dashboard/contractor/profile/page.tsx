"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  MapPin,
  Phone,
  Mail,
  FileText,
  BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContractorNav } from "@/components/contractor-nav";
import { fetchContractorProfile, updateContractorProfile, ContractorProfileData } from "@/lib/api";

export default function ContractorProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = React.useState<ContractorProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = React.useState("");
  const [ownerName, setOwnerName] = React.useState("");
  const [businessEmail, setBusinessEmail] = React.useState("");
  const [businessPhone, setBusinessPhone] = React.useState("");
  const [gstin, setGstin] = React.useState("");
  const [panNumber, setPanNumber] = React.useState("");
  const [businessType, setBusinessType] = React.useState("Private Limited");
  const [businessAddress, setBusinessAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("Delhi");
  const [pincode, setPincode] = React.useState("");
  const [licenseNumber, setLicenseNumber] = React.useState("");
  const [companyBio, setCompanyBio] = React.useState("");

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/contractor/profile");
      } else if (user.role !== "CONTRACTOR" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadProfile();
      }
    }
  }, [user, authLoading, router]);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await fetchContractorProfile();
      setProfile(data);
      setCompanyName(data.companyName || "");
      setOwnerName(data.ownerName || data.user?.name || "");
      setBusinessEmail(data.businessEmail || data.user?.email || "");
      setBusinessPhone(data.businessPhone || data.user?.phone || "");
      setGstin(data.gstNumber || data.gstin || "");
      setPanNumber(data.panNumber || "");
      setBusinessType(data.businessType || "Private Limited");
      setBusinessAddress(data.businessAddress || "");
      setCity(data.city || "New Delhi");
      setState(data.state || "Delhi");
      setPincode(data.pincode || "110001");
      setLicenseNumber(data.licenseNumber || "");
      setCompanyBio(data.companyBio || "");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load contractor profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const updated = await updateContractorProfile({
        companyName,
        ownerName,
        businessEmail,
        businessPhone,
        gstin,
        panNumber,
        businessType,
        businessAddress,
        city,
        state,
        pincode,
        licenseNumber,
        companyBio,
      });

      setProfile(updated);
      setSuccessMessage("Contractor business profile and compliance details saved successfully!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update contractor profile");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || (loading && !profile)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Business Profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 pb-16">
      <ContractorNav activeTab="Business Profile" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
              <Building2 className="h-8 w-8 text-[#D4AF37]" /> Business Profile & Compliance
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Manage your legal commercial entity, GSTIN, PAN, and corporate billing details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {profile?.isVerified ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <BadgeCheck className="h-4 w-4" /> GST Verified Entity
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <AlertCircle className="h-4 w-4" /> Verification in Review
              </span>
            )}
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Legal Entity Info */}
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-[#272727] pb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#D4AF37]" /> Company & Proprietor Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Legal / Company Name <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Infra & Civil Projects Ltd"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Owner / Proprietor / Director Name <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Harsh Singh"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Business Structure</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Private Limited">Private Limited (Pvt Ltd)</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership Firm</option>
                  <option value="Limited Liability Partnership">LLP (Limited Liability Partnership)</option>
                  <option value="Public Limited">Public Limited</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">CPWD / PWD / Municipal License #</label>
                <Input
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. CLASS-1/DEL/2024/981"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Commercial Company Bio & Capabilities</label>
              <textarea
                value={companyBio}
                onChange={(e) => setCompanyBio(e.target.value)}
                rows={3}
                placeholder="Describe your construction capabilities, turnkey projects completed, equipment available, and workforce strength..."
                className="w-full p-3 rounded-md bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          {/* Card 2: GSTIN & Taxation Compliance */}
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-[#272727] pb-3 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" /> GST & Tax Compliance (Mandatory for B2B)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  GSTIN (15 Digits) <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  maxLength={15}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white font-mono uppercase tracking-wider"
                />
                <p className="text-[11px] text-zinc-400">
                  State code (first 2 digits) will be used to automatically determine CGST+SGST vs IGST.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Company PAN Number (10 Digits) <span className="text-rose-400">*</span>
                </label>
                <Input
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  placeholder="e.g. AAAAA0000A"
                  maxLength={10}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white font-mono uppercase tracking-wider"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Contact & Registered Office Address */}
          <div className="bg-[#141414] border border-[#272727] rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white border-b border-[#272727] pb-3 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-400" /> Registered Commercial Office Address
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Business Email</label>
                <Input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="e.g. accounts@acmeinfra.com"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Business Phone</label>
                <Input
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="e.g. 9811000000"
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Registered Office Street Address</label>
              <Input
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="e.g. Suite 402, Commercial Complex, Barakhamba Road"
                className="bg-zinc-900 border-zinc-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">City</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New Delhi"
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-zinc-900 border border-zinc-700 text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="Delhi">Delhi</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">PIN Code</label>
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 110001"
                  maxLength={6}
                  required
                  className="bg-zinc-900 border-zinc-700 text-white"
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-4">
            <Button
              type="submit"
              disabled={saving}
              variant="default"
              className="bg-[#D4AF37] text-black hover:bg-amber-400 font-bold px-8 gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving Changes..." : "Save Business Profile"}
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

