import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: { value: string; label: string }[];
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, helperText, options, children, id, ...props }, ref) => {
    const selectId = id || React.useId();

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 light:text-slate-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              "flex h-11 w-full appearance-none rounded-xl border border-[#2A2A2A] bg-[#181818] px-3.5 py-2 text-sm text-white transition-colors focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 disabled:cursor-not-allowed disabled:bg-[#121212] disabled:text-zinc-600 pr-10 light:bg-white light:border-slate-300 light:text-slate-900 light:disabled:bg-slate-50",
              error && "border-red-500/80 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            ref={ref}
            {...props}
          >
            {children ? (
              children
            ) : (
              options?.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-[#181818] text-white light:bg-white light:text-slate-900">
                  {opt.label}
                </option>
              ))
            )}
          </select>
          <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 light:text-slate-400">
            <ChevronDown className="h-4 w-4" />
          </div>
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
Select.displayName = "Select";

export { Select };
