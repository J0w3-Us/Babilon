import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { BookOpen, Compass, UploadCloud } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

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
      <body className="bg-stone-50 text-stone-900 dark:bg-surface-50 dark:text-stone-100 antialiased min-h-screen flex flex-col transition-colors duration-200">
        {/* Main Navbar: Minimalista y limpia */}
        <header className="sticky top-0 z-50 border-b border-stone-200 dark:border-surface-300 glass-header">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-lg bg-stone-100 dark:bg-surface-200 border border-stone-200 dark:border-surface-300 flex items-center justify-center text-stone-800 dark:text-stone-200 group-hover:text-terracotta-600 transition-colors">
                <BookOpen size={18} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-xl font-semibold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  Babilon
                  <span className="text-[10px] uppercase font-sans tracking-widest px-2 py-0.5 rounded-full bg-stone-100 dark:bg-surface-200 text-stone-600 dark:text-stone-400 border border-stone-200 dark:border-surface-300">
                    Archivo
                  </span>
                </span>
                <span className="text-[11px] text-stone-500 dark:text-stone-400 font-sans">
                  Patrimonio bibliográfico y lectura digital
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600 dark:text-stone-300">
              <Link href="/" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">
                Inicio
              </Link>
              <Link href="/biblioteca" className="hover:text-terracotta-600 dark:hover:text-terracotta-500 transition-colors flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100">
                <Compass size={15} className="text-terracotta-600 dark:text-terracotta-500" />
                Catálogo
              </Link>
              <Link href="/subir" className="hover:text-terracotta-600 dark:hover:text-terracotta-500 transition-colors flex items-center gap-1.5">
                <UploadCloud size={15} />
                Subir Obra
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/biblioteca"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white transition-colors cursor-pointer shadow-subtle"
              >
                Entrar al Catálogo
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-stone-200 dark:border-surface-300 bg-white dark:bg-surface-100 py-12 text-sm text-stone-500 dark:text-stone-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2 text-stone-900 dark:text-stone-100 font-serif font-bold text-lg">
                <BookOpen size={18} className="text-terracotta-600 dark:text-terracotta-500" />
                Babilon
              </div>
              <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400 font-sans">
                Iniciativa de preservación y lectura inmersiva con almacenamiento directo en MongoDB Atlas.
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200 mb-3">Navegación</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Inicio</Link></li>
                <li><Link href="/biblioteca" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Catálogo Completo</Link></li>
                <li><Link href="/subir" className="hover:text-stone-900 dark:hover:text-stone-100 transition-colors">Subir y Digitalizar</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-stone-800 dark:text-stone-200 mb-3">Plataforma</h4>
              <ul className="space-y-2 text-xs">
                <li className="text-stone-600 dark:text-stone-300 font-medium">Next.js 14 App Router</li>
                <li className="text-stone-600 dark:text-stone-300 font-medium">MongoDB Atlas Nativo</li>
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
      </body>
    </html>
  );
}
