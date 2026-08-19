import { execFile, execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { archiveEntryName, canPlayInBrowser, extractZipFile, videoType, zipImportLimits } from "./zipImport";
import { storagePut } from "./storage";
import { processQueuedVideoSource } from "../workers/process_queued_video";

const run = promisify(execFile);

describe("controles de extracción ZIP", () => {
  it("acepta únicamente rutas de archivo seguras", () => {
    expect(archiveEntryName("lecciones/01-introduccion.mp4")).toBe("lecciones/01-introduccion.mp4");
    expect(archiveEntryName("..\\secreto.mp4")).toBeNull();
    expect(archiveEntryName("/../../fuera.mp4")).toBeNull();
  });

  it("reconoce solo formatos de vídeo permitidos y mantiene límites explícitos", () => {
    expect(videoType("leccion.MP4")).toBe("video/mp4");
    expect(videoType("clase.webm")).toBe("video/webm");
    expect(videoType("clase.mkv")).toBe("video/x-matroska");
    expect(videoType("ejecutable.exe")).toBeNull();
    expect(canPlayInBrowser("video/mp4")).toBe(true);
    expect(canPlayInBrowser("video/webm")).toBe(true);
    expect(canPlayInBrowser("video/x-matroska")).toBe(false);
    expect(zipImportLimits.maxZipBytes).toBe(350 * 1024 * 1024);
    expect(zipImportLimits.maxVideoCount).toBe(30);
  });

  it("convierte un MKV real del ZIP local y publica su MP4 reproducible", async () => {
    const directory = await mkdtemp(join(tmpdir(), "curso-drive-mkv-fixture-"));
    const mkvPath = join(directory, "leccion-prueba.mkv");
    const extractedMkvPath = join(directory, "extraido-desde-zip.mkv");
    const zipPath = join(directory, "prueba-mkv.zip");
    try {
      await run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i", "testsrc=size=160x90:rate=12", "-t", "0.25", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-y", mkvPath]);
      await run("zip", ["-j", zipPath, mkvPath]);
      const sourceBytes = (await stat(zipPath)).size;
      const result = await extractZipFile({ archivePath: zipPath, importId: 999999, sourceBytes });

      expect(result.sourceBytes).toBe(sourceBytes);
      expect(result.videos).toHaveLength(1);
      expect(result.videos[0]).toMatchObject({
        sourcePath: "leccion-prueba.mkv",
        sourceMimeType: "video/x-matroska",
        processingStatus: "queued",
        processingMessage: "Pendiente de conversión a MP4 compatible.",
        storageUrl: null,
        storageKey: null,
        mimeType: null,
      });

      const extractedBytes = execFileSync("unzip", ["-p", zipPath, "leccion-prueba.mkv"], { encoding: "buffer", maxBuffer: 5 * 1024 * 1024 });
      await writeFile(extractedMkvPath, extractedBytes);
      const transitions: Array<{ status: string; message?: string | null; storage?: { key: string; url: string; mimeType: string; sizeBytes: number } }> = [];
      const conversion = await processQueuedVideoSource({ videoId: 999999, zipImportId: 999999, sourcePath: extractedMkvPath, outputDirectory: directory }, {
        updateStatus: async (update) => { transitions.push(update); },
        upload: storagePut,
      });
      const origin = process.env.TEST_APP_ORIGIN ?? "http://localhost:3000";
      const served = await fetch(`${origin}${conversion.storage.url}`);
      const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "stream=codec_name", "-of", "json", `${origin}${conversion.storage.url}`]);
      const servedCodecs = JSON.parse(stdout).streams.map((stream: { codec_name: string }) => stream.codec_name);

      expect(transitions.map((transition) => transition.status)).toEqual(["processing", "ready"]);
      expect(conversion.output.videoCodec).toBe("h264");
      expect(conversion.storage.url).toMatch(/^\/manus-storage\//);
      expect(served.ok).toBe(true);
      expect(servedCodecs).toContain("h264");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 20_000);
});
