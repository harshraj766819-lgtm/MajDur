import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/toast-provider";
import { AuthProvider } from "@/lib/auth-context";
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
      <body className="min-h-screen flex flex-col bg-majdur-bg text-majdur-textPrimary antialiased selection:bg-[#D4AF37] selection:text-black transition-colors duration-200">
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
