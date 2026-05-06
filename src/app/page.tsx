/**
 * Dojo home — collection-first AI workflow marketplace.
 */

import { LandingHero } from "@/components/landing/LandingHero";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function DojoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      {/* ═══ AMBIENT GRADIENT MESH ═══ */}
      <div className="atmosphere" />

      <Navbar />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pb-16 pt-28 sm:px-6">
        <main>
          <LandingHero />
        </main>
      </div>
      <Footer />
    </div>
  );
}
