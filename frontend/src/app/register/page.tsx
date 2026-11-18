"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Hammer, 
  Users, 
  HardHat, 
  Building2, 
  Lock, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Calendar,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-provider";
import { fetchCategories, Category } from "@/lib/api";

type RegRole = "CUSTOMER" | "WORKER" | "CONTRACTOR";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { registerCustomer, registerWorker, registerContractor } = useAuth();
  const { toast } = useToast();

  const [role, setRole] = React.useState<RegRole>(
    (searchParams.get("role")?.toUpperCase() as RegRole) || "CUSTOMER"
  );

  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Common fields
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  // Worker specific fields
  const [trade, setTrade] = React.useState("electrician");
  const [experienceYears, setExperienceYears] = React.useState("5");
  const [city, setCity] = React.useState("Delhi NCR");
  const [pincode, setPincode] = React.useState("");
  const [dailyRate, setDailyRate] = React.useState("850");

  // Contractor specific fields
  const [companyName, setCompanyName] = React.useState("");
  const [contactPerson, setContactPerson] = React.useState("");
  const [gstNumber, setGstNumber] = React.useState("");

  React.useEffect(() => {
    async function loadCats() {
      try {
        const cats = await fetchCategories();
        if (cats && cats.length > 0) {
          setCategories(cats);
        }
      } catch (err) {
        console.error("Failed to load categories for registration:", err);
      }
    }
    loadCats();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate phone number
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    // Validate password
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    try {
      setLoading(true);

      if (role === "CUSTOMER") {
        await registerCustomer({
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          password,
          confirmPassword,
        });
        toast.success("Account created successfully!", "Welcome to MajDur");
        router.push("/dashboard/customer");
      } else if (role === "WORKER") {
        await registerWorker({
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          password,
          trade,
          experienceYears: parseInt(experienceYears, 10) || 0,
          city: city.trim(),
          pincode: pincode.trim() || undefined,
          dailyRate: parseInt(dailyRate, 10) || undefined,
        });
        toast.success("Worker profile registered!", "Welcome Artisan");
        router.push("/dashboard/worker");
      } else if (role === "CONTRACTOR") {
        await registerContractor({
          companyName: (companyName.trim() || name.trim()),
          contactPerson: (contactPerson.trim() || name.trim()),
          phone: cleanPhone,
          email: email.trim() || undefined,
          password,
          city: city.trim(),
          gstNumber: gstNumber.trim() || undefined,
        });
        toast.success("Contractor firm registered!", "Welcome Partner");
        router.push("/dashboard/contractor");
      }
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#262626] bg-[#161616] p-6 sm:p-8 shadow-2xl space-y-6">
      
      {/* Role Selection Switcher */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
          Select Registration Type
        </label>
        <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-[#121212] border border-[#222222]">
          {(
            [
              { id: "CUSTOMER", label: "Customer (Hire)", icon: Users },
              { id: "WORKER", label: "Skilled Worker", icon: HardHat },
              { id: "CONTRACTOR", label: "Contractor Firm", icon: Building2 },
            ] as const
          ).map((r) => {
            const Icon = r.icon;
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setRole(r.id);
                  setError("");
                }}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-[#D4AF37] text-black shadow-md font-extrabold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 mb-1" />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" title="Registration Error">
          {error}
        </Alert>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Name & Contact Person */}
        {role === "CONTRACTOR" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company / Firm Name"
              placeholder="e.g. Apex Builders & Infra"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              leftIcon={<Building2 className="h-4 w-4" />}
              required
            />
            <Input
              label="Authorized Contact Person"
              placeholder="e.g. Rajesh Sharma"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              leftIcon={<Users className="h-4 w-4" />}
              required
            />
          </div>
        ) : (
          <Input
            label="Full Name"
            placeholder={role === "WORKER" ? "e.g. Ramesh Kumar" : "e.g. Amit Verma"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            leftIcon={<Users className="h-4 w-4" />}
            required
          />
        )}

        {/* Mobile & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mobile Number (10 digits)"
            type="tel"
            maxLength={10}
            placeholder="9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            leftIcon={<Phone className="h-4 w-4" />}
            helperText="OTP verification code will be sent to this number"
            required
          />
          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
          />
        </div>

        {/* Worker Specific Fields */}
        {role === "WORKER" && (
          <div className="space-y-4 p-4 rounded-2xl bg-[#141414] border border-[#242424]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <HardHat className="h-4 w-4" />
              <span>Trade Skills &amp; Experience Details</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Primary Trade Category
                </label>
                <select
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#1c1c1c] border border-[#333333] text-white text-sm focus:border-[#D4AF37] focus:outline-none"
                  required
                >
                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name} {c.hindiName ? `(${c.hindiName})` : ""}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="electrician">Electrician (इलेक्ट्रीशियन)</option>
                      <option value="plumber">Plumber (प्लम्बर)</option>
                      <option value="carpenter">Carpenter (बढ़ई)</option>
                      <option value="mason">Mason / Rajmistri (राजमिस्त्री)</option>
                      <option value="painter">Painter (पेंटर)</option>
                      <option value="welder">Welder (वेल्डर)</option>
                      <option value="construction-labour">Construction Labour (निर्माण मजदूर)</option>
                    </>
                  )}
                </select>
              </div>

              <Input
                label="Experience (in Years)"
                type="number"
                min="0"
                max="50"
                placeholder="5"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                leftIcon={<Briefcase className="h-4 w-4" />}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Working City"
                placeholder="e.g. Delhi NCR"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<MapPin className="h-4 w-4" />}
                required
              />
              <Input
                label="Area PIN Code"
                placeholder="e.g. 110001"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              />
              <Input
                label="Standard Daily Rate (₹)"
                type="number"
                min="400"
                step="50"
                placeholder="850"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                leftIcon={<span className="text-xs font-bold text-[#D4AF37]">₹</span>}
              />
            </div>
          </div>
        )}

        {/* Contractor Specific Fields */}
        {role === "CONTRACTOR" && (
          <div className="space-y-4 p-4 rounded-2xl bg-[#141414] border border-[#242424]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              <span>Business Location &amp; Tax Registration</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Primary Operating City"
                placeholder="e.g. Mumbai"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                leftIcon={<MapPin className="h-4 w-4" />}
                required
              />
              <Input
                label="GST Number (Optional)"
                placeholder="e.g. 27ABCDE1234F1Z5"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                helperText="For B2B input tax credit invoices"
              />
            </div>
          </div>
        )}

        {/* Passwords */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Create Password"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            required
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          className="font-bold bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-lg shadow-[#D4AF37]/20 mt-4"
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Register as {role === "CUSTOMER" ? "Customer" : role === "WORKER" ? "Worker" : "Contractor"}
        </Button>
      </form>

      {/* Sign In Link */}
      <div className="pt-4 border-t border-[#222222] text-center">
        <p className="text-xs text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-[#D4AF37] hover:underline">
            Sign in here
          </Link>
        </p>
      </div>

    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#101010] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial gold glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-[#D4AF37]/10 blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-amber-300 text-black shadow-lg shadow-[#D4AF37]/25 group-hover:scale-105 transition-transform">
            <Hammer className="h-6 w-6 stroke-[2.4]" />
          </div>
          <span className="text-3xl font-black tracking-tight text-white">
            Maj<span className="text-[#D4AF37]">Dur</span>
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-white">
          Create Your MajDur Account
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Join thousands of verified workers, contractors and satisfied customers across India.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <React.Suspense
          fallback={
            <div className="rounded-3xl border border-[#262626] bg-[#161616] p-8 text-center flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
              <p className="text-xs">Loading registration portal...</p>
            </div>
          }
        >
          <RegisterForm />
        </React.Suspense>
      </div>
    </div>
  );
}
