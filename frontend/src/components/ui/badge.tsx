import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-majdur-gold select-none",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-800 text-white border border-zinc-700",
        gold:
          "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30",
        brand:
          "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30",
        secondary:
          "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60",
        success:
          "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
        warning:
          "bg-amber-500/15 text-amber-400 border border-amber-500/30",
        danger:
          "bg-red-500/15 text-red-400 border border-red-500/30",
        info:
          "bg-blue-500/15 text-blue-400 border border-blue-500/30",
        outline:
          "border border-zinc-700 text-zinc-300 bg-transparent",
        customer:
          "bg-sky-500/15 text-sky-400 border border-sky-500/30",
        worker:
          "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30",
        contractor:
          "bg-purple-500/15 text-purple-400 border border-purple-500/30",
        admin:
          "bg-red-500/15 text-red-400 border border-red-500/30",
      },
      size: {
        sm: "px-2 py-0.2 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "success" && "bg-emerald-400 animate-pulse",
            variant === "danger" && "bg-red-400 animate-pulse",
            variant === "warning" && "bg-amber-400 animate-pulse",
            (variant === "gold" || variant === "brand" || variant === "worker") && "bg-[#D4AF37] animate-pulse",
            variant === "customer" && "bg-sky-400",
            variant === "contractor" && "bg-purple-400",
            (!variant || variant === "default" || variant === "secondary") && "bg-zinc-400"
          )}
        />
      )}
      {children}
    </div>
  );
}

export { badgeVariants };
