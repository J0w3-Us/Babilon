# 📚 Babilon — Arquitectura y Planificación del Proyecto

**Babilon** es una plataforma moderna para el descubrimiento, lectura y gestión de libros inspirada en el concepto de una biblioteca universal. El ecosistema se compone de un portal público orientado a lectores y SEO, un panel administrativo empresarial para autores y bibliotecarios, y un backend API robusto.

---

## 🏗️ 1. Arquitectura del Ecosistema

Para integrar armónicamente **Next.js**, **Angular** y **Express**, organizaremos el proyecto bajo una estructura **Monorepo** gestionada con **pnpm workspaces** (o npm workspaces):

```
Babilon/
├── apps/
│   ├── web/            # [Next.js] Portal público, catálogo, SEO, experiencia del lector
│   ├── admin/          # [Angular] Panel de gestión editorial, inventario, reportes
│   └── api/            # [Express.js + TypeScript] API REST central, auth, base de datos
├── packages/
│   ├── shared-types/   # Interfaces y DTOs comunes (Book, Author, Review, User)
│   └── config/         # Configuraciones compartidas (ESLint, TSConfig)
├── pnpm-workspace.yaml # Definición de workspaces
├── package.json        # Scripts raíz (dev, build, lint)
└── README.md
```

---

## 🎯 2. Roles de Cada Entorno

| Módulo | Tecnología | Rol Principal | Justificación Técnica |
| :--- | :--- | :--- | :--- |
| **`apps/web`** | **Next.js (App Router)** | Catálogo de libros, fichas de lectura, búsqueda, landing y reseñas | **Server-Side Rendering (SSR)** e indexación SEO fundamental para que los libros aparezcan en Google. |
| **`apps/admin`** | **Angular** | Backoffice editorial, alta de libros, analíticas, moderación | Arquitectura robusta basada en componentes, inyección de dependencias, formularios reactivos y control tipado para gestión empresarial. |
| **`apps/api`** | **Express.js (TypeScript)** | Servicio backend RESTful, autenticación, orquestación de datos | Servidor ágil, desacoplado, con middlewares de seguridad (CORS, Helmet, Rate Limit) y conexión a base de datos. |
| **`packages/shared-types`** | **TypeScript** | Contratos de datos (Modelos y DTOs) | Garantiza que frontend y backend utilicen exactamente los mismos tipos (`IBook`, `IAuthor`, etc.), evitando inconsistencias. |

---

## 📖 3. Módulos y Funcionalidades del Sistema de Libros

### A. Portal Público (`Next.js`)
1. **Explorador de Biblioteca**: Filtros por género, autor, año de publicación, idioma y valoración.
2. **Ficha Detallada del Libro**: Sinopsis, biografía del autor, vista previa de lectura / muestra de fragmento, libros relacionados.
3. **Estante Personal del Lector**: Listas de lectura ("Quiero leer", "Leyendo", "Leídos"), favoritos y valoraciones.
4. **Buscador Inteligente**: Búsqueda en tiempo real por título, ISBN o etiquetas temáticas.

### B. Panel Administrativo (`Angular`)
1. **Gestión de Catálogo**: CRUD completo de libros con subida de portadas, asignación de autores y metadatos.
2. **Control de Inventario / Ediciones**: Gestión de formatos (físico, e-book, audiolibro) y disponibilidad.
3. **Métricas y Estadísticas**: Libros más leídos/consultados, autores más populares y actividad de usuarios.
4. **Moderación de Reseñas**: Aprobación y filtrado de comentarios de lectores.

### C. Backend API (`Express`)
1. **`/api/v1/books`**: CRUD, filtrado, paginación, búsqueda por ISBN/título.
2. **`/api/v1/authors`**: Gestión de autores y bibliografías.
3. **`/api/v1/categories`**: Géneros literarios y etiquetas.
4. **`/api/v1/reviews`**: Calificaciones y comentarios de la comunidad.
5. **`/api/v1/auth`**: Autenticación segura (JWT) para lectores y administradores.

---

## 🚀 4. Fases de Ejecución

1. **Fase 1: Configuración del Monorepo**:
   - Crear `package.json` raíz y `pnpm-workspace.yaml`.
   - Crear el paquete de tipos compartidos (`packages/shared-types`).
2. **Fase 2: Creación del Backend Express (`apps/api`)**:
   - Inicializar Express con TypeScript, CORS, y estructura limpia de rutas/controladores/servicios.
   - Definir endpoints iniciales de libros con datos semilla (mock data) de prueba.
3. **Fase 3: Creación de la Web Next.js (`apps/web`)**:
   - Inicializar Next.js con Tailwind/Vanilla CSS moderno, configurado para consumir los tipos y la API.
4. **Fase 4: Creación del Panel Angular (`apps/admin`)**:
   - Inicializar aplicación Angular para el backoffice.
5. **Fase 5: Orquestación y Scripts**:
   - Script para levantar todo concurrentemente (`pnpm dev`).
