export type PdfPriorityBand = "immediate" | "next" | "planned" | "standard";
export type PdfPriorityFilter = "all" | PdfPriorityBand;

export function getPdfPriorityBand(priority: number): PdfPriorityBand {
  if (priority <= 3) return "immediate";
  if (priority <= 10) return "next";
  if (priority <= 99) return "planned";
  return "standard";
}

export function filterByPdfPriority<T extends { priority: number }>(items: T[], filter: PdfPriorityFilter): T[] {
  return filter === "all" ? items : items.filter((item) => getPdfPriorityBand(item.priority) === filter);
}
