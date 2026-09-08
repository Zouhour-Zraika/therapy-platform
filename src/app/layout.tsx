import type { Metadata } from "next";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import FeedbackMode from "./components/FeedbackMode";
import CookieBanner from "./components/CookieBanner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aancliniclb.com"),

  title: {
    default: "AAN Psychotherapy",
    template: "%s | AAN Psychotherapy",
  },

  description:
    "A secure online psychotherapy platform connecting patients with qualified therapists.",

  applicationName: "AAN Psychotherapy",

  keywords: [
    "psychotherapy",
    "online therapy",
    "mental health",
    "therapists",
    "Arabic therapy",
    "English therapy",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aancliniclb.com",
    siteName: "AAN Psychotherapy",
    title: "AAN Psychotherapy",
    description:
      "A secure online psychotherapy platform connecting patients with qualified therapists.",
    images: [
      {
        url: "/og-aan.png",
        width: 1200,
        height: 630,
        alt: "AAN Psychotherapy - secure online psychotherapy",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "AAN Psychotherapy",
    description:
      "A secure online psychotherapy platform connecting patients with qualified therapists.",
    images: ["/og-aan.png"],
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="h-full"
      style={
        {
          "--font-inter": 'Arial, Helvetica, "Segoe UI", sans-serif',
          "--font-playfair": 'Georgia, "Times New Roman", serif',
          "--font-arabic": 'Tahoma, Arial, "Segoe UI", sans-serif',
        } as React.CSSProperties
      }
    >
      <body className="flex min-h-full flex-col bg-aan-background font-sans antialiased">
        <LanguageProvider>
          {children}
          <FeedbackMode />
          <CookieBanner />
        </LanguageProvider>
      </body>
    </html>
  );
}
