# ADR-001: Usar la API publicada de libros desde el portal web

## Estado
Aceptado

## Contexto

El portal web tenía rutas que conectaban directamente con MongoDB, además de consumir una API externa. Esto duplicaba la capa de acceso a datos, exponía responsabilidades de persistencia en la aplicación web y obligaba a configurar credenciales de base de datos para compilar o ejecutar el frontend.

## Decisión

El portal web usará exclusivamente la API publicada de libros a través del proxy interno `/api/backend/[...path]`. Las credenciales de la API se mantienen en variables de entorno del servidor y nunca se envían al navegador.

Se eliminan del frontend las rutas directas de MongoDB y el driver `mongodb` como dependencia de `apps/web`.

## Alternativas consideradas

### Mantener el acceso directo y la API externa

Rechazada porque mantiene dos fuentes de verdad y dos contratos de persistencia para el mismo catálogo.

### Conectar el navegador directamente con la API externa

Rechazada porque expondría la clave de API al cliente y dificultaría controlar encabezados, errores y políticas de acceso.

## Consecuencias

- `apps/web` solo requiere `LIBROS_API_URL`, `LIBROS_API_KEY` y la configuración opcional del encabezado.
- La API externa es la única responsable del acceso a datos.
- El proxy de Next.js centraliza la autenticación de las solicitudes y evita exponer secretos.
- Las rutas locales de MongoDB dejan de estar disponibles; cualquier consumidor debe usar el contrato de la API publicada.
