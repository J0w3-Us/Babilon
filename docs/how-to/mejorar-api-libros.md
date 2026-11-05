# Guía para mejorar la API de libros

Guía de implementación para desarrolladores backend que mantienen la API publicada de Babilon. Usa el cliente web como evidencia de integración y propone una evolución de contratos, persistencia y despliegue que preserve la compatibilidad.

> **Importante:** este documento no modifica ni describe como existentes rutas, índices o capacidades backend que no puedan verificarse desde el frontend. Las secciones distinguen el **contrato observado por el cliente** de la **recomendación objetivo**.

## 1. Objetivo y límites

El objetivo es reducir el tamaño y el costo de las consultas del catálogo, leer páginas bajo demanda y cargar obras extensas de forma confiable, sin romper el frontend existente durante la migración.

El frontend consume la API publicada a través de un proxy de Next.js. MongoDB, sus credenciales y las reglas de escritura permanecen del lado del servicio backend. MinerU es un servicio externo de procesamiento de archivos y no forma parte del contrato de persistencia de esta API.

La fuente de evidencia del contrato actual es [api.ts](../../apps/web/src/services/api.ts). La guía relacionada con los flujos de cliente está en [desarrollo-y-verificacion-frontend.md](./desarrollo-y-verificacion-frontend.md).

## 2. Contratos que consume actualmente el frontend

Esta tabla resume lo que el cliente envía o intenta leer. No garantiza que todas las rutas estén disponibles en el despliegue.

| Operación | Método y ruta que consume el cliente | Datos relevantes |
| --- | --- | --- |
| Salud | `GET /api/backend/api/salud` | `status`, `message` y, opcionalmente, `database.connected` y `database.status` |
| Catálogo | `GET /api/backend/api/libros` | `busqueda`, `category` repetido, `author` repetido, `featured`, `limit`, `cursor` |
| Facetas | No consumido por el filtro actual | El menú obtiene categorías del catálogo local y autores de los libros ya cargados en la interfaz |
| Detalle / lectura actual | `GET /api/backend/api/libros/{id}` | El cliente obtiene el detalle, extrae `paginas`, `pages` o `fullText` y limita localmente el bloque mostrado |
| Leer páginas mediante endpoint dedicado | No es el GET que usa actualmente el cliente | La ruta `/api/backend/api/libros/{id}/paginas` se había propuesto, pero no se debe asumir disponible en el despliegue |
| Crear obra y guardar su contenido | `POST /api/backend/api/libros` | Metadatos, `fullText`, `sampleChapterText` y `paginas` en una solicitud |

El cliente actual entiende varios envoltorios históricos para catálogo y detalle. Para el catálogo, consulta `total`, `hasMore` y `nextCursor` en el nivel superior. Para páginas puede leer esos datos desde `data` o desde la raíz. El menú de filtros ya no consulta facetas: categorías provienen de la lista local de géneros y los autores se acumulan desde los libros cargados en la interfaz. Para crear una obra, el cliente acepta `success: true` o un objeto de libro reconocible en la respuesta; el ID se toma de `upsertedId`, `_id` o `id` cuando está disponible.

### Fallbacks y limitaciones observables

- El GET de lectura actual solicita `GET /api/backend/api/libros/{id}` y filtra localmente el bloque pedido por el lector.
- El límite local de 10 páginas limita lo que el lector conserva/muestra por bloque, pero **no** limita la respuesta ni los bytes descargados: el detalle puede traer el arreglo completo.
- Si el detalle incluye `fullText` pero no páginas, el cliente puede dividir el texto en el navegador; esto descarga el documento completo y no es una solución escalable para lecturas normales.
- La API publicada no soporta POST por ID ni por subruta `/paginas` para guardar páginas.
- El flujo compatible envía metadatos y páginas juntos mediante `POST /api/libros`; la respuesta exitosa debe confirmar que se persistieron ambos.
- El cliente realiza ambas llamadas por medio de un proxy; el backend debe aplicar autenticación y autorización propias. No debe confiar en que el proxy sustituye la validación del servicio.

## 3. Contratos y mejoras recomendadas

Los ejemplos objetivo están diseñados para ser compatibles con las formas de respuesta que procesa el cliente. Las recomendaciones de lectura paginada y almacenamiento deben coordinarse con el frontend antes de cambiar contratos.

### 3.1 Catálogo con búsqueda y cursor

**Solicitud**

```http
GET /api/libros?busqueda=borges&category=Ficción&author=author-123&limit=20&cursor=<token>
```

Los filtros que admiten varias opciones se envían como parámetros repetidos. Definir explícitamente si varias categorías y autores se combinan con AND u OR. Recomendación: OR dentro de cada grupo y AND entre búsqueda, categorías y autores.

**Respuesta compatible**

```json
{
  "books": [
    {
      "_id": "book-123",
      "titulo": "Ficciones",
      "autor": "Jorge Luis Borges",
      "categorias": ["Ficción"],
      "portada_url": "https://cdn.example.org/covers/book-123.jpg",
      "total_paginas": 180
    }
  ],
  "total": 42,
  "hasMore": true,
  "nextCursor": "opaque-signed-cursor"
}
```

**Recomendaciones**

- `limit` debe tener valor por defecto y máximo configurados en el servidor. No aceptar límites ilimitados.
- El cursor debe ser opaco, validado y ligado al orden y filtros usados; no confiar en un `skip` creciente para catálogos grandes.
- Usar un orden determinista, por ejemplo `createdAt` más `_id` como desempate, y codificar ambos valores en el cursor.
- Definir si `total` es exacto o aproximado. Si calcularlo exacto es costoso, mantenerlo opcional o usar una estrategia de conteo documentada; el cliente tolera que falte y usa el número de resultados recibidos.
- `nextCursor` debe ser `null` cuando no haya más resultados; `hasMore` debe coincidir con esa condición.
- Devolver metadatos de catálogo ligeros. No incluir contenido de páginas ni arreglos grandes.

### 3.2 Facetas de catálogo

**Solicitud**

```http
GET /api/libros/facetas?authorQuery=christie&authorLimit=50&selectedAuthor=author-123
```

**Respuesta compatible**

```json
{
  "categories": ["Clásicos", "Ficción", "Misterio"],
  "authors": [
    { "value": "author-123", "label": "Agatha Christie" }
  ]
}
```

**Recomendaciones**

- Aplicar un máximo de autores por respuesta y limitar la longitud de `authorQuery`.
- Incluir las selecciones existentes aunque no coincidan con el término de búsqueda, para que el usuario pueda reconocer y quitar filtros activos.
- Evitar devolver todos los libros para calcular opciones en cada interacción. Usar agregaciones acotadas o una colección de facetas si el volumen lo justifica.
- Definir si los valores de filtros son IDs estables o nombres normalizados. Preferir IDs de autor y valores de categoría controlados a nombres que pueden cambiar.

### 3.3 Detalle ligero de una obra

**Solicitud**

```http
GET /api/libros/{bookId}
```

**Respuesta recomendada**

```json
{
  "data": {
    "_id": "book-123",
    "titulo": "Ficciones",
    "autor": "Jorge Luis Borges",
    "categorias": ["Ficción"],
    "sinopsis": "Colección de relatos.",
    "isbn": "9780000000000",
    "anio_publicacion": 1944,
    "editorial": "Editorial Babilon",
    "portada_url": "https://cdn.example.org/covers/book-123.jpg",
    "total_paginas": 180,
    "contentStatus": "complete"
  }
}
```

El detalle debe excluir el texto integral y las páginas. Mantener el ID estable y documentar los campos opcionales, los aliases legado y los estados de disponibilidad del contenido.

### 3.4 Lectura de páginas bajo demanda

#### Estado actual observado

El cliente obtiene el detalle con `GET /api/libros/{bookId}` y selecciona de la respuesta el rango visible. Aunque mantiene un tamaño de bloque de 10 páginas, esto es un límite del cliente: el endpoint todavía puede enviar el libro y todas sus páginas en una sola respuesta.

#### Recomendación compatible con la ruta de detalle

Para conservar la ruta GET que ya usa el lector y reducir realmente la transferencia, se recomienda que el backend admita paginación opcional en el detalle:

```http
GET /api/libros/{bookId}?desde=1&limite=10
```

`desde` es el número de página inicial, comenzando en 1. El cliente solicita `limite=10`; el servidor debe aplicar un máximo fijo para que un consumidor no pueda pedir una respuesta ilimitada. Si no se incluyen esos parámetros, conservar temporalmente la respuesta de detalle legado solo para compatibilidad con los consumidores existentes.

**Respuesta recomendada**

```json
{
  "data": {
    "_id": "book-123",
    "total_paginas": 180,
    "pages": [
      { "pageNumber": 1, "text": "Texto de la primera página." },
      { "pageNumber": 2, "text": "Texto de la segunda página." }
    ],
    "pageRange": { "from": 1, "returned": 2, "limit": 10 }
  }
}
```

El cuerpo de respuesta conserva los metadatos ligeros del libro y solo incluye las páginas solicitadas. Al final del libro puede devolver menos de 10. Ordenar por `pageNumber` ascendente y mantener la numeración original. No devolver páginas de otro libro.

**Validación recomendada**

- Rechazar `desde < 1`, `limite < 1` y valores que no sean enteros; limitar en servidor cualquier `limite` superior al máximo permitido.
- Para un libro inexistente, devolver `404`; para parámetros inválidos, `400`; para una página fuera de rango, devolver una lista vacía o `416` según una política documentada.
- Hacer que la consulta use igualdad por `bookId` y rango por `pageNumber`, con orden e índice correspondientes.

Si el equipo backend prefiere no añadir parámetros de página a la ruta de detalle, una ruta dedicada `/api/libros/{bookId}/paginas?desde=1&limite=10` es una alternativa válida, pero requerirá coordinar también el cambio del cliente. No mantener dos contratos de paginación divergentes.

### 3.5 Crear una obra con su contenido

El frontend envía metadatos y contenido juntos mediante una sola solicitud `POST /api/libros`. No enviar páginas mediante POST por ID o subruta `/paginas`, porque la API publicada no soporta esas rutas.

**Solicitud**

```http
POST /api/libros
Content-Type: application/json

{
  "title": "Ficciones",
  "isbn": "9780000000000",
  "author": { "name": "Jorge Luis Borges" },
  "genres": ["Ficción"],
  "synopsis": "Colección de relatos.",
  "publishedYear": 1944,
  "publisher": "Editorial Babilon",
  "pageCount": 2,
  "fullText": "Texto completo de la obra.",
  "sampleChapterText": "Muestra de las primeras páginas.",
  "paginas": [
    { "numero": 1, "texto": "Texto de la primera página.", "conteo_palabras": 5 },
    { "numero": 2, "texto": "Texto de la segunda página.", "conteo_palabras": 5 }
  ],
  "coverUrl": "https://cdn.example.org/covers/book-123.jpg"
}
```

El frontend también envía aliases en español: `titulo`, `autor`, `editorial`, `anio_publicacion`, `categorias`, `sinopsis` y `portada_url`. Durante la migración, el backend puede aceptarlos, pero debe normalizar a un único modelo interno y establecer una fecha de retiro para los aliases.

La respuesta exitosa debe confirmar que se persistieron los metadatos y las páginas. No reportar éxito si solo se registró la ficha.

```json
{
  "success": true,
  "upsertedId": "book-123",
  "message": "Obra y páginas guardadas."
}
```

**Mejoras recomendadas para cargas grandes (propuesta futura, no desplegada)**

- Validar que `paginas` sea un arreglo; que cada página tenga un número positivo único; y que texto, cantidad de páginas y cuerpo completo respeten límites explícitos.
- Persistir metadatos y contenido atómicamente cuando sea viable, o informar claramente si el contenido no se guardó.
- Hacer idempotente la creación con un identificador estable y documentar su política de unicidad.
- Devolver el identificador real del libro y confirmar la persistencia de `paginas`, sin regresar el texto completo en la respuesta.
- Si las obras grandes no caben en un solo `POST`, acordar e implementar un contrato soportado para carga reanudable antes de modificar el frontend. No asumir soporte para POST por ID ni para `/paginas`.
- Para un protocolo futuro por lotes, definir límites, idempotencia por `(bookId, pageNumber)`, progreso de carga, finalización verificable y respuesta de aceptación antes de desplegarlo.

## 4. Persistencia recomendada en MongoDB

Separar metadatos y contenido evita que las consultas del catálogo lean documentos grandes. Este modelo es una recomendación, no una descripción confirmada de la base desplegada.

### 4.1 Colección `books`

```js
{
  _id: ObjectId,
  title: String,
  authorId: ObjectId,
  authorName: String,        // opcional si se decide desnormalizar para lectura
  categories: [String],
  isbn: String,              // opcional según política de catálogo
  synopsis: String,
  publishedYear: Number,
  publisher: String,
  coverUrl: String,          // URL http/https, nunca binario o base64
  pageCount: Number,
  contentStatus: "pending" | "uploading" | "complete" | "failed",
  createdAt: Date,
  updatedAt: Date
}
```

Normalizar nombres de campos internamente y hacer la traducción de aliases en la frontera HTTP. `authorName` puede desnormalizarse para mostrar resultados, pero `authorId` debe ser el identificador de referencia si existe una entidad de autor.

### 4.2 Colección `pages`

```js
{
  _id: ObjectId,
  bookId: ObjectId,
  pageNumber: Number,
  text: String,
  createdAt: Date,
  updatedAt: Date
}
```

No repetir título, autor, portada ni categorías en cada página. `pageNumber` es 1-based. `text` debe ser texto plano o Markdown validado, no HTML ejecutable. Evitar almacenar metadatos de OCR redundantes si no se consultan.

El tamaño objetivo de cada página debe medirse con muestras reales. Como límite operativo inicial, usar un máximo configurable por documento muy inferior al límite de BSON de 16 MiB, por ejemplo 256 KiB UTF-8; rechazar o dividir contenidos que lo excedan. Confirmar el umbral con el equipo y las métricas de producción antes de fijarlo.

### 4.3 Índices sugeridos

| Colección | Índice | Propósito |
| --- | --- | --- |
| `pages` | `{ bookId: 1, pageNumber: 1 }`, `unique: true` | Obtener páginas en orden y evitar duplicar una página para el mismo libro. |
| `pages` | `{ bookId: 1 }` solo si existen consultas que no fijan número de página | Soportar conteo o borrado por libro; revisar si el prefijo del índice compuesto ya cubre las consultas usadas. |
| `books` | `{ createdAt: -1, _id: -1 }` | Orden determinista para cursor por fecha de alta. |
| `books` | `{ categories: 1, createdAt: -1, _id: -1 }` si las consultas por categoría lo justifican | Filtrar por categoría y mantener el orden del catálogo; validar el plan con `explain`. |
| `books` | `{ authorId: 1, createdAt: -1, _id: -1 }` si las consultas filtran por autor | Filtrar por ID de autor y ordenar resultados. |
| `books` | `{ isbn: 1 }`, `unique` parcial solo si ISBN es realmente único y opcional | Evitar duplicados de identificador sin impedir documentos que no tienen ISBN. |

No crear todos los índices por anticipado. Medir selectividad, cardinalidad, costo de escritura y consultas reales; verificar con `explain("executionStats")`. Los índices compuestos multikey con varias arrays, por ejemplo `categories` y una lista de autores dentro del mismo documento, tienen restricciones y pueden no ser válidos. Preferir índices separados o una representación normalizada que se pueda consultar correctamente.

Para búsqueda en título, autor, sinopsis e ISBN, definir idioma, acentos, coincidencia parcial y ranking. Si la infraestructura ya ofrece Atlas Search, evaluarlo para búsqueda de texto; no asumir que existe ni sustituirlo por regex no ancladas sobre toda la colección.

### 4.4 Consulta de páginas

Pseudocódigo MongoDB para el contrato `desde` / `limite`:

```js
const start = Number(desde);
const size = Math.min(Number(limite), MAX_PAGE_LIMIT);

const [pages, total] = await Promise.all([
  db.collection("pages")
    .find({ bookId, pageNumber: { $gte: start } })
    .sort({ pageNumber: 1 })
    .limit(size)
    .project({ _id: 0, pageNumber: 1, text: 1 })
    .toArray(),
  db.collection("books").findOne(
    { _id: bookId },
    { projection: { pageCount: 1 } }
  )
]);
```

En implementación real, validar el ID antes de consultar, confirmar que el libro existe y definir si `total` viene de `books.pageCount` o de un conteo de `pages`. Si se devuelve `pageCount`, debe mantenerse consistente al completar o corregir una carga.

## 5. Errores, seguridad y operación

### Respuesta de error consistente

**Forma recomendada**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PAGE_RANGE",
    "message": "El límite de páginas excede el máximo permitido.",
    "requestId": "req-opaque-id",
    "details": { "maxLimit": 50 }
  }
}
```

Usar códigos HTTP coherentes: `400` para entrada inválida, `401`/`403` para autenticación/autorización, `404` para recurso inexistente, `409` para conflictos de carga, `413` para payload demasiado grande, `429` para límite de solicitudes y `5xx` para errores del servicio. No incluir stack traces, cadenas de conexión ni datos sensibles en respuestas públicas.

### Validación y protección

- Validar tipo, longitud y rango de cada campo en el servidor aunque el frontend también valide.
- Aceptar portada solo como URL `http` o `https`; no guardar imágenes base64 en `books`.
- Definir límites de JSON, tamaño de texto por página, tamaño y cantidad de lotes, y frecuencia de solicitudes.
- Usar consultas parametrizadas del driver, nunca concatenar entrada como fragmento de consulta.
- No renderizar texto de páginas como HTML confiable; almacenar texto y codificarlo al mostrar.
- Proteger rutas de escritura con autorización, además de autenticación de servicio; registrar actor, libro y resultado sin registrar cuerpos completos de libros.
- Añadir timeout, métricas de latencia/error, tamaño de documentos, cantidad de páginas y tasa de lotes fallidos.
- Aplicar límites de concurrencia y backpressure para evitar que varias cargas grandes saturen la base.

## 6. Migración y compatibilidad

1. **Inventariar el despliegue.** Confirmar rutas reales, campos almacenados, índices existentes, tamaño de documentos y consumidores activos. No inferirlo solo del código web.
2. **Acordar el contrato.** Publicar ejemplos de solicitud y respuesta y fijar las reglas de filtros, cursores, paginación y finalización de carga.
3. **Añadir lectura paginada primero.** Implementar el límite de servidor de 10 páginas en el GET de detalle y el índice antes de considerar que la descarga está limitada: el límite local del cliente no reduce el payload transferido.
4. **Migrar de forma reanudable.** Copiar páginas desde arreglos o texto legado a `pages`, con clave idempotente `(bookId, pageNumber)`, checkpoint por lote y modo dry-run. No eliminar contenido antiguo en la misma pasada.
5. **Verificar equivalencia.** Comparar número de páginas, primera/última página, muestras y conteos. Registrar discrepancias para corrección.
6. **Validar escrituras.** Confirmar que el `POST /api/libros` actual persiste metadatos y páginas enviados juntos. Si el tamaño máximo del cuerpo lo impide, acordar primero un contrato de carga soportado y desplegarlo antes de cambiar el frontend.
7. **Observar clientes y errores.** Medir respuestas `404` de las rutas de páginas, errores `4xx/5xx`, lotes incompletos y latencia.
8. **Retirar compatibilidad gradualmente.** Eliminar campos grandes, rutas antiguas y aliases únicamente cuando no haya consumidores activos y exista respaldo verificable.

No habilitar una ruta de migración que borre o transforme datos sin respaldo, conteos antes/después, dry-run y procedimiento de reanudación.

## 7. Plan de pruebas y criterios de aceptación

### Pruebas de contrato

- Catálogo vacío y con resultados; combinación de búsqueda y múltiples filtros; límite máximo y cursor inválido.
- Facetas con búsqueda vacía, con coincidencias, sin coincidencias y con autores seleccionados fuera de la búsqueda.
- Detalle existente e inexistente; confirmar que no incluye páginas ni texto completo.
- GET con páginas iniciales, intermedias y finales; confirmar que `limite=10` restringe también el tamaño de respuesta del servidor; rangos inválidos; libro sin contenido o inexistente; orden estable.
- Crear obra con URL válida, URL inválida, campos requeridos ausentes e identificador duplicado.
- POST único con metadatos y páginas; verificar que la respuesta solo se considere exitosa cuando la API haya guardado el contenido. Para cualquier protocolo futuro por lotes, añadir pruebas de idempotencia, reintento, incompletitud y límites antes de adoptarlo.
- Migrar una obra con cero páginas, muchas páginas, separadores inesperados y contenido legado.

### Criterios de aceptación

- Las respuestas de catálogo y detalle no contienen texto integral ni arrays de páginas.
- La lectura devuelve únicamente el rango solicitado y usa el índice `{ bookId, pageNumber }`.
- Repetir un lote no duplica páginas ni marca una carga incompleta como terminada.
- El cliente nunca interpreta una respuesta de metadatos como confirmación de persistencia de páginas.
- Los errores incluyen código estable y `requestId`, sin información interna sensible.
- La migración puede pausarse y reanudarse sin duplicar ni perder contenido.
- Latencia, bytes devueltos, tamaño medio/máximo de documento y errores se pueden observar en métricas.

## 8. Prioridades sugeridas

| Prioridad | Trabajo | Motivo |
| --- | --- | --- |
| P0 | Verificar rutas y formatos actualmente desplegados; no interpretar el `404` de `/paginas` como libro inexistente. | Determina el estado real y desbloquea el diagnóstico. |
| P0 | Aplicar el límite de 10 en servidor al GET por ID (o acordar una sola ruta paginada) con índice compuesto. | El límite local no reduce el payload descargado; el límite del servidor sí. |
| P0 | Verificar que el POST actual de creación persista tanto metadatos como páginas; investigar el límite de tamaño del cuerpo. | Evita que una respuesta exitosa signifique solo que se aceptaron metadatos, sin guardar páginas. |
| P1 | Limitar catálogo, facetas y payloads; estandarizar errores. | Mantiene costo y comportamiento predecibles bajo carga. |
| P1 | Medir y crear índices de catálogo según consultas reales. | Reduce lecturas sin añadir índices innecesarios. |
| P2 | Migrar documentos existentes a páginas independientes y retirar el fallback solo después de verificar clientes. | Reduce almacenamiento y facilita una transición segura. |
| P2 | Mejorar búsqueda de texto con la tecnología disponible y métricas de relevancia. | Escala búsqueda sin recurrir a escaneos o regex costosos. |
