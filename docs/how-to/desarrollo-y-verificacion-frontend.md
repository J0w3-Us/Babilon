# Desarrollo y verificación de los flujos frontend

Guía para desarrolladores que necesiten mantener, probar o extender el catálogo, el lector y la carga de obras en Babilon.

## Alcance y límites

La aplicación web es responsable de la interacción, el estado de vista y la preparación del contenido en el navegador. Los datos se consultan y persisten mediante la API publicada, usando el cliente de [api.ts](../../apps/web/src/services/api.ts) y el proxy de Next.js.

Esta guía describe cambios del frontend. No define ni requiere cambios en el backend, MongoDB, MinerU ni sus contratos desplegados. Si un endpoint externo no admite una operación, el frontend muestra el error o usa el fallback existente; no sustituye esa API.

## Catálogo

El estado y la consulta del catálogo viven en [useBooksCatalog.ts](../../apps/web/src/modules/biblioteca/hooks/useBooksCatalog.ts). La interfaz de filtros está en [CatalogFilterDropdown.tsx](../../apps/web/src/modules/biblioteca/CatalogFilterDropdown.tsx).

### Búsqueda, filtros y URL

- La búsqueda se aplica con una espera de 280 ms para evitar solicitudes por cada tecla.
- Las categorías y autores usan estado de borrador. Marcar opciones no consulta el catálogo hasta pulsar **Aplicar filtros**.
- **Limpiar filtros** borra las selecciones del borrador; cerrar o cancelar descarta el borrador.
- El contador del botón refleja las categorías y autores aplicados.
- `q`, `category` y `author` se escriben en la URL. Al abrir la biblioteca, esos parámetros inicializan la búsqueda y los filtros.
- Las opciones de autores y categorías se consultan al abrir el menú; la búsqueda de autores espera 180 ms.
- El menú ofrece casillas, búsqueda de autores, estados de carga y error, cierre con `Escape` y foco de teclado.

### Carga incremental

El catálogo solicita hasta 20 obras por lote. Al pedir más, utiliza el cursor que devuelve la API y agrega las nuevas obras sin duplicar IDs.

Los parámetros enviados por el cliente incluyen `busqueda`, `category`, `author`, `limit` y, cuando existe, `cursor`. La UI muestra el estado de carga, los errores y el total informado por el servicio.

## Lector

La coordinación de páginas está en [useBookReader.ts](../../apps/web/src/modules/biblioteca/hooks/useBookReader.ts), y la presentación en [BookReader.tsx](../../apps/web/src/modules/biblioteca/BookReader.tsx).

### Carga y navegación

- El lector pide bloques de 10 páginas al avanzar a una página que aún no está cargada.
- La consulta usa `GET /api/backend/api/libros/{id}/paginas?desde={n}&limite=10`.
- Si esa ruta responde `404`, `getBookPagesApi` intenta obtener el libro mediante la ruta de detalle y extraer sus páginas. Si tampoco hay contenido utilizable, la UI presenta el error y permite reintentar.
- Al cambiar la página, el área desplazable del lector vuelve al inicio para que el nuevo texto comience visible desde arriba.

### Limpieza y representación del texto

Las páginas se limpian en [bookTextCleaner.ts](../../apps/web/src/lib/bookTextCleaner.ts), antes de incorporarlas al estado del lector. El proceso elimina paginación y encabezados repetidos, repara iniciales partidas al comienzo de línea, une cortes de línea dentro de un párrafo y conserva separaciones explícitas entre párrafos y encabezados. También une palabras partidas por guion al final de línea.

El contenido se inserta como texto de React, no como HTML. No convertir el Markdown recibido a HTML sin un proceso de sanitización adecuado.

Para documentos de carga mayores de 80.000 caracteres, [bookTextCleanerAsync.ts](../../apps/web/src/lib/bookTextCleanerAsync.ts) delega la limpieza a [bookTextCleaner.worker.ts](../../apps/web/src/lib/bookTextCleaner.worker.ts). Los errores del Worker y el tiempo límite de 60 segundos se notifican al usuario.

### Marcador local

[useReadingProgress.ts](../../apps/web/src/modules/biblioteca/hooks/useReadingProgress.ts) guarda el progreso en el almacenamiento local del navegador, no en la API. La clave por libro tiene el formato `babilon:reading-progress:v1:{bookId codificado}`. El valor JSON contiene:

```json
{
  "version": 1,
  "bookId": "id-del-libro",
  "pageNumber": 5,
  "totalPages": 146,
  "updatedAt": "2026-11-04T07:00:00.000Z"
}
```

La página guardada empieza en 1. Al reabrir el libro, el lector ofrece reanudar; el progreso se actualiza al navegar y se refleja en la tarjeta de catálogo. Si el almacenamiento local falla, la lectura continúa y se muestra el aviso correspondiente.

## Carga de obras

El flujo se compone de [BookUploadWizard.tsx](../../apps/web/src/modules/upload/BookUploadWizard.tsx), [FileDropzone.tsx](../../apps/web/src/modules/upload/FileDropzone.tsx), [MetadataFields.tsx](../../apps/web/src/modules/upload/MetadataFields.tsx) y [useBookUpload.ts](../../apps/web/src/modules/upload/useBookUpload.ts).

### Procesamiento y revisión

1. La interfaz acepta archivos PDF, TXT y Markdown. La selección y el arrastre usan el mismo flujo.
2. Los PDF se envían al servicio externo de digitalización. El frontend muestra el estado de carga, recibe el resultado y limpia y estructura el texto en portada, cuerpo y material extra.
3. TXT y Markdown se leen en el navegador y pasan por la misma limpieza y estructuración.
4. El formulario permite revisar y editar los metadatos detectados antes de guardar. Título, autor, género y año son obligatorios; el año debe ser entero entre -3000 y dos años después del año actual.
5. Se puede usar una URL `http` o `https` para la portada. Elegir un archivo de imagen crea una vista previa local; ese archivo personalizado no se sube a la API.
6. La vista previa permite revisar el cuerpo y el material extra por separado, editar el texto y exportarlo como Markdown.

### Persistencia del contenido

El cliente valida y envía los metadatos mediante `createBookApi`. Después divide el texto preparado en páginas y las envía mediante `uploadBookPagesApi` en lotes de hasta 50. La interfaz informa el rango de páginas que se está guardando y detiene el flujo si un lote falla.

La división del texto se mantiene en [pageSplitter.ts](../../apps/web/src/lib/pageSplitter.ts). Los tamaños de lote y la lógica de la carga están en `useBookUpload.ts`; los nombres permitidos para género están en [bookUploadOptions.ts](../../apps/web/src/modules/upload/bookUploadOptions.ts).

## Mapa de módulos

| Responsabilidad | Archivo |
| --- | --- |
| Página de biblioteca, filtros y conexión de vistas | [BibliotecaView.tsx](../../apps/web/src/modules/biblioteca/BibliotecaView.tsx) |
| Búsqueda, filtros aplicados y borrador, paginación | [useBooksCatalog.ts](../../apps/web/src/modules/biblioteca/hooks/useBooksCatalog.ts) |
| Presentación del filtro accesible | [CatalogFilterDropdown.tsx](../../apps/web/src/modules/biblioteca/CatalogFilterDropdown.tsx) |
| Carga de páginas, progreso y navegación | [useBookReader.ts](../../apps/web/src/modules/biblioteca/hooks/useBookReader.ts) |
| Guardado local de lectura | [useReadingProgress.ts](../../apps/web/src/modules/biblioteca/hooks/useReadingProgress.ts) |
| Limpieza, división estructural y normalización | [bookTextCleaner.ts](../../apps/web/src/lib/bookTextCleaner.ts) |
| Limpieza de documentos grandes en segundo plano | [bookTextCleanerAsync.ts](../../apps/web/src/lib/bookTextCleanerAsync.ts), [bookTextCleaner.worker.ts](../../apps/web/src/lib/bookTextCleaner.worker.ts) |
| Conversión de texto en páginas | [pageSplitter.ts](../../apps/web/src/lib/pageSplitter.ts) |
| Cliente de API, normalización y cargas por lotes | [api.ts](../../apps/web/src/services/api.ts), [bookMapper.ts](../../apps/web/src/lib/bookMapper.ts) |
| Estado y componentes del flujo de carga | [useBookUpload.ts](../../apps/web/src/modules/upload/useBookUpload.ts), [BookUploadWizard.tsx](../../apps/web/src/modules/upload/BookUploadWizard.tsx) |

## Verificación antes de integrar

### Compilación

Desde la raíz del repositorio:

```bash
pnpm run build
```

El comando compila primero `@babilon/shared-types` y después la aplicación web.

### Revisión manual

En `/biblioteca`:

- Buscar por texto y confirmar que la URL contiene `q`.
- Abrir filtros, cambiar varias opciones y confirmar que los resultados no cambian antes de aplicar.
- Aplicar, cancelar y limpiar filtros; comprobar el contador, los parámetros `category` y `author`, y el estado vacío.
- Cargar más obras y confirmar que se agregan en lotes de 20 sin duplicados.
- Abrir una obra, avanzar y retroceder; comprobar que cada página nueva comienza arriba.
- Confirmar que el marcador de lectura se guarda, se ve en la tarjeta y permite reanudar.

En `/subir`:

- Probar un PDF, un TXT o un Markdown y revisar los estados de carga y error.
- Confirmar que los metadatos detectados son editables y que los campos obligatorios se validan.
- Revisar por separado cuerpo y material extra; comprobar la limpieza de paginación, encabezados, cortes de línea y guiones.
- Probar una URL de portada válida y una inválida. Confirmar que una imagen elegida como vista previa local no se envía a la API.
- Guardar una obra con varias páginas y verificar el progreso por lotes y el manejo de errores.

## Diagnóstico rápido

- **No aparecen filtros:** confirma que la API publicada exponga la consulta de facetas que consume `getCatalogFacetsApi`; la UI presenta el error sin sustituirlo por opciones falsas.
- **No cargan las páginas:** revisa la respuesta de la ruta de páginas y la alternativa de detalle en `getBookPagesApi`; el lector muestra un error recuperable.
- **No funciona reanudar:** comprueba que el navegador permita `localStorage` y que el identificador de libro sea estable.
- **Falla la limpieza de un archivo grande:** revisa el soporte de Web Workers y el mensaje de error del procesamiento; el flujo no debe continuar como si la limpieza hubiera terminado.
- **La imagen personalizada no se guarda:** es una vista previa local por diseño; para persistir una portada se requiere proporcionar una URL válida.
