'use client';

import { HeroSection } from '@/modules/landing/HeroSection';
import { FeaturesGrid } from '@/modules/landing/FeaturesGrid';
import { CallToActionSection } from '@/modules/landing/CallToActionSection';

export default function LandingPage() {
  return (
    <div className="bg-parchment-50 text-ink-900 selection:bg-terracotta-200 selection:text-ink-950 font-sans">
      {/* Pilar 1: Hero Principal */}
      <HeroSection />

      {/* Los 3 Pilares del Sistema */}
      <FeaturesGrid />

      {/* Llamada a la acción / Exploración */}
      <CallToActionSection />
    </div>
  );
}
