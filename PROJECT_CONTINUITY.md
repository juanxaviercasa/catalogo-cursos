# Continuidad técnica — Ruta de Aprendizaje Drive

## Propósito y estado actual

La plataforma convierte una carpeta de Google Drive en una biblioteca de **19 cursos** agrupados en seis rutas pedagógicas. El contenido fuente permanece en Drive, mientras que el catálogo, las rutas, el avance del usuario y la preparación de medios se gestionan desde la aplicación.

| Área | Estado actual | Decisión principal |
|---|---|---|
| Catálogo y navegación | Operativo | El inventario estructurado de Drive alimenta las 19 fichas y sus módulos ordenados. |
| Progreso | Operativo | El progreso por módulo, curso y ruta se guarda por usuario en la base de datos. |
| Vídeos disponibles en Drive | Operativo | Los MP4 compatibles se pueden visualizar mediante el visor embebido de Drive. |
| Importación de ZIP | Operativo para formatos web | El ZIP original no se modifica; MP4/WebM compatibles se copian al almacenamiento gestionado para reproducción desde la plataforma. |
| ZIP piloto | Validado parcialmente | `01-Welcome friends.mp4` se importó y responde desde almacenamiento gestionado. Los MKV quedan pendientes de conversión. |
| Conversión y doblaje | Preparado como placeholder | No hay proveedor, credenciales ni trabajador configurado aún. |

## Arquitectura vigente

La aplicación usa React y TypeScript en el cliente, procedimientos tipados en el servidor, autenticación de usuarios y una base de datos relacional. Los bytes de vídeo no se guardan en la base de datos: el almacenamiento de objetos conserva el archivo y las tablas solo registran su clave, URL, formato y tamaño.

| Componente | Responsabilidad | Persistencia |
|---|---|---|
| `module_progress` | Módulos completados por usuario. | Base de datos. |
| `zip_imports` | Estado de cada archivo ZIP preparado. | Base de datos. |
| `extracted_videos` | Metadatos y URL de vídeos ya extraídos. | Base de datos + almacenamiento de objetos. |
| `/manus-storage/` | Entrega mediante redirección firmada. | Almacenamiento de objetos. |
| Google Drive | Fuente original, carpeta y archivos de curso. | Externo. |

> **Regla de almacenamiento:** no guardar vídeos en Local Storage, IndexedDB ni archivos públicos de la aplicación. El navegador solo consume una URL de reproducción; los archivos viven fuera de él.

## Importación y conversión de ZIP

La primera importación descarga el ZIP público una única vez desde Drive, valida rutas y límites, conserva el original sin cambios y prepara los medios compatibles. La reproducción posterior de un vídeo preparado no vuelve a consumir la descarga de Drive.

| Escenario | Tratamiento actual | Siguiente paso |
|---|---|---|
| MP4/WebM | Se preserva y se sube directamente al almacenamiento gestionado. | Mantener este comportamiento. |
| MKV/MOV/M4V | Se detecta, pero no se muestra como pista reproducible. | Convertir a MP4 en un trabajador externo. |
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
