import { describe, expect, it } from "vitest";
import { PdfTranslationDocumentSchema, PdfTranslationSetupSchema, pdfTranslationSetup } from "../shared/learning";

describe("contratos de PDF visual localizado", () => {
  it("acepta una variante visual aprobada enlazada a almacenamiento gestionado", () => {
    const result = PdfTranslationDocumentSchema.safeParse({
      id: 1,
      courseId: "curso",
      moduleId: "modulo",
      sourceUrl: "https://drive.google.com/file/d/modulo/view",
      sourceLanguage: "en",
      targetLanguage: "es",
      status: "ready",
      processingMode: "local-worker",
      priority: 3,
      reconstructedStorageUrl: "/manus-storage/lectura-es.pdf",
      pageCount: 1,
      errorMessage: null,
      preparedAt: new Date(),
      segments: [],
      visualLocalizations: [{
        id: 1,
        pageNumber: 1,
        sourceImageUrl: "/manus-storage/original.png",
        localizedStorageUrl: "/manus-storage/localizada-es.png",
        sourceText: "Example",
        translatedText: "Ejemplo",
        status: "ready",
        provider: "image-service",
        errorMessage: null,
        reviewedAt: new Date(),
      }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe(3);
  });

  it("representa la localización aprobada de Drinking Guide sin sustituir su fuente", () => {
    const sourceImageUrl = "/manus-storage/kinobody-drinking-guide-concept_169b6d33.png";
    const localizedStorageUrl = "/manus-storage/drinking-guide-page-01-es_06bf7f96.png";
    expect(sourceImageUrl).not.toBe(localizedStorageUrl);
    const result = PdfTranslationDocumentSchema.safeParse({
      id: 30009,
      courseId: "1dxvel2jEarUb7ijNesZULpHQmbpM0bDa",
      moduleId: "1SHiRfoyhxC3kNOqaRC_SQlWvpI7pXzYZ",
      sourceUrl: "https://drive.google.com/file/d/1SHiRfoyhxC3kNOqaRC_SQlWvpI7pXzYZ/view",
      sourceLanguage: "en",
      targetLanguage: "es",
      status: "ready",
      processingMode: "local-worker",
      priority: 100,
      reconstructedStorageUrl: "/manus-storage/drinking-guide-es_89782e19.pdf",
      pageCount: 12,
      errorMessage: null,
      preparedAt: new Date(),
      segments: [],
      visualLocalizations: [{ id: 60001, pageNumber: 1, sourceImageUrl, localizedStorageUrl, sourceText: "KINOBODY DRINKING GUIDE", translatedText: "GUÍA DE BEBIDAS KINOBODY", status: "ready", provider: "image-service", errorMessage: null, reviewedAt: new Date() }],
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.visualLocalizations[0].status).toBe("ready");
  });

  it("expone OCR local y los proveedores opcionales sin credenciales en el contrato público", () => {
    const result = PdfTranslationSetupSchema.safeParse(pdfTranslationSetup);
    expect(result.success).toBe(true);
    expect(pdfTranslationSetup.ocr.provider).toBe("tesseract-local");
    expect(pdfTranslationSetup.providers.map((provider) => provider.id)).toEqual(["argos-local", "deepl", "google-cloud"]);
    expect(pdfTranslationSetup.placeholders.every((placeholder) => !placeholder.example.includes("sk-"))).toBe(true);
  });
});
