import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maiat Dojo — AI Skill Marketplace",
  description: "The daily dispatch of AI agent skills. Equip your agent, earn on-chain.",
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
