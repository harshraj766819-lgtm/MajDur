import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "MajDur — Find Work. Hire Workers. Build Your Future.",
  description:
    "India's premier marketplace for hiring verified skilled workers, tradesmen, contractors, and daily wage labourers. Developed by Harsh Singh.",
  authors: [{ name: "Harsh Singh" }],
  keywords: [
    "MajDur",
    "Harsh Singh",
    "hire workers india",
    "daily wage labour",
    "skilled tradesmen",
    "electrician near me",
    "plumber near me",
    "contractor hiring",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen flex flex-col bg-[#101010] text-white antialiased selection:bg-[#D4AF37] selection:text-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
