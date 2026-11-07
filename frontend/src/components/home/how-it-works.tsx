"use client";

import * as React from "react";
import { Search, UserCheck, ShieldAlert, Award, PhoneCall, Wallet, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  const [activeTab, setActiveTab] = React.useState<"customer" | "worker">("customer");

  return (
    <section className="py-20 bg-[#101010] border-t border-[#1c1c1c]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-full border border-[#D4AF37]/30">
            Simple &amp; Transparent Process
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            How MajDur Works
          </h2>
          <p className="mt-2 text-base text-zinc-400">
            A trustworthy workforce ecosystem engineered for transparent Indian hiring.
          </p>

          {/* Persona Switcher Tabs */}
          <div className="mt-8 inline-flex p-1.5 rounded-xl bg-[#181818] border border-[#2a2a2a]">
            <button
              onClick={() => setActiveTab("customer")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "customer"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              For Homeowners &amp; Contractors
            </button>
            <button
              onClick={() => setActiveTab("worker")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "worker"
                  ? "bg-[#D4AF37] text-black shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              For Workers / मजदूर भाईयों के लिए
            </button>
          </div>
        </div>

        {activeTab === "customer" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-[#222222] bg-[#181818] p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 font-black text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Search or Post Requirement
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Filter workers by skill trade, daily rate, city, area, and verified status, or publish a job with your budget and site location.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-[#222222] bg-[#181818] p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-[#D4AF37] border border-[#D4AF37]/40 shadow-lg font-black text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Connect Directly &amp; Confirm
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Check worker experience, reviews, and ID verification status. Send a direct booking request or call to agree on start date and timings.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-[#222222] bg-[#181818] p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-black text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Work Done &amp; Safe Payment
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Inspect work quality on completion. Pay transparently with standard rates and receive verified digital invoices.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-[#222222] bg-[#181818] p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20 font-black text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                मुफ्त प्रोफाइल बनाएं (Free Registration)
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                अपना मोबाइल नंबर दर्ज करें। अपने काम का हुनर (इलेक्ट्रीशियन, प्लम्बर, मिस्त्री) और अपनी मनपसंद दिहाड़ी सेट करें।
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-[#222222] bg-[#181818] p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 text-[#D4AF37] border border-[#D4AF37]/40 shadow-lg font-black text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                सीधे काम और बुकिंग पाएं
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                ठेकेदारों और घरों से सीधे आपके फोन पर कॉल या बुकिंग नोटिफिकेशन आएगा। बीच में कोई दलाल या कमीशन नहीं।
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-[#222222] bg-[#181818] p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-black text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                पूरी दिहाड़ी और सम्मान
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                काम पूरा होने पर सही दिहाड़ी पाएं। ग्राहक से अच्छी रेटिंग पाएं जिससे आपको और भी ज्यादा काम और कमाई मिले।
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
