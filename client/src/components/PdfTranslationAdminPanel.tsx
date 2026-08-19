import { ArrowUpDown, Download, FileText, Filter, Loader2, Save, Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { PdfTranslationSummary } from "@shared/learning";
import { filterByPdfPriority, getPdfPriorityBand, type PdfPriorityFilter } from "@shared/pdfPriority";
import { buildPdfQueueCsv, filterByPdfRoute } from "@shared/pdfQueueExport";

type AdminDocument = PdfTranslationSummary & { courseTitle: string; moduleName: string; routeId: string; routeLabel: string };
type AdminStatus = "all" | PdfTranslationSummary["status"];

const statusLabels: Record<PdfTranslationSummary["status"], string> = {
  queued: "En cola",
  extracting: "Extrayendo",
  translating: "Traduciendo",
  reconstructing: "Reconstruyendo",
  ready: "Listo",
  failed: "Requiere revisión",
};

export function PdfTranslationAdminPanel({ documents, onSetPriority, isSaving }: { documents: AdminDocument[]; onSetPriority: (id: number, priority: number) => void; isSaving?: boolean }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<AdminStatus>("all");
  const [courseId, setCourseId] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<PdfPriorityFilter>("all");
  const [routeId, setRouteId] = useState("all");
  const [drafts, setDrafts] = useState<Record<number, number>>({});
  const courses = useMemo(() => Array.from(new Map(documents.map((document) => [document.courseId, document.courseTitle])).entries()), [documents]);
  const routes = useMemo(() => Array.from(new Map(documents.map((document) => [document.routeId, document.routeLabel])).entries()), [documents]);
  const counts = useMemo(() => documents.reduce<Record<AdminStatus, number>>((summary, document) => ({ ...summary, all: summary.all + 1, [document.status]: summary[document.status] + 1 }), { all: 0, queued: 0, extracting: 0, translating: 0, reconstructing: 0, ready: 0, failed: 0 }), [documents]);
  const priorityCounts = useMemo(() => documents.reduce<Record<Exclude<PdfPriorityFilter, "all">, number>>((summary, document) => ({ ...summary, [getPdfPriorityBand(document.priority)]: summary[getPdfPriorityBand(document.priority)] + 1 }), { immediate: 0, next: 0, planned: 0, standard: 0 }), [documents]);
  const rows = useMemo(() => filterByPdfRoute(filterByPdfPriority(documents, priorityFilter), routeId).filter((document) => {
    const term = search.trim().toLowerCase();
    return (status === "all" || document.status === status) && (courseId === "all" || document.courseId === courseId) && (!term || `${document.courseTitle} ${document.moduleName}`.toLowerCase().includes(term));
  }).sort((left, right) => left.priority - right.priority || left.moduleName.localeCompare(right.moduleName, "es")), [courseId, documents, priorityFilter, routeId, search, status]);
  const exportRows = () => {
    const csv = buildPdfQueueCsv(rows.map(({ courseTitle, moduleName, routeLabel, status, priority, pageCount }) => ({ courseTitle, moduleName, routeLabel, status: statusLabels[status], priority, pageCount })));
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "cola-pdfs-bilingues.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <section className="pdf-admin-panel" aria-labelledby="pdf-admin-title">
    <header className="pdf-admin-head"><div><p className="eyebrow"><span /> GESTIÓN ADMINISTRATIVA</p><h2 id="pdf-admin-title">Cola de PDFs bilingües</h2><p>Prioriza, revisa y filtra los documentos sin modificar sus originales en Drive.</p></div><div className="pdf-admin-total"><FileText size={17} /><b>{counts.all}</b><span>documentos</span></div></header>
    <div className="pdf-admin-summary" aria-label="Resumen de estados">{(["queued", "extracting", "translating", "reconstructing", "ready", "failed"] as const).map((item) => <span key={item} className={`pdf-admin-summary--${item}`}><b>{counts[item]}</b> {statusLabels[item]}</span>)}</div>
    <div className="pdf-admin-priority-summary" aria-label="Resumen de prioridades"><span><b>{priorityCounts.immediate}</b> 1–3 inmediatas</span><span><b>{priorityCounts.next}</b> 4–10 próximas</span><span><b>{priorityCounts.planned}</b> 11–99 planificadas</span><span><b>{priorityCounts.standard}</b> 100+ estándar</span></div>
    <div className="pdf-admin-filters"><label className="pdf-admin-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar documento o curso…" /></label><label><Filter size={14} /><select value={status} onChange={(event) => setStatus(event.target.value as AdminStatus)} aria-label="Filtrar documentos por estado"><option value="all">Todos los estados</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PdfPriorityFilter)} aria-label="Filtrar documentos por prioridad"><option value="all">Todas las prioridades</option><option value="immediate">1–3 · inmediatas</option><option value="next">4–10 · próximas</option><option value="planned">11–99 · planificadas</option><option value="standard">100+ · estándar</option></select></label><label><select value={routeId} onChange={(event) => setRouteId(event.target.value)} aria-label="Filtrar documentos por ruta pedagógica"><option value="all">Todas las rutas</option>{routes.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label><select value={courseId} onChange={(event) => setCourseId(event.target.value)} aria-label="Filtrar documentos por curso"><option value="all">Todos los cursos</option>{courses.map(([id, title]) => <option key={id} value={id}>{title}</option>)}</select></label><button type="button" className="pdf-admin-export" onClick={exportRows}><Download size={14} /> Exportar CSV</button></div>
    <div className="pdf-admin-list">{rows.map((document) => { const priority = drafts[document.id] ?? document.priority; return <article key={document.id} className={`pdf-admin-row pdf-admin-row--${document.status}`}><div className="pdf-admin-priority"><ArrowUpDown size={14} /><label>Prioridad<input type="number" min="1" max="999" value={priority} onChange={(event) => setDrafts((current) => ({ ...current, [document.id]: Math.max(1, Math.min(999, Number(event.target.value) || 1)) }))} /></label><button disabled={isSaving || priority === document.priority} onClick={() => onSetPriority(document.id, priority)}>{isSaving ? <Loader2 className="animate-spin" size={13} /> : <Save size={13} />} Guardar</button></div><div className="pdf-admin-copy"><b>{document.moduleName}</b><span>{document.courseTitle}</span></div><div className="pdf-admin-meta"><span className={`pdf-admin-status pdf-admin-status--${document.status}`}>{statusLabels[document.status]}</span><small>{document.pageCount ? `${document.pageCount} páginas` : "Sin páginas aún"}</small></div></article>; })}</div>
    {!rows.length && <div className="pdf-admin-empty">No hay documentos que coincidan con estos filtros.</div>}
  </section>;
}
