import { describe, expect, it } from "vitest";
import { VideoProcessingSetupSchema, videoProcessingSetup } from "../shared/learning";
import { canRemuxToMp4, safeMp4Name } from "../workers/local_video_processor.mjs";

describe("configuración de conversión de vídeo", () => {
  it("expone opciones sin claves reales, conserva una ruta gratuita y valida estados de disponibilidad", () => {
    expect(VideoProcessingSetupSchema.parse(videoProcessingSetup).workerStatus).toBe("not_configured");
    expect(videoProcessingSetup.activeMode).toBeNull();
    expect(videoProcessingSetup.providers.some((provider) => provider.tier === "free")).toBe(true);
    expect(videoProcessingSetup.placeholders.every((field) => field.example.includes("REEMPLAZAR") || field.key === "VIDEO_PROCESSOR_MODE")).toBe(true);
    expect(VideoProcessingSetupSchema.parse({ ...videoProcessingSetup, status: "pilot_ready", workerStatus: "configured", activeMode: "local-worker", availability: { queued: 0, processing: 0, ready: 6, failed: 0, transcoded: 5 } }).availability.transcoded).toBe(5);
  });

  it("conserva códecs ya compatibles y normaliza los nombres para objetos almacenables", () => {
    expect(canRemuxToMp4("h264", "aac")).toBe(true);
    expect(canRemuxToMp4("hevc", "aac")).toBe(false);
    expect(canRemuxToMp4("h264", "opus")).toBe(false);
    expect(safeMp4Name("05- Active VS Passive Income (Make Money While You Sleep).mkv")).toBe("05-active-vs-passive-income-make-money-while-you-sleep.mp4");
  });
});
