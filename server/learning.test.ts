import { describe, expect, it } from "vitest";
import { calculateProgress, getContentType, orderedModules, type DriveItem } from "../shared/learning";
import { courseMeta, learningRoutes } from "../shared/courseMeta";

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

  it("incluye la ruta Salud y Rendimiento y sus seis cursos Kinobody", () => {
    expect(learningRoutes.find((route) => route.id === "fitness")?.label).toBe("Salud y Rendimiento");
    const fitnessCourses = courseMeta.filter((course) => course.routeId === "fitness").sort((left, right) => left.order - right.order);
    expect(fitnessCourses).toHaveLength(6);
    expect(fitnessCourses.map((course) => course.id)).toEqual([
      "1IkRomy3M6h9RfDKSln9NjW-Q4x7FZJ2p",
      "1dxvel2jEarUb7ijNesZULpHQmbpM0bDa",
      "1C0jkpBEP67eGfw9w2QvylDifOOxc2hnZ",
      "1hGCKVpEUdS8H6FefY4Th-_GH1XQT0Evt",
      "16CSfE6f_NUo_AWLobnCwCxbWW4ZWvJwr",
      "14qYxKwwDHMtxXwzExn_ZDQ3v55QAH97k",
    ]);
  });
});
