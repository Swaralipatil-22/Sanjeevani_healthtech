import type { Metadata, Viewport } from "next";
import { Inter, Manrope } from "next/font/google";

import GlobalProvider from "@/components/providers/global-provider";

import "@/styles/global.css";

const inter = Inter({
  subsets: ["latin"],
  preload: true,
  variable: "--font-inter",
});

const manrope = Manrope({
  subsets: ["latin"],
  preload: true,
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: {
    default: "Sanjeevani | Rural Health Outreach Console",
    template: "%s | Sanjeevani",
  },
  description:
    "Secure clinical data entry and district health analytics for rural outreach centres.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} scroll-smooth`}
    >
      <body className={inter.className}>
        <GlobalProvider>{children}</GlobalProvider>
      </body>
    </html>
  );
}
