import { Check, ExternalLink, FileText, ImageIcon, Languages, Loader2, PencilLine, RefreshCw, SplitSquareVertical, X } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { DriveItem, PdfTranslationSummary } from "@shared/learning";

type ViewMode = "compare" | "reader" | "reconstructed" | "visual";
type BilingualSegment = { sourceText: string; translatedText: string };

export function BilingualPdfPanel({ courseId, item, translation, onClose, canManage = false }: { courseId: string; item: DriveItem; translation: PdfTranslationSummary; onClose: () => void; canManage?: boolean }) {
  const [mode, setMode] = useState<ViewMode>("compare");
  const [draft, setDraft] = useState<{ id: number; sourceText: string; translatedText: string } | null>(null);
  const documentQuery = trpc.learning.pdfTranslation.useQuery({ courseId, moduleId: item.id }, { enabled: translation.status === "ready" });
  const utils = trpc.useUtils();
  const reviewVisual = trpc.learning.reviewPdfVisualLocalization.useMutation({ onSuccess: () => utils.learning.pdfTranslation.invalidate({ courseId, moduleId: item.id }) });
  const localizeVisual = trpc.learning.localizePdfImage.useMutation({ onSuccess: () => { setDraft(null); utils.learning.pdfTranslation.invalidate({ courseId, moduleId: item.id }); } });
  const pages = useMemo<Array<{ pageNumber: number; segments: BilingualSegment[] }>>(() => {
    const grouped = new Map<number, BilingualSegment[]>();
    for (const segment of documentQuery.data?.segments ?? []) {
      grouped.set(segment.pageNumber, [...(grouped.get(segment.pageNumber) ?? []), segment]);
    }
    return Array.from(grouped.entries()).map(([pageNumber, segments]) => ({ pageNumber, segments }));
  }, [documentQuery.data?.segments]);

  if (translation.status !== "ready") {
    return <section className="pdf-bilingual-panel pdf-bilingual-panel--pending"><div><span>TRADUCCIÓN DE PDF</span><h2>Preparando la lectura en español</h2><p>{translation.status === "failed" ? translation.errorMessage ?? "La traducción no pudo terminar." : "El documento está en cola para extraer texto, traducirlo y reconstruirlo localmente."}</p></div><button onClick={onClose}>Cerrar</button></section>;
  }

  if (documentQuery.isLoading) {
    return <section className="pdf-bilingual-panel"><div className="pdf-bilingual-loading"><Loader2 className="animate-spin" size={20} /> Cargando la lectura bilingüe…</div></section>;
  }

  const visualLocalizations = documentQuery.data?.visualLocalizations ?? [];
  const visualProgress = (status: "queued" | "rendering" | "review" | "ready" | "failed") => ({ queued: 20, rendering: 60, review: 82, ready: 100, failed: 100 }[status]);
  const visualStatusLabel = (status: "queued" | "rendering" | "review" | "ready" | "failed") => ({ queued: "Pendiente", rendering: "Generando", review: "En revisión", ready: "Aprobado", failed: "Requiere nueva variante" }[status]);

  return <section className="pdf-bilingual-panel" aria-label={`Lectura bilingüe de ${item.name}`}>
    <header className="pdf-bilingual-head"><div><span>LECTURA BILINGÜE · PILOTO LOCAL</span><h2>{item.name.replace(/\.pdf$/i, "")}</h2><p>{translation.pageCount} páginas reconstruidas en español. El original de Drive se conserva como referencia.</p></div><button onClick={onClose}>Cerrar</button></header>
    <div className="pdf-view-tabs" role="tablist" aria-label="Modo de lectura PDF"><button className={mode === "compare" ? "pdf-view-tab--active" : ""} onClick={() => setMode("compare")}><SplitSquareVertical size={15} /> Comparar</button><button className={mode === "reader" ? "pdf-view-tab--active" : ""} onClick={() => setMode("reader")}><Languages size={15} /> Leer en español</button><button className={mode === "reconstructed" ? "pdf-view-tab--active" : ""} onClick={() => setMode("reconstructed")}><FileText size={15} /> PDF en español</button>{visualLocalizations.length > 0 && <button className={mode === "visual" ? "pdf-view-tab--active" : ""} onClick={() => setMode("visual")}><ImageIcon size={15} /> Visual en español</button>}</div>
    {mode === "compare" && <div className="pdf-compare-grid"><article><div className="pdf-pane-title"><span>ORIGINAL · INGLÉS</span><a href={item.webViewLink} target="_blank" rel="noreferrer">Abrir en Drive <ExternalLink size={13} /></a></div><iframe src={`https://drive.google.com/file/d/${item.id}/preview`} title={`Original en inglés: ${item.name}`} /></article><article><div className="pdf-pane-title"><span>LECTURA · ESPAÑOL</span><span>{pages.length} páginas con texto</span></div><div className="pdf-reader-scroll">{pages.map((page) => <section key={page.pageNumber} className="pdf-reader-page"><b>Página {page.pageNumber}</b>{page.segments.map((segment, index) => <p key={index}>{segment.translatedText}</p>)}</section>)}</div></article></div>}
    {mode === "reader" && <div className="pdf-reader-full">{pages.map((page) => <section key={page.pageNumber} className="pdf-reader-page"><b>Página {page.pageNumber}</b>{page.segments.map((segment, index) => <p key={index}>{segment.translatedText}</p>)}</section>)}</div>}
    {mode === "reconstructed" && <div className="pdf-reconstructed-frame"><iframe src={translation.reconstructedStorageUrl ?? undefined} title={`PDF reconstruido en español: ${item.name}`} /><a href={translation.reconstructedStorageUrl ?? undefined} target="_blank" rel="noreferrer">Abrir PDF reconstruido <ExternalLink size={14} /></a></div>}
    {mode === "visual" && <div className="pdf-visual-localizations">{visualLocalizations.map((visual) => <article key={visual.id} className="pdf-visual-card"><div className="pdf-pane-title"><span>PÁGINA {visual.pageNumber} · {visual.status === "ready" ? "LOCALIZACIÓN APROBADA" : visual.status === "review" ? "PENDIENTE DE REVISIÓN" : "VARIANTE VISUAL"}</span><span>{visual.provider}</span></div><div className="pdf-visual-progress" aria-label={`Progreso: ${visualStatusLabel(visual.status)}`}><div><b>{visualStatusLabel(visual.status)}</b><span>{visualProgress(visual.status)}%</span></div><i><em style={{ width: `${visualProgress(visual.status)}%` }} /></i></div><div className="pdf-visual-compare"><figure><figcaption>Original · inglés</figcaption><img src={visual.sourceImageUrl} alt={`Imagen original en inglés de la página ${visual.pageNumber}`} /></figure><figure><figcaption>Versión · español</figcaption>{visual.localizedStorageUrl ? <img src={visual.localizedStorageUrl} alt={`Imagen localizada en español de la página ${visual.pageNumber}`} /> : <div className="pdf-visual-empty">La variante visual no se pudo generar.</div>}</figure></div><div className="pdf-visual-copy">{draft?.id === visual.id ? <div className="pdf-visual-editor"><label>Texto original en inglés<textarea value={draft.sourceText} onChange={(event) => setDraft({ ...draft, sourceText: event.target.value })} /></label><label>Texto que debe verse en español<textarea value={draft.translatedText} onChange={(event) => setDraft({ ...draft, translatedText: event.target.value })} /></label><div><button className="pdf-visual-regenerate" disabled={localizeVisual.isPending || !draft.sourceText.trim() || !draft.translatedText.trim()} onClick={() => localizeVisual.mutate({ courseId, moduleId: item.id, pageNumber: visual.pageNumber, sourceImageUrl: visual.sourceImageUrl, sourceText: draft.sourceText.trim(), translatedText: draft.translatedText.trim() })}>{localizeVisual.isPending ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />} Guardar y volver a generar</button><button className="pdf-visual-cancel" disabled={localizeVisual.isPending} onClick={() => setDraft(null)}>Cancelar</button></div></div> : <><p><b>Texto detectado:</b> {visual.sourceText}</p><p><b>Traducción:</b> {visual.translatedText}</p>{visual.status === "review" && <p className="pdf-visual-review-note">La imagen está disponible como borrador. Revisa la ortografía, las cifras y la composición antes de aprobarla.</p>}{canManage && <div className="pdf-visual-review-actions"><button className="pdf-visual-edit" onClick={() => setDraft({ id: visual.id, sourceText: visual.sourceText, translatedText: visual.translatedText })}><PencilLine size={14} /> Editar texto</button>{visual.status === "review" && <><button disabled={reviewVisual.isPending} onClick={() => reviewVisual.mutate({ id: visual.id, approved: true, courseId, moduleId: item.id })}><Check size={14} /> Aprobar variante</button><button disabled={reviewVisual.isPending} onClick={() => reviewVisual.mutate({ id: visual.id, approved: false, courseId, moduleId: item.id })}><X size={14} /> Solicitar nueva variante</button></>}</div>}</>}</div></article>)}</div>}
    <footer className="pdf-bilingual-note">La traducción es una ayuda de lectura automática. Revisa terminología, cifras y recomendaciones antes de tomar decisiones de salud o entrenamiento.</footer>
  </section>;
}
