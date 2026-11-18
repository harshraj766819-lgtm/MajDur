"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Hammer, 
  Lock, 
  Phone, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  HardHat, 
  Building2, 
  Users,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-provider";

type LoginRole = "CUSTOMER" | "WORKER" | "CONTRACTOR" | "ADMIN";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  const [role, setRole] = React.useState<LoginRole>(
    (searchParams.get("role")?.toUpperCase() as LoginRole) || "CUSTOMER"
  );
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your registered phone number or email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);
      const user = await login({
        identifier: identifier.trim(),
        password,
        role,
      });

      toast.success(`Welcome back, ${user.name}!`, "Signed In");

      // Redirect to role-appropriate dashboard
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "WORKER") {
        router.push("/dashboard/worker");
      } else if (user.role === "CONTRACTOR") {
        router.push("/dashboard/contractor");
      } else {
        router.push("/dashboard/customer");
      }
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-[#262626] bg-[#161616] p-6 sm:p-8 shadow-2xl space-y-6">
      {/* Role Switcher Tabs */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
          Select Your Role
        </label>
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#121212] border border-[#222222]">
          {(
            [
              { id: "CUSTOMER", label: "Customer", icon: Users },
              { id: "WORKER", label: "Worker", icon: HardHat },
              { id: "CONTRACTOR", label: "Contractor", icon: Building2 },
              { id: "ADMIN", label: "Admin", icon: ShieldCheck },
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
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[11px] font-bold transition-all ${
                  isSelected
                    ? "bg-[#D4AF37] text-black shadow-sm font-extrabold"
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
        <Alert variant="destructive" title="Login Failed">
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Phone Number or Email"
          type="text"
          placeholder="e.g. 9876543210 or name@example.com"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          leftIcon={<Phone className="h-4 w-4" />}
          autoComplete="username"
          required
        />

        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white focus:outline-none"
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[#333333] bg-[#1a1a1a] text-[#D4AF37] focus:ring-[#D4AF37] focus:ring-offset-0"
            />
            <span>Remember session for 7 days</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={loading}
          className="font-bold bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-lg shadow-[#D4AF37]/20 mt-2"
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          Sign In as {role}
        </Button>
      </form>

      {/* Registration Redirects */}
      <div className="pt-4 border-t border-[#222222] text-center space-y-2">
        <p className="text-xs text-zinc-400">
          Don&apos;t have an account yet?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-semibold">
          <Link
            href="/register?role=CUSTOMER"
            className="text-[#D4AF37] hover:underline"
          >
            Register as Customer
          </Link>
          <span className="text-zinc-600">•</span>
          <Link
            href="/register?role=WORKER"
            className="text-[#D4AF37] hover:underline"
          >
            Join as Worker
          </Link>
          <span className="text-zinc-600">•</span>
          <Link
            href="/register?role=CONTRACTOR"
            className="text-[#D4AF37] hover:underline"
          >
            Contractor Signup
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#101010] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial gold glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#D4AF37]/10 blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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
          Sign In to Your Account
        </h2>
        <p className="mt-1 text-xs text-zinc-400">
          Find Work. Hire Workers. Build Your Future.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <React.Suspense
          fallback={
            <div className="rounded-3xl border border-[#262626] bg-[#161616] p-8 text-center flex flex-col items-center justify-center gap-3 text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
              <p className="text-xs">Loading sign-in interface...</p>
            </div>
          }
        >
          <LoginForm />
        </React.Suspense>
      </div>
    </div>
  );
}
