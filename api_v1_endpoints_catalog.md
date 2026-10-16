# 📋 Catálogo y Documentación de Endpoints — API v1 (Babilon)

> [!NOTE]  
> Este documento cataloga la especificación actual de la **API v1**. Servirá como referencia antes de aplicar cambios estructurales en las rutas, controladores y la integración con la base de datos MongoDB.

---

## 🌐 Resumen de Rutas v1

| Método | Endpoint | Descripción | Parámetros / Query | Body | Código Éxito |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | Estado del servicio API | Ninguno | Ninguno | `200 OK` |
| **GET** | `/api/v1/books` | Listar catálogo con filtros | `query`, `genre`, `featured` | Ninguno | `200 OK` |
| **GET** | `/api/v1/books/:id` | Obtener detalle de libro | `id` (parámetro de ruta) | Ninguno | `200 OK` / `404` |
| **POST** | `/api/v1/books` | Registrar nuevo libro | Ninguno | `JSON` (Book payload) | `201 Created` |
| **GET** | `/api/v1/authors` | Listar autores registrados | Ninguno | Ninguno | `200 OK` |
| **GET** | `/api/v1/authors/:id` | Obtener autor por ID | `id` (parámetro de ruta) | Ninguno | `200 OK` / `404` |

---

## 📚 1. Módulo de Libros (`/api/v1/books`)

### 1.1 `GET /api/v1/books`
Permite obtener la lista completa de libros o filtrar por texto, género literario y destacados.

* **Query Parameters opcionales**:
  * `query` *(string)*: Búsqueda flexible por título, autor o ISBN.
  * `genre` *(string)*: Filtrar por género literario (ej: `'Ficción'`, `'Ciencia Ficción'`, `'Filosofía'`).
  * `featured` *(string)*: Si es `'true'`, devuelve únicamente libros destacados.

* **Respuesta Exitosa (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "book-1",
      "title": "Ficciones",
      "originalTitle": "Ficciones",
      "isbn": "978-8420633121",
      "author": {
        "id": "auth-1",
        "name": "Jorge Luis Borges",
        "biography": "Escritor, poeta y ensayista argentino...",
        "country": "Argentina"
      },
      "genres": ["Ficción", "Filosofía", "Clásicos"],
      "synopsis": "Una recopilación magistral de cuentos...",
      "publishedYear": 1944,
      "publisher": "Sur / Alianza Editorial",
      "pageCount": 224,
      "language": "Español",
      "coverUrl": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80",
      "ratingAverage": 4.8,
      "ratingCount": 3120,
      "availableFormats": ["HARDCOVER", "PAPERBACK", "EBOOK"],
      "featured": true,
      "sampleChapterText": "El universo (que otros llaman la Biblioteca)..."
    }
  ],
  "meta": {
    "total": 1
  }
}
```

---

### 1.2 `GET /api/v1/books/:id`
Devuelve el objeto completo de un libro a partir de su identificador único.

* **Parámetros de Ruta**:
  * `id` *(string)*: ID del libro (ej: `book-1`).

* **Respuesta Exitosa (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "book-1",
    "title": "Ficciones",
    "isbn": "978-8420633121",
    "genres": ["Ficción", "Filosofía", "Clásicos"],
    ...
  }
}
```

* **Respuesta de Error (`404 Not Found`)**:
```json
{
  "success": false,
  "message": "Libro con id book-999 no encontrado",
  "data": null
}
```

---

### 1.3 `POST /api/v1/books`
Permite dar de alta un libro desde el panel administrativo (Angular) o clientes autorizados.

* **Cuerpo de la Solicitud (`Content-Type: application/json`)**:
```json
{
  "title": "El Aleph",
  "isbn": "978-8420633114",
  "author": {
    "name": "Jorge Luis Borges",
    "biography": "Escritor argentino"
  },
  "genres": ["Ficción", "Filosofía"],
  "synopsis": "Colección de relatos sobre el infinito y el tiempo.",
  "publishedYear": 1949,
  "publisher": "Losada",
  "pageCount": 180,
  "language": "Español",
  "coverUrl": "https://...",
  "availableFormats": ["PAPERBACK", "EBOOK"],
  "featured": false
}
```

* **Respuesta Exitosa (`201 Created`)**:
```json
{
  "success": true,
  "message": "Libro registrado exitosamente en Babilon",
  "data": {
    "id": "book-1728321000000",
    "title": "El Aleph",
    "isbn": "978-8420633114",
    "ratingAverage": 0,
    "ratingCount": 0
    ...
  }
}
```

---

## ✍️ 2. Módulo de Autores (`/api/v1/authors`)

### 2.1 `GET /api/v1/authors`
Listado de todos los autores dados de alta en el sistema.

* **Respuesta Exitosa (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "auth-1",
      "name": "Jorge Luis Borges",
      "biography": "Escritor, poeta y ensayista argentino...",
      "birthDate": "1899-08-24",
      "country": "Argentina",
      "avatarUrl": "https://..."
    }
  ],
  "meta": {
    "total": 1
  }
}
```

---

### 2.2 `GET /api/v1/authors/:id`
Obtiene la ficha biográfica de un autor por su ID.

* **Parámetros de Ruta**:
  * `id` *(string)*: Identificador del autor (ej: `auth-1`).

* **Respuesta Exitosa (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "auth-1",
    "name": "Jorge Luis Borges",
    "biography": "Escritor, poeta y ensayista argentino...",
    "birthDate": "1899-08-24",
    "country": "Argentina"
  }
}
```

---

## 🔍 3. Estado de la Integración con MongoDB
 
> [!NOTE]  
> **Estado de la Implementación**:
> 1. ✅ **Conexión Directa a MongoDB**: Las rutas `/api/v1/books` y `/api/v1/authors` ahora consultan y persisten directamente en MongoDB a través de los modelos `BookModel` y `AuthorModel` de Mongoose.
> 2. ✅ **Sembrado Automático (Auto-seed)**: Si la base de datos MongoDB está vacía al iniciar, se inicializa automáticamente con el catálogo literario curado.
> 3. ✅ **Modo Resiliente**: Si MongoDB aún no ha arrancado en el puerto 27017 o en Atlas, la API continúa operativa en modo de reserva e informa su estado en el header `X-Babilon-Storage` y en `/api/health`.
> 4. ✅ **Interfaz Gráfica Sincronizada**: La aplicación web Next.js (`apps/web`) consume directamente estos endpoints con indicador de estado de MongoDB en vivo y formulario para registrar nuevos libros directamente en la base de datos.

