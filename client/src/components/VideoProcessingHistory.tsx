import { Filter, History, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

export type VideoProcessingEvent = {
  id: number;
  extractedVideoId: number;
  title: string;
  sourceName: string;
  sourceMimeType: string;
  status: "queued" | "processing" | "ready" | "failed";
  progressPercent: number;
  processingMode: "local-worker" | "persistent-worker" | null;
  message: string | null;
  createdAt: Date;
};

const statusLabel = { queued: "En cola", processing: "Procesando", ready: "Disponible", failed: "Falló" } as const;
const modeLabel = { "local-worker": "Equipo propio", "persistent-worker": "Servicio persistente" } as const;

function eventDate(value: Date) {
  return new Date(value).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
}

export function VideoProcessingHistory({ events }: { events: VideoProcessingEvent[] }) {
  const [statusFilter, setStatusFilter] = useState<"all" | VideoProcessingEvent["status"]>("all");
  const [modeFilter, setModeFilter] = useState<"all" | NonNullable<VideoProcessingEvent["processingMode"]>>("all");
  const [search, setSearch] = useState("");
  const latest = useMemo(() => Array.from(events.reduce((map, event) => map.has(event.extractedVideoId) ? map : map.set(event.extractedVideoId, event), new Map<number, VideoProcessingEvent>()).values()), [events]);
  const overallProgress = latest.length ? Math.round(latest.reduce((sum, event) => sum + event.progressPercent, 0) / latest.length) : 0;
  const filtered = useMemo(() => events.filter((event) => {
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    const matchesMode = modeFilter === "all" || event.processingMode === modeFilter;
    const term = search.trim().toLowerCase();
    const matchesText = !term || `${event.title} ${event.sourceName} ${event.message ?? ""}`.toLowerCase().includes(term);
    return matchesStatus && matchesMode && matchesText;
  }), [events, modeFilter, search, statusFilter]);

  return <section className="processing-history-panel" aria-label="Panel administrativo de conversiones">
    <header className="processing-history-head"><div><p><History size={14} /> ADMINISTRACIÓN · CONVERSIONES</p><h2>Historial y avance de la cola</h2><span>Eventos persistidos por vídeo; no muestra URLs privadas ni secretos.</span></div><div className="processing-overall"><b>{overallProgress}%</b><span>avance agregado</span><i><em style={{ width: `${overallProgress}%` }} /></i></div></header>
    <div className="processing-history-filters"><div className="processing-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Filtrar por vídeo o mensaje…" /></div><div><Filter size={14} /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} aria-label="Filtrar historial por estado"><option value="all">Todos los estados</option><option value="queued">En cola</option><option value="processing">Procesando</option><option value="ready">Disponibles</option><option value="failed">Fallidos</option></select><select value={modeFilter} onChange={(event) => setModeFilter(event.target.value as typeof modeFilter)} aria-label="Filtrar historial por ruta"><option value="all">Todas las rutas</option><option value="local-worker">Equipo propio</option><option value="persistent-worker">Servicio persistente</option></select></div></div>
    {filtered.length ? <div className="processing-event-list">{filtered.map((event) => <article className={`processing-event processing-event--${event.status}`} key={event.id}><div className="processing-event-main"><div><span className="processing-event-status">{statusLabel[event.status]}</span><h3>{event.title}</h3><p>{event.message ?? "Sin mensaje adicional."}</p></div><time>{eventDate(event.createdAt)}</time></div><div className="processing-event-progress"><div><b>{event.progressPercent}%</b><span>{event.processingMode ? modeLabel[event.processingMode] : "Ruta no seleccionada"}</span></div><i><em style={{ width: `${event.progressPercent}%` }} /></i></div></article>)}</div> : <div className="processing-history-empty"><SlidersHorizontal size={18} /><p>No hay eventos que coincidan con los filtros seleccionados.</p></div>}
  </section>;
}
