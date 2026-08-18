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

export type DriveItem = z.infer<typeof DriveItemSchema>;
export type DriveCourse = z.infer<typeof DriveCourseSchema>;

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
