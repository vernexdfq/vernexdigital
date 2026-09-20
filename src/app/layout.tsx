import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vernex Digital",
  description: "Professional digital services panel — Virtual Numbers, SMM, Airtime, Data & more",
  applicationName: "Vernex",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className={`${inter.className} min-h-full flex flex-col antialiased bg-white text-[#0F172A]`}>
        {children}
      </body>
    </html>
  );
}
