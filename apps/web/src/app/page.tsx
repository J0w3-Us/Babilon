'use client';

import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  Library,
  Feather,
  Sparkles,
  Search,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Compass,
  Bookmark,
  Layers,
  GraduationCap,
  Globe2,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="bg-parchment-50 text-ink-900 selection:bg-terracotta-200 selection:text-ink-950 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-28 lg:pb-36 border-b border-parchment-300 bg-gradient-to-b from-parchment-100/70 via-parchment-50 to-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Mission & Impact */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-terracotta-100/90 text-terracotta-800 text-xs font-semibold uppercase tracking-wider border border-terracotta-200/80 shadow-subtle">
                <GraduationCap size={15} className="text-terracotta-600" />
                <span>Archivo Abierto & Patrimonio Literario</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-ink-950 leading-[1.08]">
                El saber universal en un archivo <span className="italic font-normal text-terracotta-600">accesible y sereno</span>.
              </h1>

              <p className="text-base sm:text-lg text-ink-600 font-sans max-w-2xl leading-relaxed">
                Babilon es una plataforma de lectura y preservación digital concebida para estudiantes, investigadores y amantes de los libros. Sin intermediarios, conectada a la base de datos y diseñada para una lectura profunda libre de distracciones.
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <Link
                  href="/biblioteca"
                  className="inline-flex items-center gap-3 px-7 py-4 rounded-xl bg-ink-900 text-parchment-50 font-medium text-sm sm:text-base hover:bg-terracotta-600 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer group"
                >
                  <BookOpen size={18} className="text-terracotta-400 group-hover:text-white transition-colors" />
                  <span>Entrar a la Biblioteca</span>
                  <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link
                  href="/biblioteca?action=subir"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-white text-ink-800 font-medium text-sm sm:text-base border border-parchment-300 hover:border-terracotta-500 hover:text-terracotta-600 transition-all duration-200 shadow-subtle cursor-pointer"
                >
                  <UploadCloud size={18} />
                  <span>Digitalizar / Subir Obra</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-parchment-200 grid grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold">Acceso Libre</p>
                  <p className="font-serif text-2xl font-bold text-ink-900 mt-1">100%</p>
                  <p className="text-[11px] text-ink-400 mt-0.5">Sin barreras ni cobros</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold">Lector Digital</p>
                  <p className="font-serif text-2xl font-bold text-ink-900 mt-1">Editorial</p>
                  <p className="text-[11px] text-ink-400 mt-0.5">Paginado y modos de luz</p>
                </div>
                <div>
                  <p className="text-xs text-ink-500 uppercase tracking-wider font-semibold">Almacenamiento</p>
                  <p className="font-serif text-2xl font-bold text-emerald-700 mt-1">MongoDB</p>
                  <p className="text-[11px] text-ink-400 mt-0.5">Atlas biblioteca_digital</p>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-terracotta-200/50 via-parchment-300/40 to-transparent blur-xl" />

                <div className="relative rounded-2xl bg-white border border-parchment-300 p-8 shadow-card space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-parchment-200">
                    <div className="flex items-center gap-2 text-ink-600 text-xs font-semibold">
                      <Feather size={16} className="text-terracotta-600" />
                      <span>Volumen Destacado de Archivo</span>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-parchment-100 text-terracotta-700 font-semibold border border-parchment-200">
                      Lectura Directa
                    </span>
                  </div>

                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-parchment-200 relative group shadow-inner">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80"
                      alt="Don Quijote de la Mancha"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                      <span className="text-[11px] uppercase tracking-wider text-parchment-200 font-bold">
                        Novela Clásica • 1605
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold mt-0.5">
                        Don Quijote de la Mancha
                      </h3>
                      <p className="text-xs text-parchment-300">Miguel de Cervantes Saavedra</p>
                    </div>
                  </div>

                  <p className="text-xs text-ink-600 leading-relaxed font-serif italic border-l-2 border-terracotta-500 pl-3">
                    «En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero...»
                  </p>

                  <Link
                    href="/biblioteca"
                    className="w-full py-3 rounded-xl bg-ink-900 hover:bg-terracotta-600 text-parchment-50 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <BookOpen size={16} />
                    <span>Abrir en el Lector Digital</span>
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Pillars Section: ui-ux-pro-max Principles */}
      <section className="py-20 lg:py-28 border-b border-parchment-300 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-terracotta-600">
              Arquitectura & Experiencia
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-ink-950">
              Tres pilares concebidos para el lector y la obra
            </h2>
            <p className="text-sm sm:text-base text-ink-600 leading-relaxed">
              Eliminamos capas innecesarias para construir un flujo directo entre el texto preservado y los ojos del lector.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pilar 1 */}
            <div className="bg-parchment-50 border border-parchment-300 rounded-2xl p-8 space-y-4 book-card-shadow">
              <div className="w-12 h-12 rounded-xl bg-ink-950 text-parchment-50 flex items-center justify-center shadow-md">
                <BookOpen size={22} className="text-terracotta-400" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-950">
                Lector de Papel Sereno
              </h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                Navegación página por página con tipografía editorial adaptada, modos Pergamino, Claro y Oscuro, escalado de texto y lectura en pantalla completa.
              </p>
            </div>

            {/* Pilar 2 */}
            <div className="bg-parchment-50 border border-parchment-300 rounded-2xl p-8 space-y-4 book-card-shadow">
              <div className="w-12 h-12 rounded-xl bg-ink-950 text-parchment-50 flex items-center justify-center shadow-md">
                <UploadCloud size={22} className="text-emerald-400" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-950">
                Subida y Digitalización
              </h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                Incorpora obras mediante archivos de texto o transcripciones. El sistema pagina automáticamente el texto y lo deja inmediatamente disponible en el catálogo.
              </p>
            </div>

            {/* Pilar 3 */}
            <div className="bg-parchment-50 border border-parchment-300 rounded-2xl p-8 space-y-4 book-card-shadow">
              <div className="w-12 h-12 rounded-xl bg-ink-950 text-parchment-50 flex items-center justify-center shadow-md">
                <Layers size={22} className="text-academic-gold" />
              </div>
              <h3 className="font-serif text-xl font-bold text-ink-950">
                Conexión Nativa MongoDB
              </h3>
              <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
                Consultas directas a la base de datos <code className="font-mono text-terracotta-700">biblioteca_digital</code> sin APIs intermedias que ralenticen o interrumpan el flujo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exploration CTA Section */}
      <section className="py-20 lg:py-28 bg-parchment-100/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-ink-950 text-parchment-50 p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-terracotta-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-academic-gold/15 rounded-full blur-3xl pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-terracotta-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Exploración Sin Límites</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white max-w-2xl mx-auto leading-tight">
              Comienza tu lectura o preserva una nueva obra hoy mismo
            </h2>

            <p className="text-sm sm:text-base text-parchment-300 max-w-xl mx-auto leading-relaxed font-sans">
              Accede a las salas temáticas de Filosofía, Clásicos, Ficción, Ciencia Ficción y Poesía de la Biblioteca Babilon.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/biblioteca"
                className="px-8 py-4 rounded-xl bg-terracotta-600 hover:bg-terracotta-700 text-white font-semibold text-sm sm:text-base transition-all shadow-lg hover:shadow-xl cursor-pointer"
              >
                Abrir Catálogo de la Biblioteca
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
