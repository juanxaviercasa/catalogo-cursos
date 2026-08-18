import { Readable } from "node:stream";
import unzipper from "unzipper";
import { storagePutStream } from "./storage";

const MAX_ZIP_BYTES = 350 * 1024 * 1024;
const MAX_VIDEO_BYTES = 320 * 1024 * 1024;
const MAX_TOTAL_VIDEO_BYTES = 600 * 1024 * 1024;
const MAX_VIDEO_COUNT = 30;
const VIDEO_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
};

export type ExtractedVideo = {
  sourcePath: string;
  title: string;
  storageKey: string;
  storageUrl: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
};

export function archiveEntryName(path: string) {
  const normalized = path.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").some((part) => part === "..")) return null;
  return normalized;
}

export function videoType(path: string) {
  const extension = path.toLowerCase().split(".").pop() ?? "";
  return VIDEO_TYPES[extension] ?? null;
}

function safeStorageName(path: string) {
  return path.replaceAll(/[^a-zA-Z0-9._-]+/g, "-").replaceAll(/-+/g, "-").slice(-170);
}

export async function extractPublicDriveZip(input: { zipId: string; sourceName: string; importId: number }) {
  const downloadUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(input.zipId)}&export=download&confirm=t`;
  const response = await fetch(downloadUrl, { redirect: "follow" });
  if (!response.ok || !response.body) throw new Error("Google Drive no permitió leer el ZIP seleccionado.");

  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize && declaredSize > MAX_ZIP_BYTES) {
    throw new Error("El ZIP supera el límite de importación segura de 350 MB.");
  }

  const source = Readable.fromWeb(response.body as never);
  const parser = source.pipe(unzipper.Parse({ forceStream: true }));
  const videos: ExtractedVideo[] = [];
  let totalVideoBytes = 0;

  try {
    for await (const entry of parser as AsyncIterable<any>) {
      const path = archiveEntryName(String(entry.path ?? ""));
      const mimeType = path ? videoType(path) : null;
      const uncompressedSize = Number(entry.vars?.uncompressedSize ?? 0);

      if (!path || entry.type !== "File" || !mimeType) {
        entry.autodrain();
        continue;
      }
      if (videos.length >= MAX_VIDEO_COUNT) {
        entry.autodrain();
        throw new Error("El ZIP supera el límite de 30 vídeos por importación.");
      }
      if (!uncompressedSize || uncompressedSize > MAX_VIDEO_BYTES || totalVideoBytes + uncompressedSize > MAX_TOTAL_VIDEO_BYTES) {
        entry.autodrain();
        throw new Error("Uno de los vídeos supera el límite seguro de la importación.");
      }

      totalVideoBytes += uncompressedSize;
      const stored = await storagePutStream(
        `course-imports/${input.importId}/${safeStorageName(path)}`,
        entry as Readable,
        mimeType,
      );
      videos.push({
        sourcePath: path,
        title: path.split("/").pop()?.replace(/\.(mp4|webm|mov|m4v)$/i, "") ?? path,
        storageKey: stored.key,
        storageUrl: stored.url,
        mimeType,
        sizeBytes: uncompressedSize,
        sortOrder: videos.length + 1,
      });
    }
  } finally {
    source.destroy();
  }

  if (!videos.length) throw new Error("El ZIP no contiene vídeos compatibles para reproducir.");
  return { videos, sourceBytes: declaredSize || null };
}

export const zipImportLimits = {
  maxZipBytes: MAX_ZIP_BYTES,
  maxVideoCount: MAX_VIDEO_COUNT,
};
