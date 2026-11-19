# Avance 3 · Biblioteca Virtual Eclesiástica (Zenit)

**Fase 3: interfaz de usuario e integración con la base de datos NoSQL en la nube** **Equipo:** Zenit · **Integrantes:** \[lopez hu Jose yael - Zapata Paredes Luiz Yael - Manzanilla Bass Emmanuel] · **Fecha oficial de revisión en aula:** 19 de noviembre de 2026

## 1. Objetivo de la fase

Desarrollar, demostrar e integrar la interfaz de usuario (Frontend/Móvil) con la base de datos NoSQL remota (MongoDB Atlas). El equipo presenta un buscador con filtros dinámicos avanzados y un módulo administrativo que consumen las APIs del backend de forma eficiente, controlando el pool de sockets de red y optimizando la transferencia de datos desde la nube.

El trabajo se organizó en 4 fases con 12 hitos. Cada fase corresponde a uno de los cuatro criterios de la rúbrica (25 % cada uno).

## 2. Resumen de fases e hitos

| Fase | Hito | Entregable | Criterio de la rúbrica |
| --- | --- | --- | --- |
| 1. Frontend y UI/UX | 1.1 | Layout adaptable (Responsive Design) | Diseño de interfaz adaptable |
| 1. Frontend y UI/UX | 1.2 | Tarjetas de libros y visor de texto | Diseño de interfaz adaptable |
| 1. Frontend y UI/UX | 1.3 | Barra de navegación inferior | Diseño de interfaz adaptable |
| 2. Buscador y paginación | 2.1 | Inputs y filtros dinámicos combinados | Filtros dinámicos del buscador |
| 2. Buscador y paginación | 2.2 | Consultas NoSQL por palabras clave | Filtros dinámicos del buscador |
| 2. Buscador y paginación | 2.3 | Paginación de red con `limit` y `skip` | Filtros dinámicos del buscador |
| 3. Módulo administrativo | 3.1 | Ruta protegida de administración | Módulo de administración |
| 3. Módulo administrativo | 3.2 | Conexión con la colección de metadatos de control | Módulo de administración |
| 3. Módulo administrativo | 3.3 | Indicadores y gráficos de progreso | Módulo de administración |
| 4. Cloud y resiliencia | 4.1 | Patrón Singleton para el Connection Pool | Integración y resiliencia cloud |
| 4. Cloud y resiliencia | 4.2 | Manejo de excepciones de red (Try-Catch) | Integración y resiliencia cloud |
| 4. Cloud y resiliencia | 4.3 | Alertas de interrupción en la interfaz | Integración y resiliencia cloud |

## 3. Fase 1: Desarrollo del Frontend y Experiencia de Usuario (UI/UX)

Esta fase se centra en la construcción visual de la aplicación, garantizando que la interfaz sea adaptable y cómoda para la lectura de los textos históricos.

### Hito 1.1: Diseño del layout adaptable (Responsive Design)

**Evento:** estructuración de las vistas principales con maquetación flexible (Flexbox/Grid) para lograr una visualización impecable tanto en dispositivos móviles como en pantallas de escritorio.

**Cómo se resuelve:**

- CSS Grid para el esqueleto de cada vista (cabecera, contenido y barra inferior) y Flexbox para alinear los elementos dentro de cada componente.
- Unidades relativas (`rem`, `%`, `fr`) y puntos de quiebre con `media queries`: móvil (menos de 600 px), tableta (600 a 1024 px) y escritorio (más de 1024 px).
- Cuadrícula de libros que se ajusta sola al ancho disponible, por ejemplo `repeat(auto-fill, minmax(150px, 1fr))`: 2 columnas en un teléfono y más columnas en una pantalla grande.
- Zonas táctiles de al menos 44 px para botones y enlaces.

**Evidencia en la demostración:** la aplicación en el simulador móvil y en una ventana de escritorio, a la vez. \[Insertar captura\]

### Hito 1.2: Implementación de tarjetas de libros y visor de texto

**Evento:** creación de componentes reutilizables (cards) para desplegar dinámicamente las portadas de los libros y desarrollo de un visor de texto plano optimizado para una lectura fluida.

**Cómo se resuelve:**

- Un solo componente de tarjeta que recibe portada, título, fecha, iglesia de origen y tipo de libro, y se genera a partir de la respuesta JSON de la API.
- Carga diferida de las imágenes (`lazy loading`) con un marcador mientras llega la portada.
- Visor de texto plano con tipografía legible (16 a 18 px), interlineado de 1.5 a 1.6 y ancho de línea limitado para no cansar la vista.
- El texto se pide por capítulo o página, no el libro completo, para que la lectura sea fluida en el teléfono.

**Evidencia en la demostración:** abrir un libro desde su tarjeta y leer su texto plano indexado. \[Insertar captura\]

### Hito 1.3: Integración de la barra de navegación inferior (Bottom Navigation)

**Evento:** programación de la barra de navegación interactiva para permitir el cambio rápido y sin recargas entre las vistas principales: Inicio, Biblioteca y Ajustes.

**Cómo se resuelve:**

- Barra fija en la parte inferior con tres destinos: Inicio, Biblioteca y Ajustes.
- Navegación del lado del cliente (aplicación de una sola página): al cambiar de vista solo se intercambia el contenido, sin recargar el documento.
- Indicador visual de la pestaña activa y etiquetas accesibles en cada ícono.

**Evidencia en la demostración:** cambiar entre las tres vistas con la pestaña de red del navegador abierta, donde se observa que no hay recarga de la página. \[Insertar captura\]

## 4. Fase 2: Implementación del buscador avanzado y paginación

Aquí se conecta la interfaz con el backend para procesar consultas complejas de forma rápida y segura sin afectar el rendimiento del cliente.

### Hito 2.1: Desarrollo de inputs y filtros dinámicos combinados

**Evento:** creación de los selectores en la interfaz para filtrar los libros simultáneamente por metadatos: fecha, iglesia de origen y tipo de libro.

**Cómo se resuelve:**

- Un campo de búsqueda de texto y tres filtros: rango de fechas, iglesia de origen y tipo de libro. Todos se combinan entre sí (condición Y).
- Los valores viajan al backend como parámetros de consulta, por ejemplo `?q=palabra&iglesia=...&tipo=...&desde=1850&hasta=1950&page=1`.
- La búsqueda se lanza tras una breve pausa al escribir (`debounce` de 300 ms) para no saturar la red.
- Botón para limpiar filtros, y al cambiar cualquier filtro la lista vuelve a la página 1.

**Evidencia en la demostración:** aplicar dos o tres filtros a la vez y ver cómo cambia la lista al instante. \[Insertar captura\]

### Hito 2.2: Programación de consultas NoSQL por palabras clave

**Evento:** escritura de las rutas en el backend con operadores de búsqueda avanzada e índices de texto para localizar términos exactos dentro de los capítulos de los documentos.

**Cómo se resuelve:**

- Índice de texto sobre el campo que contiene el texto de capítulos y páginas. Con `default_language='none'` no se aplica derivación de palabras (stemming), de modo que el término buscado coincide de forma exacta.
- Consulta con `$text` y `$search`; poniendo el término entre comillas dobles se busca la frase exacta.
- Los filtros de metadatos se combinan en el mismo `find`, y se ordena por relevancia con `textScore`.
- Índices adicionales sobre fecha, iglesia y tipo para que los filtros sean rápidos.
- Los parámetros recibidos se tratan siempre como texto, nunca como objetos, para evitar la inyección de operadores NoSQL.

```python
coleccion.create_index([('texto', 'text')], default_language='none')

filtro = {'$text': {'$search': '"palabra exacta"'}}
if iglesia:
    filtro['iglesia_origen'] = iglesia
if tipo:
    filtro['tipo_libro'] = tipo

cursor = coleccion.find(filtro, {'puntaje': {'$meta': 'textScore'}})
cursor = cursor.sort([('puntaje', {'$meta': 'textScore'})])
```

**Evidencia en la demostración:** buscar una palabra del texto y mostrar en Atlas, pestaña Collections, el documento que la contiene. \[Insertar captura\]

### Hito 2.3: Configuración del sistema de paginación de red

**Evento:** implementación de límites y saltos (`limit` / `skip`) en las consultas para entregar los datos en bloques controlados y evitar el desbordamiento de memoria en la aplicación móvil.

**Cómo se resuelve:**

- Tamaño de página fijo (por ejemplo 10 o 20 resultados) con un máximo validado en el servidor, para que nadie pueda pedir todo de una vez.
- Salto calculado como `skip = (pagina - 1) * limite`, con un orden estable (relevancia y luego `_id`) para que no se repitan ni se salten resultados.
- La respuesta incluye `total`, `pagina`, `paginas` e `items`, y la interfaz agrega la siguiente página con un botón “Cargar más” o al llegar al final del scroll.

```python
limite = min(int(limite), 50)
skip = (max(int(pagina), 1) - 1) * limite
items = list(cursor.skip(skip).limit(limite))
total = coleccion.count_documents(filtro)
```

**Evidencia en la demostración:** una búsqueda con muchos resultados que llega por bloques, y la respuesta de red con solo 10 o 20 elementos. \[Insertar captura\]

## 5. Fase 3: Creación del módulo administrativo y métricas logísticas

Esta fase dota al sistema de un panel de control exclusivo para supervisar el avance de la digitalización y el rendimiento del equipo de trabajo.

### Hito 3.1: Creación de la ruta protegida de administración

**Evento:** configuración de los niveles de acceso y de la vista de interfaz exclusiva para administradores dentro de la arquitectura de la aplicación.

**Cómo se resuelve:**

- Dos roles: lector y administrador. La vista `/admin` solo existe para el administrador, y a cualquier otro usuario se le redirige.
- La protección real está en el backend: cada endpoint de administración valida el rol en cada petición y responde 401 (sin sesión) o 403 (sin permiso). Ocultar el botón en la interfaz no basta.
- Las credenciales de conexión viven en variables de entorno (`.env`), fuera del código y del repositorio.

**Evidencia en la demostración:** entrar como administrador y como lector, y mostrar que el segundo no puede acceder al panel. \[Insertar captura\]

### Hito 3.2: Conexión con la colección de metadatos de control

**Evento:** enlace del panel administrativo con la base de datos NoSQL para extraer los registros en tiempo real sobre el estado de escaneo de los documentos.

**Cómo se resuelve:**

- Una colección de control con un documento por integrante, por ejemplo: `{ integrante, libros_escaneados, meta_individual, ultima_actualizacion }`, y la meta global de producción del equipo.
- Un endpoint de solo lectura para administradores, por ejemplo `GET /api/admin/progreso`, que calcula el total acumulado con una agregación (`$group` con `$sum`).
- El panel se actualiza de forma periódica (cada 10 segundos) o con Change Streams de Atlas, de modo que refleje el estado real del escaneo.

**Evidencia en la demostración:** actualizar un registro en Atlas, pestaña Collections, y ver el cambio reflejado en el panel. \[Insertar captura\]

### Hito 3.3: Renderizado de indicadores y gráficos de progreso

**Evento:** desarrollo de componentes visuales (como barras de porcentaje o contadores) que miden de manera transparente el avance individual de cada integrante frente a la meta global de producción.

**Cómo se resuelve:**

- Una barra de porcentaje por integrante (escaneados entre meta individual) y un contador acumulado frente a la meta global.
- Un gráfico de barras que compara a los integrantes entre sí.
- Transparencia: se muestra la fecha de última actualización y de dónde sale cada cifra.

| Integrante | Libros escaneados | Meta individual | Avance |
| --- | --- | --- | --- |
| \[Integrante 1\] | \[n\] | \[n\] | \[%\] |
| \[Integrante 2\] | \[n\] | \[n\] | \[%\] |
| \[Integrante 3\] | \[n\] | \[n\] | \[%\] |
| **Total del equipo** | \[n\] | \[meta global\] | \[%\] |

**Evidencia en la demostración:** el panel con las barras y los contadores del equipo. \[Insertar captura\]

## 6. Fase 4: Optimización cloud, patrón Singleton y resiliencia de red

Es la etapa de blindaje técnico de la infraestructura, asegurando la estabilidad de las conexiones concurrentes hacia la nube y la tolerancia a fallos.

### Hito 4.1: Aplicación del patrón Singleton para el Connection Pool

**Evento:** configuración centralizada del cliente de conexión a MongoDB para garantizar que se inicialice una sola vez y reutilice el mismo pool de sockets TCP/TLS, evitando saturar el servidor.

**Cómo se resuelve:**

- Un único módulo de conexión con una función `get_client()` que crea el `MongoClient` la primera vez y después devuelve siempre el mismo.
- Todas las rutas del backend usan esa función; ninguna crea su propio cliente por petición.
- El tamaño del pool se configura con `maxPoolSize` y `minPoolSize`, y la URI se lee desde `.env`.

```python
import os
import threading
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()
_cliente = None
_candado = threading.Lock()


def get_client():
    # Devuelve siempre el mismo MongoClient (Singleton) y su pool de conexiones
    global _cliente
    if _cliente is None:
        with _candado:
            if _cliente is None:
                _cliente = MongoClient(
                    os.getenv('DATABASE_URL'),
                    tls=True,
                    maxPoolSize=20,
                    minPoolSize=2,
                    serverSelectionTimeoutMS=5000,
                    retryWrites=True,
                )
    return _cliente
```

**Evidencia en la demostración:** lanzar varias peticiones HTTP concurrentes desde la aplicación y mostrar en Atlas que el número de conexiones activas se mantiene estable. \[Insertar captura\]

### Hito 4.2: Implementación de manejo de excepciones de red (Try-Catch)

**Evento:** envolvimiento de las llamadas asíncronas en bloques de control robustos para capturar errores críticos de conectividad, como el `ServerSelectionTimeoutError`.

**Cómo se resuelve:**

- Cada consulta a la base de datos va dentro de un `try/except` que atrapa `ServerSelectionTimeoutError` y, como red de seguridad, `PyMongoError`.
- El backend responde con un código 503 y un mensaje claro en JSON, sin trazas internas ni datos de la conexión. El detalle técnico se guarda solo en el registro del servidor.
- En el cliente, cada petición tiene un tiempo límite (por ejemplo 8 segundos) y hasta 2 reintentos con espera creciente.

```python
from pymongo.errors import ServerSelectionTimeoutError, PyMongoError

try:
    items = list(cursor.skip(skip).limit(limite))
except ServerSelectionTimeoutError:
    return {'error': 'sin_conexion',
            'mensaje': 'No pudimos conectar con la biblioteca. Intenta de nuevo en unos segundos.'}, 503
except PyMongoError:
    return {'error': 'error_base_datos',
            'mensaje': 'Ocurrió un problema al consultar los libros.'}, 500
```

**Evidencia en la demostración:** provocar el fallo (por ejemplo, desconectando la red) y mostrar que el backend responde 503 en lugar de caerse. \[Insertar captura\]

### Hito 4.3: Diseño de alertas de interrupción en la interfaz de usuario

**Evento:** programación de notificaciones visuales y elegantes en la pantalla del usuario para reportar problemas de red en tiempo real, evitando que la aplicación sufra un bloqueo total.

**Cómo se resuelve:**

- Un aviso no bloqueante (banner o toast) con mensajes distintos para “sin internet” y “servidor no disponible”, y un botón “Reintentar”.
- La interfaz conserva el último contenido cargado en lugar de quedar en blanco, y distingue tres estados: cargando, sin resultados y error.
- El aviso desaparece solo cuando la conexión se recupera.

**Evidencia en la demostración:** cortar la conexión, ver el aviso en pantalla sin que la aplicación se cierre, restaurarla y ver cómo se recupera. \[Insertar captura\]

## 7. Módulo de demostración en el aula

La calificación se asigna estrictamente según lo que el equipo demuestre en su laptop. Antes de solicitar la revisión deben estar abiertos y listos estos 3 elementos al mismo tiempo:

| Elemento | Qué debe estar abierto | Qué se muestra |
| --- | --- | --- |
| Dispositivo móvil o simulador | La aplicación corriendo de forma local o desplegada, conectada a la red | Interfaz completa: tarjetas, visor, barra inferior, buscador y panel de administración |
| IDE o consola | El código de la interfaz y las rutas de consumo de la API | Componentes, llamadas a la API, `get_client()` y los bloques `try/except` |
| Navegador web | MongoDB Atlas en la pestaña Collections | Cómo las búsquedas impactan los datos y cómo el pool mantiene estables las conexiones |

**Guión sugerido (8 a 10 minutos):**

1. Mostrar la aplicación en el simulador móvil y en escritorio, y navegar con la barra inferior (hitos 1.1 a 1.3).
2. Abrir un libro desde su tarjeta y leer el texto en el visor (hito 1.2).
3. Buscar una palabra con filtros combinados y cargar más resultados por bloques (hitos 2.1 a 2.3).
4. Entrar al panel de administración y mostrar el avance de cada integrante frente a la meta (hitos 3.1 a 3.3).
5. Lanzar peticiones concurrentes y mostrar en Atlas que las conexiones no se multiplican (hito 4.1).
6. Cortar la conexión y mostrar la alerta amigable sin que la aplicación colapse (hitos 4.2 y 4.3).

## 8. Matriz de cumplimiento con la rúbrica

| Criterio (25 % c/u) | Hitos | Qué se demuestra para el nivel Excelente |
| --- | --- | --- |
| Diseño de interfaz adaptable | 1.1, 1.2, 1.3 | Interfaz elástica y consistente en varias resoluciones móviles, navegación fluida y visor de texto optimizado |
| Filtros dinámicos del buscador | 2.1, 2.2, 2.3 | Filtros por metadatos y palabras clave con operadores NoSQL e índices de texto, de forma instantánea y paginada |
| Módulo de administración | 3.1, 3.2, 3.3 | Panel analítico transparente con el avance individual de escaneo frente a las metas, con datos reales de la colección de control |
| Integración y resiliencia cloud | 4.1, 4.2, 4.3 | Un solo pool de conexiones (Singleton), credenciales protegidas y manejo elegante de las excepciones de red en la interfaz |

## 9. Lista de verificación antes de la revisión

- [ ] La aplicación abre sin errores en el simulador móvil y en escritorio.
- [ ] Los datos de ejemplo (libros, textos y registros de control) están cargados en Atlas.
- [ ] El índice de texto y los índices de metadatos están creados.
- [ ] El `.env` está configurado y no está en el repositorio.
- [ ] Atlas está abierto en Collections y tu IP está autorizada.
- [ ] Se ensayó el corte de red y la alerta se muestra bien.
- [ ] Las capturas de evidencia están insertadas en este documento.
