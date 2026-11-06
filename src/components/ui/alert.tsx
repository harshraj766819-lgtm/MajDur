import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-sm flex items-start gap-3 transition-all",
  {
    variants: {
      variant: {
        default: "bg-slate-50 border-slate-200 text-slate-800",
        info: "bg-blue-50 border-blue-200 text-blue-900 [&>svg]:text-blue-600",
        success: "bg-emerald-50 border-emerald-200 text-emerald-900 [&>svg]:text-emerald-600",
        warning: "bg-amber-50 border-amber-200 text-amber-900 [&>svg]:text-amber-600",
        destructive: "bg-red-50 border-red-200 text-red-900 [&>svg]:text-red-600",
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
