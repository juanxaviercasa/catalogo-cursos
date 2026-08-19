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
  });

  it("expone OCR local y los proveedores opcionales sin credenciales en el contrato público", () => {
    const result = PdfTranslationSetupSchema.safeParse(pdfTranslationSetup);
    expect(result.success).toBe(true);
    expect(pdfTranslationSetup.ocr.provider).toBe("tesseract-local");
    expect(pdfTranslationSetup.providers.map((provider) => provider.id)).toEqual(["argos-local", "deepl", "google-cloud"]);
    expect(pdfTranslationSetup.placeholders.every((placeholder) => !placeholder.example.includes("sk-"))).toBe(true);
  });
});
