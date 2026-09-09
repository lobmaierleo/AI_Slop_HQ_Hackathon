import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Datenlabor — AI Hackathon Ars Electronica 2026",
  description:
    "Festivalprogramm und Open Data der Stadt Linz in einer Ansicht. Arbeitsgerüst für den AI Hackathon beim Ars Electronica Festival 2026.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-text">{children}</body>
    </html>
  );
}
