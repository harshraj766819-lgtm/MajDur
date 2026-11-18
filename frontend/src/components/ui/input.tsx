import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 light:text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3.5 flex items-center text-zinc-400 light:text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border border-[#2A2A2A] bg-[#181818] px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:bg-[#121212] disabled:text-zinc-600 light:bg-white light:border-slate-300 light:text-slate-900 light:placeholder:text-slate-400 light:disabled:bg-slate-50 light:disabled:text-slate-400",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error &&
                "border-red-500/80 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-zinc-400 light:text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-400 light:text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-zinc-400 light:text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
