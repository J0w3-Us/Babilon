'use client';

import { HeroSection } from './HeroSection';
import { FeaturesGrid } from './FeaturesGrid';
import { CallToActionSection } from './CallToActionSection';

export function LandingView() {
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
