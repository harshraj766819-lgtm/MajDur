"use client";

import * as React from "react";
import {
  ShieldCheck,
  X,
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PaymentCheckoutOrderResponse,
  authorizeSandboxCheckout,
  verifyRazorpayPayment,
  recordPaymentFailure,
} from "@/lib/api";

interface SandboxCheckoutModalProps {
  orderData: PaymentCheckoutOrderResponse;
  onClose: () => void;
  onSuccess: (result: any) => void;
  onFailure: (message: string) => void;
}

const METHODS = [
  {
    id: "UPI",
    label: "UPI / QR",
    subtitle: "success@razorpay (Instant Test UPI)",
    icon: Smartphone,
  },
  {
    id: "CARD",
    label: "Test Card",
    subtitle: "VISA •••• 1111 (Razorpay Test Card)",
    icon: CreditCard,
  },
  {
    id: "NETBANKING",
    label: "NetBanking",
    subtitle: "SBI / HDFC / ICICI Test Bank",
    icon: Building2,
  },
  {
    id: "WALLET",
    label: "Wallet",
    subtitle: "Paytm / PhonePe Test Wallet",
    icon: Wallet,
  },
] as const;

export function SandboxCheckoutModal({
  orderData,
  onClose,
  onSuccess,
  onFailure,
}: SandboxCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = React.useState<string>("UPI");
  const [processing, setProcessing] = React.useState<"success" | "fail" | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const { checkout } = orderData;

  const handleSimulateSuccess = async () => {
    try {
      setProcessing("success");
      setLocalError(null);

      // Step 1: Obtain server-signed Razorpay Test Mode authorization
      const authPayload = await authorizeSandboxCheckout(checkout.orderId, selectedMethod);

      // Step 2: Verify cryptographic HMAC-SHA256 signature on backend
      const verified = await verifyRazorpayPayment({
        razorpay_order_id: authPayload.razorpay_order_id,
        razorpay_payment_id: authPayload.razorpay_payment_id,
        razorpay_signature: authPayload.razorpay_signature,
        paymentMethod: selectedMethod,
      });

      onSuccess(verified);
    } catch (err: any) {
      const msg = err.message || "Test payment verification failed.";
      setLocalError(msg);
      onFailure(msg);
    } finally {
      setProcessing(null);
    }
  };

  const handleSimulateFailure = async () => {
    try {
      setProcessing("fail");
      setLocalError(null);

      await recordPaymentFailure({
        razorpay_order_id: checkout.orderId,
        failureCode: "TEST_BANK_DECLINED",
        failureReason: `Simulated ${selectedMethod} decline in Razorpay Test Mode`,
      });

      onFailure("Simulated test payment failed. You can safely retry payment.");
      onClose();
    } catch (err: any) {
      setLocalError(err.message || "Could not record payment failure.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Razorpay Test Mode Checkout"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#141414] border border-[#2d2d2d] shadow-2xl overflow-hidden">
        {/* Top Test Mode Banner */}
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-[11px] text-amber-300 font-semibold">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            RAZORPAY TEST MODE • NO REAL MONEY CHARGED
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={processing !== null}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Close checkout"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Merchant Header */}
        <div className="bg-[#1a1a1a] border-b border-[#252525] p-5 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              {checkout.name}
            </p>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{checkout.description}</p>
            <p className="text-[10px] font-mono text-zinc-500 mt-1 truncate">
              Order: {checkout.orderId}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 block">
              Payable
            </span>
            <span className="text-2xl font-black text-white">
              ₹{checkout.amountInr.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Payment Methods Selection */}
        <div className="p-5 space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
              Select Test Payment Method
            </p>
            <div className="space-y-2">
              {METHODS.map((m) => {
                const Icon = m.icon;
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={processing !== null}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      active
                        ? "bg-[#D4AF37]/10 border-[#D4AF37] text-white"
                        : "bg-[#191919] border-[#272727] text-zinc-300 hover:border-[#3b3b3b]"
                    }`}
                  >
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                        active
                          ? "bg-[#D4AF37] text-black"
                          : "bg-[#242424] text-zinc-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold">{m.label}</p>
                      <p className="text-[11px] text-zinc-400 truncate">{m.subtitle}</p>
                    </div>
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        active ? "border-[#D4AF37]" : "border-zinc-600"
                      }`}
                    >
                      {active && <div className="h-2 w-2 rounded-full bg-[#D4AF37]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {localError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{localError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <Button
              type="button"
              onClick={handleSimulateSuccess}
              disabled={processing !== null}
              fullWidth
              size="lg"
              className="bg-[#D4AF37] hover:bg-[#e5c048] text-black font-black text-xs"
            >
              {processing === "success" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying HMAC Signature...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Pay ₹{checkout.amountInr.toLocaleString("en-IN")} (Test Success)
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSimulateFailure}
              disabled={processing !== null}
              fullWidth
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold"
            >
              {processing === "fail" ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Recording Failure...
                </>
              ) : (
                "Simulate Payment Failure (Test Retry Flow)"
              )}
            </Button>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 pt-1">
            <Lock className="h-3 w-3" />
            <span>Secured by HMAC-SHA256 Server Verification • Razorpay Test Sandbox</span>
          </div>
        </div>
      </div>
    </div>
  );
}

