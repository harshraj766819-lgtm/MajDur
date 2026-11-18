"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

interface PaymentStatusBadgeProps {
  status?: string | null;
  size?: "sm" | "md";
}

export function PaymentStatusBadge({ status, size = "sm" }: PaymentStatusBadgeProps) {
  const normalized = (status || "UNPAID").toUpperCase();

  const configs: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    PAID: {
      label: "Paid (Verified)",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="h-3 w-3 shrink-0" />,
    },
    SUCCESS: {
      label: "Success",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: <CheckCircle2 className="h-3 w-3 shrink-0" />,
    },
    PENDING: {
      label: "Payment Pending",
      className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: <Clock className="h-3 w-3 shrink-0" />,
    },
    FAILED: {
      label: "Payment Failed",
      className: "bg-red-500/15 text-red-400 border-red-500/30",
      icon: <XCircle className="h-3 w-3 shrink-0" />,
    },
    REFUND_PENDING: {
      label: "Refund Eligible",
      className: "bg-orange-500/15 text-orange-400 border-orange-500/30",
      icon: <RotateCcw className="h-3 w-3 shrink-0" />,
    },
    REFUNDED: {
      label: "Refunded",
      className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      icon: <RotateCcw className="h-3 w-3 shrink-0" />,
    },
    PARTIALLY_REFUNDED: {
      label: "Partially Refunded",
      className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
      icon: <RotateCcw className="h-3 w-3 shrink-0" />,
    },
    UNPAID: {
      label: "Unpaid",
      className: "bg-zinc-800 text-zinc-400 border-zinc-700",
      icon: <AlertCircle className="h-3 w-3 shrink-0" />,
    },
  };

  const cfg = configs[normalized] || configs.UNPAID;
  const sizeClass = size === "md" ? "px-3 py-1 text-xs" : "px-2.5 py-0.5 text-[10px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold tracking-wide uppercase ${sizeClass} ${cfg.className}`}
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
}

