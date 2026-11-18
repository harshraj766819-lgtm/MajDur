"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DropdownMenuItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items?: DropdownMenuItem[];
  children?: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}

interface DropdownContextType {
  close: () => void;
}

const DropdownContext = React.createContext<DropdownContextType | null>(null);

export function DropdownMenu({
  trigger,
  items,
  children,
  align = "right",
  className,
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const close = React.useCallback(() => setIsOpen(false), []);

  return (
    <DropdownContext.Provider value={{ close }}>
      <div ref={containerRef} className="relative inline-block text-left">
        <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
          {trigger}
        </div>

        {isOpen && (
          <div
            className={cn(
              "absolute z-50 mt-2 min-w-52 rounded-xl border border-[#2A2A2A] bg-[#181818] p-1.5 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 text-white light:bg-white light:border-slate-200 light:text-slate-900",
              align === "right" ? "right-0" : "left-0",
              className
            )}
          >
            {items
              ? items.map((item, idx) => {
                  if (item.divider) {
                    return <div key={`divider-${idx}`} className="my-1 border-t border-[#262626] light:border-slate-100" />;
                  }

                  const Icon = item.icon as any;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled={item.disabled}
                      onClick={() => {
                        if (item.onClick) item.onClick();
                        setIsOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors text-left",
                        item.destructive
                          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300 light:text-red-600 light:hover:bg-red-50"
                          : "text-zinc-300 hover:bg-[#222222] hover:text-white light:text-slate-700 light:hover:bg-slate-100 light:hover:text-slate-900",
                        item.disabled && "pointer-events-none opacity-40"
                      )}
                    >
                      {React.isValidElement(Icon) ? Icon : Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
                      <span className="flex-1">{item.label}</span>
                    </button>
                  );
                })
              : children}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

export function DropdownItem({
  children,
  icon,
  onClick,
  destructive = false,
  disabled = false,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const ctx = React.useContext(DropdownContext);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (onClick) onClick();
        ctx?.close();
      }}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors text-left",
        destructive
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300 light:text-red-600 light:hover:bg-red-50"
          : "text-zinc-300 hover:bg-[#222222] hover:text-white light:text-slate-700 light:hover:bg-slate-100 light:hover:text-slate-900",
        disabled && "pointer-events-none opacity-40",
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-[#262626] light:border-slate-100" />;
}
