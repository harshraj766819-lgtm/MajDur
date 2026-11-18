"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full max-w-lg rounded-2xl bg-[#181818] p-6 shadow-2xl z-10 transition-all border border-[#2a2a2a] text-white light:bg-white light:border-slate-200 light:text-slate-900",
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#262626] light:border-slate-100">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-white light:text-slate-900">{title}</h3>
            )}
            {description && (
              <p className="text-sm text-zinc-400 light:text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-[#222222] hover:text-white transition-colors light:text-slate-400 light:hover:bg-slate-100 light:hover:text-slate-600"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
