"use client";

import * as React from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  recordPaymentFailure,
  PaymentCheckoutOrderResponse,
} from "@/lib/api";
import { SandboxCheckoutModal } from "./sandbox-checkout-modal";

declare global {
  interface Window {
    Razorpay?: any;
  }
}

interface RazorpayCheckoutButtonProps {
  bookingId: string;
  amount: number;
  label?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  onSuccess?: (result: any) => void;
  onError?: (message: string) => void;
}

function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayCheckoutButton({
  bookingId,
  amount,
  label,
  fullWidth = true,
  size = "md",
  onSuccess,
  onError,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [sandboxOrder, setSandboxOrder] = React.useState<PaymentCheckoutOrderResponse | null>(null);

  const handlePayClick = async () => {
    try {
      setLoading(true);
      const orderData = await createRazorpayOrder(bookingId);
      const { checkout } = orderData;

      // Local Razorpay Test Sandbox Mode (when placeholder test keys are configured)
      if (checkout.isSandbox) {
        setSandboxOrder(orderData);
        setLoading(false);
        return;
      }

      // Live Razorpay Test Mode Checkout JS
      const loaded = await loadRazorpayCheckoutScript();
      if (!loaded || !window.Razorpay) {
        throw new Error(
          "Unable to load Razorpay Checkout SDK. Please check your network connection and retry."
        );
      }

      const rzp = new window.Razorpay({
        key: checkout.keyId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: checkout.name,
        description: checkout.description,
        order_id: checkout.orderId,
        prefill: checkout.prefill,
        theme: checkout.theme,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verified = await verifyRazorpayPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentMethod: "RAZORPAY_TEST",
            });
            onSuccess?.(verified);
          } catch (verifyErr: any) {
            onError?.(verifyErr.message || "Payment verification failed.");
          }
        },
        modal: {
          ondismiss: async () => {
            try {
              await recordPaymentFailure({
                razorpay_order_id: checkout.orderId,
                failureCode: "CHECKOUT_DISMISSED",
                failureReason: "Customer dismissed Razorpay checkout modal before completion.",
              });
            } catch {
              // Ignore secondary dismiss logging error
            }
            onError?.("Payment window closed before completion. You can retry anytime.");
          },
        },
      });

      rzp.on("payment.failed", async (failResp: any) => {
        const errCode = failResp?.error?.code || "RAZORPAY_PAYMENT_FAILED";
        const errDesc = failResp?.error?.description || "Transaction failed at Razorpay gateway.";
        try {
          await recordPaymentFailure({
            razorpay_order_id: checkout.orderId,
            failureCode: errCode,
            failureReason: errDesc,
          });
        } catch {
          // Ignore secondary failure logging error
        }
        onError?.(errDesc);
      });

      rzp.open();
    } catch (err: any) {
      onError?.(err.message || "Failed to initiate payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <Button
          type="button"
          onClick={handlePayClick}
          disabled={loading}
          variant="primary"
          fullWidth={fullWidth}
          size={size}
          className="bg-[#D4AF37] hover:bg-[#e5c048] text-black font-black text-xs shadow-lg shadow-[#D4AF37]/15"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Preparing Razorpay Order...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              {label || `Pay ₹${amount.toLocaleString("en-IN")} Now (Test Mode)`}
            </>
          )}
        </Button>
        <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3 w-3 text-[#D4AF37]" />
          Razorpay Test Mode • Encrypted &amp; Server-Verified
        </p>
      </div>

      {sandboxOrder && (
        <SandboxCheckoutModal
          orderData={sandboxOrder}
          onClose={() => setSandboxOrder(null)}
          onSuccess={(result) => {
            setSandboxOrder(null);
            onSuccess?.(result);
          }}
          onFailure={(msg) => {
            onError?.(msg);
          }}
        />
      )}
    </>
  );
}

