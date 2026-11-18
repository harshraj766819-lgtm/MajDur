"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Search, 
  UserCheck, 
  ShieldCheck, 
  PhoneCall, 
  Wallet, 
  ArrowRight,
  HardHat,
  BadgeCheck,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  const [activeTab, setActiveTab] = React.useState<"customer" | "worker">("customer");

  return (
    <section className="py-20 bg-[#101010] border-b border-[#1c1c1c] text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-3.5 py-1 rounded-full border border-[#D4AF37]/30">
            Simple, Transparent &amp; Direct
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            How MajDur Works
          </h2>
          <p className="mt-2 text-base text-zinc-400">
            A trustworthy, digital workforce ecosystem engineered for fair Indian hiring with zero hidden cuts.
          </p>

          {/* Persona Switcher Tabs */}
          <div className="mt-8 inline-flex p-1.5 rounded-2xl bg-[#181818] border border-[#2a2a2a]">
            <button
              onClick={() => setActiveTab("customer")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "customer"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              For Customers &amp; Homeowners
            </button>
            <button
              onClick={() => setActiveTab("worker")}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === "worker"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              For Workers / मजदूर भाईयों के लिए
            </button>
          </div>
        </div>

        {/* Customer Steps */}
        {activeTab === "customer" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative rounded-3xl border border-[#222222] bg-[#161616] p-8 text-center flex flex-col items-center hover:border-[#D4AF37]/40 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/25 font-black text-2xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5">
                Search for a Skilled Worker
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Filter by service trade, city, locality area, or 6-digit PIN code. Instantly browse available electricians, masons, plumbers, carpenters, and helpers nearby.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs text-[#D4AF37] font-semibold">
                <Search className="h-4 w-4" />
                <span>32 Verified Trades Available</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-3xl border border-[#222222] bg-[#161616] p-8 text-center flex flex-col items-center hover:border-[#D4AF37]/40 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#222222] text-[#D4AF37] border border-[#D4AF37]/40 shadow-lg font-black text-2xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5">
                Compare Profiles &amp; Request
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Inspect Aadhaar KYC verification status, verified experience years, real reviews, and transparent minimum daily rate cards before sending a direct booking request.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs text-[#D4AF37] font-semibold">
                <UserCheck className="h-4 w-4" />
                <span>Zero Hidden Intermediaries</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-3xl border border-[#222222] bg-[#161616] p-8 text-center flex flex-col items-center hover:border-[#D4AF37]/40 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 font-black text-2xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5">
                Hire &amp; Manage Your Work
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Agree on timings directly with the worker. Inspect completed work quality, pay transparently via digital methods, and generate verified tax invoices.
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <Wallet className="h-4 w-4" />
                <span>Safe Direct Payment</span>
              </div>
            </div>
          </div>
        ) : (
          /* Worker Steps */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Worker Step 1 */}
            <div className="relative rounded-3xl border border-[#222222] bg-[#161616] p-8 text-center flex flex-col items-center hover:border-[#D4AF37]/40 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/25 font-black text-2xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5">
                मुफ्त प्रोफाइल बनाएं (Free Registration)
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                अपना मोबाइल नंबर दर्ज करें और अपना हुनर, अनुभव, काम का शहर और दैनिक दिहाड़ी दर सेट करें। 100% निशुल्क।
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs text-[#D4AF37] font-semibold">
                <HardHat className="h-4 w-4" />
                <span>Zero Registration Fee</span>
              </div>
            </div>

            {/* Worker Step 2 */}
            <div className="relative rounded-3xl border border-[#222222] bg-[#161616] p-8 text-center flex flex-col items-center hover:border-[#D4AF37]/40 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#222222] text-[#D4AF37] border border-[#D4AF37]/40 shadow-lg font-black text-2xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5">
                आधार वेरिफिकेशन कराएं (Get Verified)
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                अपना आधार कार्ड अपलोड करके अपनी प्रोफाइल पर ग्रीन वेरिफाइड बैज पाएं। वेरिफाइड कारीगरों को 4 गुना अधिक काम मिलता है।
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs text-[#D4AF37] font-semibold">
                <BadgeCheck className="h-4 w-4" />
                <span>Government ID Verification</span>
              </div>
            </div>

            {/* Worker Step 3 */}
            <div className="relative rounded-3xl border border-[#222222] bg-[#161616] p-8 text-center flex flex-col items-center hover:border-[#D4AF37]/40 transition-colors">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 font-black text-2xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2.5">
                सीधा फोन पर काम और पूरी कमाई
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                ग्राहकों और ठेकेदारों से सीधे फोन कॉल प्राप्त करें। काम पूरा होने पर तुरंत पूरा भुगतान लें। कोई दलाली या कमीशन नहीं।
              </p>
              <div className="mt-6 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                <span>100% Direct Take-Home Pay</span>
              </div>
            </div>
          </div>
        )}

        {/* CTA Bottom Banner */}
        <div className="mt-14 text-center">
          <Link href={activeTab === "customer" ? "/workers" : "/register?role=WORKER"}>
            <Button
              variant="primary"
              size="lg"
              className="px-8 font-bold bg-[#D4AF37] hover:bg-[#C5A028] text-black shadow-lg shadow-[#D4AF37]/20"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {activeTab === "customer" ? "Get Started — Hire a Worker" : "कारीगर के रूप में अभी जुड़ें"}
            </Button>
          </Link>
        </div>

      </div>
    </section>
  );
}
