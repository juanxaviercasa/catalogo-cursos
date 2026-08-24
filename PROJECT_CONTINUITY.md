# Continuidad técnica — Ruta de Aprendizaje Drive

## Propósito y estado actual

La plataforma convierte las bibliotecas compartidas de Google Drive y Terabox en una biblioteca de **110 cursos registrados** agrupados en siete rutas pedagógicas: 31 de Google Drive y 79 de Terabox. En Terabox, cuatro cursos ya tienen estructura interna verificada y los demás conservan un acceso provisional a la carpeta original mientras continúa la inspección profunda. El contenido fuente permanece en Drive o Terabox, mientras que el catálogo, las rutas, el avance del usuario y la preparación de medios se gestionan desde la aplicación.

| Área | Estado actual | Decisión principal |
|---|---|---|
| Catálogo y navegación | Operativo | El inventario estructurado de Drive alimenta las 25 fichas y sus módulos ordenados. |
| Cofre del Emprendedor · Kinobody | Operativo | Seis cursos incorporados en la ruta Salud y Rendimiento; los módulos enlazan a las carpetas de programa de Drive. |
| Progreso | Operativo | El progreso por módulo, curso y ruta se guarda por usuario en la base de datos. |
| Vídeos disponibles en Drive | Operativo | Los MP4 compatibles se pueden visualizar mediante el visor embebido de Drive. |
| Importación de ZIP | Operativo para formatos web | El ZIP original no se modifica; MP4/WebM compatibles se copian al almacenamiento gestionado para reproducción desde la plataforma. |
| ZIP piloto | Operativo | Seis vídeos reproducibles: un MP4 original y cinco MKV convertidos a MP4 en almacenamiento gestionado. |
| Conversión de formatos | Operativa y seleccionable | MP4/WebM se conservan; los formatos incompatibles se encolan y pueden procesarse en equipo propio o servicio persistente. |
| Doblaje inglés→español | Piloto operativo | El primer módulo tiene MP4 doblado, subtítulos VTT y selector de idioma. |
| PDF bilingüe inglés→español | Piloto operativo | El Main Guide de Aggressive Fat Loss 2.0 ofrece comparación, lectura española y PDF reconstruido; el original permanece en Drive. |

## Arquitectura vigente

La aplicación usa React y TypeScript en el cliente, procedimientos tipados en el servidor, autenticación de usuarios y una base de datos relacional. Los bytes de vídeo no se guardan en la base de datos: el almacenamiento de objetos conserva el archivo y las tablas solo registran su clave, URL, formato y tamaño.

| Componente | Responsabilidad | Persistencia |
|---|---|---|
| `module_progress` | Módulos completados por usuario. | Base de datos. |
| `zip_imports` | Estado de cada archivo ZIP preparado. | Base de datos. |
| `extracted_videos` | Metadatos y URL de vídeos ya extraídos. | Base de datos + almacenamiento de objetos. |
| `pdf_translations` | Estado y URL del documento español reconstruido. | Base de datos + almacenamiento de objetos. |
| `pdf_translation_segments` | Texto fuente y traducción por página. | Base de datos. |
| `/manus-storage/` | Entrega mediante redirección firmada. | Almacenamiento de objetos. |
| Google Drive | Fuente original, carpeta y archivos de curso. | Externo. |
| Terabox | Fuente original, carpetas de curso y archivos compartidos. | Externo; puede requerir sesión y permisos de la cuenta. |

> **Regla de almacenamiento:** no guardar vídeos en Local Storage, IndexedDB ni archivos públicos de la aplicación. El navegador solo consume una URL de reproducción; los archivos viven fuera de él.

## Importación y conversión de ZIP

La primera importación descarga el ZIP público una única vez desde Drive, valida rutas y límites, conserva el original sin cambios y prepara los medios compatibles. La reproducción posterior de un vídeo preparado no vuelve a consumir la descarga de Drive.

| Escenario | Tratamiento actual | Siguiente paso |
|---|---|---|
| MP4/WebM | Se preserva y se sube directamente al almacenamiento gestionado. | Mantener este comportamiento. |
| MKV/MOV/M4V | Se registra como `queued` con su ruta dentro del ZIP. | El trabajador seleccionado lo recupera, convierte y publica como MP4. |
| ZIP mayor de 350 MB | Se rechaza para proteger la aplicación. | Ajustar el límite solo con capacidad de procesamiento suficiente. |
| Archivo privado de Drive | No se puede leer con el enlace público actual. | Activar una integración de Drive de solo lectura. |

## Doblaje inglés → español

Para vídeos de cursos ya grabados, la solución recomendada no es traducir cada segundo en el navegador. Es más robusto generar una **pista de audio española asíncrona** y conservar la pista original. El reproductor debe permitir elegir `Original`, `Español` y `Subtítulos en español`.

| Etapa | Resultado | Detalle de sincronización |
|---|---|---|
| 1. Extraer y analizar audio | Audio fuente y detección de idioma/hablantes. | Mantener duración original y segmentos temporales. |
| 2. Transcribir | Guion inglés con marcas de tiempo. | Usar segmentos y, cuando sea posible, marcas por palabra. |
| 3. Traducir | Guion español editable. | Conservar el intervalo de cada segmento. |
| 4. Sintetizar voz neural | Fragmentos de audio español. | Ajustar ritmo y pausas para caber en el intervalo. |
| 5. Mezclar y publicar | Pista de audio española, subtítulos VTT y estado del trabajo. | El vídeo permanece; solo se selecciona otra pista. |

La preparación es un **trabajo asíncrono**. En la primera solicitud se muestran el vídeo original y subtítulos traducidos cuando estén disponibles; cuando termine el doblaje, se habilita la pista española. Esto evita bloquear la reproducción y permite revisar el guion antes de publicar audio definitivo.

## Opciones de integración

| Enfoque | Ventajas | Limitaciones | Uso recomendado |
|---|---|---|---|
| Local: faster-whisper + Argos Translate + Piper + FFmpeg | Sin coste por minuto de API; control de datos; funciona con un equipo propio. | El equipo debe permanecer encendido; requiere instalación, potencia de cómputo y revisión humana de calidad. | Pilotos, biblioteca pequeña y aprendizaje técnico. |
| Google Cloud STT + Translate + TTS | Voces neuronales, síntesis de audio extensa y cuota gratuita de TTS para ciertas voces. | Es una cadena de varios servicios; exige implementar sincronización y mezcla. | Alternativa modular con coste inicial bajo. |
| Azure Speech Translation + TTS | Traducción de voz a voz con salida sintetizada de baja latencia; adecuado para interacción o flujos en directo. | Requiere combinar servicios y controlar costes de transcripción/traducción/síntesis. | Futuro modo de interpretación o traducción de audio más inmediata. |
| ElevenLabs Dubbing | API de doblaje directo de audio/vídeo, detección de varios hablantes, preservación de fondo y soporte de inglés/español. | Servicio de pago por minutos; su flujo de doblaje automático es asíncrono y la versión v2 sigue en alpha. | Alternativa opcional cuando la ruta local no alcance la calidad o velocidad necesarias. |

### Recomendación práctica

La primera prueba debe usar la **ruta local gratuita** para validar la calidad de transcripción, traducción y voz en el curso piloto. Las APIs externas se activan únicamente si se necesita mayor velocidad, calidad consistente o automatización a escala. Google Cloud y Azure quedan como alternativas modulares opcionales; **ElevenLabs queda como última opción opcional**, útil para un doblaje integral de cursos grabados si se acepta su coste. ElevenLabs documenta que su API admite doblaje de vídeo y audio, incluyendo inglés y español, pero también especifica que el doblaje en tiempo real no está disponible; por tanto, no debe prometerse como traducción instantánea de un vídeo ya iniciado.[1]

## Contratos y secretos pendientes

Los valores se deben añadir exclusivamente a la configuración segura del servidor cuando se seleccione un proveedor. No se deben escribir en el código ni enviar al navegador.

| Variable | Finalidad |
|---|---|
| `VIDEO_PROCESSOR_MODE` | Ruta para transcodificación de formato: equipo propio, trabajador persistente o proveedor. |
| `VIDEO_PROCESSOR_URL` | URL HTTPS del trabajador de conversión. |
| `VIDEO_PROCESSOR_SHARED_SECRET` | Autentica solicitud y callback de conversión. |
| `DUBBING_PROVIDER_MODE` | `local`, `elevenlabs` o `azure`. |
| `DUBBING_PROVIDER_API_KEY` | Clave del proveedor elegido. |
| `DUBBING_WEBHOOK_SECRET` | Verifica resultados asíncronos del proveedor. |

## Continuación fuera de este entorno

La guía completa para mover el proyecto, escoger entre equipo propio o servicio persistente y operar el procesador está en [`MIGRATION_AND_VIDEO_WORKERS.md`](./MIGRATION_AND_VIDEO_WORKERS.md). Incluye archivos de configuración de ejemplo, la plantilla de servicio Linux y las comprobaciones de reproducción.

El flujo gratuito de extracción, traducción y reconstrucción de PDFs está documentado en [`PDF_TRANSLATION_PILOT.md`](./PDF_TRANSLATION_PILOT.md). Incluye el piloto validado, los comandos de ejecución y registro, sus límites de texto extraíble y las alternativas de pago opcionales.

La localización visual de texto dentro de imágenes, el OCR local para PDFs escaneados, la preparación masiva y el uso opcional de DeepL o Google Cloud están descritos en [`IMAGE_LOCALIZATION_PILOT.md`](./IMAGE_LOCALIZATION_PILOT.md). Las APIs externas no están activas: la plataforma prioriza la ruta local y exige revisión humana de cada variante visual.

## Modelo de datos propuesto para la siguiente fase

| Entidad | Campos esenciales | Uso |
|---|---|---|
| `media_processing_jobs` | vídeo fuente, modo, idioma origen/destino, estado, proveedor, error, fechas. | Cola: `queued`, `transcribing`, `translating`, `synthesizing`, `ready`, `failed`. |
| `media_tracks` | vídeo, idioma, tipo de pista, URL, duración, proveedor. | Pistas `original`, `dubbed_audio`, `subtitles`. |
| `transcript_segments` | trabajo, inicio, fin, texto fuente, texto traducido, hablante. | Corrección editorial, subtítulos y sincronización. |

## Derechos y control de calidad

Procesar traducciones y doblajes puede crear una adaptación del material. Antes de habilitar el trabajo masivo, confirmar que se tienen derechos suficientes sobre los cursos y mantener una revisión humana del guion, nombres propios, terminología y anuncios. La voz sintetizada debe presentarse como pista traducida, no como intervención del hablante original.

## Referencias

[1] [ElevenLabs Dubbing](https://elevenlabs.io/docs/overview/capabilities/dubbing)
[2] [Azure Speech Translation](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-translation)
[3] [Google Cloud Text-to-Speech](https://cloud.google.com/text-to-speech)
[4] [faster-whisper](https://github.com/SYSTRAN/faster-whisper)
[5] [Argos Translate](https://github.com/argosopentech/argos-translate)
[6] [Piper](https://github.com/rhasspy/piper)

## Actualización de continuidad — 19 de agosto de 2026

La cola del curso **Aggressive Fat Loss 2.0** quedó cerrada con **12 PDFs disponibles en español**. Cada documento conserva su original de Google Drive y tiene una reconstrucción independiente, segmentos bilingües persistidos y acceso mediante «Leer en español». La ruta local usa extracción directa u OCR de respaldo, Argos Translate y ReportLab.

| Entregable reciente | Estado |
|---|---|
| Cinco PDFs finales procesados | Listos: AFL Workout Program, Secret Code To Building A Chiseled Physique, Kinobody Drinking Guide, AFL-cheatsheet y AggressiveFatLoss. |
| Localización visual | Dos portadas aprobadas: Main Guide y Presence Bonus. La portada de Drinking Guide quedó documentada como siguiente variante, pero su generación se aplazó al alcanzar la cuota diaria gratuita de imágenes. |
| Consola administrativa | Búsqueda, estado, curso, ruta pedagógica y prioridad; recuentos por estado y banda; prioridad editable. |
| Exportación | Botón «Exportar CSV» con los registros filtrados de curso, módulo, ruta, estado, prioridad y páginas. |
| Validación | `pnpm check`, 19 pruebas Vitest y E2E con 12 accesos de lectura española. |
| Repositorio | Continuidad en `https://github.com/juanxaviercasa/catalogo-cursos.git`; el checkpoint `9ba533aa` contiene estos avances. |

La única tarea abierta es crear y aprobar la nueva variante visual de Drinking Guide cuando se restablezca la cuota gratuita o se habilite capacidad adicional. No se publicó una imagen parcial ni se modificó el original. Al retomarla, se debe registrar la variante como `review`, comprobar ortografía, cifras, marca y composición, y cambiarla a `ready` solo tras la revisión humana.


## Actualización — catálogo separado por Google Drive y Terabox

El 24 de agosto de 2026 se inspeccionó la carpeta pública de Google Drive asociada por el usuario al correo `cursosgo235@gmail.com`: `https://drive.google.com/drive/folders/1nZ6lw8z-lNbV7kDGM2ifsOwzq0l0-YJm?usp=sharing`. Se identificaron seis carpetas de curso con módulos reales y se incorporaron al inventario combinado publicado en `/manus-storage/drive_courses_inventory_with_kinobody_and_cursosgo235_81d1c762.json`. El catálogo de Google Drive pasa de 25 a **31 cursos**; posteriormente se añadieron 79 cursos Terabox registrados en el catálogo combinado, que alcanza **110 cursos**.

Los seis cursos son Chat GPT Marketing para Ventas Exitosas, IA para Investigar tu Mercado, Copywriting: Mensajes que Venden, Creación y Planeación de Contenido para Instagram, Entendiendo el Marketing Digital y Tu Agencia de Expertos en IA. Sus módulos conservan los IDs y enlaces individuales de Drive. La aplicación los clasifica con el origen `google_drive` y mantiene la acción **«Ir al contenido»**.

El catálogo ahora admite el tipo extensible `google_drive | terabox`, muestra el proveedor en cada tarjeta y ficha, ofrece un filtro global por fuente y muestra la cuenta de procedencia en la ficha cuando está definida. Los metadatos Terabox usan `juanxaviercasa@gmail.com`; los cursos Drive de Cofre del Emprendedor no heredan ese campo. Para Terabox, la ficha no intentará usar un iframe de Google Drive: abrirá el enlace original mediante «Ir al contenido». Esto evita mezclar proveedores aunque se utilice el mismo correo.

Se inspeccionó `https://www.1024tera.com/spanish/sharing/link?surl=68IfqGVjoXwH5FzSAbgVXA` con la cuenta autorizada **juanxaviercasa@gmail.com**. Esta colección Terabox pertenece a esa cuenta y no a `cofredelemprendedor@gmail.com`, que corresponde a la colección de Google Drive de Cofre del Emprendedor. La carpeta compartida `jxcasa` expuso 79 carpetas de cursos visibles. Se incorporaron con origen `terabox`, cuenta de procedencia registrada, enlaces originales conservados y una acción de acceso a la carpeta compartida. Cuatro cursos tienen estructura interna verificada: el guía de marketing digital con 20 subcarpetas, AI Automation Agency con 7, KCPQHDFCC con 11 y Robert Richards — OnlyFans Agency con 20 archivos reales. Las otras 75 fichas no inventan módulos ni enlaces profundos y muestran un acceso provisional a la carpeta original hasta inspeccionar sus archivos internos. El inventario de evidencia se conserva en `/home/ubuntu/curso_drive_analysis/terabox_inventory_2026-08-24.md`. Si el propietario cambia Terabox a privado, los estudiantes necesitarán una sesión autorizada o una futura integración segura del servidor; la aplicación no puede eludir permisos.

La validación de esta iteración completó `pnpm test -- --run` y `pnpm exec tsc --noEmit`: **22 pruebas unitarias pasan** y no quedan errores TypeScript. El catálogo Terabox se fusiona desde `shared/teraboxCatalog.ts` en el procedimiento público sin modificar el inventario JSON original de Drive.

## Actualización — inventario Terabox ampliado

La sesión autenticada mostró una segunda colección de carpetas dentro de `jxcasa`, además de las 20 ya registradas. El catálogo ampliado conserva **79 cursos Terabox visibles** frente a 31 cursos de Google Drive, para un total de 110 fichas. Las nuevas carpetas incluyen formación de marketing y publicidad, ventas, ecommerce, IA, contenido, Notion, desarrollo personal y cursos de creadores.

Los nombres se incorporaron como cursos provisionales con identificadores estables, etiqueta `terabox` y el enlace compartido original. No se supusieron módulos internos ni se descargaron archivos. Se mantienen como estructuras detalladas únicamente los tres cursos previamente verificados: AI-Powered Digital Marketing Guide con 20 subcarpetas, AI Automation Agency con 7 y KCPQHDFCC con 11. La inspección individual de las otras 76 carpetas queda pendiente y se conserva en `todo.md`.

La validación del catálogo ampliado pasa con `pnpm test -- --run`: 22 pruebas, y `pnpm exec tsc --noEmit` no reporta errores. Si Terabox se vuelve privado, el acceso seguirá dependiendo de una sesión autorizada y de los permisos de la cuenta; la aplicación no los elude.

## Actualización — Robert Richards en Terabox

La sesión autenticada permitió abrir `/jxcasa/Robert Richards - How to create a successful OnlyFans Agency` desde el árbol lateral. Se verificaron **20 archivos reales**: 18 vídeos de capítulos y actualizaciones, además de `21-Account List Template.xlsx` y `20-Model Relase Template.docx`. El catálogo reemplaza el único acceso provisional de esta ficha por una secuencia de 20 elementos con tipo de archivo y nombres originales. Terabox no expuso enlaces profundos individuales en la vista compartida, por lo que cada elemento conserva el enlace compartido como destino de origen y no se presenta como una URL de archivo inventada.

La prueba de catálogo mantiene 79 cursos Terabox, valida los 20 elementos de Robert Richards y confirma que las demás fichas pendientes conservan un único acceso provisional. `pnpm test -- --run` pasa con 22 pruebas y `pnpm exec tsc --noEmit` no reporta errores.

### Profundización posterior de Terabox — módulo 29
La sesión autenticada permitió abrir el módulo `29. Meta Broad Targeting & Special Ad Categories @joinBITTUfreecourses` dentro de `The AI-Powered Digital Marketing & Digital Advertising Guide`. Se observaron tres vídeos MP4, tres subtítulos SRT, una página HTML y un archivo TXT de contraseña. La contraseña no se descargó, no se almacenó y no se incorporó a la interfaz. El catálogo mantiene el módulo como carpeta Terabox y la colección continúa atribuida a `juanxaviercasa@gmail.com`.
