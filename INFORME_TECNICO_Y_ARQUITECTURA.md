# 📚 Catálogo de Cursos & Pipeline Multimedia — Informe Técnico y Arquitectura

> **Documento de auditoría técnica, desacoplamiento y estado de implementación del proyecto.**  
> *Fecha de actualización: 24 de septiembre de 2026*  
> *Repositorio: [`juanxaviercasa/catalogo-cursos`](https://github.com/juanxaviercasa/catalogo-cursos)*

---

## 1. Resumen Ejecutivo y Diagnóstico Inicial

El proyecto es una plataforma web educativa (*EdTech*) construida con **React 19, TypeScript, Express, tRPC, Drizzle ORM (MySQL) y Tailwind CSS**, diseñada para catalogar **170 cursos** procedentes de **Google Drive** y **Terabox**. La plataforma incluye navegación por rutas pedagógicas, progreso por usuario, importación de vídeos ZIP, lectura bilingüe de PDFs y reproducción de vídeos con audio original o doblado al español y subtítulos.

### El Bloqueo "Manus Sandbox" Identificado
El repositorio original fue generado dentro del entorno cerrado de *Manus*, dejando acoplamientos rígidos que impedían su funcionamiento en entornos independientes:
1. **Almacenamiento de Objetos (`BUILT_IN_FORGE_API_URL`):** Todos los archivos multimedia (vídeos, audios, PDFs reconstruidos, portadas) dependían de un servicio proxy de almacenamiento propietario de Manus (`/manus-storage/*`).
2. **Catálogo de Google Drive Faltante:** La lista detallada de módulos de Google Drive se descargaba de un archivo JSON alojado exclusivamente en el storage interno de Manus (`drive_courses_inventory_...json`), ausente en el repositorio Git.
3. **Autenticación Externa Obligatoria:** El flujo OAuth apuntaba a servidores internos de Manus, impidiendo iniciar sesión localmente o acceder a paneles administrativos.
4. **Dependencias Unix incompatibles con Windows:** Rutas `/tmp/...`, llamadas de sistema al comando Unix `unzip` (no presente en Windows) y fuentes del sistema Linux (`/usr/share/fonts/...`).

---

## 2. Decisiones de Arquitectura: Almacenamiento y Traducción

### ¿Conviene o no almacenar las traducciones generadas?

| Tipo de Recurso | Decisión | Justificación Técnica | Destino de Persistencia |
| :--- | :---: | :--- | :--- |
| **Subtítulos (`.vtt` / `.srt`)** | **SÍ, 100% obligatorio** | Pasan de segundos a KB (~20-80 KB por lección). Generarlos al vuelo durante el streaming en el navegador es inviable. | Almacenamiento de objetos (S3 / R2 / local) y enlace en `media_tracks`. |
| **Pista de Audio Doblada (`.mp3` / `.aac`)** | **SÍ, indispensable** | La transcripción (Whisper) y síntesis neural (TTS) toma varios minutos por vídeo según la CPU/GPU. Un MP3 doblado a 128 kbps pesa solo ~1 MB por minuto (~15 MB por un vídeo de 15 min). | Almacenamiento de objetos (S3 / R2 / local) y enlace en `media_tracks`. |
| **Vídeo Completo Re-renderizado** | **NO conveniente** | Re-renderizar el vídeo completo cuadruplica el almacenamiento (cientos de megabytes por lección) y consume CPU innecesaria. Es superior almacenar solo la pista de audio secundaria y dejar que el reproductor web seleccione entre audio original o español. | No aplica (se conserva el vídeo base). |
| **Segmentos de Texto (PDFs y Vídeos)** | **SÍ, en Base de Datos** | Permite lectura bilingüe interactiva lado a lado, búsqueda rápida y corrección manual de términos erróneos por parte del docente/administrador. | Tablas relacionales (`pdf_translation_segments`, `transcript_segments`). |
| **PDF Reconstruido en Español** | **SÍ** | Una vez traducido el PDF, se guarda el documento generado para descarga directa del estudiante. | Almacenamiento de objetos (S3 / R2 / local). |

---

## 3. Implementaciones Realizadas

### Fase 1: Desacoplamiento de Almacenamiento y Autenticación
* **Almacenamiento Universal (`server/storage.ts`):**
  * Se implementó un adaptador que soporta tres modos:
    1. **Disco Local (Predeterminado):** Guarda en `./storage_data` sin requerir credenciales en la nube.
    2. **Cloudflare R2 / AWS S3 / MinIO:** Configurable mediante `S3_BUCKET`, `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, etc.
    3. **Forge:** Mantenido como retrocompatibilidad.
* **Streaming de Vídeo y Audio (`server/_core/storageProxy.ts`):**
  * Las rutas `/manus-storage/*` y `/storage/*` implementan **HTTP 206 Partial Content** (soporte de cabecera `Range`), permitiendo reproducción fluida y adelantado/retroceso en reproductores HTML5.
* **Autenticación Local y de Desarrollo (`server/_core/oauth.ts`, `server/_core/sdk.ts` y `client/src/const.ts`):**
  * Endpoint `/api/auth/dev-login` que emite una sesión firmada como Administrador (`role: "admin"`).
  * Si no hay un servidor OAuth configurado, el botón de la interfaz utiliza este inicio de sesión local de forma transparente.

### Fase 2: Reconstrucción y Carga del Catálogo Base
* **Catálogo Tipado de Respaldo (`shared/driveCatalogFallback.ts`):**
  * Se construyó la estructura completa de los **31 cursos de Google Drive**, incluyendo los módulos detallados de las colecciones verificadas (*Kinobody*, *YouTube Monetization* con su archivo ZIP piloto, etc.).
* **Fusión de Catálogo (`server/routers.ts`):**
  * La función `loadCatalog` carga de forma resiliente los 31 cursos de Drive combinados con los 139 cursos de Terabox, entregando un catálogo consolidado de **170 cursos** sin depender de recursos externos caídos.

### Fase 3: Multiplataforma y Pipeline de Doblaje
* **Extracción ZIP Nativa (`server/zipImport.ts`, `workers/process_queued_video.ts`):**
  * Se reemplazaron los comandos externos `unzip` por extracción en streaming mediante `yauzl`.
  * Se reemplazaron rutas `/tmp/...` por `os.tmpdir()`.
* **Registro de Doblaje (`server/db.ts` y `workers/register_dubbing_result.mjs`):**
  * Se implementó `saveMediaTrack` y un script ejecutable para subir audios doblados y subtítulos y vincularlos a la base de datos para su reproducción inmediata.
* **Configuración del Entorno (`.env.example`):**
  * Plantilla completa con todas las variables de base de datos, almacenamiento S3/R2 y motores de doblaje.

---

## 4. Estado de Validación y Pruebas

* **Pruebas Unitarias e Integración (`vitest`):**  
  `10/10 archivos de pruebas pasados, 27/27 tests ejecutados con éxito (100% de aprobación)`.
* **Chequeo de Tipos TypeScript (`tsc --noEmit`):**  
  `0 errores encontrados`.
* **Compilación Frontend (`vite build`):**  
  `Compilación de producción exitosa en dist/public`.
* **Prueba de Servidor en Vivo:**  
  * Endpoint de catálogo `learning.catalog` verificado: responde con los **170 cursos**.
  * Endpoint de autenticación `/api/auth/dev-login` verificado: responde con cookie de sesión y perfil de Administrador activo.
  * Página principal `http://localhost:3000/` verificada: status HTTP 200 con HTML completo.

---

## 5. Guía de Ejecución Rápida

### 1. Iniciar en Entorno Local
```powershell
# Iniciar el servidor en modo desarrollo
npm run dev
```
Accede a `http://localhost:3000/` en tu navegador.

### 2. Registrar un Doblaje Manualmente
Una vez generado el audio doblado y los subtítulos con el worker:
```powershell
npx tsx workers/register_dubbing_result.mjs <videoId> ruta/al/audio-es.mp3 ruta/al/subtitulos-es.vtt
```
Al refrescar la ficha del vídeo, el reproductor mostrará el selector `[Original · inglés | Español]` y activará los subtítulos VTT.

---

## 6. Siguientes Pasos Opcionales

1. **Base de Datos Persistente:** Conectar una base de datos MySQL configurando `DATABASE_URL` en `.env` y ejecutando `npm run db:push`.
2. **Almacenamiento en la Nube:** Migrar de `STORAGE_DRIVER=local` a `STORAGE_DRIVER=s3` apuntando a Cloudflare R2 para almacenamiento global sin costos de transferencia.
3. **Automatización de Doblaje:** Conectar el script de doblaje a una cola de tareas asíncrona para que se ejecute al pulsar un botón desde la interfaz web.
