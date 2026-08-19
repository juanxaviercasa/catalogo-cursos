import { describe, expect, it } from "vitest";
import { filterByPdfPriority, getPdfPriorityBand } from "../shared/pdfPriority";

describe("filtro de prioridad de PDFs", () => {
  const documents = [{ id: 1, priority: 1 }, { id: 2, priority: 3 }, { id: 3, priority: 4 }, { id: 4, priority: 10 }, { id: 5, priority: 11 }, { id: 6, priority: 99 }, { id: 7, priority: 100 }];

  it("clasifica las cuatro bandas que muestra la consola administrativa", () => {
    expect(getPdfPriorityBand(1)).toBe("immediate");
    expect(getPdfPriorityBand(4)).toBe("next");
    expect(getPdfPriorityBand(11)).toBe("planned");
    expect(getPdfPriorityBand(100)).toBe("standard");
  });

  it("reduce la lista según cada filtro de prioridad", () => {
    expect(filterByPdfPriority(documents, "immediate").map((item) => item.id)).toEqual([1, 2]);
    expect(filterByPdfPriority(documents, "next").map((item) => item.id)).toEqual([3, 4]);
    expect(filterByPdfPriority(documents, "planned").map((item) => item.id)).toEqual([5, 6]);
    expect(filterByPdfPriority(documents, "standard").map((item) => item.id)).toEqual([7]);
    expect(filterByPdfPriority(documents, "all")).toHaveLength(7);
  });
});
