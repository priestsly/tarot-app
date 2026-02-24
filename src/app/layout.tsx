import type { Metadata } from "next";
import { DM_Sans, Cinzel } from "next/font/google";
import "./globals.css";

const body = DM_Sans({
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
  description: "A real-time, interactive mystical tarot reading platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${body.variable} ${heading.variable} antialiased bg-[#0C0B14] text-neutral-50`}>
        {children}
      </body>
    </html>
  );
}
