# Preparación de conversión de vídeo

## Objetivo

La plataforma conserva los archivos MP4 y WebM que ya se reproducen en navegador. Para formatos como MKV, una integración de conversión externa los transforma a MP4 y sube el resultado al almacenamiento gestionado del sitio. El navegador nunca almacena los vídeos de la biblioteca en memoria persistente ni en almacenamiento local.

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

## Publicación en hosting

La web puede estar en hosting integrado o en un proveedor externo. En ambos casos, los vídeos convertidos deben seguir almacenados en el almacenamiento de objetos gestionado y la aplicación debe conservar su backend para generar rutas firmadas, registrar progreso y recibir estados de procesamiento. No copies los vídeos al hosting estático ni al navegador.
