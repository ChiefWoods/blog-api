import { Geist, Geist_Mono, Merriweather } from "next/font/google";

import "./globals.css";
import Script from "next/script";

import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const merriweather = Merriweather({ subsets: ["latin"], variable: "--font-serif" });

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontSans.variable,
        fontMono.variable,
        "font-serif",
        merriweather.variable,
      )}
    >
      <head>
        {process.env.NODE_ENV === "development" && (
          <>
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
            />
            <Script
              src="//unpkg.com/react-scan/dist/auto.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
            />
          </>
        )}
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
