import type { Metadata, Viewport } from "next";
import { Quicksand, Cinzel } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import GlobalNotification from "@/components/GlobalNotification";
import RootErrorBoundary from "../components/RootErrorBoundary";

const body = Quicksand({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const heading = Cinzel({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Mystic Tarot | Real-time Readings",
  description: "Profesyonel tarot danışmanlık platformu. Gerçek zamanlı okuma, video görüşme ve interaktif kart masası.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mystic Tarot",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0B14",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${body.variable} ${heading.variable} antialiased bg-[#0C0B14] text-neutral-50`}>
        <RootErrorBoundary>
          <Suspense fallback={<div className="min-h-screen bg-[#0C0B14]" />}>
            <GlobalNotification />
            {children}
          </Suspense>
        </RootErrorBoundary>
      </body>
    </html>
  );
}
