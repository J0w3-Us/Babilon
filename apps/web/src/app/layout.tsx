import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { AuthProvider } from '@/context/AuthContext';
import NavbarClient from '@/components/NavbarClient';

export const metadata: Metadata = {
  title: 'Babilon — Biblioteca Digital & Archivo Literario',
  description: 'Explora, lee y digitaliza obras maestras de la literatura con un diseño minimalista sereno y conexión a base de datos.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const theme = localStorage.getItem('babilon-theme'); const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; if (theme === 'dark' || (!theme && prefersDark)) document.documentElement.classList.add('dark'); } catch (_) {} })()`,
          }}
        />
      </head>
      <body className="bg-cream-100 text-stone-900 dark:bg-surface-50 dark:text-stone-100 antialiased min-h-screen flex flex-col transition-colors duration-200">
        <AuthProvider>
          <NavbarClient />

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="border-t border-stone-200/80 dark:border-surface-300 bg-cream-50/80 dark:bg-surface-100 py-12 text-sm text-stone-500 dark:text-stone-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-3 md:col-span-1">
                <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-serif font-bold text-lg">
                  <BookOpen size={18} className="text-terracotta-600 dark:text-terracotta-500" />
                  Babilon
                </div>
                <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400 font-sans">
                  Iniciativa de preservación y lectura inmersiva conectada a la API de libros.
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200 mb-3">Navegación</h4>
                <ul className="space-y-2 text-xs">
                  <li><Link href="/" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Inicio</Link></li>
                  <li><Link href="/biblioteca" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Catálogo Completo</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200 mb-3">Plataforma</h4>
                <ul className="space-y-2 text-xs">
                  <li className="text-stone-600 dark:text-stone-300 font-medium">Next.js 14 App Router</li>
                  <li className="text-stone-600 dark:text-stone-300 font-medium">Control de Roles (Admin / Usuario)</li>
                  <li className="text-stone-600 dark:text-stone-300 font-medium">Lector Editorial de Alta Legibilidad</li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200 mb-3">Edición Abierta</h4>
                <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                  Diseñado bajo el principio de minimalismo suizo contemporáneo: tipografía nítida y lectura libre de ruido.
                </p>
                <div className="mt-4 pt-3 border-t border-stone-200 dark:border-surface-300 text-[11px] text-stone-400 dark:text-stone-500">
                  © {new Date().getFullYear()} Babilon Digital Archive
                </div>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
