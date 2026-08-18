import { chromium } from "playwright";

const url = "http://localhost:3000/curso/1oRjIfdjSXDOcjX8dhvgDjmJZY6YuOB8D";
const expectedTitle = "04-Traditional VS Faceless Channels";
const expectedMessage = "Pendiente de recuperación automática desde el ZIP de Drive.";
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });

try {
  await page.goto(url, { waitUntil: "networkidle" });
  const state = await page.locator(".zip-video-status-panel").evaluate((panel) => ({
    title: panel.querySelector(".zip-video-status b")?.textContent?.trim() ?? "",
    message: panel.querySelector(".zip-video-status small")?.textContent?.trim() ?? "",
    status: panel.querySelector(".zip-video-status > span")?.textContent?.trim() ?? "",
  }));
  console.log(JSON.stringify(state, null, 2));
  if (state.title !== expectedTitle || state.message !== expectedMessage || state.status !== "En cola") throw new Error("La interfaz no mostró el estado individual esperado para el vídeo en cola.");
} finally {
  await browser.close();
}
