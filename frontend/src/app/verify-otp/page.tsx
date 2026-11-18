"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Hammer, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  RotateCw,
  Phone,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { verifyOtp, sendOtp } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") || "";
  const redirectTo = searchParams.get("redirect") || "/login";

  const { refreshUser } = useAuth();
  const [phone, setPhone] = React.useState(initialPhone);
  const [otp, setOtp] = React.useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = React.useState(60);
  const [canResend, setCanResend] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);

  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  // 60-second cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // If pasted multiple digits
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || "";
      }
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      return;
    }

    if (!phone || phone.trim().length !== 10) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    try {
      setIsLoading(true);
      const verified = await verifyOtp(phone.trim(), fullOtp);
      if (verified) {
        setIsSuccess(true);
        await refreshUser().catch(() => {});
      } else {
        setErrorMessage("Invalid or expired OTP. Please verify and try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to verify OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setErrorMessage(null);
    setInfoMessage(null);

    if (!phone || phone.trim().length !== 10) {
      setErrorMessage("Please enter a valid 10-digit phone number first.");
      return;
    }

    try {
      setIsResending(true);
      await sendOtp(phone.trim());
      setInfoMessage("A new verification code has been dispatched.");
      setCanResend(false);
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to send new OTP. Please wait before retrying.");
    } finally {
      setIsResending(false);
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
            Phone Verified Successfully!
          </h2>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            Your Indian mobile number <span className="font-semibold text-zinc-200">+91 {phone}</span> has been authenticated.
          </p>
        </div>

        <div className="pt-2">
          <Button
            onClick={() => router.push(redirectTo)}
            variant="primary"
            fullWidth
            size="lg"
            className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Continue to Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#222222] border border-[#333333] text-[#D4AF37] mb-3">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Verify Mobile Number
        </h2>
        <p className="mt-1 text-sm text-zinc-400">
          Enter the 6-digit one-time password (OTP) sent to your mobile.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {infoMessage && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{infoMessage}</span>
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
            Registered Phone Number
          </label>
          <div className="relative">
            <Input
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              disabled={isLoading}
              className="bg-[#191919] border-[#333333] text-white pl-10 focus:border-[#D4AF37] focus:ring-[#D4AF37]"
            />
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
              <Phone className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-zinc-400 mb-2 text-center">
            Enter 6-Digit OTP Code
          </label>
          <div className="flex justify-center items-center gap-2 sm:gap-3">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isLoading}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-[#191919] border border-[#333333] text-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 outline-none transition-all"
              />
            ))}
          </div>
        </div>

        {/* Resend Timer */}
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
          <span>Didn&apos;t receive the code?</span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-[#D4AF37] font-semibold hover:underline flex items-center gap-1"
            >
              {isResending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCw className="h-3.5 w-3.5" />
              )}
              Resend OTP
            </button>
          ) : (
            <span className="text-zinc-500 font-mono">
              Resend in <span className="text-[#D4AF37] font-semibold">{cooldown}s</span>
            </span>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          disabled={isLoading || otp.join("").length !== 6}
          className="bg-[#D4AF37] hover:bg-[#c5a028] text-black font-bold tracking-wide shadow-lg shadow-[#D4AF37]/20"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying Code...
            </span>
          ) : (
            "Verify & Continue"
          )}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-[#222222] text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to <span className="text-[#D4AF37] hover:underline">Sign In</span>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
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
          <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#D4AF37]/10 blur-2xl pointer-events-none" />
          <React.Suspense
            fallback={
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                <p className="text-xs">Loading verification portal...</p>
              </div>
            }
          >
            <VerifyOtpContent />
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

