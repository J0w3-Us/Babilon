Actualmente, 

apps/web/src/app/biblioteca/page.tsx
 es un archivo monolítico de más de 870 líneas que concentra:

Catálogo, filtros y búsqueda de libros.
Todo el formulario y lógica de ingesta/subida de libros (action=subir y modal).
Todo el visor/lector interactivo de libros (reader mode, paginación, modos de lectura).
Dividir la arquitectura en 3 pilares bien definidos (Landing, Biblioteca, y Subida de Libros / Ingesta) resolverá el acoplamiento y permitirá escalar la plataforma.

¿Cómo funcionará cada uno de los 3 Pilares?
                      ┌───────────────────────────────┐
                      │     BABILON PLATFORM          │
                      └──────────────┬────────────────┘
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         ▼                           ▼                           ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    1. LANDING    │       │  2. BIBLIOTECA   │       │   3. SUBIDA      │
│     (Pilar 1)    │       │    (Pilar 2)     │       │    (Pilar 3)     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ • Presentación   │       │ • Exploración &  │       │ • Ingesta de     │
│   y manifiesto   │       │   Búsqueda       │       │   archivos (TXT/ │
│ • Métricas clave │       │ • Filtros géneros│       │   PDF/EPUB)      │
│ • Acceso rápido  │       │ • Ficha de libro │       │ • Extracción de  │
│ • Diseño editorial│      │ • Modo Lector    │       │   metadatos      │
│   e identidad    │       │   (Reader view)  │       │ • Validaciones   │
└──────────────────┘       └──────────────────┘       └──────────────────┘
🏛️ Pilar 1: Landing (/)
Propósito: Entrada principal, posicionamiento editorial, atracción y bienvenida.
Componentes clave:
HeroSection: Introducción y call-to-actions limpios hacia el catálogo o la subida.
FeaturesGrid: Principios de Babilon (archivo abierto, lectura serena, sin distracciones).
StatsBanner: Indicadores de libros en catálogo y autores preservados.
RecentBooksCarousel / CuratedSection: Muestra de obras destacadas consultadas de la API.
Ruta: / (

apps/web/src/app/page.tsx
).
📚 Pilar 2: Biblioteca (/biblioteca)
Propósito: Búsqueda, filtrado, visualización de colecciones y lectura inmersiva.
Componentes clave:
CatalogHeader & GenreFilterBar: Filtros por género, ordenamiento y barra de búsqueda.
BookGrid / BookCard: Tarjetas editoriales con portada, badge de género y progreso.
BookDetailModal / BookDrawer: Sinopsis, ficha técnica (ISBN, editorial, año).
BookReader: Lector dedicado modularizado (modos pergamino/oscuro/claro, tipografía ajustable, paginación y pantalla completa).
Ruta: /biblioteca (y lector opcional /biblioteca/leer/[id]).
📤 Pilar 3: Subida e Ingesta de Libros (/subir o módulo independiente)
Propósito: Administración, contribución comunitaria o ingesta de obras digitales.
Componentes clave:
DropzoneUploader: Carga de archivos (.txt, .md, .epub, etc.) con vista previa de tamaño y contenido.
MetadataForm: Título, autor, género, ISBN, sinopsis, portada y año con validación.
ContentPaginatorPreview: Procesamiento automático de páginas o división de capítulos antes de enviar.
UploadFeedback: Estado de carga, barra de progreso y confirmación con enlace directo a la obra.
Ruta: /subir (o /biblioteca/subir), además de poder invocarse como un componente modal autónomo reutilizable.
Estructura de Carpetas Propuesta
Para reflejar limpiamente estos 3 pilares, reorganizamos apps/web/src:

apps/web/src/
├── app/
│   ├── page.tsx                       # Pilar 1: Landing (orquestador ligero)
│   ├── biblioteca/
│   │   ├── page.tsx                   # Pilar 2: Biblioteca y Catálogo
│   │   └── leer/[id]/page.tsx         # (Opcional) Reader dedicado o embebido
│   ├── subir/
│   │   └── page.tsx                   # Pilar 3: Página / Flujo dedicado de subida
│   └── api/v1/...                     # Endpoints API existentes
│
├── modules/ (o components/features/)
│   ├── landing/                       # Pilar 1
│   │   ├── components/HeroSection.tsx
│   │   ├── components/FeaturesGrid.tsx
│   │   └── components/CuratedBooks.tsx
│   │
│   ├── biblioteca/                    # Pilar 2
│   │   ├── components/BookCard.tsx
│   │   ├── components/BookGrid.tsx
│   │   ├── components/GenreFilter.tsx
│   │   ├── components/SearchBar.tsx
│   │   └── reader/                    # Submódulo lector
│   │       ├── BookReader.tsx
│   │       ├── ReaderControls.tsx
│   │       └── useReaderPreferences.ts
│   │
│   └── upload/                        # Pilar 3
│       ├── components/BookUploadWizard.tsx
│       ├── components/FileDropzone.tsx
│       ├── components/MetadataForm.tsx
│       └── hooks/useBookUpload.ts
│
└── services/                          # Llamadas API desacopladas
    ├── books.service.ts
    └── upload.service.ts
Plan de Implementación por Fases
| Fase | Tarea | Entregables | Estado |
| :--- | :--- | :--- | :--- |
| **Fase 1: Extracción de Subida (Pilar 3)** | Extraer modal a `modules/upload/BookUploadWizard` y crear ruta `/subir`. | Componente `BookUploadWizard` + página `/subir` + integración modal. | **Completado ✅** |
| **Fase 2: Desacoplamiento del Lector y Catálogo (Pilar 2)** | Separar `BookReader`, `BookCard` y `GenreFilterBar` en `modules/biblioteca/`. | `biblioteca/page.tsx` ligero y enfocado en catálogo y estados. | **Completado ✅** |
| **Fase 3: Refactorización y Enriquecimiento de Landing (Pilar 1)** | Desacoplar `HeroSection`, `FeaturesGrid` y `CallToActionSection` en `modules/landing/`. | `page.tsx` orquestador limpio con enlaces directos a `/biblioteca` y `/subir`. | **Completado ✅** |
| **Fase 4: Verificación y Compilación** | Validar TypeScript, linting y generación de rutas estáticas con Next.js 14. | Build de producción exitoso (código 0, 6 rutas generadas). | **Completado ✅** |

