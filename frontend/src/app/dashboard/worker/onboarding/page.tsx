"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  HardHat, 
  CheckCircle2, 
  Briefcase, 
  MapPin, 
  ShieldCheck, 
  IndianRupee, 
  ChevronRight, 
  ChevronLeft, 
  Loader2, 
  Sparkles,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { fetchWorkerOnboarding, saveWorkerOnboardingStep, WorkerOnboardingData } from "@/lib/api";

const TRADE_OPTIONS = [
  "Construction Labour", "Mason", "Electrician", "Plumber", "Carpenter",
  "Painter", "Welder", "Tile Worker", "POP Worker", "False Ceiling Worker",
  "Bar Bender", "Shuttering Worker", "Helper", "Housekeeping", "AC Technician",
  "Refrigerator Technician", "CCTV Technician", "Solar Technician", "Machine Operator",
  "Fabricator", "Glass Worker", "Aluminium Worker", "Waterproofing Worker",
  "Roofer", "Flooring Worker", "Interior Worker", "Gardner", "Pest Control Worker",
  "Driver", "Security Guard", "Heavy Equipment Operator", "General Maintenance Worker"
];

export default function WorkerOnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [onboardingData, setOnboardingData] = React.useState<WorkerOnboardingData | null>(null);
  const [activeStep, setActiveStep] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  // Step 1 Form
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [city, setCity] = React.useState("");
  const [state, setState] = React.useState("");
  const [pincode, setPincode] = React.useState("");
  const [address, setAddress] = React.useState("");

  // Step 2 Form
  const [category, setCategory] = React.useState("Electrician");
  const [experienceYears, setExperienceYears] = React.useState(5);
  const [bio, setBio] = React.useState("");
  const [skillsText, setSkillsText] = React.useState("");

  // Step 3 Form
  const [dailyRate, setDailyRate] = React.useState(850);
  const [hourlyRate, setHourlyRate] = React.useState(120);
  const [serviceRadiusKm, setServiceRadiusKm] = React.useState(25);
  const [secondaryCity, setSecondaryCity] = React.useState("");

  // Step 4 Form
  const [idType, setIdType] = React.useState("Aadhaar");
  const [idNumber, setIdNumber] = React.useState("");
  const [documentUrl, setDocumentUrl] = React.useState("");

  const loadOnboarding = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchWorkerOnboarding();
      setOnboardingData(res);
      setActiveStep(res.currentStep > 4 ? 4 : res.currentStep);

      // Populate initial values
      if (res.user) {
        setName(res.user.name || "");
        setEmail(res.user.email || "");
      }
      if (res.profile) {
        setCity(res.profile.locationCity || "Delhi NCR");
        setState(res.profile.locationState || "Delhi");
        setPincode(res.profile.locationPincode || "110001");
        setCategory(res.profile.category || "Electrician");
        setExperienceYears(res.profile.experienceYears || 5);
        setBio(res.profile.bio || "");
        setDailyRate(res.profile.dailyRate || 850);
        setHourlyRate(res.profile.hourlyRate || 120);
        setServiceRadiusKm(res.profile.serviceRadiusKm || 25);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load onboarding");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login?redirect=/dashboard/worker/onboarding");
      } else if (user.role !== "WORKER" && user.role !== "ADMIN") {
        router.push("/unauthorized");
      } else {
        loadOnboarding();
      }
    }
  }, [user, authLoading, router, loadOnboarding]);

  const handleSaveStep = async (stepNum: number) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      let payload: any = {};
      if (stepNum === 1) {
        if (!name.trim() || !city.trim() || !pincode.trim()) {
          throw new Error("Name, City, and PIN code are required.");
        }
        payload = { name, email, city, state, pincode, address };
      } else if (stepNum === 2) {
        if (!category) throw new Error("Please select your primary trade.");
        const skillsArray = skillsText.split(",").map((s) => s.trim()).filter(Boolean);
        payload = { category, experienceYears: Number(experienceYears), bio, skills: skillsArray };
      } else if (stepNum === 3) {
        if (Number(dailyRate) < 300) throw new Error("Daily rate must be at least ₹300.");
        payload = { 
          dailyRate: Number(dailyRate), 
          hourlyRate: Number(hourlyRate), 
          serviceRadiusKm: Number(serviceRadiusKm),
          serviceAreas: secondaryCity ? [{ city: secondaryCity, radiusKm: 20 }] : []
        };
      } else if (stepNum === 4) {
        if (!idType || !documentUrl.trim()) {
          throw new Error("ID Type and Document URL are required.");
        }
        payload = { idType, idNumber, documentUrl };
      }

      await saveWorkerOnboardingStep(stepNum, payload);
      setSuccessMsg(`Step ${stepNum} saved successfully!`);

      if (stepNum < 4) {
        setActiveStep(stepNum + 1);
      } else {
        router.push("/dashboard/worker");
      }
    } catch (err: any) {
      setError(err.message || "Failed to save step");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-3 text-zinc-400">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
        <p className="text-sm font-medium">Loading Onboarding Wizard...</p>
      </div>
    );
  }

  const stepsMeta = [
    { num: 1, label: "Personal Info", desc: "Identity & Location" },
    { num: 2, label: "Professional Details", desc: "Trade & Skills" },
    { num: 3, label: "Service Preferences", desc: "Rates & Radius" },
    { num: 4, label: "KYC Verification", desc: "Government ID" },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Wizard Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
            <Sparkles className="h-3.5 w-3.5" />
            Worker Professional Onboarding
          </div>
          <h1 className="text-3xl font-black text-white">Complete Your Artisan Profile</h1>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Set up your credentials, daily rates, and service coverage to start receiving direct booking contracts from verified customers.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stepsMeta.map((s) => {
            const isDone = onboardingData?.steps ? (onboardingData.steps as any)[`step${s.num}`]?.completed : false;
            const isCurrent = activeStep === s.num;

            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStep(s.num)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isCurrent
                    ? "bg-[#1f1a0e] border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10"
                    : isDone
                    ? "bg-[#141414] border-emerald-500/30 text-emerald-400"
                    : "bg-[#141414] border-[#222] text-zinc-500 hover:border-[#333]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold font-mono">STEP {s.num}</span>
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-zinc-600" />
                  )}
                </div>
                <p className={`text-xs font-bold ${isCurrent ? "text-white" : isDone ? "text-emerald-300" : "text-zinc-400"}`}>
                  {s.label}
                </p>
              </button>
            );
          })}
        </div>

        {error && (
          <Alert variant="destructive" title="Error Saving Step">
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert variant="success" title="Progress Saved">
            {successMsg}
          </Alert>
        )}

        {/* Step 1: Personal Information */}
        {activeStep === 1 && (
          <Card className="bg-[#141414] border-[#222]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Step 1 — Personal Information</CardTitle>
              <p className="text-xs text-zinc-400">Provide your basic contact information and home base</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Full Name *</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rameshwar Mistri" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Email Address</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. rameshwar@gmail.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Primary City *</label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Delhi NCR" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">State *</label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="e.g. Delhi" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">PIN Code *</label>
                  <Input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="e.g. 110001" maxLength={6} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Full Base Address / Area</label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Sector 12, Dwarka" />
              </div>

              <div className="pt-4 flex justify-end">
                <Button onClick={() => handleSaveStep(1)} disabled={saving} className="font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save & Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Professional Details & Skills */}
        {activeStep === 2 && (
          <Card className="bg-[#141414] border-[#222]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Step 2 — Professional Details & Skills</CardTitle>
              <p className="text-xs text-zinc-400">Select your primary trade and describe your work history</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Primary Trade / Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    {TRADE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Years of Experience *</label>
                  <Input 
                    type="number" 
                    min={1} 
                    max={50} 
                    value={experienceYears} 
                    onChange={(e) => setExperienceYears(Number(e.target.value))} 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Specific Skills (Comma separated)</label>
                <Input 
                  value={skillsText} 
                  onChange={(e) => setSkillsText(e.target.value)} 
                  placeholder="e.g. Concealed Conduit Wiring, MCB Setup, 3-Phase Commercial" 
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Professional Bio & Portfolio Summary</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Detail your specializations, tools owned, and completed high-profile projects..."
                  className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg p-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button variant="outline" onClick={() => setActiveStep(1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button onClick={() => handleSaveStep(2)} disabled={saving} className="font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save & Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Service Preferences & Rates */}
        {activeStep === 3 && (
          <Card className="bg-[#141414] border-[#222]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Step 3 — Service Preferences & Rates</CardTitle>
              <p className="text-xs text-zinc-400">Define your standard daily wages and service travel distance</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Daily Rate (INR ₹) *</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input 
                      type="number" 
                      min={300} 
                      max={20000} 
                      value={dailyRate} 
                      onChange={(e) => setDailyRate(Number(e.target.value))} 
                      className="pl-9"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">Recommended base: ₹800–₹1200 / day</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Hourly Rate (INR ₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                    <Input 
                      type="number" 
                      min={40} 
                      max={3000} 
                      value={hourlyRate} 
                      onChange={(e) => setHourlyRate(Number(e.target.value))} 
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Maximum Travel Radius (KM)</label>
                  <Input 
                    type="number" 
                    min={5} 
                    max={100} 
                    value={serviceRadiusKm} 
                    onChange={(e) => setServiceRadiusKm(Number(e.target.value))} 
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">Maximum distance you are willing to commute</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Secondary Service City (Optional)</label>
                  <Input 
                    value={secondaryCity} 
                    onChange={(e) => setSecondaryCity(e.target.value)} 
                    placeholder="e.g. Noida or Gurugram" 
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button variant="outline" onClick={() => setActiveStep(2)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button onClick={() => handleSaveStep(3)} disabled={saving} className="font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Save & Continue →
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Verification */}
        {activeStep === 4 && (
          <Card className="bg-[#141414] border-[#222]">
            <CardHeader>
              <CardTitle className="text-lg text-white">Step 4 — Identity Verification (KYC)</CardTitle>
              <p className="text-xs text-zinc-400">Upload your government ID to earn the Verified Artisan badge</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Document Type *</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full bg-[#1c1c1c] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Voter ID">Voter ID Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Trade License">Government Trade Certificate / License</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Document / ID Number</label>
                  <Input 
                    value={idNumber} 
                    onChange={(e) => setIdNumber(e.target.value)} 
                    placeholder="e.g. 1234-5678-9012" 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Document Scanned Image / PDF URL *</label>
                <Input 
                  value={documentUrl} 
                  onChange={(e) => setDocumentUrl(e.target.value)} 
                  placeholder="e.g. https://storage.majdur.in/kyc/aadhaar.pdf" 
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Private and encrypted. Never shared publicly.</span>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <Button variant="outline" onClick={() => setActiveStep(3)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button onClick={() => handleSaveStep(4)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Submit & Finish Onboarding ✓
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}

