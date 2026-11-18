"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Search, 
  Briefcase, 
  CalendarCheck2, 
  MessageSquare, 
  FileText, 
  Star, 
  Settings, 
  Users, 
  HardHat, 
  ShieldCheck, 
  Layers, 
  AlertCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CreditCard,
  LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type UserRole = "CUSTOMER" | "WORKER" | "CONTRACTOR" | "ADMIN";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

const NAV_CONFIG: Record<UserRole, NavItem[]> = {
  CUSTOMER: [
    { label: "Overview", href: "/dashboard/customer", icon: LayoutDashboard },
    { label: "Find Workers", href: "/workers", icon: Search },
    { label: "My Jobs", href: "/dashboard/customer/jobs", icon: Briefcase },
    { label: "Bookings", href: "/dashboard/customer/bookings", icon: CalendarCheck2, badge: "Live" },
    { label: "Payments", href: "/dashboard/customer/payments", icon: CreditCard },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { label: "Invoices", href: "/dashboard/customer/invoices", icon: FileText },
    { label: "Reviews", href: "/dashboard/customer/reviews", icon: Star },
    { label: "Settings", href: "/dashboard/customer/settings", icon: Settings },
  ],
  WORKER: [
    { label: "Overview", href: "/dashboard/worker", icon: LayoutDashboard },
    { label: "My Profile & Skills", href: "/dashboard/worker/profile", icon: HardHat },
    { label: "Find Jobs", href: "/jobs", icon: Search },
    { label: "Job Applications", href: "/dashboard/worker/applications", icon: Briefcase },
    { label: "Booking Requests", href: "/dashboard/worker/bookings", icon: CalendarCheck2, badge: 2 },
    { label: "Earnings Records", href: "/dashboard/worker/earnings", icon: FileText },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { label: "KYC Verification", href: "/dashboard/worker/verification", icon: ShieldCheck },
    { label: "Settings", href: "/dashboard/worker/settings", icon: Settings },
  ],
  CONTRACTOR: [
    { label: "Overview", href: "/dashboard/contractor", icon: LayoutDashboard },
    { label: "Site Projects", href: "/dashboard/contractor/projects", icon: Briefcase },
    { label: "Recruit Workers", href: "/workers", icon: Users },
    { label: "Applications", href: "/dashboard/contractor/applications", icon: UserCheck, badge: 5 },
    { label: "Team Management", href: "/dashboard/contractor/teams", icon: HardHat },
    { label: "GST Invoices", href: "/dashboard/contractor/invoices", icon: FileText },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { label: "Settings", href: "/dashboard/contractor/settings", icon: Settings },
  ],
  ADMIN: [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Trade Categories", href: "/admin/categories", icon: Layers },
    { label: "Job Oversight", href: "/admin/jobs", icon: Briefcase },
    { label: "Bookings", href: "/admin/bookings", icon: CalendarCheck2 },
    { label: "KYC Verification", href: "/admin/verifications", icon: ShieldCheck, badge: "Pending" },
    { label: "Complaints", href: "/admin/complaints", icon: AlertCircle },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ],
};

export interface SidebarProps {
  role?: UserRole;
  userName?: string;
  userPhone?: string;
  className?: string;
}

export function Sidebar({
  role = "CUSTOMER",
  userName = "User",
  userPhone = "+91 98765 43210",
  className,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const items = NAV_CONFIG[role] || NAV_CONFIG.CUSTOMER;

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-[#2A2A2A] bg-[#121212] transition-all duration-300 select-none z-30 shrink-0",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Top Header / Role indicator */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#222222]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Workspace
            </span>
            <Badge
              variant={
                role === "ADMIN"
                  ? "danger"
                  : role === "CONTRACTOR"
                  ? "contractor"
                  : role === "WORKER"
                  ? "brand"
                  : "secondary"
              }
              className="text-[10px] uppercase font-bold"
            >
              {role}
            </Badge>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mx-auto rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-[#1E1E1E] transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 relative",
                isActive
                  ? "bg-[#1F1F1F] text-white shadow-sm border border-[#2D2D2D]"
                  : "text-zinc-400 hover:bg-[#181818] hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-[#D4AF37]" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-[#D4AF37]"
                    : "text-zinc-500 group-hover:text-zinc-300"
                )}
              />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="rounded-full bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-bold text-[#D4AF37] border border-[#D4AF37]/25">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Profile */}
      <div className="p-3 border-t border-[#222222] bg-[#0E0E0E]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#161616] border border-[#262626]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-black text-sm">
            {userName.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{userName}</p>
              <p className="text-[11px] text-zinc-500 truncate">{userPhone}</p>
            </div>
          )}
          {!collapsed && (
            <Link
              href="/auth/logout"
              className="text-zinc-500 hover:text-red-400 p-1 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}

