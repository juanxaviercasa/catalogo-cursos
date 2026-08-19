import { savePdfVisualLocalization } from "../server/db.ts";

const [courseId, moduleId, pageNumberValue, sourceImageUrl, localizedStorageUrl, sourceText, translatedText, status = "ready"] = process.argv.slice(2);

if (!courseId || !moduleId || !pageNumberValue || !sourceImageUrl || !localizedStorageUrl || !sourceText || !translatedText) {
  throw new Error("Uso: pnpm tsx workers/register_pdf_visual_localization_result.mjs <courseId> <moduleId> <pageNumber> <url-original> <url-es> <texto-en> <texto-es> [review|ready]");
}

const pageNumber = Number(pageNumberValue);
if (!Number.isInteger(pageNumber) || pageNumber < 1) throw new Error("pageNumber debe ser un entero positivo.");
if (!["review", "ready"].includes(status)) throw new Error("El estado debe ser review o ready.");

const result = await savePdfVisualLocalization({
  courseId,
  moduleId,
  pageNumber,
  sourceImageUrl,
  localizedStorageUrl,
  sourceText,
  translatedText,
  status,
  provider: "image-service",
});

const visual = result?.visualLocalizations.find((item) => item.pageNumber === pageNumber);
console.log(JSON.stringify({ id: visual?.id, pageNumber: visual?.pageNumber, status: visual?.status, localizedStorageUrl: visual?.localizedStorageUrl }, null, 2));
