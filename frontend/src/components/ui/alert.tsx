import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-sm flex items-start gap-3 transition-all",
  {
    variants: {
      variant: {
        default:
          "bg-[#1c1c1c] border-[#2e2e2e] text-zinc-200 light:bg-slate-50 light:border-slate-200 light:text-slate-800",
        info:
          "bg-blue-950/30 border-blue-800/40 text-blue-200 [&>svg]:text-blue-400 light:bg-blue-50 light:border-blue-200 light:text-blue-900 light:[&>svg]:text-blue-600",
        success:
          "bg-emerald-950/30 border-emerald-800/40 text-emerald-200 [&>svg]:text-emerald-400 light:bg-emerald-50 light:border-emerald-200 light:text-emerald-900 light:[&>svg]:text-emerald-600",
        warning:
          "bg-amber-950/30 border-amber-800/40 text-amber-200 [&>svg]:text-amber-400 light:bg-amber-50 light:border-amber-200 light:text-amber-900 light:[&>svg]:text-amber-600",
        destructive:
          "bg-red-950/30 border-red-800/40 text-red-200 [&>svg]:text-red-400 light:bg-red-50 light:border-red-200 light:text-red-900 light:[&>svg]:text-red-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  hideIcon?: boolean;
}

export function Alert({
  className,
  variant = "default",
  title,
  hideIcon = false,
  children,
  ...props
}: AlertProps) {
  const IconComponent = iconMap[variant || "default"];

  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {!hideIcon && <IconComponent className="h-5 w-5 shrink-0 mt-0.5" />}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold leading-none">{title}</h5>}
        <div className="text-sm opacity-90 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
