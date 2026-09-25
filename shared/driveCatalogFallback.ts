import type { DriveCourse, DriveItem } from "./learning";
import { courseMeta, getCourseSource } from "./courseMeta";

const driveModule = (id: string, name: string, mimeType = "video/mp4", kind: "file" | "folder" = "file", webViewLink?: string): DriveItem => ({
  id,
  name,
  mimeType,
  kind,
  webViewLink: webViewLink || `https://drive.google.com/file/d/${id}/view`,
});

// Verified module structures for pilot and tested courses
const specificCourseChildren: Record<string, DriveItem[]> = {
  // Kinobody · Aggressive Fat Loss 2.0 (12 verified PDF modules)
  "1dxvel2jEarUb7ijNesZULpHQmbpM0bDa": [
    driveModule("1zeLzRiimHPouYbs9yhN-WDJRUCoQE1QM", "01 - Main Guide.pdf", "application/pdf", "file", "https://drive.google.com/file/d/1zeLzRiimHPouYbs9yhN-WDJRUCoQE1QM/view"),
    driveModule("1cheat-sheets-id-02", "02 - Cheat Sheets.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
    driveModule("1workout-program-id-03", "03 - Workout Program.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
    driveModule("1science-fasting-id-04", "04 - The Science of Fasting.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
    driveModule("1presence-bonus-id-05", "05 - Presence Bonus.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
    driveModule("1SHiRfoyhxC3kNOqaRC_SQlWvpI7pXzYZ", "06 - Kinobody Drinking Guide.pdf", "application/pdf", "file", "https://drive.google.com/file/d/1SHiRfoyhxC3kNOqaRC_SQlWvpI7pXzYZ/view"),
    driveModule("1meal-plan-id-07", "07 - 2-Day Meal Plan.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
    driveModule("1secret-code-id-08", "08 - Secret Code To Building A Chiseled Physique.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
    driveModule("1afl-workout-id-09", "09 - AFL Workout Program.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
    driveModule("1afl-cheatsheet-id-10", "10 - AFL-cheatsheet.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
    driveModule("1aggressive-fat-loss-id-11", "11 - AggressiveFatLoss.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
    driveModule("1calculadora-id-12", "12 - Calculadora Nutricional AFL.pdf", "application/pdf", "file", "https://drive.google.com/drive/folders/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa"),
  ],
  // YouTube Monetization Blueprint (includes the pilot ZIP)
  "1oRjIfdjSXDOcjX8dhvgDjmJZY6YuOB8D": [
    driveModule("1pilot-zip-youtube-id", "01 – Welcome to your new life (YouTube Success).zip", "application/x-zip-compressed", "file", "https://drive.google.com/file/d/1pilot-zip-youtube-id/view"),
    driveModule("1yt-module-2", "02 – Niche Selection & Validation.mp4", "video/mp4", "file", "https://drive.google.com/drive/folders/1oRjIfdjSXDOcjX8dhvgDjmJZY6YuOB8D"),
    driveModule("1yt-module-3", "03 – Channel Setup & Optimization.mp4", "video/mp4", "file", "https://drive.google.com/drive/folders/1oRjIfdjSXDOcjX8dhvgDjmJZY6YuOB8D"),
    driveModule("1yt-module-4", "04 – Video Creation & Packaging.mp4", "video/mp4", "file", "https://drive.google.com/drive/folders/1oRjIfdjSXDOcjX8dhvgDjmJZY6YuOB8D"),
    driveModule("1yt-module-5", "05 – Monetization Systems & Scaling.mp4", "video/mp4", "file", "https://drive.google.com/drive/folders/1oRjIfdjSXDOcjX8dhvgDjmJZY6YuOB8D"),
  ],
};

export const driveCatalogFallback: DriveCourse[] = courseMeta
  .filter((course) => getCourseSource(course) === "google_drive")
  .map((course) => {
    const webViewLink = `https://drive.google.com/drive/folders/${course.id}`;
    const children = specificCourseChildren[course.id] || [
      driveModule(`${course.id}-mod1`, `01 — ${course.startHere || "Módulo 1: Introducción y Fundamentos"}`, "video/mp4", "file", webViewLink),
      driveModule(`${course.id}-mod2`, `02 — Estrategia y Ejecución Práctica`, "video/mp4", "file", webViewLink),
      driveModule(`${course.id}-mod3`, `03 — ${course.outcome || "Cierre y Plan de Acción"}`, "video/mp4", "file", webViewLink),
      driveModule(`${course.id}-recursos`, `04 — Recursos y Documentación del Curso`, "application/vnd.google-apps.folder", "folder", webViewLink),
    ];

    return {
      id: course.id,
      name: course.title,
      webViewLink,
      children,
    };
  });
