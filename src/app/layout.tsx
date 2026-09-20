import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Vernex Digital",
  description: "Professional digital services panel — Virtual Numbers, SMM, Airtime, Data & more",
  applicationName: "Vernex",
  appleWebApp: {
    title: "Vernex",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-background text-text-primary font-sans">
        {children}
      </body>
    </html>
  );
}
