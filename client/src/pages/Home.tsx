import { useAuth } from "@/_core/hooks/useAuth";
import { CourseCard } from "@/components/CourseCard";
import { CourseDetail } from "@/components/CourseDetail";
import { PdfTranslationAdminPanel } from "@/components/PdfTranslationAdminPanel";
import { ProgressRing } from "@/components/ProgressRing";
import { startLogin } from "@/const";
import { courseMetaById, courseMeta, learningRoutes } from "@shared/courseMeta";
import { calculateProgress, getContentType, type ContentType, type DriveCourse } from "@shared/learning";
import { ArrowUpRight, BookOpen, Check, CheckCircle2, ChevronRight, CircleDot, Filter, FolderOpen, LayoutGrid, Loader2, LogOut, Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";

type StatusFilter = "all" | "pending" | "active" | "complete";
type TypeFilter = "all" | ContentType;

const contentLabels: Record<TypeFilter, string> = { all: "Todo tipo", video: "Vídeo", zip: "ZIP", pdf: "PDF", folder: "Carpeta", other: "Otros" };

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [, params] = useRoute("/curso/:courseId");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const catalogQuery = trpc.learning.catalog.useQuery(undefined, { retry: 1 });
  const progressQuery = trpc.learning.progress.useQuery(undefined, { retry: false });
  const zipImportsQuery = trpc.learning.zipImports.useQuery();
  const mediaTracksQuery = trpc.learning.mediaTracks.useQuery();
  const videoProcessingSetupQuery = trpc.learning.videoProcessingSetup.useQuery();
  const videoProcessingHistoryQuery = trpc.learning.videoProcessingHistory.useQuery(undefined, { enabled: user?.role === "admin" });
  const pdfTranslationsQuery = trpc.learning.pdfTranslations.useQuery();
  const dubbingSetupQuery = trpc.learning.dubbingSetup.useQuery();
  const setModuleProgress = trpc.learning.setModuleProgress.useMutation({ onSuccess: () => utils.learning.progress.invalidate() });
  const prepareZip = trpc.learning.prepareZip.useMutation({ onSuccess: () => { utils.learning.zipImports.invalidate(); toast.success("Los vídeos del ZIP ya están preparados para reproducirse desde la plataforma."); }, onError: (error) => toast.error(error.message) });
  const setVideoProcessingMode = trpc.learning.setVideoProcessingMode.useMutation({ onSuccess: (setup) => { utils.learning.videoProcessingSetup.setData(undefined, setup); toast.success("Ruta de procesamiento seleccionada. Completa sus variables privadas para activarla."); }, onError: (error) => toast.error(error.message) });
  const preparePdfTranslation = trpc.learning.preparePdfTranslation.useMutation({ onSuccess: () => { utils.learning.pdfTranslations.invalidate(); toast.success("El PDF entró en la cola de traducción local."); }, onError: (error) => toast.error(error.message) });
  const prepareCoursePdfTranslations = trpc.learning.prepareCoursePdfTranslations.useMutation({ onSuccess: (result) => { utils.learning.pdfTranslations.invalidate(); toast.success(result.queued ? `${result.queued} PDF(s) entraron en la cola de traducción local.` : "Todos los PDFs del curso ya están preparados."); }, onError: (error) => toast.error(error.message) });
  const setPdfTranslationPriority = trpc.learning.setPdfTranslationPriority.useMutation({ onSuccess: () => { utils.learning.pdfTranslations.invalidate(); toast.success("Prioridad del PDF actualizada."); }, onError: (error) => toast.error(error.message) });
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const completedIds = useMemo(() => new Set((progressQuery.data ?? []).filter((entry) => entry.completed).map((entry) => entry.moduleId)), [progressQuery.data]);
  const courses = useMemo(() => (catalogQuery.data ?? []).map((course) => ({ course, meta: courseMetaById[course.id] })).filter((item): item is { course: DriveCourse; meta: NonNullable<typeof courseMetaById[string]> } => Boolean(item.meta)).sort((a, b) => a.meta.order - b.meta.order), [catalogQuery.data]);
  const courseProgress = (course: DriveCourse) => calculateProgress(course.children.map((item) => item.id), completedIds);
  const selected = courses.find((item) => item.course.id === params?.courseId);
  const pdfAdminEntries = useMemo(() => (pdfTranslationsQuery.data ?? []).map((document) => {
    const course = courses.find((item) => item.course.id === document.courseId);
    const module = course?.course.children.find((item) => item.id === document.moduleId);
    return { ...document, courseTitle: course?.meta.title ?? document.courseId, moduleName: module?.name.replace(/\.pdf$/i, "") ?? document.moduleId, routeId: course?.meta.routeId ?? "other", routeLabel: learningRoutes.find((route) => route.id === course?.meta.routeId)?.label ?? "Sin ruta" };
  }), [courses, pdfTranslationsQuery.data]);

  const filteredCourses = courses.filter(({ course, meta }) => {
    const progress = courseProgress(course);
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || `${meta.title} ${meta.description} ${meta.whatYouLearn} ${course.name}`.toLowerCase().includes(term);
    const matchesRoute = routeFilter === "all" || meta.routeId === routeFilter;
    const matchesType = typeFilter === "all" || course.children.some((item) => getContentType(item) === typeFilter);
    const matchesStatus = statusFilter === "all" || (statusFilter === "pending" && progress === 0) || (statusFilter === "active" && progress > 0 && progress < 100) || (statusFilter === "complete" && progress === 100);
    return matchesSearch && matchesRoute && matchesType && matchesStatus;
  });

  const totalModules = courses.reduce((sum, item) => sum + item.course.children.length, 0);
  const courseCount = courses.length;
  const totalProgress = totalModules ? Math.round((courses.reduce((sum, item) => sum + item.course.children.filter((module) => completedIds.has(module.id)).length, 0) / totalModules) * 100) : 0;
  const inProgressCourses = courses.filter((item) => { const progress = courseProgress(item.course); return progress > 0 && progress < 100; });
  const completeCourses = courses.filter((item) => courseProgress(item.course) === 100 && item.course.children.length > 0);
  const routeProgress = (routeId: string) => {
    const routeCourses = courses.filter((item) => item.meta.routeId === routeId);
    const routeModules = routeCourses.flatMap((item) => item.course.children);
    return calculateProgress(routeModules.map((module) => module.id), completedIds);
  };

  const toggleModule = (courseId: string, moduleId: string, completed: boolean) => {
    if (!isAuthenticated) {
      toast.message("Inicia sesión para guardar tu progreso.");
      startLogin();
      return;
    }
    setModuleProgress.mutate({ courseId, moduleId, completed }, { onError: () => toast.error("No se pudo guardar el progreso. Inténtalo otra vez.") });
  };

  if (selected) {
    const route = learningRoutes.find((item) => item.id === selected.meta.routeId)!;
    return <CourseDetail course={selected.course} meta={selected.meta} route={route} completedIds={completedIds} onBack={() => setLocation("/")} onToggle={(moduleId, completed) => toggleModule(selected.course.id, moduleId, completed)} canTrack={isAuthenticated} onLogin={startLogin} zipImports={zipImportsQuery.data ?? []} mediaTracks={mediaTracksQuery.data ?? []} canImportZip={user?.role === "admin"} isImportingZip={prepareZip.isPending} onPrepareZip={(zipId) => prepareZip.mutate({ zipId, courseId: selected.course.id })} videoProcessingSetup={videoProcessingSetupQuery.data ?? { status: "placeholder", workerStatus: "not_configured", activeMode: null, selectedMode: null, modeAvailability: { localWorker: false, persistentWorker: false }, availability: { queued: 0, processing: 0, ready: 0, failed: 0, transcoded: 0 }, storage: { provider: "managed-object-storage", description: "Configuración cargando…" }, providers: [], placeholders: [] }} onSelectVideoProcessingMode={(mode) => setVideoProcessingMode.mutate({ mode })} isSavingVideoProcessingMode={setVideoProcessingMode.isPending} videoProcessingHistory={videoProcessingHistoryQuery.data ?? []} dubbingSetup={dubbingSetupQuery.data ?? { status: "placeholder", sourceLanguage: "en", targetLanguage: "es", pipeline: [], providers: [], placeholders: [] }} pdfTranslations={pdfTranslationsQuery.data ?? []} isPreparingPdf={preparePdfTranslation.isPending} onPreparePdf={(item) => preparePdfTranslation.mutate({ courseId: selected.course.id, moduleId: item.id, sourceUrl: item.webViewLink })} isPreparingCoursePdfs={prepareCoursePdfTranslations.isPending} onPrepareCoursePdfs={() => prepareCoursePdfTranslations.mutate({ courseId: selected.course.id })} />;
  }

  return (
    <div className="learning-app">
      <aside className="learning-sidebar">
        <div className="brand-lockup"><span className="brand-symbol">R</span><div><span>RUTA</span><strong>Aprendizaje</strong></div></div>
        <div className="side-section"><span className="side-label">EXPLORAR</span><button className={`side-nav-item ${routeFilter === "all" && statusFilter === "all" ? "side-nav-item--active" : ""}`} onClick={() => { setRouteFilter("all"); setStatusFilter("all"); }}><LayoutGrid size={17} />Todos los cursos <b>{courseCount}</b></button></div>
        <div className="side-section"><span className="side-label">RUTAS PEDAGÓGICAS</span>{learningRoutes.map((route) => <button key={route.id} className={`side-route ${routeFilter === route.id ? "side-route--active" : ""}`} onClick={() => { setRouteFilter(route.id); setStatusFilter("all"); }}><span className={`route-dot route-dot--${route.accent}`} /><span>{route.shortLabel}</span><small>{routeProgress(route.id)}%</small><ChevronRight size={14} /></button>)}</div>
        <div className="side-section"><span className="side-label">TU BIBLIOTECA</span><button className={`side-nav-item ${statusFilter === "active" ? "side-nav-item--active" : ""}`} onClick={() => { setStatusFilter("active"); setRouteFilter("all"); }}><CircleDot size={17} />En curso <b>{inProgressCourses.length}</b></button>{inProgressCourses.slice(0, 3).map((item) => <button className="quick-course-link" key={item.course.id} onClick={() => setLocation(`/curso/${item.course.id}`)}><span>↗</span>{item.meta.title}</button>)}<button className={`side-nav-item ${statusFilter === "complete" ? "side-nav-item--active" : ""}`} onClick={() => { setStatusFilter("complete"); setRouteFilter("all"); }}><CheckCircle2 size={17} />Completados <b>{completeCourses.length}</b></button>{completeCourses.slice(0, 3).map((item) => <button className="quick-course-link quick-course-link--complete" key={item.course.id} onClick={() => setLocation(`/curso/${item.course.id}`)}><Check size={12} />{item.meta.title}</button>)}</div>
        <div className="sidebar-progress"><span>PROGRESO GLOBAL</span><ProgressRing value={totalProgress} size={62} /><p>{totalProgress ? "Sigue construyendo tu ruta." : "Tu siguiente módulo te espera."}</p></div>
        <div className="sidebar-account">{authLoading ? <Loader2 className="animate-spin" size={17} /> : isAuthenticated ? <><span className="account-avatar">{user?.name?.charAt(0).toUpperCase() ?? "U"}</span><div><b>{user?.name ?? "Usuario"}</b><button onClick={logout}>Cerrar sesión <LogOut size={13} /></button></div></> : <><span className="account-avatar">?</span><div><b>Guarda tu progreso</b><button onClick={startLogin}>Iniciar sesión <ArrowUpRight size={13} /></button></div></>}</div>
      </aside>

      <main className="learning-main">
        <header className="app-topbar"><div className="breadcrumbs"><span>Biblioteca</span><span>/</span><b>{routeFilter === "all" ? "Todas las rutas" : learningRoutes.find((route) => route.id === routeFilter)?.label}</b></div><a href={routeFilter === "fitness" ? "https://drive.google.com/drive/folders/1dKjIxzuDxcQZLOKM-DdSUMYQq6S1JFNB?usp=sharing" : "https://drive.google.com/drive/folders/1Rda2HOslYHwJUGK4vMR3MA8wHP19tNfX?usp=sharing"} target="_blank" rel="noreferrer">{routeFilter === "fitness" ? "Abrir Drive de salud" : "Abrir Drive original"} <ArrowUpRight size={15} /></a></header>
        <section className="catalog-hero"><div><p className="eyebrow"><span /> BIBLIOTECA PERSONAL · DRIVE</p><h1>Aprende con<br /><em>dirección.</em></h1><p>{courseCount} cursos organizados en rutas que convierten una biblioteca extensa en una secuencia concreta: decide qué estudiar, abre el contenido y registra lo aprendido.</p></div><div className="hero-focus-card"><span>ENFOQUE DE HOY</span><h2>{inProgressCourses[0]?.meta.title ?? "Elige tu primera ruta"}</h2><p>{inProgressCourses[0] ? `${courseProgress(inProgressCourses[0].course)}% completado` : "Empieza por una ruta pedagógica para crear impulso."}</p><button onClick={() => inProgressCourses[0] ? setLocation(`/curso/${inProgressCourses[0].course.id}`) : setRouteFilter("business")}>{inProgressCourses[0] ? "Continuar curso" : "Explorar rutas"}<ArrowUpRight size={16} /></button></div></section>

        <section className="catalog-toolbar"><div className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por curso, habilidad o resultado…" /></div><div className="filter-group"><Filter size={15} /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as TypeFilter)} aria-label="Filtrar por tipo de contenido">{Object.entries(contentLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} aria-label="Filtrar por estado"><option value="all">Cualquier estado</option><option value="pending">Pendiente</option><option value="active">En curso</option><option value="complete">Completado</option></select></div></section>

        {user?.role === "admin" && <PdfTranslationAdminPanel documents={pdfAdminEntries} onSetPriority={(id, priority) => setPdfTranslationPriority.mutate({ id, priority })} isSaving={setPdfTranslationPriority.isPending} />}

        <section className="route-rail" aria-label="Rutas de aprendizaje">{learningRoutes.map((route) => <button key={route.id} onClick={() => { setRouteFilter(route.id); setStatusFilter("all"); }} className={`route-card route-card--${route.accent} ${routeFilter === route.id ? "route-card--selected" : ""}`}><span>{courseMeta.filter((course) => course.routeId === route.id).length} cursos</span><h2>{route.label}</h2><p>{route.description}</p></button>)}</section>

        <section className="catalog-section"><div className="section-heading"><div><p className="eyebrow"><span /> CATÁLOGO CURADO</p><h2>{routeFilter === "all" ? "Todos los cursos" : learningRoutes.find((route) => route.id === routeFilter)?.label}</h2></div><p>{catalogQuery.isLoading ? "Cargando módulos…" : `${filteredCourses.length} cursos disponibles`}</p></div>{catalogQuery.isLoading ? <div className="catalog-loading"><Loader2 className="animate-spin" /> Preparando tu biblioteca…</div> : catalogQuery.isError ? <div className="catalog-empty"><BookOpen size={25} /><h3>No se pudo abrir el catálogo.</h3><button onClick={() => catalogQuery.refetch()}>Intentar de nuevo</button></div> : <div className="course-grid">{filteredCourses.map(({ course, meta }) => <CourseCard key={course.id} course={course} meta={meta} progress={courseProgress(course)} onOpen={() => setLocation(`/curso/${course.id}`)} />)}</div>}{!catalogQuery.isLoading && !catalogQuery.isError && filteredCourses.length === 0 && <div className="catalog-empty"><BookOpen size={25} /><h3>No encontramos cursos con estos filtros.</h3><button onClick={() => { setSearch(""); setRouteFilter("all"); setStatusFilter("all"); setTypeFilter("all"); }}>Restablecer catálogo</button></div>}</section>
        <footer className="app-footer"><span>Ruta de Aprendizaje · contenido enlazado desde Google Drive.</span><span><Sparkles size={14} /> Aprende con intención, no por acumulación.</span></footer>
      </main>
    </div>
  );
}
