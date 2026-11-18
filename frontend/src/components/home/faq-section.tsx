"use client";

import * as React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "How do I find and hire skilled workers on MajDur?",
    answer:
      "You can search directly by trade category (e.g. Electrician, Plumber, Mason), city, area, or 6-digit PIN code using the search bar on our homepage. You can view worker experience, verified skills, and standard minimum daily wage rates. Once you find a suitable profile, you can send a booking request or connect with them directly.",
  },
  {
    question: "How do workers register on MajDur? Is there any registration fee?",
    answer:
      "Worker registration is 100% free with zero joining fees. Workers can sign up with their mobile phone number, set their primary trade, skills, daily/hourly rates, and working location. To receive the green 'Verified' badge and get up to 4x more booking requests, workers complete an Aadhaar and background verification step.",
  },
  {
    question: "How do commercial contractors hire bulk labour (10 to 100+ workers)?",
    answer:
      "Contractors can register as a Contractor to access our enterprise hiring suite. You can post site project requirements, specify the number of masons, carpenters, and helpers needed, review candidate gangs, manage attendance, and generate consolidated GST invoices for company accounting.",
  },
  {
    question: "How does worker KYC and identity verification work?",
    answer:
      "MajDur verifies worker identities using government-issued documents including UIDAI Aadhaar, Voter ID, and trade certifications where applicable. Verified profiles display a prominent green shield badge, giving homeowners and builders complete confidence in who is arriving at their premises.",
  },
  {
    question: "How do booking requests and wage payments work?",
    answer:
      "When you send a booking request, the worker receives an instant notification with your project details and location. Once the worker accepts, you coordinate start timings directly. Payments are based on transparent daily or hourly rate cards, paid directly without predatory middleman deductions.",
  },
  {
    question: "What safety, dispute resolution, and guarantees does MajDur provide?",
    answer:
      "We enforce strict community standards. In the rare event of a dispute or service issue, customers and workers can raise a ticket through our Dispute Resolution Portal. Dedicated support agents mediate resolutions, and persistent poor performers are removed from the platform.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-[#121212] border-b border-[#1c1c1c] text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/30">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Got Questions? We Have Answers</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Everything you need to know about hiring verified workers, registering your trade, and managing workforce operations.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3.5">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className={cn(
                  "rounded-2xl border transition-all duration-200 overflow-hidden",
                  isOpen
                    ? "border-[#D4AF37]/50 bg-[#181818] shadow-lg shadow-[#D4AF37]/5"
                    : "border-[#242424] bg-[#161616] hover:border-[#333333]"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between p-5 sm:p-6 text-left focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-bold text-white pr-4 leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-transform duration-200",
                      isOpen
                        ? "bg-[#D4AF37] text-black rotate-180"
                        : "bg-[#222222] text-zinc-400"
                    )}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-6 sm:px-6 text-sm text-zinc-300 leading-relaxed border-t border-[#222222] pt-4 animate-in fade-in duration-150">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

