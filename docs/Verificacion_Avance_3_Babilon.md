# Ronda de Verificación de Cumplimiento · Avance 3 vs. Producto Babilon

**Proyecto:** Babilon — Biblioteca Digital & Archivo Literario (Zenit)  
**Fecha de evaluación:** 19 de noviembre de 2026  
**Documento base:** `docs/Avance 3 · Biblioteca Virtual Eclesiástica (Zenit).md`  
**Equipo:** Zenit · Integrantes: Lopez Hu Jose Yael, Zapata Paredes Luiz Yael, Manzanilla Bass Emmanuel  

---

## 1. Resumen Ejecutivo del Estado del Producto

| Criterio de la Rúbrica | Ponderación | Estado en Babilon | Calificación Estimada |
| :--- | :---: | :---: | :---: |
| **Criterio 1: Diseño de interfaz adaptable** (Hitos 1.1, 1.2, 1.3) | 25 % | **Cumplido al 100 %** (con matiz en Hito 1.3) | 23 - 25 % |
| **Criterio 2: Filtros dinámicos del buscador** (Hitos 2.1, 2.2, 2.3) | 25 % | **Cumplido al 100 %** | 25 % |
| **Criterio 3: Módulo de administración** (Hitos 3.1, 3.2, 3.3) | 25 % | **Cumplido Parcial (50 %)** *(Atención Prioritaria)* | 12 - 15 % |
| **Criterio 4: Integración y resiliencia cloud** (Hitos 4.1, 4.2, 4.3) | 25 % | **Cumplido al 100 %** | 25 % |
| **Puntaje Global Estimado Actual** | **100 %** | **Aprobado Sobresaliente con Observación en Fase 3** | **85 - 88 %** |

---

## 2. Auditoría Detallada Hito por Hito

### FASE 1: Frontend y UI/UX (25 %)

#### ✅ Hito 1.1: Layout adaptable (Responsive Design)
* **Requisito en Avance 3:** Flexbox / Grid para móvil (<600px), tablet y escritorio. Cuadrícula de libros autoajustable con zonas táctiles de 44px.
* **Estado en Babilon:** **CUMPLIDO AL 100 %**
* **Evidencia en código:**
  - `BibliotecaView.tsx` y `BookCard.tsx`: Grid dinámico `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`.
  - Botones táctiles `px-3.5 py-2`, `min-h-[44px]` implícito en inputs y selectores accesibles.
  - Paleta editorial cálida (`cream` y `surface`) con soporte completo modo claro/oscuro.

#### ✅ Hito 1.2: Tarjetas de libros y visor de texto
* **Requisito en Avance 3:** Cards reutilizables (portada, título, fecha, tipo/iglesia) con lazy loading y visor de texto plano editorial paginado (16-18px, interlineado cómodo, texto por página o capítulo sin cargar el libro completo).
* **Estado en Babilon:** **CUMPLIDO AL 100 % (Superado)**
* **Evidencia en código:**
  - `BookCard.tsx`: Manejo de portadas con fallback tipográfico clásico, degradados y badges de metadata.
  - `BookDetailModal.tsx` & `BookReader.tsx`: Lector editorial interactivo con paginación por demanda (`GET /api/libros/:id/paginas?desde=X&limite=Y`), 3 modos de iluminación (*Parchment*, *Light*, *Dark*), control de tamaño de letra y pantalla completa.

#### ⚠️ Hito 1.3: Barra de navegación (Bottom Navigation vs. Sticky Topbar)
* **Requisito en Avance 3:** Barra fija inferior (Bottom Navigation) con destinos: Inicio, Biblioteca, Ajustes. Navegación SPA sin recarga.
* **Estado en Babilon:** **CUMPLIDO FUNCIONALMENTE / DIFERENCIA DE POSICIÓN VISUAL**
* **Análisis:**
  - La navegación es 100 % SPA sin recarga (Next.js Link / App Router).
  - En lugar de barra inferior (`bottom-nav`), el sistema cuenta con un **Navbar superior flotante con efecto blur glass** (`NavbarClient.tsx`), con selector de tema integrado y enlaces a Inicio, Catálogo, Subir Obra y Obras Libres.
  - **Recomendación para la rúbrica:** En pantallas móviles se recomienda inyectar una barra inferior fija de 3 botones si el docente exige de manera estricta el layout "Bottom Nav" móvil.

---

### FASE 2: Buscador Avanzado y Paginación (25 %)

#### ✅ Hito 2.1: Inputs y filtros dinámicos combinados
* **Requisito en Avance 3:** Input de texto con `debounce` de 300ms combinado con selectores de metadatos (fecha, iglesia/origen, tipo/categoría, autor). Botón de limpiar filtros y reset a página 1.
* **Estado en Babilon:** **CUMPLIDO AL 100 %**
* **Evidencia en código:**
  - `useBooksCatalog.ts`: Implementa `debounceMs = 280`, combianción de `searchTerm`, `selectedCategories`, `selectedAuthors`, `cursor`, `filterMenuOpen` y botón para resetear filtros.
  - `CatalogFilterDropdown.tsx`: Dropdown facetado con búsqueda reactiva de autores y selección multivariable.

#### ✅ Hito 2.2: Consultas NoSQL por palabras clave
* **Requisito en Avance 3:** Consultas `$text` / `$regex` sobre capítulos/páginas con sanitización contra inyección de operadores NoSQL y combinación lógica AND.
* **Estado en Babilon:** **CUMPLIDO AL 100 %**
* **Evidencia en código:**
  - Backend `libro_search.js`: Función `escaparRegex()` que neutraliza caracteres especiales regex antes de consultar MongoDB.
  - `apps/web/src/app/api/backend/[...path]/route.ts`: Sanitización estricta de cadenas recibidas y matching multi-campo (`titulo`, `autor`, `editorial`, `isbn`, `categorias`, `sinopsis`).

#### ✅ Hito 2.3: Sistema de paginación de red (`limit` y `skip` / cursor)
* **Requisito en Avance 3:** Entrega en bloques controlados (10 o 20 items), orden estable y respuesta con total acumulado y botón "Cargar más".
* **Estado en Babilon:** **CUMPLIDO AL 100 %**
* **Evidencia en código:**
  - `apps/web/src/modules/biblioteca/hooks/useBooksCatalog.ts` y backend `server.js`: Paginación por bloques (`limit=20`), con soporte de cursor opaco codificado en Base64 para garantizar lecturas O(1) en MongoDB Atlas sin riesgo de saturación de memoria RAM por `Sort exceeded memory limit`.
  - Botón interactivo "Cargar más obras" con contador reactivo `Mostrando X de Y obras registradas`.

---

### FASE 3: Módulo Administrativo y Métricas Logísticas (25 %)

#### ⚠️ Hito 3.1: Ruta protegida de administración
* **Requisito en Avance 3:** Roles lector y administrador. La ruta `/admin` o endpoints protegidos devuelven 401/403. Credenciales en `.env`.
* **Estado en Babilon:** **CUMPLIDO EN UN 85 %**
* **Evidencia en código:**
  - El sistema implementa autenticación real por JWT con bcrypt (`jwtSecurity.ts`, `mongoDb.ts`, `NavbarClient.tsx`).
  - Hay roles definidos (`'admin'` vs `'usuario'`).
  - Las acciones administrativas (`/subir`, edición de libros, subida por lotes en `PageManager.tsx` y `/explorar-libres`) están protegidas en frontend (`isAdmin`) y en backend (`verifyUploadJwt` / `verificarAutenticacion` respondiendo 401/403).
  - *Observación:* No existe una ruta con el nombre explícito `/admin`; el admin opera en `/subir` y en modales de gestión.

#### ❌ Hito 3.2: Conexión con colección de metadatos de control
* **Requisito en Avance 3:** Colección específica (ej. `control_escaneo` o `metadatos_control`) con un documento por integrante del equipo (`integrante`, `libros_escaneados`, `meta_individual`, `ultima_actualizacion`).
* **Estado en Babilon:** **NO CREADO AÚN**
* **Análisis:** En la base de datos actual existen colecciones `libros`, `pages` y `usuarios`, pero no existe aún la colección de monitoreo de avance de los integrantes del equipo (Lopez Hu, Zapata Paredes, Manzanilla Bass).

#### ❌ Hito 3.3: Renderizado de indicadores y gráficos de progreso de los integrantes
* **Requisito en Avance 3:** Gráfico de barras o barras de progreso por cada integrante del equipo (escaneados vs. meta) y total grupal.
* **Estado en Babilon:** **NO CREADO AÚN**
* **Análisis:** Babilon tiene el visor de lectura y el gestor de páginas, pero falta la vista/pestaña donde el docente pueda ver la tabla comparativa con las métricas de los 3 estudiantes.

---

### FASE 4: Cloud, Patrón Singleton y Resiliencia (25 %)

#### ✅ Hito 4.1: Patrón Singleton para el Connection Pool
* **Requisito en Avance 3:** Módulo de conexión con `get_client()` reutilizando un único cliente y pool de sockets TCP/TLS (`maxPoolSize`, `minPoolSize`).
* **Estado en Babilon:** **CUMPLIDO AL 100 %**
* **Evidencia en código:**
  - `apps/web/src/lib/mongoDb.ts`: Utiliza el patrón Singleton global en NodeJS (`global._babilonMongoClientPromise`), reutilizando el socket pool en serverless/edge y Next.js.
  - `backend_libros/backend/src/db.js`: Función `intentarConectar()` con variable singleton `let client = null` y control de concurrencia `conectando`.

#### ✅ Hito 4.2: Manejo de excepciones de red (Try-Catch)
* **Requisito en Avance 3:** Bloques try-catch capturando errores de conexión/timeout hacia Atlas, respondiendo códigos 503/500 sin exponer credenciales.
* **Estado en Babilon:** **CUMPLIDO AL 100 %**
* **Evidencia en código:**
  - `apps/web/src/app/api/backend/[...path]/route.ts`: Mecanismo de doble capa resiliente: intenta conexión directa a MongoDB Atlas; si falla, conmuta automáticamente como fallback a la API de Render (`backendUrl`).
  - Mensajes de error controlados en JSON sin fugas de stack trace ni contraseñas.

#### ✅ Hito 4.3: Alertas de interrupción en la interfaz
* **Requisito en Avance 3:** Toast/Banner visual que reporta desconexión sin que la app crashee o quede en blanco.
* **Estado en Babilon:** **CUMPLIDO AL 100 %**
* **Evidencia en código:**
  - `BibliotecaView.tsx`: Banner/Toast `toastMessage` y badge de salud `catalog.health`.
  - Si la API falla, la aplicación retiene las obras cacheadas y despliega estados vacíos elegantes ("Consultando catálogo...", "No se hallaron obras registradas") con opción de reintento.

---

## 3. Plan de Acción Recomendado para la Demostración

Para garantizar la calificación máxima (100 / 100 en la rúbrica):

1. **Implementar el Dashboard Logístico de Administración (`/admin` o `/progreso`):**
   - Crear la colección o endpoint que devuelva las métricas de los 3 integrantes:
     - Lopez Hu Jose Yael
     - Zapata Paredes Luiz Yael
     - Manzanilla Bass Emmanuel
   - Renderizar la tabla con barras de progreso de porcentaje y meta global.
2. **Añadir el Hito Complementario en el nuevo documento:**
   - La arquitectura moderna de Babilon incluye aportes superiores no contemplados en el avance original (como la ingesta OCR con Gemini / MinerU y el explorador federado de Google Books). Estos deben presentarse como hitos de valor agregado.

