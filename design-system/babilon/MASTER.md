# Design System Master File — Babilon

> **LOGIC:** Base de diseño para Babilon según las recomendaciones de `ui-ux-pro-max` (Minimalismo Editorial para Bibliotecas Educativas).

---

**Project:** Babilon (Plataforma y Landing de Biblioteca Educativa)  
**Stack:** Next.js 14 (App Router) + Tailwind CSS + Express API + MongoDB  
**Estilo:** Minimalismo Editorial Clásico (Editorial / Swiss Academic)  

---

## Paleta de Colores (Papel, Tinta y Terracota)

| Rol | Token Tailwind | Hex | Uso |
|-----|----------------|-----|-----|
| Fondo Principal | `bg-parchment-50` | `#FDFBF7` | Fondo cálido tipo papel marfil editorial |
| Fondo Tarjetas | `bg-white` / `bg-parchment-100` | `#FFFFFF` / `#F9F6EE` | Superficies de lectura y cards |
| Bordes Cálidos | `border-parchment-200` | `#F2ECE1` / `#E7DEC9` | Separadores de biblioteca sobrios |
| Texto Principal (Tinta) | `text-ink-900` | `#0F172A` | Lectura principal de alta legibilidad |
| Texto Secundario | `text-ink-500` / `text-ink-600` | `#64748B` | Metadatos, ISBN, años, citas |
| Acento Primario (Terracota) | `text-terracotta-600` / `bg-terracotta-600` | `#C85A32` | CTAs, botones de acción y destacados |
| Acento Secundario (Oro Académico)| `text-academic-gold` | `#C59B27` | Insignias de archivo y curaduría |

---

## Tipografía Editorial

- **Títulos y Encabezados:** `Newsreader` (Google Fonts, con variante cursiva editorial para énfasis y citas).
- **Cuerpo y UI:** `Plus Jakarta Sans` (Limpia, neutra, altamente legible en interfaces digitales y tablas).
- **Monospace de Archivo:** Fuentes del sistema mono para códigos ISBN, referencias de sala y metadatos de catalogación.

---

## Principios UX/UI Aplicados (`ui-ux-pro-max`)

1. **Jerarquía sin ruido visual:** Eliminación de gradientes de alto contraste innecesarios; uso de espacio negativo generoso (`py-16`, `gap-8`) para facilitar la lectura extendida.
2. **Micro-interacciones sobrias:** Elevaciones sutiles en tarjetas de libros (`translate-y-1` y sombras tenues de 250ms con curvas suaves).
3. **Lector de Tomos Integrado:** Experiencia tipográfica de lectura en modal con inicio capitular drop-cap y fondo de papel.
4. **Accesibilidad WCAG AAA:** Alto contraste entre la tinta oscura y el fondo pergamino cálido.
