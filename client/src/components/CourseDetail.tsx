import type { CourseMeta, LearningRoute } from "@shared/courseMeta";
import { getContentType, orderedModules, type DriveCourse, type DriveItem } from "@shared/learning";
import { AlertTriangle, ArrowLeft, AudioLines, Check, CheckCircle2, ExternalLink, FileArchive, FileText, FolderOpen, Loader2, Play, PlayCircle, Server } from "lucide-react";
import { useMemo, useState } from "react";
import { ProgressRing } from "./ProgressRing";
import { VideoProcessingPanel } from "./VideoProcessingPanel";
import { DubbingPanel } from "./DubbingPanel";

const moduleIcon = (item: DriveItem) => {
  const type = getContentType(item);
  if (type === "video") return <PlayCircle size={18} />;
  if (type === "zip") return <FileArchive size={18} />;
  if (type === "pdf") return <FileText size={18} />;
  return <FolderOpen size={18} />;
};

type ImportedVideo = { id: number; title: string; storageUrl: string; mimeType: string; sizeBytes: number; sortOrder: number };
type ZipImport = { zipId: string; status: "processing" | "ready" | "failed"; errorMessage: string | null; videos: ImportedVideo[] };

export function CourseDetail({ course, meta, route, completedIds, onBack, onToggle, canTrack, onLogin, zipImports, canImportZip, isImportingZip, onPrepareZip, videoProcessingSetup, dubbingSetup }: {
  course: DriveCourse;
  meta: CourseMeta;
  route: LearningRoute;
  completedIds: Set<string>;
  onBack: () => void;
  onToggle: (moduleId: string, completed: boolean) => void;
  canTrack: boolean;
  onLogin: () => void;
  zipImports: ZipImport[];
  canImportZip: boolean;
  isImportingZip: boolean;
  onPrepareZip: (zipId: string) => void;
  videoProcessingSetup: import("@shared/learning").VideoProcessingSetup;
  dubbingSetup: import("@shared/learning").DubbingSetup;
}) {
  const [activeVideo, setActiveVideo] = useState<DriveItem | null>(null);
  const [preparedVideos, setPreparedVideos] = useState<ImportedVideo[] | null>(null);
  const modules = useMemo(() => orderedModules(course.children), [course.children]);
  const completed = modules.filter((item) => completedIds.has(item.id)).length;
  const progress = modules.length ? Math.round((completed / modules.length) * 100) : 0;
  const zipModules = modules.filter((item) => getContentType(item) === "zip");
  const pilotZip = zipModules[0];
  const pilotImport = pilotZip ? zipImports.find((record) => record.zipId === pilotZip.id) : undefined;

  return (
    <section className="course-detail-shell">
      <header className="detail-topbar">
        <button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Volver al catálogo</button>
        <a href={course.webViewLink} target="_blank" rel="noreferrer">Carpeta original <ExternalLink size={15} /></a>
      </header>

      <div className="detail-intro">
        <div>
          <p className="eyebrow"><span /> {route.label}</p>
          <h1>{meta.title}</h1>
          <p className="detail-lead">{meta.description}</p>
        </div>
        <ProgressRing value={progress} size={94} />
      </div>

      <div className="route-map-line" aria-label={`Ruta de estudio: ${route.label}, curso ${meta.order}, módulos`}>
        <span>{route.shortLabel}</span><i /><span>CURSO {String(meta.order).padStart(2, "0")}</span><i /><span>MÓDULOS</span>
      </div>

      <div className="course-brief-grid">
        <article><span>QUÉ APRENDERÁS</span><p>{meta.whatYouLearn}</p></article>
        <article><span>QUÉ VER PRIMERO</span><p>{meta.startHere}</p></article>
        <article><span>RESULTADO PRÁCTICO</span><p>{meta.outcome}</p></article>
        <article className="drive-brief"><span>ORIGEN DEL CURSO</span><a href={course.webViewLink} target="_blank" rel="noreferrer">Abrir carpeta en Drive <ExternalLink size={15} /></a></article>
      </div>

      {pilotZip && <section className={`zip-import-hero zip-import-hero--${pilotImport?.status ?? "idle"}`}>
        <div className="zip-import-icon"><FileArchive size={23} /></div>
        <div className="zip-import-copy"><span>VÍDEOS DENTRO DE ZIP</span><h2>Prepáralos aquí, no en Google Drive.</h2><p>El archivo original se mantiene comprimido en Drive. Esta acción lo lee una sola vez, extrae únicamente los vídeos compatibles y los deja listos para reproducir desde esta plataforma.</p></div>
        <div className="zip-import-actions">
          {pilotImport?.status === "ready" ? <button className="zip-primary-action" onClick={() => setPreparedVideos(pilotImport.videos)}><Server size={16} /> Ver {pilotImport.videos.length} vídeos listos</button> : pilotImport?.status === "processing" ? <div className="zip-processing"><Loader2 className="animate-spin" size={18} /><span>Importando vídeos…<small>No cierres esta página.</small></span></div> : canImportZip ? <button className="zip-primary-action" disabled={isImportingZip} onClick={() => onPrepareZip(pilotZip.id)}>{isImportingZip ? <Loader2 className="animate-spin" size={16} /> : <Server size={16} />} {pilotImport?.status === "failed" ? "Reintentar preparación" : "Preparar vídeos en la plataforma"}</button> : <button className="zip-primary-action" onClick={onLogin}><Server size={16} /> Iniciar sesión para preparar</button>}
          <a href={pilotZip.webViewLink} target="_blank" rel="noreferrer">Ver original en Drive <ExternalLink size={14} /></a>
          {pilotImport?.status === "failed" && <p className="zip-import-failure">La última preparación no terminó: {pilotImport.errorMessage}</p>}
        </div>
      </section>}

      {pilotZip && <VideoProcessingPanel setup={videoProcessingSetup} />}
      {pilotZip && <DubbingPanel setup={dubbingSetup} />}

      {activeVideo && (
        <section className="video-player-panel" aria-label={`Reproduciendo ${activeVideo.name}`}>
          <div className="video-panel-head"><div><span>REPRODUCIENDO EN DRIVE</span><h2>{activeVideo.name.replace(/\.(mp4|ts)$/i, "")}</h2></div><button onClick={() => setActiveVideo(null)}>Cerrar</button></div>
          <div className="drive-video-frame"><iframe src={`https://drive.google.com/file/d/${activeVideo.id}/preview`} title={`Vídeo: ${activeVideo.name}`} allow="autoplay; fullscreen" allowFullScreen /></div>
          <div className="video-panel-footer"><p>El vídeo se reproduce desde Google Drive; no se aloja una copia en esta plataforma.</p><a href={activeVideo.webViewLink} target="_blank" rel="noreferrer">Ir al contenido <ExternalLink size={15} /></a></div><div className="audio-availability"><AudioLines size={15} /><span><b>Audio disponible: original.</b> La traducción y la voz española aún no están activas para este vídeo.</span></div>
        </section>
      )}

      <section className="module-section">
        <div className="section-heading"><div><p className="eyebrow"><span /> SECUENCIA PEDAGÓGICA</p><h2>Módulos del curso</h2></div><p>{completed} de {modules.length} vistos</p></div>
        <div className="module-list">
          {modules.map((item, index) => {
            const contentType = getContentType(item);
            const isComplete = completedIds.has(item.id);
            const importRecord = zipImports.find((record) => record.zipId === item.id);
            return (
              <article className={`module-row module-row--${contentType}`} key={item.id}>
                <button className={`module-check ${isComplete ? "module-check--complete" : ""}`} onClick={() => canTrack ? onToggle(item.id, !isComplete) : onLogin()} aria-label={isComplete ? `Marcar ${item.name} como pendiente` : `Marcar ${item.name} como visto`}>
                  {isComplete ? <Check size={15} /> : <span />}
                </button>
                <span className="module-index">{String(index + 1).padStart(2, "0")}</span>
                <span className="module-type-icon">{moduleIcon(item)}</span>
                <div className="module-copy"><h3>{item.name.replace(/\.(zip|mp4|ts|pdf)$/i, "")}</h3><p>{contentType === "video" ? "Vídeo disponible para reproducir desde Google Drive." : contentType === "zip" ? "Archivo ZIP con material de curso; ábrelo en Drive para acceder a su contenido." : contentType === "folder" ? "Carpeta de Drive con lecciones o recursos organizados." : contentType === "pdf" ? "Documento PDF disponible en la carpeta original." : "Recurso disponible en Google Drive."}</p></div>
                <div className="module-actions">
                  {contentType === "video" && <button className="watch-button" onClick={() => setActiveVideo(item)}><Play size={14} /> Ver aquí</button>}
                  <a href={item.webViewLink} target="_blank" rel="noreferrer">Ir al contenido <ExternalLink size={15} /></a>
                </div>
                {contentType === "zip" && <div className="zip-note"><AlertTriangle size={15} /><span><b>Archivo ZIP original.</b> “Ir al contenido” abre Drive y no descomprime el archivo. {importRecord?.status === "ready" ? "Sus vídeos ya fueron preparados y se reproducen desde la plataforma." : "Usa la acción destacada “Preparar vídeos en la plataforma” situada arriba."}</span>{importRecord?.status === "ready" ? <button className="prepared-button" onClick={() => setPreparedVideos(importRecord.videos)}><Server size={14} /> Ver vídeos listos</button> : null}</div>}
              </article>
            );
          })}
        </div>
      </section>
      {preparedVideos && <section className="prepared-video-panel"><div className="video-panel-head"><div><span>VÍDEOS PREPARADOS</span><h2>Reproducir desde la plataforma</h2></div><button onClick={() => setPreparedVideos(null)}>Cerrar</button></div><p>Estos vídeos se importaron una vez desde el ZIP original de Drive y ahora se sirven desde el almacenamiento gestionado de la plataforma.</p><div className="audio-availability audio-availability--dark"><AudioLines size={15} /><span><b>Audio disponible: original · inglés.</b> No hay una pista española generada todavía.</span></div><div className="prepared-video-list">{preparedVideos.map((video) => <article key={video.id}><h3>{video.title}</h3><video controls preload="metadata" src={video.storageUrl} /></article>)}</div></section>}
      {!canTrack && <aside className="tracking-note"><CheckCircle2 size={18} /><span>Inicia sesión para marcar módulos como vistos y guardar tu progreso entre sesiones.</span><button onClick={onLogin}>Iniciar sesión</button></aside>}
    </section>
  );
}
