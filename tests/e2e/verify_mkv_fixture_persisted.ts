import assert from "node:assert/strict";
import { execFile, execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { desc, eq } from "drizzle-orm";
import { extractedVideos, users, zipImports } from "../../drizzle/schema";
import { completeZipImport, createZipImport, getDb, getExtractedVideoById, setExtractedVideoProcessingStatus } from "../../server/db";
import { storagePut } from "../../server/storage";
import { extractZipFile } from "../../server/zipImport";
import { processQueuedVideoSource } from "../../workers/process_queued_video";

const run = promisify(execFile);
const db = await getDb();
assert(db, "La prueba integrada requiere acceso a la base de datos del proyecto.");
const [owner] = await db.select().from(users).orderBy(desc(users.id)).limit(1);
assert(owner, "La prueba integrada requiere al menos un usuario registrado.");

const directory = await mkdtemp(join(tmpdir(), "curso-drive-persisted-mkv-"));
const fixtureId = `fixture-mkv-${crypto.randomUUID()}`;
let importId: number | undefined;

try {
  const mkvPath = join(directory, "leccion-persistida.mkv");
  const zipPath = join(directory, "fixture-persistido.zip");
  const extractedMkvPath = join(directory, "extraido-desde-zip.mkv");
  await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=160x90:rate=12", "-t", "0.25", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", mkvPath]);
  await run("zip", ["-j", zipPath, mkvPath]);
  const sourceBytes = (await stat(zipPath)).size;
  const zipImport = await createZipImport({ zipId: fixtureId, courseId: "fixture-course", sourceName: "fixture-persistido.zip", importedByUserId: owner.id });
  importId = zipImport.id;
  const extracted = await extractZipFile({ archivePath: zipPath, importId, sourceBytes });
  await completeZipImport({ importId, sourceBytes, videos: extracted.videos });

  const [queued] = await db.select().from(extractedVideos).where(eq(extractedVideos.zipImportId, importId)).limit(1);
  assert.equal(queued?.processingStatus, "queued");
  assert.equal(queued?.storageUrl, null);
  assert(queued, "No se persistió el vídeo MKV en cola.");

  const extractedBytes = execFileSync("unzip", ["-p", zipPath, "leccion-persistida.mkv"], { encoding: "buffer", maxBuffer: 5 * 1024 * 1024 });
  await writeFile(extractedMkvPath, extractedBytes);
  const persistedStates = [queued.processingStatus];
  await processQueuedVideoSource({ videoId: queued.id, zipImportId: importId, sourcePath: extractedMkvPath, outputDirectory: directory }, {
    updateStatus: async (update) => {
      await setExtractedVideoProcessingStatus({ videoId: queued.id, ...update });
      const persisted = await getExtractedVideoById(queued.id);
      assert.equal(persisted?.processingStatus, update.status);
      persistedStates.push(persisted!.processingStatus);
    },
    upload: storagePut,
  });

  const ready = await getExtractedVideoById(queued.id);
  assert.equal(ready?.processingStatus, "ready");
  assert.equal(ready?.processingMessage, null);
  assert.equal(ready?.mimeType, "video/mp4");
  assert(ready?.storageUrl?.startsWith("/manus-storage/"), "El MP4 no se publicó en almacenamiento gestionado.");

  const origin = process.env.TEST_APP_ORIGIN ?? "http://localhost:3000";
  const response = await fetch(`${origin}${ready.storageUrl}`);
  assert.equal(response.ok, true);
  const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name", "-of", "json", `${origin}${ready.storageUrl}`]);
  assert(JSON.parse(stdout).streams.some((stream: { codec_name: string }) => stream.codec_name === "h264"), "El objeto publicado no contiene vídeo H.264.");
  assert.deepEqual(persistedStates, ["queued", "processing", "ready"]);
  console.log(JSON.stringify({ fixtureId, importId, transitions: persistedStates, storageUrl: ready.storageUrl }, null, 2));
} finally {
  if (importId) await db.delete(zipImports).where(eq(zipImports.id, importId));
  await rm(directory, { recursive: true, force: true });
}

process.exit(0);
