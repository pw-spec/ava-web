import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { BRAND, brandConfig } from "@/lib/brand";
import { ProfileScoresProvider } from "@/lib/profileScores";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const brand = brandConfig[BRAND];

export const metadata: Metadata = {
  title: `${brand.name} — ${brand.tagline}`,
  description: `${brand.name} is an AI health companion for men's health optimization. Not a doctor. 100% private.`,
  metadataBase: new URL(`https://${brand.domain}`),
  openGraph: {
    title: brand.name,
    description: brand.tagline,
    url: `https://${brand.domain}`,
    siteName: brand.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0d12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-brand={BRAND}
      className={`${inter.variable} ${jetbrains.variable}`}
    >
      <body>
        <ProfileScoresProvider>{children}</ProfileScoresProvider>
      </body>
    </html>
  );
}
