import { describe, expect, it, vi } from "vitest";

describe("disparo del procesador de vídeo", () => {
  it("no intenta una llamada externa cuando el trabajador no está configurado", async () => {
    vi.stubEnv("VIDEO_PROCESSOR_URL", "");
    vi.stubEnv("VIDEO_PROCESSOR_SHARED_SECRET", "");
    vi.stubEnv("VIDEO_PROCESSOR_MODE", "");
    const { buildProcessorDispatchRequest } = await import("./videoProcessorDispatch");
    expect(buildProcessorDispatchRequest({ id: 42, sourcePath: "curso/leccion.mkv" }, "local-worker")).toBeNull();
    vi.unstubAllEnvs();
  });

  it("construye una solicitud autenticada para un trabajador configurado", async () => {
    vi.stubEnv("VIDEO_PERSISTENT_PROCESSOR_URL", "https://worker.example/");
    vi.stubEnv("VIDEO_PERSISTENT_PROCESSOR_SHARED_SECRET", "secreto-prueba");
    const { buildProcessorDispatchRequest } = await import("./videoProcessorDispatch");
    const request = buildProcessorDispatchRequest({ id: 42, sourcePath: "curso/leccion.mkv" }, "persistent-worker");
    expect(request?.url).toBe("https://worker.example/process");
    expect(request?.init.headers).toMatchObject({ "x-video-processor-secret": "secreto-prueba", "x-video-processor-mode": "persistent-worker" });
    expect(request?.init.body).toContain("\"videoId\":42");
    vi.unstubAllEnvs();
  });
});
