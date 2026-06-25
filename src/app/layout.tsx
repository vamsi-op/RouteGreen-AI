import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RouteGreen AI — Carbon-Aware Fleet Routing & 3D Cargo Optimization",
  description:
    "Hybrid AI + Operations Research platform for carbon-aware fleet routing and 3D cargo load optimization. Aligned with UN SDG 11, 12, and 13. Built with IBM Granite on watsonx.ai.",
  keywords: [
    "carbon-aware routing",
    "3D bin packing",
    "IBM Granite",
    "sustainability",
    "ESG compliance",
    "fleet optimization",
    "SDG",
    "watsonx.ai",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
