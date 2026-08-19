import { ExternalLink, FileText, Languages, Loader2, SplitSquareVertical } from "lucide-react";
import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { DriveItem, PdfTranslationSummary } from "@shared/learning";

type ViewMode = "compare" | "reader" | "reconstructed";
type BilingualSegment = { sourceText: string; translatedText: string };

export function BilingualPdfPanel({ courseId, item, translation, onClose }: { courseId: string; item: DriveItem; translation: PdfTranslationSummary; onClose: () => void }) {
  const [mode, setMode] = useState<ViewMode>("compare");
  const documentQuery = trpc.learning.pdfTranslation.useQuery({ courseId, moduleId: item.id }, { enabled: translation.status === "ready" });
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

  return <section className="pdf-bilingual-panel" aria-label={`Lectura bilingüe de ${item.name}`}>
    <header className="pdf-bilingual-head"><div><span>LECTURA BILINGÜE · PILOTO LOCAL</span><h2>{item.name.replace(/\.pdf$/i, "")}</h2><p>{translation.pageCount} páginas reconstruidas en español. El original de Drive se conserva como referencia.</p></div><button onClick={onClose}>Cerrar</button></header>
    <div className="pdf-view-tabs" role="tablist" aria-label="Modo de lectura PDF"><button className={mode === "compare" ? "pdf-view-tab--active" : ""} onClick={() => setMode("compare")}><SplitSquareVertical size={15} /> Comparar</button><button className={mode === "reader" ? "pdf-view-tab--active" : ""} onClick={() => setMode("reader")}><Languages size={15} /> Leer en español</button><button className={mode === "reconstructed" ? "pdf-view-tab--active" : ""} onClick={() => setMode("reconstructed")}><FileText size={15} /> PDF en español</button></div>
    {mode === "compare" && <div className="pdf-compare-grid"><article><div className="pdf-pane-title"><span>ORIGINAL · INGLÉS</span><a href={item.webViewLink} target="_blank" rel="noreferrer">Abrir en Drive <ExternalLink size={13} /></a></div><iframe src={`https://drive.google.com/file/d/${item.id}/preview`} title={`Original en inglés: ${item.name}`} /></article><article><div className="pdf-pane-title"><span>LECTURA · ESPAÑOL</span><span>{pages.length} páginas con texto</span></div><div className="pdf-reader-scroll">{pages.map((page) => <section key={page.pageNumber} className="pdf-reader-page"><b>Página {page.pageNumber}</b>{page.segments.map((segment, index) => <p key={index}>{segment.translatedText}</p>)}</section>)}</div></article></div>}
    {mode === "reader" && <div className="pdf-reader-full">{pages.map((page) => <section key={page.pageNumber} className="pdf-reader-page"><b>Página {page.pageNumber}</b>{page.segments.map((segment, index) => <p key={index}>{segment.translatedText}</p>)}</section>)}</div>}
    {mode === "reconstructed" && <div className="pdf-reconstructed-frame"><iframe src={translation.reconstructedStorageUrl ?? undefined} title={`PDF reconstruido en español: ${item.name}`} /><a href={translation.reconstructedStorageUrl ?? undefined} target="_blank" rel="noreferrer">Abrir PDF reconstruido <ExternalLink size={14} /></a></div>}
    <footer className="pdf-bilingual-note">La traducción es una ayuda de lectura automática. Revisa terminología, cifras y recomendaciones antes de tomar decisiones de salud o entrenamiento.</footer>
  </section>;
}
