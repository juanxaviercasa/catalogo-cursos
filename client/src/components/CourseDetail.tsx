import { getCourseSource, type CourseMeta, type LearningRoute } from "@shared/courseMeta";
import { getContentType, orderedModules, type DriveCourse, type DriveItem, type PdfTranslationSummary } from "@shared/learning";
import { getSpanishMediaTracks, type MediaTrack } from "@shared/mediaTracks";
import { AlertTriangle, ArrowLeft, AudioLines, Check, CheckCircle2, ExternalLink, FileArchive, FileText, FolderOpen, Languages, Loader2, Play, PlayCircle, Server } from "lucide-react";
import { useMemo, useState } from "react";
import { ProgressRing } from "./ProgressRing";
import { VideoProcessingPanel } from "./VideoProcessingPanel";
import { VideoProcessingHistory, type VideoProcessingEvent } from "./VideoProcessingHistory";
import { DubbingPanel } from "./DubbingPanel";
import { BilingualPdfPanel } from "./BilingualPdfPanel";

const moduleIcon = (item: DriveItem) => {
  const type = getContentType(item);
  if (type === "video") return <PlayCircle size={18} />;
  if (type === "zip") return <FileArchive size={18} />;
  if (type === "pdf") return <FileText size={18} />;
  return <FolderOpen size={18} />;
};

type ImportedVideo = { id: number; title: string; storageUrl: string | null; sourceMimeType: string; mimeType: string | null; sizeBytes: number | null; sortOrder: number; processingStatus: "queued" | "processing" | "ready" | "failed"; processingMessage: string | null; wasTranscoded: boolean };
type ReadyImportedVideo = ImportedVideo & { storageUrl: string; mimeType: string; sizeBytes: number; processingStatus: "ready" };
type ZipImport = { zipId: string; status: "processing" | "ready" | "failed"; errorMessage: string | null; videos: ImportedVideo[] };

function isReadyVideo(video: ImportedVideo): video is ReadyImportedVideo {
  return video.processingStatus === "ready" && Boolean(video.storageUrl && video.mimeType && video.sizeBytes !== null);
}

function PreparedVideoPlayer({ video, tracks }: { video: ReadyImportedVideo; tracks: MediaTrack[] }) {
  const { dubbedVideo: spanishVideo, captions: spanishCaptions } = getSpanishMediaTracks(video.id, tracks);
  const [language, setLanguage] = useState<"original" | "es">(spanishVideo ? "es" : "original");
  const isSpanish = language === "es" && Boolean(spanishVideo);
  const source = isSpanish ? spanishVideo!.storageUrl : video.storageUrl;
  return <article className="prepared-video-card"><div className="prepared-video-card-head"><h3>{video.title}</h3>{spanishVideo && <div className="audio-selector" aria-label={`Idioma de audio para ${video.title}`}><button className={!isSpanish ? "audio-selector--selected" : ""} onClick={() => setLanguage("original")}>Original · inglés</button><button className={isSpanish ? "audio-selector--selected" : ""} onClick={() => setLanguage("es")}>Español</button></div>}</div><p className={isSpanish ? "audio-track-label audio-track-label--es" : "audio-track-label"}><AudioLines size={13} /> {isSpanish ? "Audio español local · ritmo refinado" : "Audio original en inglés"}</p><video key={source} controls preload="metadata" src={source}>{isSpanish && spanishCaptions && <track kind="subtitles" srcLang="es" label="Español" src={spanishCaptions.storageUrl} default />}</video>{isSpanish && spanishCaptions && <p className="subtitle-status">Subtítulos en español incluidos. Actívalos con el control <b>CC</b> del reproductor.</p>}</article>;
}

export function CourseDetail({ course, meta, route, completedIds, onBack, onToggle, canTrack, onLogin, zipImports, mediaTracks, canImportZip, isImportingZip, onPrepareZip, videoProcessingSetup, onSelectVideoProcessingMode, isSavingVideoProcessingMode, videoProcessingHistory = [], dubbingSetup, pdfTranslations = [], isPreparingPdf = false, onPreparePdf, isPreparingCoursePdfs = false, onPrepareCoursePdfs }: {
  course: DriveCourse;
  meta: CourseMeta;
  route: LearningRoute;
  completedIds: Set<string>;
  onBack: () => void;
  onToggle: (moduleId: string, completed: boolean) => void;
  canTrack: boolean;
  onLogin: () => void;
  zipImports: ZipImport[];
  mediaTracks: MediaTrack[];
  canImportZip: boolean;
  isImportingZip: boolean;
  onPrepareZip: (zipId: string) => void;
  videoProcessingSetup: import("@shared/learning").VideoProcessingSetup;
  onSelectVideoProcessingMode?: (mode: "local-worker" | "persistent-worker") => void;
  isSavingVideoProcessingMode?: boolean;
  videoProcessingHistory?: VideoProcessingEvent[];
  dubbingSetup: import("@shared/learning").DubbingSetup;
  pdfTranslations?: PdfTranslationSummary[];
  isPreparingPdf?: boolean;
  onPreparePdf?: (item: DriveItem) => void;
  isPreparingCoursePdfs?: boolean;
  onPrepareCoursePdfs?: () => void;
}) {
  const [activeVideo, setActiveVideo] = useState<DriveItem | null>(null);
  const [preparedVideos, setPreparedVideos] = useState<ReadyImportedVideo[] | null>(null);
  const [activePdf, setActivePdf] = useState<DriveItem | null>(null);
  const modules = useMemo(() => orderedModules(course.children), [course.children]);
  const completed = modules.filter((item) => completedIds.has(item.id)).length;
  const progress = modules.length ? Math.round((completed / modules.length) * 100) : 0;
  const zipModules = modules.filter((item) => getContentType(item) === "zip");
  const pilotZip = zipModules[0];
  const pilotImport = pilotZip ? zipImports.find((record) => record.zipId === pilotZip.id) : undefined;
  const readyPilotVideos = (pilotImport?.videos ?? []).filter(isReadyVideo);
  const pendingPilotVideos = (pilotImport?.videos ?? []).filter((video) => video.processingStatus === "queued" || video.processingStatus === "processing");
  const failedPilotVideos = (pilotImport?.videos ?? []).filter((video) => video.processingStatus === "failed");
  const unpreparedPdfCount = modules.filter((item) => getContentType(item) === "pdf" && !pdfTranslations.some((document) => document.courseId === course.id && document.moduleId === item.id)).length;
  const isGoogleDrive = getCourseSource(meta) === "google_drive";
  const sourceLabel = isGoogleDrive ? "Google Drive" : "Terabox";

  return (
    <section className="course-detail-shell">
      <header className="detail-topbar">
        <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Volver al catálogo</button>
        <a href={course.webViewLink} target="_blank" rel="noreferrer">{sourceLabel} original <ExternalLink size={15} /></a>
      </header>

      <div className="detail-intro">
        <div>
          <p className="eyebrow"><span /> {route.label}</p>
          <h1>{meta.title}</h1>
          <p className="detail-lead">{meta.description}</p>
        </div>
        <ProgressRing value={progress} size={94} />
      </div>

      {meta.coverImageUrl && <aside className="course-concept-cover" aria-label="Portada conceptual del curso"><img src={meta.coverImageUrl} alt="Portada conceptual de Kinobody Drinking Guide" /><div><span>RECURSO VISUAL CONCEPTUAL</span><h2>Kinobody Drinking Guide</h2><p>{meta.coverImageNote ?? "Imagen conceptual generada para orientar la navegación."}</p><small>El material original permanece en la carpeta de origen.</small></div></aside>}

      <div className="route-map-line" aria-label={`Ruta de estudio: ${route.label}, curso ${meta.order}, módulos`}>
        <span>{route.shortLabel}</span><i /><span>CURSO {String(meta.order).padStart(2, "0")}</span><i /><span>MÓDULOS</span>
      </div>

      <div className="course-brief-grid">
        <article><span>QUÉ APRENDERÁS</span><p>{meta.whatYouLearn}</p></article>
        <article><span>QUÉ VER PRIMERO</span><p>{meta.startHere}</p></article>
        <article><span>RESULTADO PRÁCTICO</span><p>{meta.outcome}</p></article>
        <article className="drive-brief"><span>ORIGEN DEL CURSO</span><a href={course.webViewLink} target="_blank" rel="noreferrer">Abrir carpeta en {sourceLabel} <ExternalLink size={15} /></a>{meta.sourceAccountEmail && <small className="source-account-note">Cuenta: {meta.sourceAccountEmail}</small>}</article>
      </div>

      {pilotZip && <section className={`zip-import-hero zip-import-hero--${pilotImport?.status ?? "idle"}`}>
        <div className="zip-import-icon"><FileArchive size={23} /></div>
        <div className="zip-import-copy"><span>VÍDEOS DENTRO DE ZIP</span><h2>Prepáralos aquí, no en {sourceLabel}.</h2><p>El archivo original se mantiene comprimido en {sourceLabel}. Esta acción lo lee una sola vez, extrae únicamente los vídeos compatibles y los deja listos para reproducir desde esta plataforma.</p></div>
        <div className="zip-import-actions">
          {pilotImport?.status === "ready" && readyPilotVideos.length ? <button className="zip-primary-action" onClick={() => setPreparedVideos(readyPilotVideos)}><Server size={16} /> Ver {readyPilotVideos.length} vídeos listos</button> : pilotImport?.status === "ready" && pendingPilotVideos.length ? <div className="zip-processing"><Loader2 className="animate-spin" size={18} /><span>Convirtiendo {pendingPilotVideos.length} vídeos…<small>{pendingPilotVideos[0]?.processingMessage ?? "El resultado aparecerá aquí al quedar listo."}</small></span></div> : pilotImport?.status === "processing" ? <div className="zip-processing"><Loader2 className="animate-spin" size={18} /><span>Importando vídeos…<small>No cierres esta página.</small></span></div> : canImportZip ? <button className="zip-primary-action" disabled={isImportingZip} onClick={() => onPrepareZip(pilotZip.id)}>{isImportingZip ? <Loader2 className="animate-spin" size={16} /> : <Server size={16} />} {pilotImport?.status === "failed" ? "Reintentar preparación" : "Preparar vídeos en la plataforma"}</button> : <button className="zip-primary-action" onClick={onLogin}><Server size={16} /> Iniciar sesión para preparar</button>}
          <a href={pilotZip.webViewLink} target="_blank" rel="noreferrer">Ver original en {sourceLabel} <ExternalLink size={14} /></a>
          {pilotImport?.status === "failed" && <p className="zip-import-failure">La última preparación no terminó: {pilotImport.errorMessage}</p>}
          {failedPilotVideos.length > 0 && <p className="zip-import-failure">{failedPilotVideos.length} vídeo(s) requieren revisión: {failedPilotVideos[0]?.processingMessage ?? "La conversión no terminó."}</p>}
        </div>
      </section>}

      {(pendingPilotVideos.length > 0 || failedPilotVideos.length > 0) && <section className="zip-video-status-panel" aria-labelledby="zip-video-status-title">
        <div><span>COLA DE CONVERSIÓN</span><h2 id="zip-video-status-title">Estado de cada vídeo pendiente</h2></div>
        <ul>{[...pendingPilotVideos, ...failedPilotVideos].map((video) => <li key={video.id} className={`zip-video-status zip-video-status--${video.processingStatus}`}><div><b>{video.title}</b><small>{video.processingMessage ?? "Sin detalle adicional."}</small></div><span>{video.processingStatus === "queued" ? "En cola" : video.processingStatus === "processing" ? "Convirtiendo" : "Requiere revisión"}</span></li>)}</ul>
      </section>}

      {pilotZip && <VideoProcessingPanel setup={videoProcessingSetup} canConfigure={canImportZip} onSelectMode={onSelectVideoProcessingMode} isSaving={isSavingVideoProcessingMode} />}
      {pilotZip && canImportZip && <VideoProcessingHistory events={videoProcessingHistory} />}
      {pilotZip && <DubbingPanel setup={dubbingSetup} isPilotReady={Boolean(pilotImport?.videos.some((video) => getSpanishMediaTracks(video.id, mediaTracks).dubbedVideo))} />}

      {activeVideo && (
        <section className="video-player-panel" aria-label={`Reproduciendo ${activeVideo.name}`}>
          <div className="video-panel-head"><div><span>REPRODUCIENDO EN {sourceLabel.toUpperCase()}</span><h2>{activeVideo.name.replace(/\.(mp4|ts)$/i, "")}</h2></div><button onClick={() => setActiveVideo(null)}>Cerrar</button></div>
          <div className="drive-video-frame"><iframe src={`https://drive.google.com/file/d/${activeVideo.id}/preview`} title={`Vídeo: ${activeVideo.name}`} allow="autoplay; fullscreen" allowFullScreen /></div>
          <div className="video-panel-footer"><p>El vídeo se reproduce desde {sourceLabel}; no se aloja una copia en esta plataforma.</p><a href={activeVideo.webViewLink} target="_blank" rel="noreferrer">Ir al contenido <ExternalLink size={15} /></a></div><div className="audio-availability"><AudioLines size={15} /><span><b>Audio disponible: original.</b> La traducción y la voz española aún no están activas para este vídeo.</span></div>
        </section>
      )}

      <section className="module-section">
        <div className="section-heading"><div><p className="eyebrow"><span /> SECUENCIA PEDAGÓGICA</p><h2>Módulos del curso</h2></div><div className="module-section-actions">{canImportZip && unpreparedPdfCount > 0 && onPrepareCoursePdfs && <button className="prepare-course-pdfs" disabled={isPreparingCoursePdfs} onClick={onPrepareCoursePdfs}>{isPreparingCoursePdfs ? <Loader2 className="animate-spin" size={14} /> : <Languages size={14} />} Preparar {unpreparedPdfCount} PDFs</button>}<p>{completed} de {modules.length} vistos</p></div></div>
        <div className="module-list">
          {modules.map((item, index) => {
            const contentType = getContentType(item);
            const pdfTranslation = contentType === "pdf" ? pdfTranslations.find((document) => document.courseId === course.id && document.moduleId === item.id) : undefined;
            const isComplete = completedIds.has(item.id);
            const importRecord = zipImports.find((record) => record.zipId === item.id);
            return (
              <article className={`module-row module-row--${contentType}`} key={item.id}>
                <button className={`module-check ${isComplete ? "module-check--complete" : ""}`} onClick={() => canTrack ? onToggle(item.id, !isComplete) : onLogin()} aria-label={isComplete ? `Marcar ${item.name} como pendiente` : `Marcar ${item.name} como visto`}>
                  {isComplete ? <Check size={15} /> : <span />}
                </button>
                <span className="module-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="module-type-icon">{moduleIcon(item)}</span>
                <div className="module-copy"><h3>{item.name.replace(/\.(zip|mp4|ts|pdf)$/i, "")}</h3><p>{contentType === "video" ? <>Vídeo disponible para reproducir desde {sourceLabel}.</> : contentType === "zip" ? <>Archivo ZIP con material de curso; ábrelo en {sourceLabel} para acceder a su contenido.</> : contentType === "folder" ? <>Carpeta de {sourceLabel} con lecciones o recursos organizados.</> : contentType === "pdf" ? <>Documento PDF disponible en la carpeta original de {sourceLabel}.</> : <>Recurso disponible en {sourceLabel}.</>}</p></div>
                <div className="module-actions">
                  {contentType === "video" && isGoogleDrive && <button className="watch-button" onClick={() => setActiveVideo(item)}><Play size={14} /> Ver aquí</button>}
                  {contentType === "pdf" && pdfTranslation?.status === "ready" && <button className="pdf-translation-button" onClick={() => setActivePdf(item)}><Languages size={14} /> Leer en español</button>}
                  {contentType === "pdf" && !pdfTranslation && canImportZip && onPreparePdf && <button className="pdf-translation-button" disabled={isPreparingPdf} onClick={() => onPreparePdf(item)}>{isPreparingPdf ? <Loader2 className="animate-spin" size={14} /> : <Languages size={14} />} Preparar español</button>}
                  <a href={item.webViewLink} target="_blank" rel="noreferrer">Ir al contenido <ExternalLink size={15} /></a>
                </div>
                {contentType === "pdf" && pdfTranslation && <div className={`pdf-translation-status pdf-translation-status--${pdfTranslation.status}`}>{pdfTranslation.status === "ready" ? <><Languages size={14} /> <span>Lectura en español y PDF reconstruido disponibles.</span></> : <><Loader2 className="animate-spin" size={14} /> <span>{pdfTranslation.status === "failed" ? pdfTranslation.errorMessage ?? "La traducción requiere revisión." : "En cola para preparación local en español."}</span></>}</div>}
                {contentType === "zip" && <div className="zip-note"><AlertTriangle size={15} /><span><b>Archivo ZIP original.</b> “Ir al contenido” abre Drive y no descomprime el archivo. {importRecord?.status === "ready" ? `${importRecord.videos.filter(isReadyVideo).length} vídeos ya fueron preparados y se reproducen desde la plataforma.${importRecord.videos.some((video) => video.processingStatus === "queued" || video.processingStatus === "processing") ? " Otros siguen en conversión." : ""}` : "Usa la acción destacada “Preparar vídeos en la plataforma” situada arriba."}</span>{importRecord?.status === "ready" ? <button className="prepared-button" onClick={() => setPreparedVideos(importRecord.videos.filter(isReadyVideo))}><Server size={14} /> Ver vídeos listos</button> : null}</div>}
              </article>
            );
          })}
        </div>
      </section>
      {activePdf && (() => { const translation = pdfTranslations.find((document) => document.courseId === course.id && document.moduleId === activePdf.id); return translation ? <BilingualPdfPanel courseId={course.id} item={activePdf} translation={translation} onClose={() => setActivePdf(null)} canManage={canImportZip} /> : null; })()}
      {preparedVideos && <section className="prepared-video-panel"><div className="video-panel-head"><div><span>VÍDEOS PREPARADOS</span><h2>Reproducir desde la plataforma</h2></div><button onClick={() => setPreparedVideos(null)}>Cerrar</button></div><p>Estos vídeos se importaron una vez desde el ZIP original de Drive y ahora se sirven desde el almacenamiento gestionado de la plataforma.</p><div className="prepared-video-list">{preparedVideos.map((video) => <PreparedVideoPlayer key={video.id} video={video} tracks={mediaTracks.filter((track) => track.extractedVideoId === video.id)} />)}</div></section>}
      {!canTrack && <aside className="tracking-note"><CheckCircle2 size={18} /><span>Inicia sesión para marcar módulos como vistos y guardar tu progreso entre sesiones.</span><button onClick={onLogin}>Iniciar sesión</button></aside>}
    </section>
  );
}
