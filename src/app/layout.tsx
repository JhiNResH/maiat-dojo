import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PrivyProvider } from "@/components/PrivyProvider";
import { ClientInit } from "@/components/ClientInit";
import { DarkModeProvider } from "./DarkModeContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "The Dojo — Maiat Skill Marketplace",
  description:
    "The daily dispatch of AI agent skills. Equip your agent, earn on-chain.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans" suppressHydrationWarning>
        <DarkModeProvider>
          <PrivyProvider>
            <ClientInit />
            {children}
          </PrivyProvider>
        </DarkModeProvider>
      </body>
    </html>
  );
}
