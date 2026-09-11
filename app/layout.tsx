import type { Metadata } from "next";
import { Fraunces, Noto_Sans_KR, Outfit } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });
const kr = Noto_Sans_KR({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-kr" });
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif" });

export const metadata: Metadata = {
  title: "PSSOT — Project Management Package Generating System",
  description:
    "Transform customer information into a Project Single Source of Truth and generate PM, data, architecture, and AI artifacts as views of that SSOT.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${kr.variable} ${serif.variable} antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
