import { describe, expect, it } from "vitest";
import { buildPdfQueueCsv, filterByPdfRoute } from "../shared/pdfQueueExport";

describe("filtro y exportación de la cola PDF", () => {
  const entries = [{ id: 1, routeId: "fitness" }, { id: 2, routeId: "business" }, { id: 3, routeId: "fitness" }];

  it("filtra la cola por ruta pedagógica sin alterar el modo global", () => {
    expect(filterByPdfRoute(entries, "fitness").map((entry) => entry.id)).toEqual([1, 3]);
    expect(filterByPdfRoute(entries, "all")).toHaveLength(3);
  });

  it("exporta las columnas administrativas y escapa caracteres CSV", () => {
    const csv = buildPdfQueueCsv([{ courseTitle: "Curso, especial", moduleName: "Guía \"A\"", routeLabel: "Salud", status: "ready", priority: 1, pageCount: 11 }]);
    expect(csv).toContain('"Curso, especial"');
    expect(csv).toContain('"Guía ""A"""');
    expect(csv.split("\n")).toHaveLength(2);
  });
});
