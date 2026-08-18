import { describe, expect, it } from "vitest";
import { VideoProcessingSetupSchema, videoProcessingSetup } from "../shared/learning";

describe("placeholder de conversión de vídeo", () => {
  it("expone opciones sin claves reales y mantiene una ruta gratuita", () => {
    expect(VideoProcessingSetupSchema.parse(videoProcessingSetup).workerStatus).toBe("not_configured");
    expect(videoProcessingSetup.providers.some((provider) => provider.tier === "free")).toBe(true);
    expect(videoProcessingSetup.placeholders.every((field) => field.example.includes("REEMPLAZAR") || field.key === "VIDEO_PROCESSOR_MODE")).toBe(true);
  });
});
