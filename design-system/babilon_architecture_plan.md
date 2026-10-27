# 📚 Babilon — Arquitectura y Planificación del Sistema

**Babilon** es una plataforma moderna para la preservación, lectura y gestión de patrimonio bibliográfico universal. Su arquitectura está basada en una división limpia por **Módulos & Hooks**, separando estrictamente la capa de rutas (Next.js App Router), la lógica de dominio en Hooks reactivos, los componentes visuales y los servicios de red.

---

## 🏛️ 1. Estructura y Capas de la Aplicación (`apps/web/src`)

El código sigue el patrón **Modules & Hooks Architecture**:

```
apps/web/src/
├── app/                           # CAPA 1: Solo Enrutamiento & SSR (Páginas delgadas)
│   ├── layout.tsx                 # Shell visual global, Navbar, Footer y ThemeProvider
│   ├── page.tsx                   # Ruta '/' -> Monta <LandingView />
│   ├── biblioteca/page.tsx        # Ruta '/biblioteca' -> Monta <BibliotecaView />
│   ├── subir/page.tsx             # Ruta '/subir' -> Monta <UploadView />
│   └── api/                       # BFF / Endpoints internos (Proxy y Motor MinerU)
│       ├── backend/[...path]/     # Proxy seguro hacia la API remota de libros (Basic Auth / API Key)
│       └── v1/scan/mineru/        # Endpoint de escaneo de PDFs (remoto o local vía Python)
│
├── modules/                       # CAPA 2: Dominio & Casos de Uso (UI + Lógica)
│   ├── landing/                   # Pilar 1: Landing & Manifiesto
│   │   ├── components/
│   │   │   ├── HeroSection.tsx
│   │   │   ├── FeaturesGrid.tsx
│   │   │   └── CallToActionSection.tsx
│   │   └── LandingView.tsx        # Vista ensambladora
│   │
│   ├── biblioteca/                # Pilar 2: Catálogo & Lector Editorial
│   │   ├── hooks/
│   │   │   ├── useBooksCatalog.ts # Búsqueda con debounce, filtro por género y salud API
│   │   │   └── useBookReader.ts   # Paginación, temas (pergamino/oscuro), zoom y fullscreen
│   │   ├── BookCard.tsx           # Tarjeta individual con portada, autor y rating
│   │   ├── BookReader.tsx         # Visor inmersivo a doble página / continua
│   │   ├── GenreFilterBar.tsx     # Selector de géneros literarios
│   │   └── BibliotecaView.tsx     # Ensamblador del catálogo y lector
│   │
│   └── upload/                    # Pilar 3: Ingesta & Digitalización
│       ├── hooks/
│       │   └── useBookUpload.ts   # Formulario, carga de archivos, escaneo MinerU y persistencia
│       ├── BookUploadWizard.tsx   # Asistente multi-paso (metadatos / contenido)
│       ├── FileDropzone.tsx       # Zona interactiva de arrastrar y soltar
│       ├── MetadataFields.tsx     # Campos de título, ISBN, autor, año y sinopsis
│       └── UploadView.tsx         # Vista completa de subida
│
├── services/                      # CAPA 3: Comunicación Externa (Clientes HTTP desacoplados)
│   ├── api.ts                     # Funciones fetch de libros (getBooksApi, createBookApi, checkApiHealth)
│   └── mineru.service.ts          # Adaptador HTTP para el servicio de extracción MinerU
│
└── lib/                           # CAPA 4: Utilidades Puras y Mappers
    ├── bookMapper.ts              # Adaptador de modelos del backend a tipos unificados Book
    ├── mineruParser.ts            # Parser y limpiador de Markdown extraído
    └── pdf_extractor.py           # Script local en Python para procesar PDFs si MinerU está offline
```

---

## 🎯 2. Reglas de Responsabilidad por Capa

| Capa | Ubicación | Responsabilidad | Lo que NUNCA debe contener |
| :--- | :--- | :--- | :--- |
| **Páginas (App)** | `src/app/**/page.tsx` | Declaración de ruta URL, Suspense boundaries y montaje del componente View correspondiente. | `useState`, lógica de formularios, llamadas `fetch` complejas o estilos extensos. |
| **Hooks de Módulo** | `src/modules/*/hooks/` | Toda la lógica de negocio, validaciones, debounce, llamadas a `services` y manejo del estado reactivo. Devuelve `{ state, actions }`. | Código JSX / HTML o elementos visuales. |
| **Componentes Visuales** | `src/modules/*/components` | Renderizar interfaz con TailwindCSS según las props recibidas. Disparar acciones del hook. | Peticiones HTTP directas o estados globales no delegados. |
| **Vistas del Módulo** | `src/modules/*/*View.tsx` | Ensamblar el Hook del módulo con sus respectivos componentes visuales. | Rutas de servidor o configuración de Next.js. |
| **Servicios** | `src/services/*.ts` | Clientes HTTP agnósticos a React (`fetch`). Manejan errores y devuelven promesas tipadas. | Estado de React (`useState`), hooks o UI. |
| **Mappers / Lib** | `src/lib/*.ts` | Funciones puras de transformación de datos (ej. Backend JSON $\leftrightarrow$ Frontend `Book`). | Efectos secundarios o llamadas de red. |

---

## 🔄 3. Flujo de Datos y Proxy BFF

```
[ Navegador del Usuario ]
       │
       ▼ (Usa hook del módulo)
[ useBooksCatalog / useBookUpload ]
       │
       ▼ (Llama a función del servicio)
[ services/api.ts ]
       │
       ▼ fetch('/api/backend/api/libros')
[ app/api/backend/[...path]/route.ts ] (BFF Proxy Seguro)
       │  • Agrega credenciales (Basic Auth / API Key) desde variables de entorno
       ▼ fetch('https://backend-libros-wj1t.onrender.com/api/libros')
[ API Backend Externa (Render + MongoDB Atlas) ]
```

---

## 🚀 4. Los 3 Pilares Funcionales

1. **Pilar 1 — Landing (`/`)**: Exposición del proyecto, catálogo destacado y acceso directo a la biblioteca y al módulo de digitalización.
2. **Pilar 2 — Biblioteca (`/biblioteca`)**:
   - **Catálogo**: Exploración por géneros, buscador en vivo con debounce, monitoreo de salud del backend.
   - **Lector**: Visualizador inmersivo con modo pergamino, oscuro o claro, ajuste dinámico de tipografía y paginación.
3. **Pilar 3 — Subida e Ingesta (`/subir`)**:
   - Soporte para archivos `.txt`, `.md` y `.pdf`.
   - Motor de escaneo con **MinerU Engine** para extraer automáticamente el texto estructurado en Markdown y sugerir metadatos (título, autor, ISBN).
   - Persistencia directa en el backend de MongoDB.
