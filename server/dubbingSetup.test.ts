import { describe, expect, it } from "vitest";
import { dubbingSetup, DubbingSetupSchema } from "../shared/learning";

describe("placeholder de doblaje", () => {
  it("prepara una ruta inglés-español sin exponer claves y recomienda una opción de vídeo grabado", () => {
    const parsed = DubbingSetupSchema.parse(dubbingSetup);
    expect(parsed.sourceLanguage).toBe("en");
    expect(parsed.targetLanguage).toBe("es");
    expect(parsed.providers.find((provider) => provider.id === "elevenlabs")?.recommended).toBe(true);
    expect(parsed.placeholders.every((field) => field.example.includes("REEMPLAZAR") || field.key === "DUBBING_PROVIDER_MODE")).toBe(true);
  });
});
