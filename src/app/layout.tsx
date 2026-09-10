import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from 'react-hot-toast';
import { ClerkProvider } from '@clerk/nextjs'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NestMatch",
  description: "Find the perfect PG tailored to your needs.",
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <head>
          {/* Google AdSense Integration */}
          <script
            async
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1589107667014849"
            crossOrigin="anonymous"
          ></script>
        </head>
        <body suppressHydrationWarning>
          <Toaster position="bottom-right" />
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
