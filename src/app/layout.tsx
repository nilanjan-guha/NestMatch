



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
  title: "NestMatch",
  description: "Find the perfect PG tailored to your needs.",
};

export const viewport: Viewport = {
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