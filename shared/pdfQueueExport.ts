export type PdfQueueExportRow = {
  courseTitle: string;
  moduleName: string;
  routeLabel: string;
  status: string;
  priority: number;
  pageCount: number | null;
};

const csvCell = (value: string | number | null) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export function filterByPdfRoute<T extends { routeId: string }>(items: T[], routeId: string): T[] {
  return routeId === "all" ? items : items.filter((item) => item.routeId === routeId);
}

export function buildPdfQueueCsv(rows: PdfQueueExportRow[]): string {
  const header = ["Curso", "Módulo", "Ruta", "Estado", "Prioridad", "Páginas"].map(csvCell).join(",");
  const body = rows.map((row) => [row.courseTitle, row.moduleName, row.routeLabel, row.status, row.priority, row.pageCount].map(csvCell).join(","));
  return [header, ...body].join("\n");
}
