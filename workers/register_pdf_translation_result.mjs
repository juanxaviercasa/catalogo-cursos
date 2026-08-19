import { readFile } from "node:fs/promises";
import { savePdfTranslationResult } from "../server/db.ts";

const [courseId, moduleId, sourceUrl, reconstructedStorageUrl, reconstructedStorageKey, segmentsPath] = process.argv.slice(2);
if (![courseId, moduleId, sourceUrl, reconstructedStorageUrl, reconstructedStorageKey, segmentsPath].every(Boolean)) {
  throw new Error("Uso: tsx workers/register_pdf_translation_result.mjs <courseId> <moduleId> <sourceUrl> <pdfUrl> <storageKey> <segmentsJson>");
}

const payload = JSON.parse(await readFile(segmentsPath, "utf8"));
const segments = payload.pages.flatMap((page) => page.segments);
const result = await savePdfTranslationResult({
  courseId,
  moduleId,
  sourceUrl,
  reconstructedStorageKey,
  reconstructedStorageUrl,
  pageCount: payload.pageCount,
  segments,
});
console.log(JSON.stringify({ id: result?.id, status: result?.status, pageCount: result?.pageCount, segments: result?.segments.length, reconstructedStorageUrl: result?.reconstructedStorageUrl }, null, 2));
