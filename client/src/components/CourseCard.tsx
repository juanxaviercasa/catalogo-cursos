import { getCourseSource, type CourseMeta } from "@shared/courseMeta";
import type { DriveCourse } from "@shared/learning";
import { ArrowUpRight, FolderOpen, PlayCircle } from "lucide-react";
import { ProgressRing } from "./ProgressRing";

export function CourseCard({ course, meta, progress, onOpen }: { course: DriveCourse; meta: CourseMeta; progress: number; onOpen: () => void }) {
  const videoCount = course.children.filter((item) => item.mimeType.includes("video") || item.name.toLowerCase().endsWith(".mp4")).length;
  const sourceLabel = getCourseSource(meta) === "terabox" ? "Terabox" : "Google Drive";
  return (
    <article className="course-card">
      <div className="course-card-head">
        <span className="course-order">{String(meta.order).padStart(2, "0")}</span>
        <ProgressRing value={progress} size={46} />
      </div>
      <div className="course-card-body">
        <p className="course-overline">{course.children.length} módulos · {videoCount ? `${videoCount} vídeos` : `biblioteca ${sourceLabel}`}</p>
        <h3>{meta.title}</h3>
        <p>{meta.description}</p>
      </div>
      <div className="course-card-footer">
        <span><FolderOpen size={14} /> {sourceLabel}</span>
        <button onClick={onOpen} aria-label={`Abrir ${meta.title}`}><span>Ver curso</span><ArrowUpRight size={16} /></button>
      </div>
      {videoCount > 0 && <span className="course-video-badge"><PlayCircle size={13} /> Vídeos disponibles</span>}
    </article>
  );
}
