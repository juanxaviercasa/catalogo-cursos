import { describe, expect, it } from "vitest";
import { calculateProgress, getContentType, orderedModules, type DriveItem } from "../shared/learning";
import { courseMeta, getCourseSource, learningRoutes, TERABOX_SOURCE_ACCOUNT_EMAIL } from "../shared/courseMeta";
import { teraboxCatalog } from "../shared/teraboxCatalog";

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

  it("distingue el origen por defecto y permite un metadato Terabox", () => {
    expect(getCourseSource({ id: "drive-course", routeId: "business", order: 1, title: "Drive", description: "", whatYouLearn: "", startHere: "", outcome: "" })).toBe("google_drive");
    expect(getCourseSource({ id: "terabox-course", source: "terabox", routeId: "business", order: 2, title: "Terabox", description: "", whatYouLearn: "", startHere: "", outcome: "" })).toBe("terabox");
  });

  it("incluye la nueva colección de seis cursos Drive", () => {
    const addedCourses = [
      "1qyEz3Tq3snDDpW2Co3SmvL3cOfO-sZ-C",
      "19VBkN0GelCU2Fr_aOg74trWGSKiQB2nM",
      "1fALqYvE8SuygpVi88NfJtCUg42x-4Z1H",
      "1dQTdsKNyGrnPlA-KDTRZDS62ZhPzV48o",
      "1On52JnLs86YPjQdgYhaD1hzXszOYFmzo",
      "1aAGE6c5xN8FoPgHbqf9FFtcExCB0HBGj",
    ];
    expect(addedCourses.every((id) => courseMeta.some((course) => course.id === id))).toBe(true);
    expect(addedCourses.every((id) => getCourseSource(courseMeta.find((course) => course.id === id)! ) === "google_drive")).toBe(true);
  });

  it("registra los 20 cursos Terabox confirmados y conserva un enlace compartido verificable", () => {
    expect(teraboxCatalog).toHaveLength(79);
    expect(new Set(teraboxCatalog.map((course) => course.id)).size).toBe(79);
    expect(teraboxCatalog.every((course) => course.webViewLink.includes("1024tera.com/spanish/sharing/link"))).toBe(true);
    expect(teraboxCatalog.find((course) => course.id === "terabox-jxcasa-ai-digital-marketing-guide")?.children).toHaveLength(20);
    expect(teraboxCatalog.find((course) => course.id === "terabox-jxcasa-ai-automation-agency")?.children).toHaveLength(7);
    expect(teraboxCatalog.find((course) => course.id === "terabox-jxcasa-kcpqhdfcc")?.children).toHaveLength(11);
    expect(teraboxCatalog.find((course) => course.id === "terabox-jxcasa-onlyfans-agency")?.children).toHaveLength(20);
    expect(teraboxCatalog.find((course) => course.id === "terabox-jxcasa-onlyfans-agency")?.children.filter((item) => item.kind === "file")).toHaveLength(20);
    expect(teraboxCatalog.filter((course) => !["terabox-jxcasa-ai-digital-marketing-guide", "terabox-jxcasa-ai-automation-agency", "terabox-jxcasa-kcpqhdfcc", "terabox-jxcasa-onlyfans-agency"].includes(course.id)).every((course) => course.children.length === 1)).toBe(true);
    expect(teraboxCatalog.some((course) => course.name === "A.I. Ads Machine + 10 Profitable Sales Funnels + The Digital Marketer's Guide To ChatGPT")).toBe(true);
    expect(teraboxCatalog.every((course) => courseMeta.some((meta) => meta.id === course.id && getCourseSource(meta) === "terabox"))).toBe(true);
    expect(courseMeta.filter((meta) => getCourseSource(meta) === "terabox")).toHaveLength(79);
    expect(courseMeta.filter((meta) => getCourseSource(meta) === "terabox").every((meta) => meta.sourceAccountEmail === TERABOX_SOURCE_ACCOUNT_EMAIL)).toBe(true);
    expect(courseMeta.filter((meta) => getCourseSource(meta) === "google_drive").every((meta) => !meta.sourceAccountEmail)).toBe(true);
  });

  it("incluye la ruta Salud y Rendimiento y sus seis cursos Kinobody", () => {
    expect(learningRoutes.find((route) => route.id === "fitness")?.label).toBe("Salud y Rendimiento");
    const fitnessCourses = courseMeta.filter((course) => course.routeId === "fitness").sort((left, right) => left.order - right.order);
    expect(fitnessCourses).toHaveLength(8);
    expect(fitnessCourses.map((course) => course.id)).toEqual([
      "1IkRomy3M6h9RfDKSln9NjW-Q4x7FZJ2p",
      "1dxvel2jEarUb7ijNesZULpHQmbpM0bDa",
      "1C0jkpBEP67eGfw9w2QvylDifOOxc2hnZ",
      "1hGCKVpEUdS8H6FefY4Th-_GH1XQT0Evt",
      "16CSfE6f_NUo_AWLobnCwCxbWW4ZWvJwr",
      "14qYxKwwDHMtxXwzExn_ZDQ3v55QAH97k",
      "terabox-jxcasa-fitness-programs",
      "terabox-jxcasa-caitlin-hard-as-you-want",
    ]);
  });
});
