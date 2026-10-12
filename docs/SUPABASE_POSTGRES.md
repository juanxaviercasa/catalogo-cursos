# Migración de `catalogo-cursos` a Supabase PostgreSQL

## Estado

- El esquema Drizzle activo está migrado a PostgreSQL en `drizzle/schema.ts`.
- La migración inicial generada está en `drizzle/postgres/` y crea las 10 tablas, enums, claves foráneas e índices del esquema actual; además habilita RLS en las tablas públicas, sin políticas para acceso directo desde el navegador.
- El historial de migraciones MySQL previo se conserva en `drizzle/`; no se ejecuta contra Supabase.
- **La migración creada solo inicializa el esquema; no copia datos de una base MySQL existente.** No se ha conectado ni escrito en el proyecto Supabase desde este cambio.

## Aplicar el esquema

1. En el proveedor de despliegue, guarda `DATABASE_URL` como secreto del backend con la cadena PostgreSQL del proyecto Supabase. No la añadas al repositorio, a un artefacto del frontend ni a `VITE_*`.
2. Desde un entorno seguro con la URL configurada, ejecuta `pnpm db:migrate`. Ese comando aplica las migraciones revisadas de `drizzle/postgres/` sin regenerarlas.
3. `pnpm db:generate` es para crear una nueva migración cuando cambie el esquema; revisa y versiona el SQL antes de aplicarlo.
4. No ejecutes `pnpm db:push` como despliegue de producción: ese comando también genera migraciones.

La aplicación Node usa `pg`/Drizzle directamente; para esta conexión no necesita la clave `service_role` ni la clave pública de Supabase. Nunca expongas una clave privilegiada en el navegador.

## Datos existentes

La migración inicial no importa filas del antiguo MySQL. Si la base antigua contiene usuarios, progreso, importaciones o metadatos, antes del cambio definitivo se necesita una exportación consistente y una rutina de copia/verificación de tablas. No apuntes producción a la base nueva vacía hasta decidir qué datos deben conservarse y validar los recuentos. Los archivos de vídeo/PDF no están en estas tablas y deben migrarse por separado desde el almacenamiento que los contiene.

## Publicación de la aplicación

GitHub Pages no puede ejecutar el backend Express ni `/api/trpc`. Para la biblioteca completa se necesita un host Node.js para el mismo proyecto; el comando de producción del repo es `pnpm build` seguido de `pnpm start`. La interfaz usa `/api/trpc` en el mismo origen, así que conviene publicar frontend y backend bajo el mismo dominio/origen o configurar expresamente un proxy.

El acceso actual usa el flujo OAuth de Manus, no Supabase Auth. La configuración del despliegue debe conservar el portal OAuth y su API (`VITE_OAUTH_PORTAL_URL` y `OAUTH_SERVER_URL`) o acordar y desarrollar un cambio de proveedor de autenticación. En producción también se requieren `JWT_SECRET` (32 caracteres aleatorios como mínimo), `OWNER_OPEN_ID` y `DATABASE_URL`; el servidor rechaza ahora el login directo de desarrollo en producción.

El worker de vídeo es un proceso separado (`pnpm processor:service`). El alojamiento debe ejecutarlo si se requieren esas funciones. El almacenamiento local no es duradero en muchos hosts de contenedores; para archivos persistentes hace falta configurar almacenamiento S3 compatible y migrar allí los objetos existentes.
