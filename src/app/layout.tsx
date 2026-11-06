import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "MajDur - Hire Verified Workers, Tradesmen & Daily Wage Labour in India",
  description:
    "India's premier marketplace for hiring verified electricians, plumbers, masons, painters, carpenters, and daily wage workers. Zero commission, direct connect, fair wages.",
  keywords: [
    "majdur",
    "hire workers india",
    "daily wage labour",
    "electrician near me",
    "plumber near me",
    "raj mistri",
    "painter contractor",
    "construction labour",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
