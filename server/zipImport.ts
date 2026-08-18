import { createWriteStream, promises as fs } from "node:fs";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import yauzl, { type Entry, type ZipFile } from "yauzl";
import { storagePut } from "./storage";

const MAX_ZIP_BYTES = 350 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
const MAX_TOTAL_VIDEO_BYTES = 300 * 1024 * 1024;
const MAX_VIDEO_COUNT = 30;
const VIDEO_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  mkv: "video/x-matroska",
};

export type ExtractedVideo = {
  sourcePath: string;
  title: string;
  sourceMimeType: string;
  storageKey: string | null;
  storageUrl: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  sortOrder: number;
  processingStatus: "queued" | "processing" | "ready" | "failed";
  processingMessage: string | null;
  wasTranscoded: boolean;
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

export function canPlayInBrowser(mimeType: string) {
  return mimeType === "video/mp4" || mimeType === "video/webm";
}

async function readEntryBuffer(stream: Readable, maximumBytes: number) {
  const chunks: Buffer[] = [];
  let currentBytes = 0;
  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    currentBytes += buffer.length;
    if (currentBytes > maximumBytes) {
      stream.destroy();
      throw new Error("Un vídeo compatible supera el límite seguro de 150 MB para esta plataforma.");
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks, currentBytes);
}

function openArchive(path: string): Promise<ZipFile> {
  return new Promise((resolve, reject) => {
    yauzl.open(path, { lazyEntries: true, autoClose: false, validateEntrySizes: true }, (error, archive) => {
      if (error || !archive) reject(error ?? new Error("No se pudo abrir el ZIP."));
      else resolve(archive);
    });
  });
}

function openEntryStream(archive: ZipFile, entry: Entry): Promise<Readable> {
  return new Promise((resolve, reject) => {
    archive.openReadStream(entry, (error, stream) => {
      if (error || !stream) reject(error ?? new Error("No se pudo leer una entrada del ZIP."));
      else resolve(stream);
    });
  });
}

export async function extractPublicDriveZip(input: { zipId: string; sourceName: string; importId: number }) {
  const downloadUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(input.zipId)}&export=download&confirm=t`;
  const response = await fetch(downloadUrl, { redirect: "follow" });
  if (!response.ok || !response.body) throw new Error("Google Drive no permitió leer el ZIP seleccionado.");

  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize && declaredSize > MAX_ZIP_BYTES) {
    throw new Error("El ZIP supera el límite de importación segura de 350 MB.");
  }

  const temporaryFile = `/tmp/drive-zip-${input.importId}-${crypto.randomUUID()}.zip`;
  const videos: ExtractedVideo[] = [];
  let totalVideoBytes = 0;
  let downloadedBytes = 0;

  try {
    const limit = new Transform({
      transform(chunk, _encoding, callback) {
        downloadedBytes += chunk.length;
        if (downloadedBytes > MAX_ZIP_BYTES) callback(new Error("El ZIP supera el límite de importación segura de 350 MB."));
        else callback(null, chunk);
      },
    });
    await pipeline(Readable.fromWeb(response.body as never), limit, createWriteStream(temporaryFile, { flags: "wx" }));

    const archive = await openArchive(temporaryFile);
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        archive.close();
        reject(error instanceof Error ? error : new Error(String(error)));
      };
      const next = () => { if (!settled) archive.readEntry(); };

      archive.on("error", fail);
      archive.on("end", () => { if (!settled) { settled = true; archive.close(); resolve(); } });
      archive.on("entry", (entry) => {
        const path = archiveEntryName(entry.fileName);
        const mimeType = path ? videoType(path) : null;
        const uncompressedSize = Number(entry.uncompressedSize ?? 0);

        if (!path || entry.fileName.endsWith("/") || !mimeType) return next();
        if (videos.length >= MAX_VIDEO_COUNT) return fail(new Error("El ZIP supera el límite de 30 vídeos por importación."));
        if (!uncompressedSize || uncompressedSize > MAX_VIDEO_BYTES || totalVideoBytes + uncompressedSize > MAX_TOTAL_VIDEO_BYTES) {
          return fail(new Error("Uno de los vídeos supera el límite seguro de la importación."));
        }

        if (!canPlayInBrowser(mimeType)) {
          totalVideoBytes += uncompressedSize;
          videos.push({
            sourcePath: path,
            title: path.split("/").pop()?.replace(/\.(mp4|webm|mov|m4v|mkv)$/i, "") ?? path,
            sourceMimeType: mimeType,
            storageKey: null,
            storageUrl: null,
            mimeType: null,
            sizeBytes: uncompressedSize,
            sortOrder: videos.length + 1,
            processingStatus: "queued",
            processingMessage: "Pendiente de conversión a MP4 compatible.",
            wasTranscoded: false,
          });
          return next();
        }

        openEntryStream(archive, entry).then(async (stream) => {
          totalVideoBytes += uncompressedSize;
          const videoBytes = await readEntryBuffer(stream, MAX_VIDEO_BYTES);
          const stored = await storagePut(`course-imports/${input.importId}/${safeStorageName(path)}`, videoBytes, mimeType);
          videos.push({
            sourcePath: path,
            title: path.split("/").pop()?.replace(/\.(mp4|webm|mov|m4v|mkv)$/i, "") ?? path,
            sourceMimeType: mimeType,
            storageKey: stored.key,
            storageUrl: stored.url,
            mimeType,
            sizeBytes: uncompressedSize,
            sortOrder: videos.length + 1,
            processingStatus: "ready",
            processingMessage: null,
            wasTranscoded: false,
          });
          next();
        }).catch(fail);
      });
      next();
    });
  } finally {
    await fs.unlink(temporaryFile).catch(() => undefined);
  }

  if (!videos.length) throw new Error("El ZIP no contiene vídeos compatibles para reproducir.");
  return { videos, sourceBytes: declaredSize || null };
}

export const zipImportLimits = {
  maxZipBytes: MAX_ZIP_BYTES,
  maxVideoCount: MAX_VIDEO_COUNT,
};
