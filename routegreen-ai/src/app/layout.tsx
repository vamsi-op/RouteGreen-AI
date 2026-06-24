import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RouteGreen AI — Carbon-Aware Fleet Routing",
  description:
    "Hybrid AI + Operations Research platform for carbon-aware fleet routing and 3D cargo load optimization.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
