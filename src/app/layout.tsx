import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vernex",
  description: "Vernex is a mobile-first digital services platform for virtual numbers, verification, social growth, rental numbers, airtime, data, gift cards, shopping and flight booking. Connect. Verify. Grow.",
  keywords: ["Vernex", "virtual numbers", "OTP verification", "social media boost", "rental numbers", "airtime", "data", "gift cards", "shopping", "flight booking", "digital services"],
  openGraph: {
    title: "Vernex — Connect. Verify. Grow.",
    description: "Virtual numbers, verification, social growth, connectivity, gift cards, shopping and flight booking in one mobile-first platform.",
    type: "website",
    siteName: "Vernex",
  },
  robots: { index: true, follow: true },
  applicationName: "Vernex",
  icons: {
    icon: "/vernex-icon.jpg",
    apple: "/vernex-icon.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}
