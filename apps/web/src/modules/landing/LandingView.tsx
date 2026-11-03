'use client';

import { HeroSection } from './HeroSection';
import { FeaturesGrid } from './FeaturesGrid';
import { CallToActionSection } from './CallToActionSection';

export function LandingView() {
  return (
    <div className="bg-cream-100 dark:bg-surface-50 text-stone-900 dark:text-stone-100 selection:bg-terracotta-100 selection:text-terracotta-900 font-sans transition-colors duration-200">
      {/* Pilar 1: Hero Principal */}
      <HeroSection />

      {/* Los 3 Pilares del Sistema */}
      <FeaturesGrid />

      {/* Llamada a la acción / Exploración */}
      <CallToActionSection />
    </div>
  );
}
