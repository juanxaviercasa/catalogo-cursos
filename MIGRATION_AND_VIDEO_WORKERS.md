# Migración y operación de trabajadores de vídeo

## Propósito

Este documento permite continuar **Ruta de Aprendizaje Drive** en otro equipo, servidor o proveedor sin rediseñar el flujo de vídeo. La plataforma web conserva el catálogo, el progreso, las importaciones y los metadatos. Los vídeos terminados se sirven desde almacenamiento de objetos; el trabajador usa FFmpeg fuera de la web para procesar solamente los formatos que el navegador no admite.

El repositorio oficial de continuidad indicado para este proyecto es [`juanxaviercasa/catalogo-cursos`](https://github.com/juanxaviercasa/catalogo-cursos). Antes de continuar en otro entorno, parte de la última rama principal de ese repositorio y conserva los secretos fuera del control de versiones.

> La plataforma no almacena vídeos en el navegador ni intenta ejecutar FFmpeg en su hosting web. El ZIP original se mantiene en Google Drive y el resultado reproducible se publica en almacenamiento gestionado.

## Decisión de ruta

Las dos rutas usan exactamente el mismo código, endpoint, tabla `extracted_videos` y estados `queued`, `processing`, `ready` y `failed`. Solo cambia **dónde se ejecuta** `workers/video_processor_service.mjs`.

| Ruta | Selección | Coste de software | Cuándo elegirla | Disponibilidad |
|---|---|---:|---|---|
| Equipo propio | `VIDEO_PROCESSOR_MODE=local-worker` | Gratuito | Procesos puntuales, biblioteca pequeña o control directo. | Requiere que el equipo esté encendido. |
| Servicio persistente | `VIDEO_PROCESSOR_MODE=persistent-worker` | El código es gratuito; la infraestructura depende del proveedor. | Varios ZIP, automatización continua o equipo personal apagado. | Queda disponible mientras el servidor esté activo. |

La web llama a `POST /process` después de importar un ZIP con formatos incompatibles. El servicio valida el secreto compartido y lanza el trabajador. Si no hay servicio configurado o no responde, el vídeo queda en `queued`, se muestra su estado en pantalla y nunca se pierde su ruta original dentro del ZIP.

## Componentes que deben acompañar al traslado

| Recurso | Ubicación | Razón |
|---|---|---|
| Aplicación web | Raíz del repositorio | React, API, autenticación, catálogo y progreso. |
| Esquema y migraciones | `drizzle/` | Tablas de progreso, ZIP, vídeos y pistas. |
| Trabajador de conversión | `workers/local_video_processor.mjs` y `workers/process_queued_video.ts` | Remux H.264/AAC o recodifica formatos incompatibles. |
| Servicio HTTP | `workers/video_processor_service.mjs` | Recibe trabajos desde la web por HTTPS. |
| Configuración de ejemplo | `config/video-processor-platform.env.example` y `workers/video-processor.env.example` | Separa los placeholders de la web y del proceso de FFmpeg. |
| Preferencia de ruta | `video_processing_preferences` | Conserva solo la ruta seleccionada por el administrador, sin credenciales. |
| Servicio persistente | `deploy/video-processor.service.example` | Plantilla de arranque continuo para Linux. |
| Documentación de medios | `VIDEO_PROCESSING_SETUP.md` y `LOCAL_DUBBING_PILOT.md` | Operación de conversión y doblaje. |

Los archivos grandes de vídeo **no** se copian al repositorio. Se conservan en el almacenamiento de objetos y sus rutas se registran en la base de datos.

## Requisitos compartidos

El equipo propio y el servidor persistente deben tener Node.js, pnpm, FFmpeg, FFprobe y `unzip`. Deben poder acceder a Google Drive para descargar ZIP públicos, a la misma base de datos usada por la plataforma y al almacenamiento de objetos que recibirá los MP4.

| Variable | Plataforma web | Trabajador | Función |
|---|---|---|---|
| `VIDEO_PROCESSOR_MODE` | Sí | Sí | `local-worker` o `persistent-worker`. |
| `VIDEO_LOCAL_PROCESSOR_URL` | Sí | No | URL HTTPS de la ruta en equipo propio. |
| `VIDEO_LOCAL_PROCESSOR_SHARED_SECRET` | Sí | No | Secreto de la ruta en equipo propio. |
| `VIDEO_PERSISTENT_PROCESSOR_URL` | Sí | No | URL HTTPS de la ruta persistente. |
| `VIDEO_PERSISTENT_PROCESSOR_SHARED_SECRET` | Sí | No | Secreto de la ruta persistente. |
| `VIDEO_PROCESSOR_SHARED_SECRET` | No | Sí | Secreto que valida solicitudes del servicio seleccionado. |
| `VIDEO_PROCESSOR_PORT` | No | Sí | Puerto en que escucha el servicio de vídeo. |
| `DATABASE_URL` | Sí | Sí | Permite persistir estados y URLs de vídeo. |
| `BUILT_IN_FORGE_API_URL` | Sí | Sí | Acceso al almacenamiento gestionado. |
| `BUILT_IN_FORGE_API_KEY` | Sí | Sí | Credencial privada de almacenamiento. |

> Nunca copies valores reales al repositorio ni al cliente. Usa `workers/video-processor.env.example` únicamente como plantilla y guarda los valores reales en el gestor de secretos del entorno elegido.

`VIDEO_PROCESSOR_PORT` tiene prioridad sobre `PORT`. Esto permite ejecutar el trabajador en el mismo equipo que la plataforma durante pruebas, sin competir con el puerto de la aplicación web.

La plataforma puede conservar los placeholders de las dos rutas al mismo tiempo. El selector administrativo solo persiste cuál ruta queda seleccionada; no guarda ni muestra URL, puerto o secretos. Una ruta se marca activa únicamente cuando su URL HTTPS y secreto privado correspondientes están presentes en el servidor.

La plantilla de servidor está en `config/video-processor-platform.env.example`; la plantilla del proceso que ejecuta FFmpeg está en `workers/video-processor.env.example`. Copia cada una a un archivo privado de su entorno correspondiente y no las subas con valores reales.

## Ruta 1: equipo propio

Primero copia `workers/video-processor.env.example` a un archivo privado fuera del repositorio, completa los valores y cárgalo en tu terminal. Selecciona `VIDEO_PROCESSOR_MODE=local-worker`. Luego, desde la raíz del proyecto, inicia el servicio:

```bash
set -a
source /ruta/privada/video-processor.env
set +a
bash workers/start_local_processor.sh
```

Publica el puerto mediante una URL HTTPS accesible por la plataforma web. Regístrala como `VIDEO_LOCAL_PROCESSOR_URL` y guarda el mismo secreto del trabajador como `VIDEO_LOCAL_PROCESSOR_SHARED_SECRET` en la configuración privada de la web. Después, como administrador, selecciona **Equipo propio** en el panel de conversión del curso. Si apagas el equipo, los trabajos quedan visibles en cola y se procesan en cuanto el servicio vuelva a estar disponible.

## Ruta 2: servicio persistente

En un servidor Linux, copia el proyecto en una ruta de servicio, instala Node.js, pnpm y los binarios de vídeo. Crea un archivo privado, por ejemplo `/etc/curso-drive/video-processor.env`, a partir de `workers/video-processor.env.example` y selecciona `VIDEO_PROCESSOR_MODE=persistent-worker`.

Instala `deploy/video-processor.service.example` como una unidad de servicio, reemplaza el usuario y la ruta del proyecto, y habilítala. El servicio ejecuta el mismo comando `pnpm processor:service`; por tanto, la lógica de conversión y los estados son idénticos a los de la ruta local.

El servicio debe quedar detrás de HTTPS y solo aceptar solicitudes de la plataforma con el secreto compartido. Registra su URL como `VIDEO_PERSISTENT_PROCESSOR_URL` y su secreto como `VIDEO_PERSISTENT_PROCESSOR_SHARED_SECRET` en la configuración privada de la web. Después selecciona **Servicio persistente** en el panel administrativo.

Antes de conectar la aplicación, verifica la disponibilidad sin exponer secretos con `GET https://tu-procesador/health`. La respuesta debe indicar `status: "ok"` y el modo configurado. El endpoint de proceso exige además que el modo recibido coincida con `VIDEO_PROCESSOR_MODE`, de forma que la ruta local y la persistente no se mezclen por error.

El endpoint de salud y la prioridad de `VIDEO_PROCESSOR_PORT` se validaron localmente con un proceso temporal, que respondió `{"status":"ok","mode":"local-worker"}` sin utilizar secretos de producción.

## Flujo de un ZIP nuevo

| Paso | MP4/WebM compatible | MKV/MOV/M4V incompatible |
|---|---|---|
| Importación | Se extrae y publica directamente. | Se registra junto con su `sourcePath` dentro del ZIP. |
| Estado inicial | `ready` | `queued` |
| Disparo | No requiere trabajador. | La plataforma envía el identificador al servicio configurado. |
| Procesamiento | No aplica. | El trabajador recupera la entrada exacta desde el ZIP, analiza códecs y genera un MP4 seguro. |
| Resultado | Reproductor disponible. | `ready` con URL de objeto; o `failed` con un mensaje legible. |

El trabajador conserva H.264/AAC mediante remux cuando es posible. Si los códecs no son aptos para navegador, recodifica a H.264/AAC y utiliza inicio rápido para mejorar el comienzo de reproducción.

## Traslado de la aplicación web

1. Copia el código fuente y ejecuta `pnpm install`.
2. Configura autenticación, `DATABASE_URL` y las credenciales de almacenamiento del nuevo entorno mediante su gestor de secretos.
3. Ejecuta las migraciones de `drizzle/` en orden y verifica las tablas `zip_imports`, `extracted_videos`, `media_tracks` y `video_processing_preferences`.
4. Conserva o migra el contenido del almacenamiento de objetos. La base de datos guarda las URLs y claves que deben seguir resolviendo en el nuevo dominio o capa de almacenamiento.
5. Actualiza los dominios de OAuth y la URL pública de la aplicación.
6. Completa la pareja de URL HTTPS y secreto de una o de las dos rutas en `config/video-processor-platform.env.example`, cárgala mediante el gestor de secretos y arranca el servicio correspondiente.
7. En la ficha de un curso con ZIP, entra como administrador y elige **Equipo propio** o **Servicio persistente**. La selección no expone los valores privados y solo habilita el despacho cuando esa ruta está completamente configurada.
7. Importa un ZIP de prueba. Confirma que MP4/WebM aparecen en `ready`, que los formatos incompatibles pasan por `queued` y que luego llegan a `ready`.

## Verificación operativa

Desde la raíz del proyecto, estas comprobaciones no requieren secretos adicionales:

```bash
pnpm check
pnpm test
node tests/e2e/verify_spanish_player.mjs
pnpm tsx tests/e2e/verify_mkv_fixture_persisted.ts
```

El piloto actual tiene seis vídeos disponibles: un MP4 original y cinco MKV convertidos a MP4. El primer vídeo también conserva su pista de audio español y subtítulos VTT. La prueba E2E confirma metadatos de todos los reproductores y el cambio entre el audio español y el original.

La comprobación del fixture genera un MKV corto, lo incluye en un ZIP temporal y usa un registro temporal real. Verifica en la base de datos la secuencia `queued` → `processing` → `ready`, confirma `mimeType = video/mp4` y comprueba que el MP4 publicado responde desde el almacenamiento gestionado. Al final elimina los metadatos temporales.

## Recuperación y resolución de problemas

| Síntoma | Revisión inicial | Acción segura |
|---|---|---|
| Vídeo queda en `queued` | URL, modo y secreto del trabajador. | Inicia o corrige el servicio; no vuelvas a descargar el ZIP desde el navegador. |
| Vídeo queda en `failed` | Mensaje individual mostrado en la ficha. | Corrige FFmpeg, permisos o acceso a Drive y vuelve a encolarlo. |
| Servicio recibe 401 | Secreto compartido distinto. | Actualiza ambos entornos con el mismo secreto privado. |
| MP4 no reproduce | URL de objeto y códecs. | Reprocesa con el trabajador; los nombres publicados se normalizan para URLs firmadas. |
| Cambio de hosting | Base de datos, almacenamiento, OAuth y variables. | Sigue la lista de traslado anterior antes de cambiar DNS. |

## Límites actuales

La automatización necesita que exista una URL HTTPS real para el trabajador seleccionado. El código ya incluye ambas rutas y mantiene los trabajos pendientes de forma segura, pero no crea infraestructura ni secretos por sí solo. Así se evita publicar credenciales o depender de un equipo que no esté disponible.
