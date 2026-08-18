# Importación de ZIP desde Google Drive

## Estado operativo confirmado

La plataforma puede leer un ZIP compartido públicamente en Google Drive, conservar el archivo original sin modificarlo y copiar vídeos compatibles al almacenamiento gestionado del sitio. El piloto `01-Welcome to your new life (YouTube Success).zip` se procesó correctamente: el archivo MP4 `01-Welcome friends` quedó disponible desde `/manus-storage/` y puede reproducirse sin consultar Google Drive nuevamente.

El piloto usa un enlace público de Google Drive. Todavía no existe una autorización OAuth de lectura para archivos privados; si una carpeta deja de estar compartida públicamente, será necesario añadir una conexión de Google Drive con permiso de solo lectura. Google Drive expone las descargas de archivos binarios mediante `files.get` con `alt=media`, sujeto a que el usuario pueda descargar el archivo.[1]

## Límites y formatos

| Aspecto | Comportamiento actual |
|---|---|
| Archivo original | Se conserva comprimido e intacto en Google Drive. |
| Tamaño máximo del ZIP | 350 MB. |
| Vídeos que se importan y reproducen | MP4 y WebM de hasta 150 MB cada uno, con máximo acumulado de 300 MB y 30 vídeos por importación. |
| Formatos no reproducibles directamente | MKV, MOV y M4V se omiten en la importación actual para evitar mostrar vídeos que la mayoría de navegadores no puede reproducir de forma fiable. |
| Reproducción tras importar | El navegador obtiene el vídeo desde el almacenamiento gestionado de la plataforma, no desde Google Drive. |

## Siguiente mejora: MKV

El ZIP piloto contiene cinco vídeos MKV y un MP4. El MP4 se importó correctamente. Para mostrar los MKV dentro del navegador, hay que convertirlos a MP4 o WebM antes de guardarlos. Esta conversión requiere un motor multimedia como FFmpeg y una ejecución con recursos suficientes; no debe hacerse en una petición web normal.

## Referencias

[1] [Download and export files — Google Drive API](https://developers.google.com/workspace/drive/api/guides/manage-downloads)
