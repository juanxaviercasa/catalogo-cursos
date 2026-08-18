import type { CourseMeta, LearningRoute } from "@shared/courseMeta";
import { getContentType, orderedModules, type DriveCourse, type DriveItem } from "@shared/learning";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, ExternalLink, FileArchive, FileText, FolderOpen, Play, PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { ProgressRing } from "./ProgressRing";

const moduleIcon = (item: DriveItem) => {
  const type = getContentType(item);
  if (type === "video") return <PlayCircle size={18} />;
  if (type === "zip") return <FileArchive size={18} />;
  if (type === "pdf") return <FileText size={18} />;
  return <FolderOpen size={18} />;
};

export function CourseDetail({ course, meta, route, completedIds, onBack, onToggle, canTrack, onLogin }: {
  course: DriveCourse;
  meta: CourseMeta;
  route: LearningRoute;
  completedIds: Set<string>;
  onBack: () => void;
  onToggle: (moduleId: string, completed: boolean) => void;
  canTrack: boolean;
  onLogin: () => void;
}) {
  const [activeVideo, setActiveVideo] = useState<DriveItem | null>(null);
  const modules = useMemo(() => orderedModules(course.children), [course.children]);
  const completed = modules.filter((item) => completedIds.has(item.id)).length;
  const progress = modules.length ? Math.round((completed / modules.length) * 100) : 0;

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

      {activeVideo && (
        <section className="video-player-panel" aria-label={`Reproduciendo ${activeVideo.name}`}>
          <div className="video-panel-head"><div><span>REPRODUCIENDO EN DRIVE</span><h2>{activeVideo.name.replace(/\.(mp4|ts)$/i, "")}</h2></div><button onClick={() => setActiveVideo(null)}>Cerrar</button></div>
          <div className="drive-video-frame"><iframe src={`https://drive.google.com/file/d/${activeVideo.id}/preview`} title={`Vídeo: ${activeVideo.name}`} allow="autoplay; fullscreen" allowFullScreen /></div>
          <div className="video-panel-footer"><p>El vídeo se reproduce desde Google Drive; no se aloja una copia en esta plataforma.</p><a href={activeVideo.webViewLink} target="_blank" rel="noreferrer">Ir al contenido <ExternalLink size={15} /></a></div>
        </section>
      )}

      <section className="module-section">
        <div className="section-heading"><div><p className="eyebrow"><span /> SECUENCIA PEDAGÓGICA</p><h2>Módulos del curso</h2></div><p>{completed} de {modules.length} vistos</p></div>
        <div className="module-list">
          {modules.map((item, index) => {
            const contentType = getContentType(item);
            const isComplete = completedIds.has(item.id);
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
                {contentType === "zip" && <div className="zip-note"><AlertTriangle size={15} /><span><b>Archivo ZIP.</b> Google Drive conserva este módulo comprimido. Abre el enlace “Ir al contenido” para verlo o gestionarlo desde Drive; esta plataforma no descarga ni almacena una copia.</span></div>}
              </article>
            );
          })}
        </div>
      </section>
      {!canTrack && <aside className="tracking-note"><CheckCircle2 size={18} /><span>Inicia sesión para marcar módulos como vistos y guardar tu progreso entre sesiones.</span><button onClick={onLogin}>Iniciar sesión</button></aside>}
    </section>
  );
}
