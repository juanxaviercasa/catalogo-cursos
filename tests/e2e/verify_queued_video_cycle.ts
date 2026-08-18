import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { getExtractedVideoById, setExtractedVideoProcessingStatus } from "../../server/db";

const videoId = Number(process.env.QUEUE_CYCLE_VIDEO_ID ?? 30003);
const queuedMessage = "Prueba integrada: pendiente de recuperación automática desde el ZIP de Drive.";

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), stdio: "inherit", env: process.env });
    child.on("error", reject);
    child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`El trabajador terminó con código ${code}.`)));
  });
}

const before = await getExtractedVideoById(videoId);
assert(before, "No se encontró el vídeo real para la prueba integrada.");
assert(before.wasTranscoded, "La prueba debe ejecutarse contra un vídeo previamente convertido del ZIP piloto.");

await setExtractedVideoProcessingStatus({ videoId, status: "queued", message: queuedMessage });
const queued = await getExtractedVideoById(videoId);
assert.equal(queued?.processingStatus, "queued");
assert.equal(queued?.processingMessage, queuedMessage);

await run("pnpm", ["tsx", "workers/process_queued_video.ts", "--video-id", String(videoId), "--output-dir", "/tmp/curso-drive-queue-cycle"]);

const ready = await getExtractedVideoById(videoId);
assert.equal(ready?.processingStatus, "ready");
assert.equal(ready?.processingMessage, null);
assert.equal(ready?.mimeType, "video/mp4");
assert(ready?.storageUrl?.includes("/manus-storage/course-imports/1/converted/"), "El MP4 final no se publicó en el almacenamiento gestionado.");
console.log(JSON.stringify({ videoId, from: "queued", to: ready?.processingStatus, storageUrl: ready?.storageUrl }, null, 2));
