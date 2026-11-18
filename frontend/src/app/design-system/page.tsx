"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Hammer, 
  Search, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  ShieldCheck, 
  HardHat, 
  Users, 
  Briefcase, 
  ArrowRight, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  SlidersHorizontal,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { SearchBar } from "@/components/ui/search-bar";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton, CardSkeleton, WorkerCardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { DropdownMenu, DropdownItem, DropdownDivider } from "@/components/ui/dropdown-menu";
import { Modal } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sidebar, UserRole } from "@/components/layout/sidebar";
import { useToast } from "@/components/ui/toast-provider";
import { DESIGN_TOKENS } from "@/lib/design-tokens";

export default function DesignSystemPage() {
  const { toast } = useToast();

  // Dialog & Modal states
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isDestructiveConfirmOpen, setIsDestructiveConfirmOpen] = React.useState(false);
  const [confirmLoading, setConfirmLoading] = React.useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);

  // Sidebar role preview
  const [previewRole, setPreviewRole] = React.useState<UserRole>("WORKER");

  // SearchBar state
  const [searchParams, setSearchParams] = React.useState({ query: "", location: "" });

  // Input states
  const [inputText, setInputText] = React.useState("");
  const [inputError, setInputError] = React.useState("");

  const handleConfirmAction = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setConfirmLoading(false);
      setIsConfirmOpen(false);
      toast.success("Action Confirmed", "Your operation completed successfully.");
    }, 1200);
  };

  const handleDestructiveAction = () => {
    setConfirmLoading(true);
    setTimeout(() => {
      setConfirmLoading(false);
      setIsDestructiveConfirmOpen(false);
      toast.error("Item Deleted", "The record has been permanently removed.");
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200">
      {/* Hero Header */}
      <div className="border-b border-[#222222] bg-[#141414] light:bg-slate-100 light:border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="gold" dot>Phase 2 Design System</Badge>
                <Badge variant="worker">Live Tokens</Badge>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white light:text-slate-900">
                MajDur Component Library &amp; Design System
              </h1>
              <p className="mt-2 text-base text-zinc-400 light:text-slate-600 max-w-2xl">
                Comprehensive, accessible, production-ready design tokens and interactive UI primitives built for India&apos;s premier workforce marketplace.
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                <span>Developed by <strong className="text-zinc-300 light:text-slate-800">Harsh Singh</strong></span>
                <span>•</span>
                <span>Brand: <strong className="text-[#D4AF37]">MajDur (मजदूर)</strong></span>
                <span>•</span>
                <span>Theme: Dark (Default) &amp; Light</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/">
                <Button variant="outline" size="md">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
        
        {/* SECTION 1: DESIGN TOKENS & COLOR PALETTE */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              1. Brand Palette &amp; Design Tokens
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              High-contrast accessibility standards mapped to CSS custom variables.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-[#181818] border border-[#2a2a2a] space-y-2 light:bg-white light:border-slate-200">
              <div className="h-12 w-full rounded-lg bg-[#D4AF37] shadow-sm flex items-center justify-center font-bold text-black text-xs">
                #D4AF37
              </div>
              <div className="text-xs font-semibold text-white light:text-slate-900">MajDur Gold</div>
              <div className="text-[11px] text-zinc-400">Primary Signature</div>
            </div>

            <div className="p-4 rounded-xl bg-[#181818] border border-[#2a2a2a] space-y-2 light:bg-white light:border-slate-200">
              <div className="h-12 w-full rounded-lg bg-[#38BDF8] shadow-sm flex items-center justify-center font-bold text-black text-xs">
                #38BDF8
              </div>
              <div className="text-xs font-semibold text-white light:text-slate-900">Customer Blue</div>
              <div className="text-[11px] text-zinc-400">Customer Role</div>
            </div>

            <div className="p-4 rounded-xl bg-[#181818] border border-[#2a2a2a] space-y-2 light:bg-white light:border-slate-200">
              <div className="h-12 w-full rounded-lg bg-[#A855F7] shadow-sm flex items-center justify-center font-bold text-white text-xs">
                #A855F7
              </div>
              <div className="text-xs font-semibold text-white light:text-slate-900">Contractor Purple</div>
              <div className="text-[11px] text-zinc-400">Contractor Role</div>
            </div>

            <div className="p-4 rounded-xl bg-[#181818] border border-[#2a2a2a] space-y-2 light:bg-white light:border-slate-200">
              <div className="h-12 w-full rounded-lg bg-[#EF4444] shadow-sm flex items-center justify-center font-bold text-white text-xs">
                #EF4444
              </div>
              <div className="text-xs font-semibold text-white light:text-slate-900">Admin Red</div>
              <div className="text-[11px] text-zinc-400">Admin Role</div>
            </div>

            <div className="p-4 rounded-xl bg-[#181818] border border-[#2a2a2a] space-y-2 light:bg-white light:border-slate-200">
              <div className="h-12 w-full rounded-lg bg-[#16A34A] shadow-sm flex items-center justify-center font-bold text-white text-xs">
                #16A34A
              </div>
              <div className="text-xs font-semibold text-white light:text-slate-900">Emerald Success</div>
              <div className="text-[11px] text-zinc-400">Verified &amp; Paid</div>
            </div>

            <div className="p-4 rounded-xl bg-[#181818] border border-[#2a2a2a] space-y-2 light:bg-white light:border-slate-200">
              <div className="h-12 w-full rounded-lg bg-[#181818] border border-[#333333] shadow-sm flex items-center justify-center font-bold text-zinc-300 text-xs">
                #181818
              </div>
              <div className="text-xs font-semibold text-white light:text-slate-900">Dark Surface</div>
              <div className="text-[11px] text-zinc-400">Card &amp; Dialog</div>
            </div>
          </div>
        </section>

        {/* SECTION 2: BADGES & STATUS TAGS */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#D4AF37]" />
              2. Badges &amp; Status Indicators
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              User roles, verification status, and real-time state chips.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#262626] light:bg-white light:border-slate-200 space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">User Role Badges</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="customer" dot>Customer Account</Badge>
                <Badge variant="worker" dot>Verified Worker</Badge>
                <Badge variant="contractor" dot>General Contractor</Badge>
                <Badge variant="admin" dot>System Admin</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Semantic Status Badges</h3>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="gold">Premium Gold</Badge>
                <Badge variant="success" dot>Aadhaar Verified</Badge>
                <Badge variant="warning" dot>Pending Review</Badge>
                <Badge variant="danger" dot>Payment Overdue</Badge>
                <Badge variant="info">In Transit</Badge>
                <Badge variant="default">Standard</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: BUTTON MATRIX */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <Hammer className="h-5 w-5 text-[#D4AF37]" />
              3. Button System
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              Primary brand action, secondary surfaces, ghost, danger, success, and icon variants.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#262626] light:bg-white light:border-slate-200 space-y-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Button Variants</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary">
                  Primary Action (Gold)
                </Button>
                <Button variant="secondary">
                  Secondary Surface
                </Button>
                <Button variant="outline">
                  Outline Button
                </Button>
                <Button variant="ghost">
                  Ghost Button
                </Button>
                <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
                  Destructive
                </Button>
                <Button variant="success" leftIcon={<CheckCircle2 className="h-4 w-4" />}>
                  Success Action
                </Button>
                <Button variant="link">
                  Link Button
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Sizes &amp; States</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">
                  Small (sm)
                </Button>
                <Button variant="primary" size="md">
                  Medium (md)
                </Button>
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                  Large (lg)
                </Button>
                <Button variant="outline" size="icon" aria-label="Settings">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
                <Button variant="primary" isLoading>
                  Loading State
                </Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: FORM CONTROLS */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-[#D4AF37]" />
              4. Form Controls &amp; Inputs
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              High contrast input elements with left/right icons, helper notes, and live error validations.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#262626] light:bg-white light:border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Full Name"
                placeholder="e.g. Ramesh Kumar"
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  if (e.target.value.length < 3 && e.target.value.length > 0) {
                    setInputError("Name must be at least 3 characters");
                  } else {
                    setInputError("");
                  }
                }}
                error={inputError}
                helperText="Enter your official Aadhaar name"
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="98765 43210"
                leftIcon={<span className="text-xs font-bold text-zinc-400">+91</span>}
                helperText="We will send a 6-digit OTP"
              />

              <Select
                label="Service Category"
                helperText="Select primary trade"
                options={[
                  { value: "electrician", label: "Electrician (बिजली मिस्त्री)" },
                  { value: "plumber", label: "Plumber (प्लंबर)" },
                  { value: "carpenter", label: "Carpenter (बढ़ई)" },
                  { value: "mason", label: "Mason / Raj Mistri (राजमिस्त्री)" },
                  { value: "painter", label: "Painter (पेंटर)" },
                  { value: "labourer", label: "Daily Wage Labour (मजदूर)" },
                ]}
              />
            </div>
          </div>
        </section>

        {/* SECTION 5: ADVANCED SEARCH BAR */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#D4AF37]" />
              5. Search &amp; Discovery Filter
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              Interactive dual-input search bar for finding workers, trades, and Indian cities.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#262626] light:bg-white light:border-slate-200 space-y-4">
            <SearchBar
              initialQuery={searchParams.query}
              initialCity={searchParams.location || "All India"}
              onSearch={({ query, city }) => {
                setSearchParams({ query, location: city });
                toast.info(`Searching for "${query || 'All'}" in "${city}"`, "Search Executed");
              }}
            />
            {searchParams.query || searchParams.location ? (
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <span>Active Search Query:</span>
                <span className="font-semibold text-[#D4AF37]">{searchParams.query || "All Trades"}</span>
                <span>• Location:</span>
                <span className="font-semibold text-[#D4AF37]">{searchParams.location || "All Cities"}</span>
              </div>
            ) : null}
          </div>
        </section>

        {/* SECTION 6: ALERTS & TOAST NOTIFICATIONS */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-[#D4AF37]" />
              6. Notifications &amp; Alerts
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              System alerts and interactive toast notification triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inline Alerts */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Inline Alerts</h3>
              <Alert variant="info" title="Aadhaar Verification Required">
                Workers with verified identification receive 4x more direct booking requests.
              </Alert>
              <Alert variant="success" title="Booking Confirmed">
                Ramesh Kumar (Electrician) accepted your request for tomorrow 10:00 AM.
              </Alert>
              <Alert variant="warning" title="Minimum Wage Advisory">
                Daily wage rates are calculated based on state-notified labor schedules.
              </Alert>
              <Alert variant="destructive" title="Payment Overdue">
                Please complete payment for Job #MJ-904 to keep your booking active.
              </Alert>
            </div>

            {/* Interactive Toast Triggers */}
            <div className="p-6 rounded-2xl bg-[#181818] border border-[#262626] light:bg-white light:border-slate-200 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Interactive Toast Triggers</h3>
              <p className="text-sm text-zinc-400">Click below to test global animated toast messages with audio-visual cues:</p>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => toast.success("OTP Verified", "Your phone number +91 98765 43210 is verified.")}
                  className="justify-start gap-2 border-emerald-500/30 text-emerald-400 hover:text-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Trigger Success Toast
                </Button>

                <Button
                  variant="outline"
                  onClick={() => toast.error("Booking Rejected", "Worker is unavailable at this chosen time slot.")}
                  className="justify-start gap-2 border-red-500/30 text-red-400 hover:text-red-300"
                >
                  <AlertCircle className="h-4 w-4" />
                  Trigger Error Toast
                </Button>

                <Button
                  variant="outline"
                  onClick={() => toast.warning("Low Battery / Offline", "Worker status switched to offline.")}
                  className="justify-start gap-2 border-amber-500/30 text-amber-400 hover:text-amber-300"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Trigger Warning Toast
                </Button>

                <Button
                  variant="outline"
                  onClick={() => toast.info("New Direct Message", "Contractor Sharma sent you a job inquiry.")}
                  className="justify-start gap-2 border-blue-500/30 text-blue-400 hover:text-blue-300"
                >
                  <Info className="h-4 w-4" />
                  Trigger Info Toast
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 7: MODAL DIALOGS & CONFIRMATIONS */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#D4AF37]" />
              7. Dialogs &amp; Confirmation Modals
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              Accessible modals with focus-trapping, backdrop blur, and escape key handling.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#262626] light:bg-white light:border-slate-200">
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Open Standard Modal
              </Button>

              <Button variant="outline" onClick={() => setIsConfirmOpen(true)}>
                Open Confirm Dialog
              </Button>

              <Button variant="danger" onClick={() => setIsDestructiveConfirmOpen(true)}>
                Open Danger Dialog
              </Button>

              <DropdownMenu
                trigger={
                  <Button variant="secondary">
                    Actions Menu
                  </Button>
                }
              >
                <DropdownItem icon={<Download className="h-4 w-4" />}>
                  Download Invoice (PDF)
                </DropdownItem>
                <DropdownItem icon={<Copy className="h-4 w-4" />}>
                  Copy Profile Link
                </DropdownItem>
                <DropdownDivider />
                <DropdownItem destructive icon={<Trash2 className="h-4 w-4" />}>
                  Cancel Booking
                </DropdownItem>
              </DropdownMenu>
            </div>
          </div>

          {/* Standard Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Worker Verification Details"
            description="Aadhaar KYC and background verification records."
          >
            <div className="space-y-4 text-sm text-zinc-300 light:text-slate-700">
              <p>
                MajDur verifies workers using a multi-tier pipeline:
              </p>
              <ul className="space-y-2 list-disc list-inside text-xs text-zinc-400 light:text-slate-600">
                <li>UIDAI Aadhaar OTP or biometric record verification</li>
                <li>Trade certificate and ITI diploma verification where applicable</li>
                <li>Police verification certificate upload &amp; audit</li>
                <li>Prior customer rating &amp; dispute history review</li>
              </ul>
              <div className="pt-4 flex justify-end gap-2 border-t border-[#262626]">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => {
                  setIsModalOpen(false);
                  toast.success("Saved", "Verification preferences saved.");
                }}>
                  Confirm Verification
                </Button>
              </div>
            </div>
          </Modal>

          {/* Primary Confirm Dialog */}
          <ConfirmDialog
            isOpen={isConfirmOpen}
            onClose={() => setIsConfirmOpen(false)}
            onConfirm={handleConfirmAction}
            title="Book Worker for ₹650 / Day?"
            description="You are booking Ramesh Kumar for 1 day in New Delhi. No upfront fee is charged until work begins."
            confirmLabel="Confirm Booking"
            isLoading={confirmLoading}
          />

          {/* Destructive Danger Confirm Dialog */}
          <ConfirmDialog
            isOpen={isDestructiveConfirmOpen}
            onClose={() => setIsDestructiveConfirmOpen(false)}
            onConfirm={handleDestructiveAction}
            title="Delete Job Post Permanently?"
            description="Are you sure you want to delete this job post? All 8 candidate applications will be canceled."
            confirmLabel="Delete Job Post"
            variant="danger"
            isLoading={confirmLoading}
          />
        </section>

        {/* SECTION 8: CARDS & WORKER PREVIEW */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <HardHat className="h-5 w-5 text-[#D4AF37]" />
              8. Cards &amp; Worker Presentation
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              Rich card primitives with headers, badges, pricing, and action footers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="worker" dot>Electrician</Badge>
                  <span className="text-xs font-bold text-emerald-400">★ 4.9 (128 reviews)</span>
                </div>
                <CardTitle className="mt-3">Ramesh Kumar</CardTitle>
                <CardDescription>Connaught Place, New Delhi • 8 yrs exp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-zinc-300 light:text-slate-600 leading-relaxed">
                  Specialist in complete house wiring, MCB tripping, inverter installation, and 3-phase industrial connections.
                </p>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#222222]">
                  <span className="text-zinc-400">Standard Daily Rate:</span>
                  <span className="text-base font-bold text-[#D4AF37]">₹650 <span className="text-xs font-normal text-zinc-400">/ day</span></span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">View Profile</Button>
                <Button variant="primary" size="sm">Book Now</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="contractor" dot>Contractor</Badge>
                  <span className="text-xs font-bold text-emerald-400">★ 4.8 (64 projects)</span>
                </div>
                <CardTitle className="mt-3">Sharma Civil Works</CardTitle>
                <CardDescription>Noida Sector 62 • 15 yrs exp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-zinc-300 light:text-slate-600 leading-relaxed">
                  Complete turnkey RCC construction, plastering, tile flooring, and multi-story commercial renovations.
                </p>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#222222]">
                  <span className="text-zinc-400">Available Team:</span>
                  <span className="text-sm font-bold text-white light:text-slate-900">25+ Masons &amp; Labourers</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">View Portfolio</Button>
                <Button variant="primary" size="sm">Request Quote</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="customer" dot>Active Job</Badge>
                  <span className="text-xs font-bold text-amber-400">Urgent</span>
                </div>
                <CardTitle className="mt-3">Bathroom Pipe Leakage</CardTitle>
                <CardDescription>Indirapuram, Ghaziabad • Posted 2 hrs ago</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-zinc-300 light:text-slate-600 leading-relaxed">
                  Main wall pipe joint leaking water inside bathroom. Require experienced plumber with soldering &amp; CPVC tools.
                </p>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-[#222222]">
                  <span className="text-zinc-400">Fixed Budget:</span>
                  <span className="text-base font-bold text-emerald-400">₹450</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">Details</Button>
                <Button variant="primary" size="sm">Apply For Job</Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* SECTION 9: LOADING SKELETONS & EMPTY STATES */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-[#D4AF37]" />
              9. Loading Skeletons &amp; Empty States
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              Polished shimmer animations for asynchronous data fetching and zero-state messaging.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Shimmer Loading Skeletons</h3>
              <WorkerCardSkeleton />
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Accessible Empty State</h3>
              <div className="p-6 rounded-2xl bg-[#181818] border border-[#262626] light:bg-white light:border-slate-200">
                <EmptyState
                  icon={Briefcase}
                  title="No Job Applications Found"
                  description="You haven't applied to any jobs yet. Browse available construction, electrical, and plumbing listings."
                  actionLabel="Find Work Now"
                  onAction={() => toast.info("Redirecting", "Navigating to jobs listings.")}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: PAGINATION */}
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
              <ChevronRight className="h-5 w-5 text-[#D4AF37]" />
              10. Accessible Pagination
            </h2>
            <p className="text-sm text-zinc-400 light:text-slate-600">
              Calculates page ranges, smart ellipsis, and updates page indexes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#181818] border border-[#262626] light:bg-white light:border-slate-200">
            <Pagination
              currentPage={currentPage}
              totalPages={12}
              totalResults={118}
              pageSize={10}
              onPageChange={(page) => {
                setCurrentPage(page);
                toast.info("Page Changed", `Loaded page ${page} of workers directory.`);
              }}
            />
          </div>
        </section>

        {/* SECTION 11: ROLE-BASED DASHBOARD SIDEBAR PREVIEW */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white light:text-slate-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-[#D4AF37]" />
                11. Role-Based Navigation Sidebars
              </h2>
              <p className="text-sm text-zinc-400 light:text-slate-600">
                Modular multi-role dashboard navigation with collapse toggle and badge indicators.
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#141414] rounded-xl border border-[#262626]">
              {(["CUSTOMER", "WORKER", "CONTRACTOR", "ADMIN"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setPreviewRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    previewRole === r
                      ? "bg-[#D4AF37] text-black shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden flex min-h-[480px]">
            <Sidebar
              role={previewRole}
              userName={
                previewRole === "ADMIN"
                  ? "Harsh Singh (Admin)"
                  : previewRole === "CONTRACTOR"
                  ? "Sharma Civil Works"
                  : previewRole === "WORKER"
                  ? "Ramesh Kumar"
                  : "Deepak Verma"
              }
              userPhone="+91 98765 43210"
            />
            <div className="flex-1 p-8 flex flex-col justify-center items-center text-center space-y-4">
              <Badge variant={previewRole.toLowerCase() as any} dot>
                {previewRole} Dashboard View
              </Badge>
              <h3 className="text-2xl font-bold text-white light:text-slate-900">
                Active Role: {previewRole}
              </h3>
              <p className="text-sm text-zinc-400 light:text-slate-600 max-w-md">
                The sidebar on the left displays dynamic navigation items specifically configured for the <strong className="text-white light:text-slate-900">{previewRole}</strong> persona.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
