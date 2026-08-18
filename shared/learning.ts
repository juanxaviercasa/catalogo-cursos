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
  status: z.literal("placeholder"),
  workerStatus: z.literal("not_configured"),
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

export type DriveItem = z.infer<typeof DriveItemSchema>;
export type DriveCourse = z.infer<typeof DriveCourseSchema>;
export type VideoProcessingSetup = z.infer<typeof VideoProcessingSetupSchema>;

export const videoProcessingSetup: VideoProcessingSetup = {
  status: "placeholder",
  workerStatus: "not_configured",
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
