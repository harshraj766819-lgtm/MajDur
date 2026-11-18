"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Hammer, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitPasswordReset } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "";

  const [token, setToken] = React.useState(initialToken);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!token.trim()) {
      setErrorMessage("Reset token is missing. Please use the link provided in your reset request.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match. Please verify.");
      return;
    }

    try {
      setIsLoading(true);
      await submitPasswordReset({
        token: token.trim(),
        newPassword,
        confirmPassword,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password. The token may be expired or invalid.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Password Changed Successfully!
          </h2>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            Your MajDur account password has been updated securely. You can now log in using your new credentials.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => router.push("/login")}
            variant="primary"
            fullWidth
            size="lg"
            className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In with New Password
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#222222] border border-[#333333] text-[#D4AF37] mb-3">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Set New Password
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Enter your single-use reset token and choose a strong new password.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
            Reset Token
          </label>
          <Input
            type="text"
            placeholder="Paste reset token here"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            disabled={isLoading}
            required
            className="bg-[#191919] border-[#333333] text-white font-mono text-xs focus:border-[#D4AF37] focus:ring-[#D4AF37]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
              className="bg-[#191919] border-[#333333] text-white pr-10 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
            Confirm New Password
          </label>
          <Input
            type={showPassword ? "text" : "password"}
            placeholder="Re-type new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
            className="bg-[#191919] border-[#333333] text-white focus:border-[#D4AF37] focus:ring-[#D4AF37]"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            disabled={isLoading}
            className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold tracking-wide shadow-lg shadow-[#D4AF37]/20"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating Password...
              </span>
            ) : (
              "Confirm & Reset Password"
            )}
          </Button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-[#222222] text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          Cancel and return to <span className="text-[#D4AF37] hover:underline">Sign In</span>
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-zinc-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="flex justify-center">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-[#D4AF37] to-amber-300 text-black shadow-md shadow-[#D4AF37]/20 group-hover:scale-105 transition-transform duration-200">
            <Hammer className="h-6 w-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-2xl font-black tracking-tight text-white">
                Maj<span className="text-[#D4AF37]">Dur</span>
              </span>
              <span className="rounded-md bg-[#222222] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] border border-[#333333]">
                India
              </span>
            </div>
            <p className="text-[11px] font-medium text-zinc-400">
              Find Work. Hire Workers. Build Your Future.
            </p>
          </div>
        </Link>
      </div>

      {/* Main Card with Suspense for SearchParams */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-8">
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#D4AF37]/10 blur-2xl pointer-events-none" />
          <React.Suspense
            fallback={
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                <p className="text-xs">Loading reset session...</p>
              </div>
            }
          >
            <ResetPasswordForm />
          </React.Suspense>
        </div>
      </div>

      {/* Footer Credit */}
      <div className="text-center text-xs text-zinc-600">
        MajDur Platform • Developed by Harsh Singh • All rights reserved
      </div>
    </div>
  );
}

