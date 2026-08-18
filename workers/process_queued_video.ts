import { createWriteStream } from "node:fs";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { spawn } from "node:child_process";
import { getExtractedVideoById, getZipImportById, setExtractedVideoProcessingStatus } from "../server/db";
import { storagePut } from "../server/storage";
import { convertToBrowserMp4 } from "./local_video_processor.mjs";

const MAX_ZIP_BYTES = 350 * 1024 * 1024;
const MAX_VIDEO_BYTES = 150 * 1024 * 1024;

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function extractQueuedSource(input: { zipId: string; sourcePath: string; videoId: number; outputDirectory: string }) {
  await mkdir(input.outputDirectory, { recursive: true });
  const zipPath = join(input.outputDirectory, `source-${input.videoId}.zip`);
  const sourcePath = join(input.outputDirectory, `source-${input.videoId}${extname(input.sourcePath) || ".bin"}`);
  const downloadUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(input.zipId)}&export=download&confirm=t`;
  const response = await fetch(downloadUrl, { redirect: "follow" });
  if (!response.ok || !response.body) throw new Error("Google Drive no permitió recuperar el ZIP para la conversión.");
  const declaredSize = Number(response.headers.get("content-length") ?? 0);
  if (declaredSize && declaredSize > MAX_ZIP_BYTES) throw new Error("El ZIP supera el límite seguro de conversión local.");
  await pipeline(Readable.fromWeb(response.body as never), createWriteStream(zipPath));

  await new Promise<void>((resolve, reject) => {
    const child = spawn("unzip", ["-p", zipPath, input.sourcePath]);
    const output = createWriteStream(sourcePath, { flags: "wx" });
    child.on("error", reject);
    output.on("error", reject);
    child.stdout.pipe(output);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error("No se pudo extraer el vídeo indicado del ZIP.")));
  });
  const sourceStats = await stat(sourcePath);
  if (!sourceStats.size || sourceStats.size > MAX_VIDEO_BYTES) throw new Error("El vídeo incompatible supera el límite seguro de conversión local.");
  return { sourcePath, zipPath };
}

async function main() {
  const videoId = Number(argument("--video-id"));
  const inputPath = argument("--input");
  const outputDirectory = argument("--output-dir") ?? "/tmp/curso-drive-conversion";
  if (!Number.isInteger(videoId) || videoId <= 0) throw new Error("Uso: pnpm tsx workers/process_queued_video.ts --video-id <id> [--input <archivo.mkv>] [--output-dir <directorio>]");

  const video = await getExtractedVideoById(videoId);
  if (!video) throw new Error("No existe el vídeo en cola solicitado.");
  if (video.processingStatus !== "queued" && video.processingStatus !== "failed") throw new Error(`El vídeo no está disponible para procesar; estado actual: ${video.processingStatus}.`);

  await setExtractedVideoProcessingStatus({ videoId, status: "processing", message: "Analizando códecs y preparando el MP4." });
  let temporarySource: { sourcePath: string; zipPath: string } | undefined;
  try {
    let source = inputPath;
    if (!source) {
      const zipImport = await getZipImportById(video.zipImportId);
      if (!zipImport) throw new Error("No existe la importación ZIP asociada al vídeo en cola.");
      temporarySource = await extractQueuedSource({ zipId: zipImport.zipId, sourcePath: video.sourcePath, videoId, outputDirectory });
      source = temporarySource.sourcePath;
    }
    const result = await convertToBrowserMp4(source, outputDirectory);
    const bytes = await readFile(result.outputPath);
    const stored = await storagePut(`course-imports/${video.zipImportId}/converted/${basename(result.outputPath)}`, bytes, "video/mp4");
    await setExtractedVideoProcessingStatus({
      videoId,
      status: "ready",
      storage: { key: stored.key, url: stored.url, mimeType: "video/mp4", sizeBytes: bytes.byteLength },
    });
    console.log(JSON.stringify({ videoId, status: "ready", mode: result.mode, storageUrl: stored.url }, null, 2));
  } catch (error) {
    const message = error instanceof Error ? error.message : "La conversión no terminó.";
    await setExtractedVideoProcessingStatus({ videoId, status: "failed", message: message.slice(0, 2000) });
    throw error;
  } finally {
    if (temporarySource) await Promise.all([rm(temporarySource.sourcePath, { force: true }), rm(temporarySource.zipPath, { force: true })]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
