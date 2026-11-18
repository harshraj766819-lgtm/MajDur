import * as React from "react";
import { FolderSearch, LucideIcon } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = FolderSearch,
  title,
  description,
  actionText,
  actionLabel,
  onAction,
  secondaryActionText,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}: EmptyStateProps) {
  const finalActionText = actionLabel || actionText;
  const finalSecondaryActionText = secondaryActionLabel || secondaryActionText;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-3xl border border-dashed border-[#2A2A2A] bg-[#141414]/60 max-w-lg mx-auto light:bg-slate-50 light:border-slate-200",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1C1C1C] border border-[#2A2A2A] text-[#D4AF37] mb-5 shadow-inner light:bg-white light:border-slate-200">
        <Icon className="h-8 w-8 stroke-[1.8]" />
      </div>
      <h3 className="text-lg font-bold text-white light:text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 light:text-slate-600 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {finalActionText && onAction && (
          <Button
            variant="primary"
            size="md"
            onClick={onAction}
            className="w-full sm:w-auto font-bold bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-md shadow-[#D4AF37]/20"
          >
            {finalActionText}
          </Button>
        )}
        {finalSecondaryActionText && onSecondaryAction && (
          <Button
            variant="outline"
            size="md"
            onClick={onSecondaryAction}
            className="w-full sm:w-auto"
          >
            {finalSecondaryActionText}
          </Button>
        )}
      </div>
    </div>
  );
}
