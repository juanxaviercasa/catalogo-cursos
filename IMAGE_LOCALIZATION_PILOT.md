# OCR y localización visual de imágenes: inglés → español

La plataforma ya conserva el PDF original de Drive y añade una variante de lectura en español. Esta ampliación incorpora dos capacidades complementarias: **OCR local** para páginas escaneadas o sin texto seleccionable, y **localización visual** para reemplazar texto en inglés dentro de una imagen por su equivalente en español sin alterar la fuente original.

## Piloto aprobado

La portada de `01 - Main Guide` de **Aggressive Fat Loss 2.0** constituye la primera prueba. La plataforma conserva ambas variantes en almacenamiento gestionado y muestra una pestaña **«Visual en español»** en el lector bilingüe.

| Elemento | Estado | Ubicación |
| --- | --- | --- |
| Imagen fuente | Conservada, sin cambios | `/manus-storage/afl-main-guide-page-01_c8b3b3a2.png` |
| Variante localizada | Aprobada tras revisión visual | `/manus-storage/afl-main-guide-page-01-es_3b48cfd6.png` |
| Registro | Asociado al PDF piloto, página 1 | `pdf_visual_localizations.id=1` |
| Acceso en interfaz | Disponible para lectura | Pestaña «Visual en español» |

> **Principio de preservación:** el original de Drive y la imagen fuente no se sustituyen. La variante española es un recurso adicional, trazable y reversible.

## Flujo aplicado

La localización visual no es una simple superposición de texto. Primero se identifica la región que contiene inglés; después, un editor visual genera una variante que conserva fotografía, objetos, colores, composición y jerarquía tipográfica. La salida se guarda como borrador y debe revisarse antes de marcarse como `ready`.

| Etapa | Resultado | Control de calidad |
| --- | --- | --- |
| Rasterizar página | PNG fuente del PDF | Se conserva una URL de origen por página. |
| Identificar texto | Cadena original y traducción aprobada | Los nombres propios, cifras y términos técnicos se revisan. |
| Localizar visualmente | PNG español separado | Solo se permite modificar las zonas de texto definidas. |
| Revisar | Estado `review` o `ready` | Un administrador aprueba o rechaza cada variante. |
| Publicar | Comparación visual dentro del curso | El lector sigue mostrando también la fuente original. |

El registro conserva texto fuente, traducción, proveedor, URLs de ambas imágenes, estado y fecha de revisión. Los bytes permanecen en almacenamiento gestionado, no en la base de datos.

## OCR local gratuito

El procesador `workers/local_pdf_bilingual.py` intenta primero la capa de texto del PDF. Si una página devuelve menos de 40 caracteres, la vuelve a rasterizar a 240 DPI y ejecuta **Tesseract OCR** localmente con inglés. El texto extraído vuelve al mismo flujo Argos Translate → PDF de lectura española.

| Caso | Ruta actual | Resultado esperado |
| --- | --- | --- |
| PDF con texto seleccionable | Extracción directa con `pypdf` | Lectura española y segmentos por página. |
| PDF escaneado con texto nítido | Tesseract local | Segmentos OCR traducibles, marcados como `extractionMethod: "ocr"`. |
| Portada, tipografía artística o texto sobre fotografía | OCR puede ser incompleto | Se usa localización visual y revisión humana. |
| Tablas, diagramas o escritura pequeña | OCR local de apoyo | Se recomienda validar manualmente antes de publicar. |

La API Cloud Vision de Google ofrece `TEXT_DETECTION` con cuadros delimitadores de palabras y `DOCUMENT_TEXT_DETECTION` para documentos densos; se mantiene documentada como alternativa opcional, no configurada por defecto. [1]

## Preparación masiva y proveedores opcionales

En cada ficha de curso, un administrador dispone de **«Preparar N PDFs»** para poner en cola todos los PDFs aún no preparados. La cola no altera Drive: la preparación sigue requiriendo ejecutar el trabajador local o un servicio persistente antes de que cada PDF quede disponible.

### Prioridad de preparación

La plataforma aplica una prioridad explícita y reproducible. La acción **«Preparar español»** de un módulo es la vía para priorizar un PDF concreto. Si se usa **«Preparar N PDFs»**, los documentos se incorporan uno a uno siguiendo el orden pedagógico visible en el curso: primero el prefijo numérico del módulo y, ante empate, el nombre natural del archivo. Esta regla evita que una preparación masiva desordene la ruta de aprendizaje y permite adelantar de forma manual el documento que el usuario necesita leer primero.

| Opción | Estado en esta versión | Coste | Uso previsto |
| --- | --- | --- |
| Argos Translate + Tesseract | Activa como ruta predeterminada | Gratuito, local | Pilotos, documentos con texto y OCR básico. |
| Editor visual de imágenes | Activo para localizaciones individualmente revisadas | Según uso del servicio | Portadas, imágenes explicativas y texto sobre diseño. |
| DeepL API | Placeholder seguro | Plan/API según disponibilidad | Mayor fluidez, glosarios o automatización futura. |
| Google Cloud Vision + Translate | Placeholder seguro | Uso facturable | OCR estructurado y procesamiento a escala. |

DeepL sigue como **placeholder**, sin clave ni tráfico desde la plataforma. La documentación oficial separa los endpoints Free y Pro, advierte que la clave debe ser confidencial y permite gestionarla en el área **API Keys & Limits** de la cuenta. [2] [3] Si más adelante el usuario contrata o consigue una modalidad disponible, la clave se configurará como `DEEPL_API_KEY` exclusivamente en el servidor.

## Límites y revisión obligatoria

La localización visual funciona mejor para bloques de texto claros y aislados. No garantiza que el OCR lea con precisión tipografía decorativa, texto curvado, texto sobre fondos muy complejos, diagramas, tablas o anotaciones manuscritas. Tampoco garantiza que una variante generada respete de forma perfecta marcas, cifras, nombres propios o restricciones de espacio.

Por ello, cada imagen generada debe revisar: **ortografía española, cifras, términos de salud y entrenamiento, legibilidad, jerarquía visual y preservación de elementos no textuales**. Las imágenes rechazadas se mantienen como referencias de revisión, pero no se muestran como recurso aprobado.

## Validación realizada

| Comprobación | Resultado |
| --- | --- |
| OCR de portada sin texto seleccionable | Activado y marcado como `ocr`; se documentó que la tipografía sobre fotografía requiere revisión visual. |
| Persistencia visual | Variante de página 1 registrada con estado `ready`. |
| Interfaz | La prueba E2E valida dos imágenes en la pestaña visual: fuente y versión española. |
| Calidad de código | `pnpm check`, 15 pruebas Vitest y la prueba E2E del PDF completaron correctamente. |

## Referencias

[1] [Google Cloud Vision: detección y extracción OCR de imágenes](https://docs.cloud.google.com/vision/docs/ocr)

[2] [DeepL: acceso y autenticación de la API](https://developers.deepl.com/docs/getting-started/auth)

[3] [DeepL: crear y administrar claves API](https://support.deepl.com/hc/en-us/articles/360020695820-API-key-for-DeepL-API)
