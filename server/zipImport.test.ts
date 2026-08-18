import { describe, expect, it } from "vitest";
import { archiveEntryName, videoType, zipImportLimits } from "./zipImport";

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
    expect(zipImportLimits.maxZipBytes).toBe(350 * 1024 * 1024);
    expect(zipImportLimits.maxVideoCount).toBe(30);
  });
});
