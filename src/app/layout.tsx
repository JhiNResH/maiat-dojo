import type { Metadata } from "next";
import "./globals.css";
import { PrivyProvider } from "@/components/PrivyProvider";
import { ClientInit } from "@/components/ClientInit";

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
        <PrivyProvider>
          <ClientInit />
          {children}
        </PrivyProvider>
      </body>
    </html>
  );
}
