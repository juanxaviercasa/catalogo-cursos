import { chromium } from "playwright";

const url = "http://localhost:3000/curso/1oRjIfdjSXDOcjX8dhvgDjmJZY6YuOB8D";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

try {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Ver 6 vídeos listos/ }).click();
  const preparedVideoStates = await page.locator(".prepared-video-card video").evaluateAll(async (videos) => Promise.all(videos.map(async (video) => {
    await new Promise((resolve, reject) => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return resolve();
      const timeout = window.setTimeout(() => reject(new Error(`Tiempo de espera al cargar ${video.currentSrc || video.getAttribute("src")}.`)), 15000);
      video.addEventListener("loadedmetadata", () => { clearTimeout(timeout); resolve(); }, { once: true });
      video.addEventListener("error", () => { clearTimeout(timeout); reject(new Error(`El vídeo devolvió un error: ${video.currentSrc || video.getAttribute("src")}.`)); }, { once: true });
      video.load();
    });
    return { source: video.currentSrc || video.getAttribute("src"), readyState: video.readyState, duration: video.duration };
  })));
  const spanish = page.getByRole("button", { name: "Español", exact: true });
  await spanish.click();
  const firstPreparedVideo = page.getByRole("article").filter({ hasText: "01-Welcome friends" }).locator("video");
  const spanishState = await firstPreparedVideo.evaluate(async (video) => {
    await new Promise((resolve, reject) => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return resolve();
      const timeout = window.setTimeout(() => reject(new Error("Tiempo de espera al cargar el vídeo español.")), 15000);
      video.addEventListener("loadedmetadata", () => { clearTimeout(timeout); resolve(); }, { once: true });
      video.addEventListener("error", () => { clearTimeout(timeout); reject(new Error("El vídeo español devolvió un error.")); }, { once: true });
      video.load();
    });
    return {
      source: video.currentSrc || video.getAttribute("src"),
      track: video.querySelector("track")?.getAttribute("src") ?? null,
      trackDefault: video.querySelector("track")?.hasAttribute("default") ?? false,
      readyState: video.readyState,
      duration: video.duration,
    };
  });
  await page.getByRole("button", { name: /Original · inglés/ }).click();
  const originalState = await firstPreparedVideo.evaluate((video) => ({ source: video.currentSrc || video.getAttribute("src"), readyState: video.readyState }));
  console.log(JSON.stringify({ preparedVideoStates, spanishState, originalState }, null, 2));
  if (preparedVideoStates.length !== 6) throw new Error("El ZIP piloto no expuso los seis vídeos preparados.");
  if (preparedVideoStates.some((video) => !video.source?.includes("/manus-storage/") || video.readyState < 1 || !Number.isFinite(video.duration) || video.duration <= 0)) throw new Error("Uno de los vídeos preparados no cargó metadatos válidos desde el almacenamiento gestionado.");
  if (preparedVideoStates.filter((video) => !video.source?.includes("01-welcome-friends-es-v2_4a28e61b.mp4")).length !== 5) throw new Error("Los cinco MP4 convertidos desde MKV no están presentes en el reproductor.");
  if (!spanishState.source.includes("01-welcome-friends-es-v2_4a28e61b.mp4")) throw new Error("La pista española no cargó el MP4 refinado.");
  if (!spanishState.track?.includes("01-welcome-friends-es-v2_c49422eb.vtt") || !spanishState.trackDefault) throw new Error("Los subtítulos españoles no están asociados a la pista española.");
  if (!originalState.source.includes("course-imports/1/")) throw new Error("El selector no regresó al audio original.");
} finally {
  await browser.close();
}
