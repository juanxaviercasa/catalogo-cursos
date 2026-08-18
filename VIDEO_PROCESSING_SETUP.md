# Preparación de conversión de vídeo

## Objetivo

La plataforma conserva los archivos MP4 y WebM que ya se reproducen en navegador. Para formatos como MKV, una integración de conversión externa los transforma a MP4 y sube el resultado al almacenamiento gestionado del sitio. El navegador nunca almacena los vídeos de la biblioteca en memoria persistente ni en almacenamiento local.

## Piloto completado

El ZIP público **“01 – Welcome to your new life (YouTube Success)”** ya está preparado. Conserva el MP4 de bienvenida y los cinco MKV se publicaron como MP4 H.264/AAC con inicio rápido para reproducción web. Se registraron como `ready`, con `sourceMimeType = video/x-matroska` y `wasTranscoded = true`; por eso la interfaz puede mostrar seis vídeos disponibles y distinguir el material convertido del que era compatible desde el inicio.

| Resultado | Cantidad | Verificación |
|---|---:|---|
| MP4 original conservado | 1 | Reproductor, selector inglés/español y subtítulos VTT del primer módulo. |
| MKV remuxados a MP4 | 5 | Metadatos cargados en navegador desde el almacenamiento gestionado. |
| Vídeos preparados disponibles | 6 | `readyState = 4` y duración positiva para cada reproductor. |

Los objetos publicados usan nombres normalizados sin espacios ni signos de puntuación problemáticos. Esto evita errores de firma de URL al servir los archivos desde el almacenamiento gestionado.

## Trabajador local gratuito

El proyecto incluye `workers/local_video_processor.mjs`. El trabajador inspecciona los códecs con FFprobe y decide el menor trabajo necesario. Si encuentra vídeo H.264 y audio AAC, solo cambia el contenedor a MP4; en cualquier otro caso, recodifica a H.264/AAC y añade `+faststart`. El resultado siempre usa un nombre de objeto seguro para publicar.

```bash
node workers/local_video_processor.mjs \
  "/ruta/video.mkv" \
  "/ruta/salida"
```

Para completar la transición y el registro sin pasos manuales, ejecuta `workers/process_queued_video.ts` sobre un registro en cola. El trabajador pasa el vídeo por `queued` → `processing` → `ready`, sube el MP4 a almacenamiento gestionado, registra su URL y tamaño, y deja `failed` con el mensaje de error si la conversión no termina.

```bash
pnpm tsx workers/process_queued_video.ts \
  --video-id 30003 \
  --output-dir "/ruta/temporal/de/salida"
```

Sin `--input`, el trabajador descarga el ZIP público asociado, extrae únicamente la entrada registrada para el trabajo y la borra al terminar. Si el archivo ya está disponible en el equipo, `--input "/ruta/al/archivo.mkv"` evita esa descarga. En ambos casos, el resultado se publica en el almacenamiento gestionado y actualiza el mismo registro del vídeo.

En el piloto se ejercitó este recorrido con el módulo “04 – Traditional VS Faceless Channels”: el registro pasó a `queued`, el trabajador recuperó el MKV automáticamente desde el ZIP de Drive, lo remuxó a MP4 y terminó `ready` con una URL nueva y segura en el almacenamiento gestionado. La interfaz mostró de forma individual el vídeo en cola y su mensaje antes de que volviera a estar disponible. Los MP4/WebM compatibles no ingresan en cola: el importador los conserva directamente como `ready`.

## Rutas disponibles

| Ruta | Coste | Cuándo usarla | Qué debes completar |
|---|---:|---|---|
| Equipo propio | Gratuita | Biblioteca pequeña o conversiones puntuales. El equipo debe permanecer encendido durante el trabajo. | Instalar FFmpeg y ejecutar el trabajador de conversión con la URL y secreto configurados. |
| Máquina de procesamiento persistente | Opcional de pago | Varias conversiones, automatización continua o equipo personal apagado. | Proveer una máquina con FFmpeg, URL HTTPS y secreto compartido. |
| Proveedor gestionado | Opcional de pago | Si se prefiere no administrar una máquina. | Elegir proveedor, definir sus credenciales como secretos y conectar su API. |

## Variables placeholder

No se han guardado credenciales en el proyecto. Cuando se active una ruta, agrega los valores por la gestión segura de secretos del proyecto:

| Variable | Uso | Valor inicial placeholder |
|---|---|---|
| `VIDEO_PROCESSOR_MODE` | Selecciona la ruta activa. | `local-worker`, `persistent-worker` o `managed-provider` |
| `VIDEO_PROCESSOR_URL` | Endpoint HTTPS del trabajador. | `https://REEMPLAZAR-PROCESADOR.example/process` |
| `VIDEO_PROCESSOR_SHARED_SECRET` | Protege las solicitudes y callbacks entre servicios. | `REEMPLAZAR_CON_UN_SECRETO_LARGO` |

El trabajador local validado sirve para conversiones puntuales sin coste. La automatización continua de futuros ZIP requiere conectar ese trabajador o una máquina con FFmpeg mediante las variables anteriores; el sitio publicado no intenta ejecutar FFmpeg dentro del navegador ni depende de memoria local.

Cuando `VIDEO_PROCESSOR_URL` y `VIDEO_PROCESSOR_SHARED_SECRET` están configuradas, cada importación llama al endpoint `POST /process` del trabajador por cada vídeo que quede en `queued`. El servicio de referencia `workers/video_processor_service.mjs` valida ese secreto, acepta el trabajo y ejecuta `process_queued_video.ts` en segundo plano. Si el servicio no está configurado o no responde, el vídeo permanece en cola con un estado visible; no se pierde el acceso a su ZIP original ni se bloquea la importación de los MP4/WebM compatibles.

Para poner en marcha el servicio externo, se debe ejecutar en una máquina que tenga Node.js, FFmpeg, FFprobe, `unzip`, las credenciales del almacenamiento y acceso a la misma base de datos. El servicio no debe exponerse sin HTTPS ni sin un secreto compartido largo. El modelo gratuito es ejecutarlo en el propio equipo mientras se convierten cursos; para una biblioteca que requiere procesamiento aun con el equipo apagado, se debe desplegar el mismo servicio en una máquina Linux persistente.

## Publicación en hosting

La web puede estar en hosting integrado o en un proveedor externo. En ambos casos, los vídeos convertidos deben seguir almacenados en el almacenamiento de objetos gestionado y la aplicación debe conservar su backend para generar rutas firmadas, registrar progreso y recibir estados de procesamiento. No copies los vídeos al hosting estático ni al navegador.
