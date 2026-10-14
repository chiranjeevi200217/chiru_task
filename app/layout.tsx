import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeadLens — AI Lead Scoring & Clean-up Layer for SaaS Acquisition Targets",
  description: "An acquisition-fit intelligence platform for PE search funds sourcing SaaS targets. Real-time configurable scoring, Claude AI explainability, and deduplication pipeline.",
  keywords: ["SaaS sourcing", "Search Fund", "Private Equity", "Lead Scoring", "ETA", "M&A Intelligence", "LeadLens"],
  authors: [{ name: "LeadLens Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full font-sans antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
