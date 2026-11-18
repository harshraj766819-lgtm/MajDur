"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Hammer, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Phone, 
  Mail, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordReset } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = React.useState(false);
  const [devToken, setDevToken] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setErrorMessage("Please enter your registered mobile number or email address.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await requestPasswordReset(cleanInput);
      setResetSuccess(true);
      if (res.token) {
        setDevToken(res.token);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process password reset request. Please check your input.");
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Main Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-8">
        <div className="bg-[#141414] border border-[#272727] rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
          {/* Subtle gold glow accent */}
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#D4AF37]/10 blur-2xl pointer-events-none" />

          {resetSuccess ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Reset Link Dispatched
                </h2>
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  We have generated a secure password reset link for <span className="font-semibold text-zinc-200">{identifier}</span>.
                </p>
              </div>

              {devToken && (
                <div className="p-4 rounded-xl bg-[#1c1c1c] border border-amber-500/30 text-left space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Direct Reset Link (Active Token)</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    In development mode, you can proceed directly to reset your password using the verified token below:
                  </p>
                  <Link
                    href={`/reset-password?token=${devToken}`}
                    className="inline-flex items-center justify-center gap-2 w-full mt-2 py-2 px-3 rounded-lg bg-[#D4AF37] text-black font-semibold text-xs hover:bg-[#c5a028] transition-colors"
                  >
                    Set New Password Now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#D4AF37] hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#222222] border border-[#333333] text-[#D4AF37] mb-3">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Forgot Password?
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Enter your registered mobile number or email address and we will help you reset it.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
                    Mobile Number or Email
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="e.g. 9876543210 or user@example.com"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      disabled={isLoading}
                      required
                      className="bg-[#191919] border-[#333333] text-white pl-10 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      {identifier.includes("@") ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  <p className="mt-1.5 text-[11px] text-zinc-500">
                    Indian numbers must be 10 digits without +91 prefix.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  size="lg"
                  disabled={isLoading}
                  className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold text-sm tracking-wide shadow-lg shadow-[#D4AF37]/20"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking Account...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-[#222222] text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Remember your password? <span className="text-[#D4AF37] hover:underline">Sign in</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Credit */}
      <div className="text-center text-xs text-zinc-600">
        MajDur Platform • Developed by Harsh Singh • All rights reserved
      </div>
    </div>
  );
}

