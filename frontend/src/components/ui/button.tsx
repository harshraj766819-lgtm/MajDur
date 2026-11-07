import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 text-white shadow-sm hover:bg-brand-600 active:bg-brand-700 active:scale-[0.99]",
        secondary:
          "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-950",
        outline:
          "border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900",
        ghost:
          "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        danger:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        link:
          "text-brand-600 underline-offset-4 hover:underline p-0 h-auto",
        success:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
      },
      size: {
        sm: "h-9 rounded-md px-3 text-xs gap-1.5",
        md: "h-11 px-4 py-2 text-sm gap-2",
        lg: "h-12 rounded-xl px-6 text-base gap-2.5 font-semibold",
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
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
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

