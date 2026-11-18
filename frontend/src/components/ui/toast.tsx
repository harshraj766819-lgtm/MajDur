"use client";

import * as React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number; // default 4000ms
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const toastStyles: Record<ToastType, { border: string; icon: React.ComponentType<{ className?: string }>; bg: string; iconColor: string }> = {
  success: {
    border: "border-emerald-500/40",
    bg: "bg-emerald-950/40 text-emerald-100",
    icon: CheckCircle2,
    iconColor: "text-emerald-400",
  },
  error: {
    border: "border-red-500/40",
    bg: "bg-red-950/40 text-red-100",
    icon: AlertCircle,
    iconColor: "text-red-400",
  },
  warning: {
    border: "border-amber-500/40",
    bg: "bg-amber-950/40 text-amber-100",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
  },
  info: {
    border: "border-blue-500/40",
    bg: "bg-blue-950/40 text-blue-100",
    icon: Info,
    iconColor: "text-blue-400",
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const config = toastStyles[toast.type];
  const Icon = config.icon;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4500);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-200 animate-in slide-in-from-top-2 sm:slide-in-from-bottom-2",
        "bg-[#181818]/95 dark:bg-[#181818]/95 border-[#2A2A2A]",
        config.border
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
      <div className="flex-1 space-y-0.5">
        {toast.title && (
          <h5 className="text-sm font-bold text-white leading-tight">
            {toast.title}
          </h5>
        )}
        <p className="text-xs text-zinc-300 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="rounded-lg p-1 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

