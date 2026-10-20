'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  ArrowRight,
  UploadCloud,
  GraduationCap,
  Feather,
} from 'lucide-react';
import { Book } from '@babilon/shared-types';
import { getBooksApi } from '@/services/api';

export function HeroSection() {
  const [featuredBook, setFeaturedBook] = useState<Book | null>(null);

  useEffect(() => {
    // Consultar el libro más destacado de la base de datos
    getBooksApi({ featured: true })
      .then((res) => {
        if (res.books && res.books.length > 0) {
          setFeaturedBook(res.books[0]);
        }
      })
      .catch(() => {});
  }, []);

  const title = featuredBook?.title || 'Don Quijote de la Mancha';
  const authorName = featuredBook?.author?.name || 'Miguel de Cervantes Saavedra';
  const year = featuredBook?.publishedYear || 1605;
  const genre = featuredBook?.genres?.[0] || 'Novela Clásica';
  const cover = featuredBook?.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80';
  const quote = featuredBook?.synopsis?.slice(0, 160) ||
    '«En un lugar de la Mancha, de cuyo nombre no quiero acordarme, no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero...»';

  return (
    <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32 border-b border-stone-200 dark:border-surface-300 bg-stone-50 dark:bg-surface-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Left Column: Mission & Impact */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 dark:bg-surface-200 text-stone-700 dark:text-stone-300 text-xs font-semibold uppercase tracking-wider border border-stone-200 dark:border-surface-300">
              <GraduationCap size={14} className="text-terracotta-600 dark:text-terracotta-500" />
              <span>Archivo Abierto & Patrimonio Literario</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.08]">
              El saber universal en un archivo{' '}
              <span className="italic font-normal text-terracotta-600 dark:text-terracotta-500">
                accesible y sereno
              </span>
              .
            </h1>

            <p className="text-base sm:text-lg text-stone-600 dark:text-stone-300 font-sans max-w-2xl leading-relaxed">
              Babilon es una plataforma de lectura y preservación digital concebida para estudiantes, investigadores y amantes de los libros. Conectada a la base de datos y diseñada para una lectura profunda libre de distracciones.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/biblioteca"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white font-medium text-sm transition-all shadow-subtle cursor-pointer group"
              >
                <BookOpen
                  size={16}
                  className="text-stone-400 dark:text-stone-600 group-hover:text-stone-200 dark:group-hover:text-stone-900 transition-colors"
                />
                <span>Entrar a la Biblioteca</span>
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>

              <Link
                href="/subir"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white dark:bg-surface-100 text-stone-700 dark:text-stone-200 font-medium text-sm border border-stone-200 dark:border-surface-300 hover:border-stone-400 dark:hover:border-surface-400 hover:text-stone-900 dark:hover:text-white transition-all shadow-subtle cursor-pointer"
              >
                <UploadCloud size={16} />
                <span>Digitalizar Obra</span>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-stone-200 dark:border-surface-300 grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  Acceso Libre
                </p>
                <p className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">100%</p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Sin barreras ni cobros</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  Lector Digital
                </p>
                <p className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">Editorial</p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Paginado y modos de luz</p>
              </div>
              <div>
                <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">
                  Almacenamiento
                </p>
                <p className="font-serif text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
                  API de libros
                </p>
                <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">Catálogo centralizado</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Showcase Card connected to the books API */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-white dark:bg-surface-100 border border-stone-200 dark:border-surface-300 p-7 shadow-card dark:shadow-dark-card space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-stone-100 dark:border-surface-300">
                <div className="flex items-center gap-2 text-stone-600 dark:text-stone-300 text-xs font-semibold">
                  <Feather size={15} className="text-terracotta-600 dark:text-terracotta-500" />
                  <span>Volumen Destacado de Archivo</span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-stone-100 dark:bg-surface-200 text-stone-700 dark:text-stone-300 font-semibold border border-stone-200 dark:border-surface-300">
                  Lectura Directa
                </span>
              </div>

              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-100 dark:bg-surface-200 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cover}
                  alt={`Portada de ${title}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex flex-col justify-end p-5 text-white">
                  <span className="text-[11px] uppercase tracking-wider text-stone-200 font-semibold">
                    {genre} • {year}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold mt-0.5">
                    {title}
                  </h3>
                  <p className="text-xs text-stone-300">
                    {authorName}
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed font-serif italic border-l-2 border-terracotta-600 dark:border-terracotta-500 pl-3">
                {quote.startsWith('«') ? quote : `«${quote}»`}
              </p>

              <Link
                href="/biblioteca"
                className="w-full py-2.5 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-subtle"
              >
                <BookOpen size={15} />
                <span>Abrir en el Lector Digital</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
