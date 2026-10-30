import type { Metadata, Viewport } from "next";
import { Fira_Code, Fira_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./components/Providers";
import Agent from "./components/Agent";

const body = Fira_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-body-face", display: "swap" });
const mono = Fira_Code({ subsets: ["latin"], variable: "--font-mono-face", display: "swap" });

export const metadata: Metadata = {
  title: "Haulix — the AI operations desk for logistics",
  description: "Nine AI agents that take orders, quote lanes, plan routes, watch every shipment and fix problems — and ask a person before anything costly happens. By Zovak.",
};

export const viewport: Viewport = { themeColor: "#111317" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${mono.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Agent />
      </body>
    </html>
  );
}
