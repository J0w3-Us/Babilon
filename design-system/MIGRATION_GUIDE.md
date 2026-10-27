# 📦 BABILON — Guía de Migración de Estilo

> Este documento explica cómo usar el **Blueprint** y el **Design System** para migrar el estilo visual de Babilon a cualquier otro repositorio o framework.

---

## ¿Qué contiene este repo de documentación?

| Archivo | Propósito |
|---------|-----------|
| [BLUEPRINT.md](./BLUEPRINT.md) | Arquitectura completa del proyecto: estructura, stack, modelos, API y flujos |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Colores, tipografías, componentes, animaciones e íconos |
| [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) | Este archivo — guía paso a paso para migrar el estilo |

---

## Paso 1 — Copiar el Design Token Foundation

Lo primero es trasladar las variables CSS raíz. Estas son el corazón del sistema de diseño y funcionan en **cualquier framework** (React, Vue, Angular, Svelte, HTML puro, etc.).

Crea o modifica el archivo CSS global de tu nuevo proyecto y agrega:

`css
/* ── Importar fuentes (Google Fonts) ─────────── */
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

/* ── Variables de diseño Babilon ─────────────── */
:root {
  /* Fondos */
  --bg-primary:    #0a0c10;
  --bg-secondary:  #12151e;
  --bg-card:       rgba(22, 27, 38, 0.70);
  --bg-card-hover: rgba(28, 35, 50, 0.90);

  /* Bordes */
  --border-color:  rgba(226, 183, 116, 0.15);
  --border-glow:   rgba(226, 183, 116, 0.40);

  /* Acentos */
  --accent-gold:        #e5b367;
  --accent-gold-light:  #fbe6c2;
  --accent-gold-dark:   #b8863b;
  --accent-crimson:     #c84b31;
  --accent-teal:        #2d6a4f;

  /* Texto */
  --text-main:  #f3f4f6;
  --text-muted: #9ca3af;
  --text-dim:   #6b7280;

  /* Tipografías */
  --font-serif: 'Cinzel', serif;
  --font-sans:  'Plus Jakarta Sans', sans-serif;

  /* Radios de borde */
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 20px;

  /* Sombras */
  --shadow-gold: 0 8px 32px -4px rgba(229, 179, 103, 0.15);
}

/* ── Reset mínimo ────────────────────────────── */
* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Body base ───────────────────────────────── */
body {
  background-color: var(--bg-primary);
  color:            var(--text-main);
  font-family:      var(--font-sans);
  min-height:       100vh;
  line-height:      1.6;
  background-image:
    radial-gradient(circle at 15% 10%, rgba(229, 179, 103, 0.08) 0%, transparent 40%),
    radial-gradient(circle at 85% 85%, rgba(67, 97, 238, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(10, 12, 16, 0.95) 0%, var(--bg-primary) 100%);
  background-attachment: fixed;
}

a { color: inherit; text-decoration: none; }
`

---

## Paso 2 — Copiar las Clases Utilitarias

Copia estas clases directamente del archivo [pps/web/src/app/globals.css](./apps/web/src/app/globals.css) a tu nuevo CSS global. Son independientes del framework:

### Clases esenciales a copiar

`css
.glass-panel { ... }          /* Panel glassmorphism base */
.glass-panel:hover { ... }

.navbar { ... }               /* Barra de navegación */
.brand-title { ... }          /* Logotipo con degradado */
.nav-links { ... }
.nav-links a:hover { ... }

.badge-tag { ... }            /* Etiquetas de categoría */

.btn-primary { ... }          /* Botón de acción principal */
.btn-primary:hover { ... }

.btn-secondary { ... }        /* Botón de acción secundaria */
.btn-secondary:hover { ... }

.hero-section { ... }         /* Sección hero */
.hero-title { ... }           /* H1 del hero */
.hero-subtitle { ... }

.books-container { ... }      /* Contenedor del catálogo */
.section-header { ... }
.section-title { ... }

.books-grid { ... }           /* Grid de tarjetas */
.book-card { ... }            /* Tarjeta de libro */
.book-cover-wrap { ... }
.book-cover-img { ... }
.book-card-body { ... }
.book-title { ... }
.book-author { ... }
.book-synopsis { ... }
.book-meta { ... }
.book-rating { ... }
`

---

## Paso 3 — Adaptar la Navegación

### Estructura del Navbar

Replica esta estructura HTML en tu framework objetivo:

`html
<nav class="navbar">
  <!-- Logo/Marca -->
  <a href="/" class="brand-title">
    <!-- Ícono (BookOpen en Lucide, o SVG equivalente) -->
    <span>BABYLON</span>
  </a>

  <!-- Links de navegación -->
  <div class="nav-links">
    <a href="/">Explorar</a>
    <a href="#categorias">Géneros</a>
    <a href="#autores">Autores</a>
    <a href="/admin" style="color: var(--accent-gold);">Panel Editorial</a>
  </div>
</nav>
`

### Estructura del Hero

`html
<section class="hero-section">
  <h1 class="hero-title">Título principal de la app</h1>
  <p class="hero-subtitle">Descripción secundaria</p>
  <!-- CTA -->
  <button class="btn-primary">Acción principal</button>
</section>
`

### Filtros de Género (Pills)

`html
<div style="display: flex; gap: 0.75rem; overflow-x: auto;">
  <button class="genre-pill active">Todos</button>
  <button class="genre-pill">Ficción</button>
  <button class="genre-pill">Ciencia Ficción</button>
  <!-- ... -->
</div>
`

`css
.genre-pill {
  padding: 0.6rem 1.25rem;
  border-radius: 9999px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.03);
  color: #9ca3af;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.2s;
  cursor: pointer;
}
.genre-pill.active {
  border: 1px solid #e5b367;
  background: rgba(229, 179, 103, 0.2);
  color: #fbe6c2;
}
`

---

## Paso 4 — Íconos en el Nuevo Repo

### Si el nuevo repo usa React
Mantener **Lucide React**:
`bash
npm install lucide-react
# o
pnpm add lucide-react
`

`tsx
import { BookOpen, Search, Star } from 'lucide-react';
// Uso: <BookOpen size={28} color="#e5b367" />
`

### Si el nuevo repo usa otro framework
Opciones equivalentes:
- **Vue**: lucide-vue-next
- **Angular**: lucide-angular
- **HTML puro**: descargar SVGs desde [lucide.dev](https://lucide.dev)

---

## Paso 5 — Modelos de Datos (si se conecta a la misma API)

Si el nuevo repo necesita consumir la API de Babilon, copiar los tipos desde [packages/shared-types/src/index.ts](./packages/shared-types/src/index.ts):

`typescript
// types/babilon.ts en el nuevo repo
export interface Book {
  id: string;
  title: string;
  isbn: string;
  author: Author;
  genres: string[];
  synopsis: string;
  publishedYear: number;
  publisher: string;
  coverUrl: string;
  ratingAverage: number;
  ratingCount: number;
  sampleChapterText?: string;
}

export interface Author {
  id: string;
  name: string;
  biography: string;
  country?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: { total?: number; page?: number; pageSize?: number; };
}
`

---

## Paso 6 — Conexión con la API

Si el nuevo repo necesita conectarse a la API Express:

`typescript
const API_URL = 'http://localhost:4000'; // o la URL de producción

// GET libros
async function getBooks(query?: string, genre?: string): Promise<Book[]> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (genre && genre !== 'Todos') params.append('genre', genre);

  const res = await fetch(${API_URL}/api/v1/books?);
  const json = await res.json();
  return json.success ? json.data : [];
}

// POST libro
async function createBook(book: Partial<Book>) {
  const res = await fetch(${API_URL}/api/v1/books, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(book),
  });
  return res.json();
}

// Healthcheck
async function checkHealth() {
  const res = await fetch(${API_URL}/api/health);
  return res.json();
}
`

---

## Paso 7 — Checklist de Migración

Marca cada ítem al completarlo:

- [ ] Variables CSS copiadas a globals.css / styles.css del nuevo repo
- [ ] Fuentes importadas desde Google Fonts (Cinzel + Plus Jakarta Sans)
- [ ] Clases utilitarias (.glass-panel, .btn-primary, .badge-tag, etc.) trasladadas
- [ ] Navbar replicado con la estructura correcta
- [ ] Hero section implementado
- [ ] Books Grid implementado con uto-fill, minmax(280px, 1fr)
- [ ] Book Card implementado con hover en imagen
- [ ] Filtros de género (pills) implementados
- [ ] Modales con glassmorphism configurados
- [ ] Toast de notificación implementado
- [ ] Íconos de Lucide instalados y configurados
- [ ] Tipos de datos copiados o importados desde @babilon/shared-types
- [ ] Conexión con API configurada (si aplica)
- [ ] Z-index scale respetado (navbar: 50, modal: 90, toast: 100)
- [ ] Animaciones aplicadas (0.2s, 0.3s, 0.5s con cubic-bezier)

---

## Referencia Rápida de Colores

| Nombre | HEX | Uso principal |
|--------|-----|--------------|
| bg-primary | #0a0c10 | Fondo base de la app |
| bg-secondary | #12151e | Secciones alternativas |
| bg-card | gba(22,27,38,0.7) | Tarjetas glassmorphism |
| accent-gold | #e5b367 | Color de acción principal |
| accent-gold-light | #fbe6c2 | Texto sobre dorado, badges |
| accent-gold-dark | #b8863b | Degradado de botones |
| text-main | #f3f4f6 | Texto primario |
| text-muted | #9ca3af | Texto secundario |
| text-dim | #6b7280 | Texto terciario |
| border-color | gba(226,183,116,0.15) | Bordes sutiles |
| border-glow | gba(226,183,116,0.40) | Bordes en hover |

---

*Generado: Octubre 2026 — Babilon Monorepo v1.0*
