import { describe, expect, it } from "vitest";
import { dubbingSetup, DubbingSetupSchema } from "../shared/learning";

describe("placeholder de doblaje", () => {
  it("prioriza una ruta local gratuita sin exponer claves y mantiene las APIs como opcionales", () => {
    const parsed = DubbingSetupSchema.parse(dubbingSetup);
    expect(parsed.sourceLanguage).toBe("en");
    expect(parsed.targetLanguage).toBe("es");
    expect(parsed.providers[0]?.id).toBe("local-stack");
    expect(parsed.providers.find((provider) => provider.id === "elevenlabs")?.recommended).toBe(false);
    expect(parsed.placeholders.every((field) => field.example.includes("REEMPLAZAR") || field.key === "DUBBING_PROVIDER_MODE")).toBe(true);
  });
});
