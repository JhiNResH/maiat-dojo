import type { Metadata } from "next";
import "./globals.css";
import { PrivyProvider } from "@/components/PrivyProvider";

export const metadata: Metadata = {
  title: "The Dojo — Maiat Skill Marketplace",
  description: "The daily dispatch of AI agent skills. Equip your agent, earn on-chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider>{children}</PrivyProvider>
      </body>
    </html>
  );
}
