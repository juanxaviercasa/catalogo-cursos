import { describe, expect, it } from "vitest";
import { calculateProgress, getContentType, orderedModules, type DriveItem } from "../shared/learning";

const module = (id: string, name: string, mimeType: string, kind: "file" | "folder" = "file"): DriveItem => ({
  id,
  name,
  mimeType,
  kind,
  webViewLink: "https://drive.google.com/test",
});

describe("learning catalog helpers", () => {
  it("clasifica los recursos de Drive para la experiencia de aprendizaje", () => {
    expect(getContentType(module("1", "01 - Lección.mp4", "video/mp4"))).toBe("video");
    expect(getContentType(module("2", "02 - Módulo.zip", "application/x-zip-compressed"))).toBe("zip");
    expect(getContentType(module("3", "Recursos", "application/vnd.google-apps.folder", "folder"))).toBe("folder");
  });

  it("ordena los módulos numerados y calcula el avance", () => {
    const modules = orderedModules([
      module("three", "03 - Cierre.mp4", "video/mp4"),
      module("one", "01 - Inicio.mp4", "video/mp4"),
      module("two", "02 - Práctica.mp4", "video/mp4"),
    ]);
    expect(modules.map((item) => item.id)).toEqual(["one", "two", "three"]);
    expect(calculateProgress(["one", "two", "three"], new Set(["one", "two"]))).toBe(67);
  });
});
