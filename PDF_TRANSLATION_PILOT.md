# Piloto de PDF bilingüe: inglés → español

Este documento describe el flujo local gratuito que permite conservar el PDF original en Google Drive, ofrecer una **lectura legible en español**, mostrar una comparación lado a lado y publicar un **PDF reconstruido en español** dentro de la plataforma.

## Estado validado

El piloto procesado corresponde a `01 - Main Guide` del curso **Aggressive Fat Loss 2.0**, identificado en el catálogo por el curso `1dxvel2jEarUb7ijNesZULpHQmbpM0bDa` y el módulo `1zeLzRiimHPouYbs9yhN-WDJRUCoQE1QM`.

| Entregable | Estado | Ubicación |
| --- | --- | --- |
| Documento original | Conservado sin cambios | Google Drive |
| Extracción y traducción local | Completada | 32 segmentos de texto en 33 páginas |
| Lectura española | Disponible | Panel «Leer en español» del módulo |
| Comparación bilingüe | Disponible | Original Drive y lectura española en paralelo |
| PDF reconstruido | Disponible | `/manus-storage/afl-main-guide-es_da20581a.pdf` |

La prueba E2E `tests/e2e/verify_bilingual_pdf.mjs` valida la apertura de la comparación, la lectura en español y la referencia del PDF reconstruido en almacenamiento gestionado.

## Evidencia de validación

| Comprobación | Resultado |
| --- | --- |
| Registro de datos | `pdf_translations.id=1` quedó en estado `ready`, con 33 páginas y 32 segmentos vinculados al módulo piloto. |
| Pruebas de tipos y unidad | `pnpm check` y las 13 pruebas Vitest terminaron correctamente. |
| Prueba de interfaz | La prueba E2E confirmó un marco de comparación de Drive, 40 128 caracteres de lectura en español y la URL del PDF reconstruido en `/manus-storage/`. |
| Revisión visual | La ficha del curso muestra «Leer en español» en el módulo preparado y diferencia con claridad las acciones de preparación de los demás PDFs. |

## Flujo gratuito actual

> El contenido original nunca se reemplaza. La plataforma guarda solo metadatos, segmentos bilingües y la copia reconstruida que sirve para la lectura en español.

1. Descargar el PDF autorizado desde Google Drive a un directorio de trabajo local.
2. Ejecutar `workers/local_pdf_bilingual.py`. El proceso usa `pdftotext` para páginas con texto seleccionable, Argos Translate para inglés→español y ReportLab para construir un PDF de lectura.
3. Publicar el PDF resultante en almacenamiento gestionado usando el flujo de archivos estáticos del proyecto.
4. Registrar el resultado y los segmentos en `pdf_translations` y `pdf_translation_segments` con `workers/register_pdf_translation_result.mjs`.
5. La interfaz muestra `Leer en español` cuando el estado pasa a `ready`. Para documentos aún no preparados, un administrador puede encolarlos desde `Preparar español`.

### Procesar un documento nuevo

```bash
python3 workers/local_pdf_bilingual.py \
  --input-pdf /ruta/al/documento.pdf \
  --output-dir /ruta/de/salida
```

El resultado esperado incluye `lectura-es.pdf` y `segments-es.json`. Tras publicar el PDF reconstruido, registrar el resultado con:

```bash
pnpm tsx workers/register_pdf_translation_result.mjs \
  <course-id> \
  <module-id> \
  <url-original-drive> \
  <url-manus-storage-pdf-es> \
  <nombre-pdf-es.pdf> \
  /ruta/a/segments-es.json
```

## Límites conocidos del piloto

| Aspecto | Comportamiento actual | Consecuencia práctica |
| --- | --- | --- |
| Tipo de documento | Requiere texto extraíble | PDFs escaneados o fotos de páginas necesitan OCR previo. |
| Diseño | Se extrae contenido, no la maqueta | Tablas complejas, diagramas, columnas e imágenes no conservan el diseño original. |
| Traducción | Motor local Argos Translate | Es funcional para lectura general, pero puede requerir revisión de terminología técnica, nutricional o comercial. |
| Reconstrucción | ReportLab refluye texto en páginas nuevas | El PDF español es una versión de lectura, no una réplica visual. |
| Procesamiento | Trabajador local/manual actual | La acción «Preparar español» encola el trabajo; un operador debe ejecutar el procesador hasta desplegar un servicio de fondo. |

Por seguridad y precisión, el visor advierte que cifras, terminología y recomendaciones de salud o entrenamiento deben revisarse antes de usarse para decisiones personales.

## Rutas de mejora opcionales

| Alternativa | Cuándo aporta valor | Ventaja | Contrapartida |
| --- | --- | --- | --- |
| Argos Translate local | Pruebas y presupuesto cero | Sin coste por página y control local | Calidad variable y operación manual. |
| OCR local (Tesseract/OCRmyPDF) | Documentos escaneados | Habilita PDFs sin capa de texto | Más tiempo de proceso y errores de reconocimiento. |
| DeepL API | Terminología y fluidez prioritarias | Traducción generalmente más natural | API de pago, cuota y secreto de servidor. |
| Google Cloud Translation | Alto volumen y automatización | Escalabilidad e integración amplia | API de pago y facturación por carácter. |
| Servicio de reconstrucción documental | Se requiere fidelidad visual | Puede preservar diseños y tablas | Mayor coste y complejidad de integración. |

Al activar una API de pago, las credenciales deben configurarse como secretos de entorno del servidor; nunca deben incluirse en el cliente, el repositorio o los registros de eventos.

## Operación y continuidad

La base de datos mantiene el ciclo de vida `queued` → `extracting` → `translating` → `reconstructing` → `ready` o `failed`. Los archivos se sirven desde almacenamiento gestionado y la fuente original se sigue abriendo desde Google Drive. Esta separación permite mover el sitio a un dominio propio sin convertir el hosting web en repositorio de los documentos originales.

La ampliación de OCR, preparación masiva y localización visual de texto dentro de imágenes está detallada en [`IMAGE_LOCALIZATION_PILOT.md`](./IMAGE_LOCALIZATION_PILOT.md). DeepL y Google Cloud se conservan como placeholders opcionales; la ruta local sigue siendo la predeterminada.
