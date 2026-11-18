import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 hover:bg-[#C5A028] hover:shadow-lg hover:shadow-[#D4AF37]/30 border border-amber-300/30",
        default:
          "bg-[#D4AF37] text-black shadow-md shadow-[#D4AF37]/20 hover:bg-[#C5A028] hover:shadow-lg hover:shadow-[#D4AF37]/30 border border-amber-300/30",
        secondary:
          "bg-[#222222] text-zinc-100 border border-[#333333] hover:bg-[#2a2a2a] hover:text-white light:bg-slate-900 light:text-white light:hover:bg-slate-800",
        outline:
          "border border-[#333333] bg-transparent text-zinc-200 hover:border-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 light:border-slate-300 light:text-slate-700 light:hover:border-[#D4AF37] light:hover:bg-amber-50/50",
        ghost:
          "text-zinc-300 hover:bg-white/5 hover:text-white light:text-slate-700 light:hover:bg-slate-100 light:hover:text-slate-900",
        danger:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 border border-red-500/20",
        success:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 border border-emerald-500/20",
        link:
          "text-[#D4AF37] underline-offset-4 hover:underline p-0 h-auto font-medium active:scale-100",
      },
      size: {
        sm: "h-9 rounded-lg px-3 text-xs gap-1.5",
        md: "h-11 px-4 py-2 text-sm gap-2",
        lg: "h-12 rounded-xl px-6 text-base gap-2.5 font-bold",
        icon: "h-10 w-10 p-0 rounded-lg",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2 shrink-0" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
