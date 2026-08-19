import { z } from "zod";

export const DriveItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  kind: z.enum(["file", "folder"]),
  webViewLink: z.string().url(),
});

export const DriveCourseSchema = z.object({
  id: z.string(),
  name: z.string(),
  webViewLink: z.string().url(),
  children: z.array(DriveItemSchema),
});

export const DriveCatalogSchema = z.array(DriveCourseSchema);

export const VideoProcessingSetupSchema = z.object({
  status: z.enum(["placeholder", "pilot_ready"]),
  workerStatus: z.enum(["not_configured", "pilot_complete", "configured"]),
  activeMode: z.enum(["local-worker", "persistent-worker"]).nullable(),
  selectedMode: z.enum(["local-worker", "persistent-worker"]).nullable(),
  modeAvailability: z.object({ localWorker: z.boolean(), persistentWorker: z.boolean() }),
  availability: z.object({
    queued: z.number().int().nonnegative(),
    processing: z.number().int().nonnegative(),
    ready: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    transcoded: z.number().int().nonnegative(),
  }),
  storage: z.object({
    provider: z.literal("managed-object-storage"),
    description: z.string(),
  }),
  providers: z.array(z.object({
    id: z.enum(["local-worker", "persistent-worker", "managed-provider"]),
    label: z.string(),
    tier: z.enum(["free", "optional-paid"]),
    description: z.string(),
    requirement: z.string(),
  })),
  placeholders: z.array(z.object({ key: z.string(), purpose: z.string(), example: z.string() })),
});

export const DubbingSetupSchema = z.object({
  status: z.literal("placeholder"),
  sourceLanguage: z.literal("en"),
  targetLanguage: z.literal("es"),
  pipeline: z.array(z.object({ step: z.string(), output: z.string() })),
  providers: z.array(z.object({
    id: z.enum(["local-stack", "elevenlabs", "azure-speech", "google-cloud"]),
    label: z.string(),
    tier: z.enum(["free", "optional-paid"]),
    recommended: z.boolean(),
    description: z.string(),
  })),
  placeholders: z.array(z.object({ key: z.string(), purpose: z.string(), example: z.string() })),
});

export const PdfTranslationSummarySchema = z.object({
  id: z.number(),
  courseId: z.string(),
  moduleId: z.string(),
  sourceUrl: z.string().url(),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  status: z.enum(["queued", "extracting", "translating", "reconstructing", "ready", "failed"]),
  processingMode: z.enum(["local-worker", "persistent-worker"]),
  reconstructedStorageUrl: z.string().nullable(),
  pageCount: z.number().nullable(),
  errorMessage: z.string().nullable(),
  preparedAt: z.date().nullable(),
});

export const PdfVisualLocalizationSchema = z.object({
  id: z.number(),
  pageNumber: z.number().int().positive(),
  sourceImageUrl: z.string(),
  localizedStorageUrl: z.string().nullable(),
  sourceText: z.string(),
  translatedText: z.string(),
  status: z.enum(["queued", "rendering", "review", "ready", "failed"]),
  provider: z.string(),
  errorMessage: z.string().nullable(),
  reviewedAt: z.date().nullable(),
});

export const PdfTranslationDocumentSchema = PdfTranslationSummarySchema.extend({
  segments: z.array(z.object({ id: z.number(), pageNumber: z.number(), segmentOrder: z.number(), sourceText: z.string(), translatedText: z.string() })),
  visualLocalizations: z.array(PdfVisualLocalizationSchema),
});

export const PdfTranslationSetupSchema = z.object({
  ocr: z.object({ provider: z.literal("tesseract-local"), tier: z.literal("free"), status: z.enum(["available", "not_configured"]), description: z.string() }),
  providers: z.array(z.object({ id: z.enum(["argos-local", "deepl", "google-cloud"]), label: z.string(), tier: z.enum(["free", "optional-paid"]), recommended: z.boolean(), description: z.string() })),
  visualLocalization: z.object({ provider: z.literal("image-service"), status: z.enum(["pilot_ready", "available"]), description: z.string(), requiresReview: z.literal(true) }),
  placeholders: z.array(z.object({ key: z.string(), purpose: z.string(), example: z.string() })),
});

export type DriveItem = z.infer<typeof DriveItemSchema>;
export type DriveCourse = z.infer<typeof DriveCourseSchema>;
export type VideoProcessingSetup = z.infer<typeof VideoProcessingSetupSchema>;
export type DubbingSetup = z.infer<typeof DubbingSetupSchema>;
export type PdfTranslationSummary = z.infer<typeof PdfTranslationSummarySchema>;
export type PdfTranslationDocument = z.infer<typeof PdfTranslationDocumentSchema>;
export type PdfVisualLocalization = z.infer<typeof PdfVisualLocalizationSchema>;
export type PdfTranslationSetup = z.infer<typeof PdfTranslationSetupSchema>;

export const pdfTranslationSetup: PdfTranslationSetup = {
  ocr: { provider: "tesseract-local", tier: "free", status: "available", description: "OCR local para páginas escaneadas o sin texto seleccionable; procesa el documento en el trabajador sin enviarlo a un proveedor externo." },
  providers: [
    { id: "argos-local", label: "Argos Translate local", tier: "free", recommended: true, description: "Ruta actual de texto extraíble y OCR local. No requiere una API de pago, pero exige revisión de terminología." },
    { id: "deepl", label: "DeepL API", tier: "optional-paid", recommended: false, description: "Alternativa opcional para mayor fluidez y glosarios; su traducción de documentos e imágenes se configura con una clave privada del servidor." },
    { id: "google-cloud", label: "Google Cloud Vision + Translate", tier: "optional-paid", recommended: false, description: "Alternativa para OCR estructurado y traducción a escala; requiere proyecto, facturación y credenciales seguras." },
  ],
  visualLocalization: { provider: "image-service", status: "pilot_ready", description: "Genera una variante visual en español a partir de una imagen de origen, manteniendo el original como referencia y dejando el resultado para revisión humana.", requiresReview: true },
  placeholders: [
    { key: "DEEPL_API_KEY", purpose: "Activa DeepL como traductor opcional de mayor calidad desde el servidor.", example: "REEMPLAZAR_CON_CLAVE_DEEPL" },
    { key: "GOOGLE_CLOUD_VISION_CREDENTIALS", purpose: "Credenciales del proyecto de Google para OCR estructurado opcional.", example: "REEMPLAZAR_CON_JSON_O_REFERENCIA_SEGURA" },
    { key: "GOOGLE_TRANSLATE_API_KEY", purpose: "Clave privada de Google Cloud Translation para la ruta opcional de pago.", example: "REEMPLAZAR_CON_CLAVE_GOOGLE" },
  ],
};

export const videoProcessingSetup: VideoProcessingSetup = {
  status: "placeholder",
  workerStatus: "not_configured",
  activeMode: null,
  selectedMode: null,
  modeAvailability: { localWorker: false, persistentWorker: false },
  availability: { queued: 0, processing: 0, ready: 0, failed: 0, transcoded: 0 },
  storage: {
    provider: "managed-object-storage",
    description: "Los vídeos listos se guardan fuera del navegador y se sirven por URL firmada desde el almacenamiento gestionado del sitio.",
  },
  providers: [
    {
      id: "local-worker",
      label: "Tu propio equipo",
      tier: "free",
      description: "Ejecuta la conversión con FFmpeg en tu ordenador cuando lo tengas encendido; conserva MP4/WebM y transforma únicamente formatos no compatibles.",
      requirement: "Instalar FFmpeg y completar la URL del trabajador y el secreto compartido.",
    },
    {
      id: "persistent-worker",
      label: "Máquina de procesamiento persistente",
      tier: "optional-paid",
      description: "Convierte en segundo plano aunque tu ordenador esté apagado, adecuada para varios cursos o bibliotecas grandes.",
      requirement: "Conectar una máquina con FFmpeg y completar la URL del trabajador y el secreto compartido.",
    },
    {
      id: "managed-provider",
      label: "Servicio gestionado de conversión",
      tier: "optional-paid",
      description: "Externaliza la conversión a un proveedor compatible mediante API, manteniendo la web y los vídeos separados.",
      requirement: "Seleccionar proveedor y añadir sus credenciales en la configuración segura del proyecto.",
    },
  ],
  placeholders: [
    { key: "VIDEO_PROCESSOR_URL", purpose: "URL HTTPS del servicio que ejecuta la conversión.", example: "https://REEMPLAZAR-PROCESADOR.example/process" },
    { key: "VIDEO_PROCESSOR_SHARED_SECRET", purpose: "Autentica las solicitudes entre la plataforma y el procesador.", example: "REEMPLAZAR_CON_UN_SECRETO_LARGO" },
    { key: "VIDEO_PROCESSOR_MODE", purpose: "Selecciona el proveedor activo.", example: "local-worker | persistent-worker | managed-provider" },
  ],
};

export const dubbingSetup: DubbingSetup = {
  status: "placeholder",
  sourceLanguage: "en",
  targetLanguage: "es",
  pipeline: [
    { step: "Analizar y transcribir", output: "Guion inglés con marcas de tiempo" },
    { step: "Traducir", output: "Guion español revisable" },
    { step: "Sintetizar voz neural", output: "Fragmentos de audio español" },
    { step: "Sincronizar y publicar", output: "Pista española y subtítulos" },
  ],
  providers: [
    { id: "local-stack", label: "Ruta local compuesta", tier: "free", recommended: false, description: "Transcripción, traducción y voz en tu propio equipo. Sin coste por minuto, con más instalación y revisión manual." },
    { id: "google-cloud", label: "Google Cloud Speech + TTS", tier: "optional-paid", recommended: false, description: "Cadena modular de transcripción, traducción y voces neuronales con cuota inicial gratuita de síntesis en ciertos modelos." },
    { id: "azure-speech", label: "Azure Speech", tier: "optional-paid", recommended: false, description: "Alternativa para una futura escucha traducida de baja latencia; requiere integrar traducción y síntesis de voz." },
    { id: "elevenlabs", label: "ElevenLabs Dubbing", tier: "optional-paid", recommended: false, description: "Alternativa de pago para cursos grabados: integra doblaje de vídeo y conservación de fondo como trabajo asíncrono." },
  ],
  placeholders: [
    { key: "DUBBING_PROVIDER_MODE", purpose: "Selecciona el proveedor de doblaje.", example: "local-stack | elevenlabs | azure-speech | google-cloud" },
    { key: "DUBBING_PROVIDER_API_KEY", purpose: "Clave privada del proveedor seleccionado.", example: "REEMPLAZAR_CON_LA_CLAVE_DEL_PROVEEDOR" },
    { key: "DUBBING_WEBHOOK_SECRET", purpose: "Verifica los resultados asíncronos de procesamiento.", example: "REEMPLAZAR_CON_UN_SECRETO_LARGO" },
  ],
};

export type ContentType = "video" | "zip" | "pdf" | "folder" | "other";

export function getContentType(item: DriveItem): ContentType {
  const name = item.name.toLowerCase();
  const mime = item.mimeType.toLowerCase();
  if (item.kind === "folder") return "folder";
  if (mime.includes("video") || name.endsWith(".mp4") || name.endsWith(".ts")) return "video";
  if (mime.includes("zip") || name.endsWith(".zip")) return "zip";
  if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
  return "other";
}

export function orderedModules(items: DriveItem[]) {
  return [...items].sort((left, right) => {
    const numberOf = (name: string) => Number(name.match(/^\s*(\d+(?:\.\d+)?)/)?.[1] ?? Number.MAX_SAFE_INTEGER);
    const difference = numberOf(left.name) - numberOf(right.name);
    return difference !== 0 ? difference : left.name.localeCompare(right.name, "es", { numeric: true });
  });
}

export function calculateProgress(moduleIds: string[], completedIds: Set<string>) {
  if (!moduleIds.length) return 0;
  return Math.round((moduleIds.filter((id) => completedIds.has(id)).length / moduleIds.length) * 100);
}
