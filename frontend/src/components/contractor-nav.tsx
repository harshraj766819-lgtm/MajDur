"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users2,
  MapPin,
  HardHat,
  ShieldCheck,
  CalendarCheck,
  FileCheck2,
  ReceiptIndianRupee,
  BriefcaseBusiness,
} from "lucide-react";

interface ContractorNavProps {
  activeTab?: string;
}

export function ContractorNav({ activeTab }: ContractorNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Overview",
      href: "/dashboard/contractor",
      icon: LayoutDashboard,
      active: pathname === "/dashboard/contractor",
    },
    {
      label: "Commercial Projects",
      href: "/dashboard/contractor/projects",
      icon: Building2,
      active: pathname.startsWith("/dashboard/contractor/projects"),
    },
    {
      label: "Bulk Recruitment",
      href: "/dashboard/contractor/recruitment",
      icon: Users2,
      active: pathname.startsWith("/dashboard/contractor/recruitment"),
    },
    {
      label: "Multi-Sites",
      href: "/dashboard/contractor/sites",
      icon: MapPin,
      active: pathname.startsWith("/dashboard/contractor/sites"),
    },
    {
      label: "Teams & Workforce",
      href: "/dashboard/contractor/teams",
      icon: HardHat,
      active: pathname.startsWith("/dashboard/contractor/teams"),
    },
    {
      label: "Supervisors",
      href: "/dashboard/contractor/supervisors",
      icon: ShieldCheck,
      active: pathname.startsWith("/dashboard/contractor/supervisors"),
    },
    {
      label: "Attendance",
      href: "/dashboard/contractor/attendance",
      icon: CalendarCheck,
      active: pathname.startsWith("/dashboard/contractor/attendance"),
    },
    {
      label: "Daily Reports",
      href: "/dashboard/contractor/reports",
      icon: FileCheck2,
      active: pathname.startsWith("/dashboard/contractor/reports"),
    },
    {
      label: "GST Invoices",
      href: "/dashboard/contractor/invoices",
      icon: ReceiptIndianRupee,
      active: pathname.startsWith("/dashboard/contractor/invoices"),
    },
    {
      label: "Business Profile",
      href: "/dashboard/contractor/profile",
      icon: BriefcaseBusiness,
      active: pathname.startsWith("/dashboard/contractor/profile"),
    },
  ];

  return (
    <div className="bg-[#141414] border-b border-[#272727] sticky top-16 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active || (activeTab && activeTab.toLowerCase() === item.label.toLowerCase());

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-[#D4AF37]" : "text-zinc-500"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

