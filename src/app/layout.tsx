



// import type { Metadata, Viewport } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
// import "./globals.css";
// import Navbar from "@/components/Navbar";
// import { Toaster } from "react-hot-toast";
// import { ClerkProvider } from "@clerk/nextjs";
// import Script from "next/script";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "NestMatch",
//   description: "Find the perfect PG tailored to your needs.",
// };

// export const viewport: Viewport = {
//   width: "device-width",
//   initialScale: 1,
//   maximumScale: 1,
//   userScalable: false,
//   viewportFit: "cover",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <ClerkProvider>
//       <html
//         lang="en"
//         className={`${geistSans.variable} ${geistMono.variable}`}
//         suppressHydrationWarning
//       >
//         <head />

//         <body suppressHydrationWarning>
//           {/* Google Analytics - gtag.js */}
//           <Script
//             src="https://www.googletagmanager.com/gtag/js?id=G-L2TCLM5GRQ"
//             strategy="afterInteractive"
//           />
//           <Script id="google-analytics" strategy="afterInteractive">
//             {`
//               window.dataLayer = window.dataLayer || [];
//               function gtag(){dataLayer.push(arguments);}
//               gtag('js', new Date());
//               gtag('config', 'G-L2TCLM5GRQ');
//             `}
//           </Script>

//           {/* Google AdSense */}
//           <Script
//             src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1589107667014849"
//             strategy="afterInteractive"
//             crossOrigin="anonymous"
//           />

//           <Toaster position="bottom-right" />
//           <Navbar />
//           {children}
//         </body>
//       </html>
//     </ClerkProvider>
//   );
// }












import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NestMatch | AI Powered PG & Hostel Finder",
  description: "Find the perfect PG, Hostel, or Coliving space instantly using NestMatch's Quad-AI search engine. Affordable rooms for rent, boys PG, girls PG, and couples friendly housing in your city.",
  keywords: [
    // Core terms
    "PG", "Hostel", "Coliving", "NestMatch", "Rent", "Roommate", "Boys PG", "Girls PG", "Flats", "AI PG Finder", "India PG", 
    "Paying Guest", "Student Housing", "Corporate Housing", "Shared Accommodation", "Rooms for Rent",
    // Top Cities
    "PG in Bangalore", "PG in Gurgaon", "PG in Mumbai", "PG in Pune", "PG in Delhi", "PG in Noida", "PG in Hyderabad", "PG in Chennai",
    // Specifics
    "Cheap PG", "Luxury PG", "Single Room PG", "Double Sharing PG", "PG with Food", "PG with WiFi", "PG with AC",
    "Couples Friendly PG", "No Brokerage PG", "Direct Owner PG", "Zero Brokerage flats", "Furnished Flat",
    // AI/Tech angles
    "AI Real Estate", "Smart PG Search", "Automated PG Booking", "NestMatch AI", "Nest Match"
  ],
  openGraph: {
    title: "NestMatch | AI Powered PG Finder",
    description: "Tired of brokers? Use our AI to find the perfect PG matching your exact budget and requirements instantly.",
    type: "website",
    locale: "en_IN",
    siteName: "NestMatch",
  },
  twitter: {
    card: "summary_large_image",
    title: "NestMatch | AI Powered PG Finder",
    description: "Tired of brokers? Use our AI to find the perfect PG matching your exact budget and requirements instantly.",
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      unsafe_disableDevelopmentModeConsoleWarning={true}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <head />

        <body suppressHydrationWarning>
          <NextTopLoader 
            color="#6366f1"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
            shadow="0 0 10px #6366f1,0 0 5px #6366f1"
            zIndex={1600000}
          />
          {/* Google Analytics - gtag.js */}
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-L2TCLM5GRQ"
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-L2TCLM5GRQ');
            `}
          </Script>

          {/* Google AdSense */}
          <Script
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1589107667014849"
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />

          <Toaster position="bottom-right" />
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}