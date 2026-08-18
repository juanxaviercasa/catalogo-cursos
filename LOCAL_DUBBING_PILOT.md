# Prueba gratuita de doblaje local: inglés → español

## Qué hace esta prueba

Esta ruta ejecuta el análisis y doblaje en tu propio ordenador. Conserva el vídeo original, genera un guion inglés con tiempos, traduce el texto al español, sintetiza una voz neural y produce tres archivos: `subtitles-es.vtt`, `segments-es.json` y `dubbed-es.mp3`. No requiere una API de pago ni guarda credenciales en la plataforma.

> **Límite de la prueba local:** la pista española se crea como una pista independiente. La mezcla profesional con la música y los efectos originales requiere una etapa adicional de separación de voz. Antes de publicarla, revisa nombres, términos técnicos y sincronización.

## Requisitos de tu ordenador

| Componente | Uso | Coste |
|---|---|---|
| Python 3.11 o superior | Ejecuta la transcripción y traducción. | Gratuito. |
| FFmpeg | Extrae audio, ajusta segmentos y compone la pista española. | Gratuito. |
| faster-whisper | Transcribe inglés con tiempos. | Gratuito y local.[4] |
| Argos Translate | Traduce inglés a español sin API. | Gratuito y local.[5] |
| Piper-compatible CLI y voz española | Genera la voz neural. | Gratuito si se utiliza una voz compatible instalada localmente.[6] |

## Instalación inicial

En un equipo con Python y FFmpeg instalados, crea un entorno y agrega las librerías:

```bash
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate
pip install faster-whisper argostranslate
```

Instala un ejecutable compatible con Piper y una voz española. Después, declara las rutas como variables de entorno antes de ejecutar la prueba:

```bash
# Ejemplo macOS/Linux: ajusta ambas rutas a tu instalación real
export PIPER_BIN="/RUTA/A/piper"
export PIPER_MODEL="/RUTA/A/voz-es.onnx"
```

## Ejecución del piloto

Descarga o abre localmente el MP4 que ya preparó la plataforma y ejecuta el script incluido:

```bash
python workers/local_dubbing_pilot.py \
  --input "/RUTA/01-Welcome friends.mp4" \
  --output "/RUTA/salida-es" \
  --whisper-model small
```

Elige `small` para una primera prueba con menor consumo. Si el resultado necesita mejor precisión, repite el trabajo con un modelo mayor. El proceso puede tardar más que la duración del vídeo en un equipo sin GPU.

El trabajador ya evita ralentizar frases cortas: conserva el ritmo natural y deja una pausa cuando una frase española es más breve que la ventana original. Para corregir un fragmento que la traducción local haya interpretado mal, crea un JSON con el índice de segmento y añádelo a la orden:

```json
{
  "9": "Cuantas más notas tomes y más estudies el curso, mejor comprenderás sus fundamentos y principios."
}
```

```bash
python workers/local_dubbing_pilot.py --input "/RUTA/video.mp4" --output "/RUTA/salida-es" --overrides "/RUTA/correcciones.json"
```

## Comprobación de entrega y ritmo

La prueba del vídeo piloto confirmó que el almacenamiento responde a solicitudes parciales de vídeo (`HTTP 206`), por lo que el reproductor puede empezar a cargar antes de descargar el archivo completo. En la verificación local, el primer megabyte empezó a transferirse en aproximadamente 0,28 segundos. Esto no garantiza la misma velocidad en todas las redes del usuario, pero descarta que la plataforma obligue a descargar el MP4 entero antes de reproducirlo.

La primera pista española tenía una frase ralentizada artificialmente para ocupar su ventana temporal. El trabajador se ajustó para no ralentizar frases cortas: ahora conserva una pausa natural y solo acelera cuando una frase sintetizada excede la ventana original. La versión refinada del piloto utiliza este comportamiento. Si persistieran pausas con una conexión estable, se deben revisar los segmentos marcados por duración y las traducciones antes de publicar.

La prueba interactiva en navegador confirmó que el MP4 refinado carga metadatos completos (`readyState 4`), dura 164,91 segundos —igual que el vídeo original— y adjunta el VTT español como pista predeterminada. También confirmó que el selector cambia de la versión española al vídeo original. Por tanto, una pausa posterior a esta versión puede deberse a la red del espectador o a un segmento concreto que requiera revisión editorial, no a la carga completa obligatoria del archivo.

## Incorporación al sitio

La prueba local no publica nada automáticamente: primero permite revisar el guion y el audio. Cuando `dubbed-es.mp3` y `subtitles-es.vtt` sean satisfactorios, el siguiente paso será activar el trabajador local autenticado para subirlos al almacenamiento gestionado y asociarlos al módulo. En ese momento el reproductor ofrecerá `Original`, `Español` y `Subtítulos`.

## Cuándo usar una alternativa de pago

Usa una API opcional solo cuando necesites procesar muchos cursos, una voz más consistente, varias voces, mezcla automática del fondo o menos trabajo operativo. Las alternativas se mantienen reemplazables; no hay claves de API codificadas en el proyecto.

## Referencias

[4] [faster-whisper](https://github.com/SYSTRAN/faster-whisper)
[5] [Argos Translate](https://github.com/argosopentech/argos-translate)
[6] [Piper](https://github.com/rhasspy/piper)
