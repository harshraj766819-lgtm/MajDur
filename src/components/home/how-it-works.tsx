"use client";

import * as React from "react";
import { Search, UserCheck, ShieldAlert, Award, PhoneCall, Wallet, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HowItWorks() {
  const [activeTab, setActiveTab] = React.useState<"customer" | "worker">("customer");

  return (
    <section className="py-20 bg-white border-t border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            Simple &amp; Transparent
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
            How MajDur Works
          </h2>
          <p className="mt-2 text-base text-slate-600">
            A seamless marketplace built specifically for the realities of Indian labor hiring.
          </p>

          {/* Persona Switcher Tabs */}
          <div className="mt-8 inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200">
            <button
              onClick={() => setActiveTab("customer")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "customer"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              For Homeowners &amp; Contractors
            </button>
            <button
              onClick={() => setActiveTab("worker")}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "worker"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              For Workers / मजदूर भाईयों के लिए
            </button>
          </div>
        </div>

        {activeTab === "customer" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20 font-black text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Search or Post Requirement
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Filter workers by skill trade, daily rate, city, and verified status, or post a job with your budget and site address.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 font-black text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Connect Directly &amp; Confirm
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Check worker experience, reviews, and ID verification. Send a direct booking request or call to agree on start date and timings.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-black text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Work Done &amp; Safe Payment
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Inspect work quality on completion. Pay transparently using online payment or cash with an instant digital invoice.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative rounded-2xl border border-slate-200 bg-amber-50/40 p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20 font-black text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                फ्री रजिस्ट्रेशन (Sign Up Free)
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                अपना मोबाइल नंबर और आधार दर्ज करें। अपने काम का हुनर (इलेक्ट्रीशियन, प्लम्बर, मिस्त्री) और अपनी मनपसंद दिहाड़ी चुनें।
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative rounded-2xl border border-slate-200 bg-amber-50/40 p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 font-black text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                सीधे ग्राहकों से काम पाएं
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                ठेकेदारों और घरों से सीधे आपके फोन पर कॉल या बुकिंग नोटिफिकेशन आएगा। बीच में कोई दलाल या कमीशन नहीं।
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative rounded-2xl border border-slate-200 bg-amber-50/40 p-8 text-center flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 font-black text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                पूरी दिहाड़ी और सम्मान
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                काम पूरा होने पर सही दिहाड़ी पाएं। ग्राहक से अच्छी रेटिंग पाएं जिससे आपको और भी ज्यादा काम और कमाई मिले।
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
