"use client";

import * as React from "react";
import { Modal } from "./dialog";
import { Button } from "./button";
import { AlertTriangle, Info } from "lucide-react";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  confirmLabel?: string;
  cancelText?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  confirmLabel,
  cancelText,
  cancelLabel,
  variant = "primary",
  isLoading = false,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";
  const finalConfirmText = confirmLabel || confirmText || (isDanger ? "Delete" : "Confirm");
  const finalCancelText = cancelLabel || cancelText || "Cancel";

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} className="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
            isDanger
              ? "bg-red-500/10 border-red-500/30 text-red-500"
              : "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]"
          }`}
        >
          {isDanger ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Info className="h-5 w-5" />
          )}
        </div>
        <div className="space-y-1.5 flex-1">
          <h4 className="text-base font-bold text-white light:text-slate-900 leading-tight">
            {title}
          </h4>
          <p className="text-xs text-zinc-400 light:text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#262626] light:border-slate-100">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={isLoading}
        >
          {finalCancelText}
        </Button>
        <Button
          variant={isDanger ? "danger" : "primary"}
          size="sm"
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {finalConfirmText}
        </Button>
      </div>
    </Modal>
  );
}
