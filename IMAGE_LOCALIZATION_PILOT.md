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

### Prioridades procesadas

Se procesaron los tres primeros documentos pendientes de la secuencia **Aggressive Fat Loss 2.0**. Los restantes siguen persistidos en cola, sin alterar sus archivos fuente en Drive.

| Prioridad | Documento | Resultado publicado |
| --- | --- | --- |
| 1 | `02 - Cheat Sheets.pdf` | 3 páginas y 4 segmentos; `/manus-storage/cheat-sheets-es_a8a0b4bd.pdf` |
| 2 | `03 - Workout Program.pdf` | 11 páginas y 12 segmentos; `/manus-storage/workout-program-es_86055b77.pdf` |
| 3 | `04 - Hypnosis Bonus.pdf` | 13 páginas y 19 segmentos; `/manus-storage/hypnosis-bonus-es_2dc8e438.pdf` |

El bloque siguiente ya está preparado y publicado mediante la misma ruta local. Con ello, el curso cuenta con siete documentos bilingües listos para lectura, incluidos el piloto inicial y los dos bloques priorizados.

| Prioridad | Documento | Resultado publicado |
| --- | --- | --- |
| 1 | `05 - Presence Bonus.pdf` | 22 páginas y 25 segmentos; `/manus-storage/presence-bonus-es_cba45c50.pdf` |
| 2 | `06 - The Science of Fasting.pdf` | 20 páginas y 41 segmentos; `/manus-storage/science-fasting-es_b9885978.pdf` |
| 3 | `07 - 2-Day Meal Plan.pdf` | 8 páginas y 9 segmentos; `/manus-storage/two-day-meal-plan-es_fac6515a.pdf` |

El bloque final cerró la cola restante del curso. Los doce PDFs publicados de **Aggressive Fat Loss 2.0** cuentan ahora con original de Drive, lectura segmentada en español y PDF reconstruido independiente.

| Documento | Páginas | Segmentos | PDF reconstruido |
| --- | ---: | ---: | --- |
| `08 - AFL Workout Program.pdf` | 11 | 13 | `/manus-storage/afl-workout-program-es_49757e17.pdf` |
| `09 - Secret Code To Building A Chiseled Physique.pdf` | 14 | 14 | `/manus-storage/secret-code-es_43d60af1.pdf` |
| `10 - Kinobody Drinking Guide.pdf` | 12 | 12 | `/manus-storage/drinking-guide-es_89782e19.pdf` |
| `11 - AFL-cheatsheet.pdf` | 2 | 4 | `/manus-storage/afl-cheatsheet-es_1dca073c.pdf` |
| `12 - AggressiveFatLoss.pdf` | 17 | 35 | `/manus-storage/aggressive-fat-loss-es_a071f3ca.pdf` |

## Edición manual y progreso visual

La pestaña **«Visual en español»** ahora incorpora un indicador de estado por imagen con cinco momentos: `Pendiente`, `Generando`, `En revisión`, `Aprobado` y `Requiere nueva variante`. El estado se expresa tanto con una etiqueta como con una barra de avance, para que el lector no confunda una imagen borrador con una versión aprobada.

Los administradores pueden usar **«Editar texto»** para corregir el texto inglés identificado o la versión española antes de publicar una nueva variante. El botón **«Guardar y volver a generar»** guarda esos ajustes como la entrada de trabajo y solicita una nueva localización visual. La imagen anterior continúa como referencia hasta que el nuevo resultado pasa la revisión humana.

> La edición manual modifica únicamente el texto de trabajo de la variante visual. No altera el PDF original, la imagen fuente, los enlaces de Drive ni el historial de revisión.

La segunda variante corresponde a la portada de **Presence Bonus**. Tras revisar legibilidad, traducción, tipografía y preservación de la marca Kinobody, quedó aprobada como `ready`. Conserva la fuente `/manus-storage/presence-bonus-page-01_c3297100.png` y una salida localizada separada; ambas permanecen trazables y reversibles.

La portada de **Kinobody Drinking Guide** quedó preparada como fuente para la siguiente localización, pero la generación de su variante española se aplazó al alcanzar el límite diario del plan gratuito de generación de imágenes. No se publicó una variante parcial ni se alteró la fuente. Al restablecer la cuota o habilitar más capacidad, se retomará con la traducción ya definida: `La Guía de Bebidas AFL` y `Cómo disfrutar del alcohol mientras pierdes grasa y desarrollas músculo`.

## Consola administrativa de prioridades

La pantalla principal incorpora **«Cola de PDFs bilingües»** para administradores. Resume los trabajos por estado y por bandas de prioridad, y permite filtrar por documento, curso, ruta pedagógica, estado y prioridad. Cada fila conserva una prioridad numérica persistente entre 1 y 999; los valores más bajos se muestran primero y expresan el siguiente orden operativo, sin cambiar los archivos ni los enlaces de Drive.

| Control | Uso |
| --- | --- |
| Búsqueda | Localiza un PDF por curso o por nombre de módulo. |
| Filtro de estado | Aísla trabajos en cola, procesamiento, listos o con revisión pendiente. |
| Filtro de prioridad | Filtra las bandas 1–3 inmediatas, 4–10 próximas, 11–99 planificadas y 100+ estándar. |
| Filtro de ruta | Aísla los documentos de una ruta pedagógica, como Salud y Rendimiento. |
| Filtro de curso | Permite concentrarse en una ruta documental concreta. |
| Prioridad + Guardar | Reordena de manera persistente el próximo trabajo local. |
| Resumen de cola | Muestra recuentos por estado y por banda de prioridad para detectar carga y pendientes. |
| Exportar CSV | Descarga la vista filtrada con curso, módulo, ruta, estado, prioridad y páginas. |

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
| Persistencia visual | Dos variantes de portada registradas con estado `ready`: Main Guide y Presence Bonus. |
| Interfaz | La prueba E2E valida fuente y versión española en las dos variantes visuales aprobadas. |
| Preparación priorizada | Doce módulos —incluido el piloto inicial— muestran «Leer en español» en la ficha del curso. |
| Edición y progreso | El lector expone control de edición, acción de regeneración e indicador `Aprobado` para la variante revisada. |
| Cola cerrada | Los 12 documentos del curso están listos y la E2E confirma los 12 accesos de lectura en español. |
| Consola de cola | Validada visualmente con 12 documentos, filtros de estado, curso, ruta y prioridad; exportación CSV; recuentos por estado y banda; y control de prioridad. |
| Calidad de código | `pnpm check`, 19 pruebas Vitest y la prueba E2E del PDF completaron correctamente. |

## Referencias

[1] [Google Cloud Vision: detección y extracción OCR de imágenes](https://docs.cloud.google.com/vision/docs/ocr)

[2] [DeepL: acceso y autenticación de la API](https://developers.deepl.com/docs/getting-started/auth)

[3] [DeepL: crear y administrar claves API](https://support.deepl.com/hc/en-us/articles/360020695820-API-key-for-DeepL-API)
