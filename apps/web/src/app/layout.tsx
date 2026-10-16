import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { BookOpen, Compass, Bookmark, Sparkles, Library, UploadCloud } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export const metadata: Metadata = {
  title: 'Babilon — Biblioteca Digital & Archivo Literario',
  description: 'Explora, lee y digitaliza obras maestras de la literatura y el saber universal con conexión directa a MongoDB.',
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
      <body className="bg-parchment-50 text-ink-900 antialiased selection:bg-terracotta-200 selection:text-terracotta-700 min-h-screen flex flex-col">
        {/* Main Navbar */}
        <header className="sticky top-0 z-50 border-b border-parchment-200/80 glass-parchment transition-all duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-parchment-100 border border-parchment-300 flex items-center justify-center text-terracotta-600 transition-colors duration-200 group-hover:bg-terracotta-50 group-hover:border-terracotta-200">
                <BookOpen size={20} strokeWidth={2} />
              </div>
              <div className="flex flex-col">
                <span className="font-serif text-2xl font-semibold tracking-tight text-ink-950 flex items-center gap-2">
                  Babilon
                  <span className="text-[10px] uppercase font-sans tracking-widest px-2 py-0.5 rounded-full bg-parchment-200 text-ink-700 border border-parchment-300/80">
                    Archivo
                  </span>
                </span>
                <span className="text-xs text-ink-500 font-sans tracking-wide">
                  Patrimonio bibliográfico y lectura digital
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ink-700">
              <Link href="/" className="hover:text-terracotta-600 transition-colors duration-200">
                Inicio
              </Link>
              <Link href="/biblioteca" className="hover:text-terracotta-600 transition-colors duration-200 flex items-center gap-1.5 font-semibold text-ink-950">
                <Compass size={16} className="text-terracotta-600" />
                Catálogo de la Biblioteca
              </Link>
              <Link href="/biblioteca?action=subir" className="hover:text-terracotta-600 transition-colors duration-200 flex items-center gap-1.5">
                <UploadCloud size={16} />
                Subir Obra
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/biblioteca"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-terracotta-600 text-white hover:bg-terracotta-700 transition-colors duration-200 cursor-pointer shadow-sm"
              >
                <Bookmark size={14} />
                Entrar al Catálogo
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-parchment-200 bg-white/70 py-14 text-sm text-ink-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2 text-ink-900 font-serif font-bold text-lg">
                <Library size={18} className="text-terracotta-600" />
                Babilon
              </div>
              <p className="text-xs leading-relaxed text-ink-500 font-sans">
                Iniciativa de preservación y lectura inmersiva de colecciones literarias, filosóficas y científicas con almacenamiento directo en MongoDB Atlas.
              </p>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-ink-800 mb-3">Navegación</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/" className="hover:text-terracotta-600 transition-colors">Página de Inicio</Link></li>
                <li><Link href="/biblioteca" className="hover:text-terracotta-600 transition-colors">Biblioteca Digital</Link></li>
                <li><Link href="/biblioteca?action=subir" className="hover:text-terracotta-600 transition-colors">Digitalizar / Subir Obra</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-ink-800 mb-3">Arquitectura Centralizada</h4>
              <ul className="space-y-2 text-xs">
                <li><span className="text-ink-700 font-medium">Next.js 14 App Router</span> — Landing & Biblioteca</li>
                <li><span className="text-ink-700 font-medium">MongoDB Atlas</span> — biblioteca_digital</li>
                <li><span className="text-ink-700 font-medium">Lector Inmersivo</span> — Paginación y control de luz</li>
                <li><span className="text-ink-700 font-medium">Subida Directa</span> — Sin APIs externas</li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs uppercase tracking-wider font-semibold text-ink-800 mb-3">Compromiso Abierto</h4>
              <p className="text-xs leading-relaxed text-ink-500">
                Diseñado bajo principios de armonía visual, accesibilidad y tipografía editorial clásica para una experiencia de lectura enriquecedora.
              </p>
              <div className="mt-4 pt-3 border-t border-parchment-200 flex items-center gap-2 text-[11px] text-ink-400">
                <Sparkles size={13} className="text-academic-gold" />
                <span>© {new Date().getFullYear()} Babilon Digital Archive</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
