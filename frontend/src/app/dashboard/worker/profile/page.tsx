"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  HardHat, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  Save, 
  Layers, 
  IndianRupee,
  Clock,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { fetchWorkerProfileData, updateWorkerProfileData, WorkerProfileData } from "@/lib/api";

const TRADE_CATEGORIES = [
  "Construction Labour", "Mason", "Electrician", "Plumber", "Carpenter",
  "Painter", "Welder", "Tile Worker", "POP Worker", "False Ceiling Worker",
  "Bar Bender", "Shuttering Worker", "Helper", "Housekeeping", "AC Technician",
  "Refrigerator Technician", "CCTV Technician", "Solar Technician", "Machine Operator",
  "Fabricator", "Glass Worker", "Aluminium Worker", "Waterproofing Worker",
  "Roofer", "Flooring Worker", "Interior Worker", "Gardner", "Pest Control Worker",
  "Driver", "Security Guard", "Heavy Equipment Operator", "General Maintenance Worker"
];

export default function WorkerProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profileData, setProfileData] = React.useState<WorkerProfileData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  // Form states
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [category, setCategory] = React.useState("Electrician");
  const [experienceYears, setExperienceYears] = React.useState(5);
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [pincode, setPincode] = React.useState("");
  const [serviceRadiusKm, setServiceRadiusKm] = React.useState(25);

  const loadProfile = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerProfileData();
      setProfileData(res);
      if (res.user) {
        setName(res.user.name || "");
        setEmail(res.user.email || "");
      }
      if (res.profile) {
        setBio(res.profile.bio || "");
        setCategory(res.profile.category || "Electrician");
        setExperienceYears(res.profile.experienceYears || 5);
        setCity(res.profile.locationCity || "Delhi NCR");
        setState(res.profile.locationState || "Delhi");
        setPincode(res.profile.locationPincode || "110001");
        setServiceRadiusKm(res.profile.serviceRadiusKm || 25);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load worker profile");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/profile");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadProfile();
      }
    }
  }, [user, authLoading, router, loadProfile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await updateWorkerProfileData({
        name,
        email,
        bio,
        category,
        experienceYears: Number(experienceYears),
        locationCity: city,
        locationState: state,
        locationPincode: pincode,
        serviceRadiusKm: Number(serviceRadiusKm),
      });

      setProfileData(res);
      setSuccess("Your artisan profile was successfully updated!");
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Artisan Profile...</p>
      </div>
    );
  }

  const worker = profileData?.profile;
  const userAccount = profileData?.user;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
              <Link href="/dashboard/worker" className="hover:text-[#D4AF37]">Dashboard</Link>
              <span>/</span>
              <span className="text-white">Profile Management</span>
            </div>
            <h1 className="text-2xl font-black text-white">Artisan & Professional Profile</h1>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/worker/skills">
              <Button variant="outline" size="sm" className="border-[#333] hover:border-[#D4AF37] text-xs">
                <HardHat className="h-3.5 w-3.5 mr-1 text-[#D4AF37]" /> Skills Matrix
              </Button>
            </Link>
            <Link href="/dashboard/worker/rates">
              <Button variant="outline" size="sm" className="border-[#333] hover:border-emerald-500 text-xs">
                <IndianRupee className="h-3.5 w-3.5 mr-1 text-emerald-400" /> Daily Rates
              </Button>
            </Link>
          </div>
        </div>

        {error && <Alert variant="destructive" title="Error">{error}</Alert>}
        {success && <Alert variant="success" title="Success">{success}</Alert>}

        {/* Verification Status Banner */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          worker?.isVerified
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-amber-500/10 border-amber-500/30 text-amber-300"
        }`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {worker?.isVerified ? "Govt. ID Verified Artisan" : "Identity Verification In Progress / Required"}
              </p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {worker?.isVerified 
                  ? "Your identity documents have been approved by MajDur administration. The verified badge is displayed on your public profile."
                  : "Submit or update your Aadhaar / Voter ID documents to boost client trust and unlock premium hiring contracts."
                }
              </p>
            </div>
          </div>
          <Link href="/dashboard/worker/verification">
            <Button size="sm" variant={worker?.isVerified ? "outline" : "default"} className="text-xs shrink-0">
              {worker?.isVerified ? "View KYC Details" : "Upload KYC Documents"}
            </Button>
          </Link>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleUpdate} className="space-y-6">
          <Card className="bg-[#141414] border-[#222]">
            <CardHeader>
              <CardTitle className="text-base text-white">Personal Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Full Legal Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Registered Phone (Non-editable)</label>
                  <Input value={userAccount?.phone || ""} disabled className="bg-[#181818] text-zinc-500 cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Email Address</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#222]">
            <CardHeader>
              <CardTitle className="text-base text-white">Trade & Specialization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Primary Trade Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {TRADE_CATEGORIES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Total Experience (Years) *</label>
                  <Input 
                    type="number" 
                    min={0} 
                    max={60} 
                    value={experienceYears} 
                    onChange={(e) => setExperienceYears(Number(e.target.value))} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Artisan Bio & Experience Summary</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Provide an overview of your craftsmanship, types of buildings or installations completed..."
                  className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#222]">
            <CardHeader>
              <CardTitle className="text-base text-white">Base Location & Service Radius</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">City *</label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">State *</label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">PIN Code *</label>
                  <Input value={pincode} onChange={(e) => setPincode(e.target.value)} maxLength={6} required />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Maximum Commute Radius (KM)</label>
                <Input 
                  type="number" 
                  min={5} 
                  max={150} 
                  value={serviceRadiusKm} 
                  onChange={(e) => setServiceRadiusKm(Number(e.target.value))} 
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  You will appear in search results for jobs within this distance from your base city.
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/dashboard/worker">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={saving} className="font-bold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Profile Changes
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
}

