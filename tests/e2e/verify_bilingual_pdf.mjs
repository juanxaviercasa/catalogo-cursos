import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 1000 } });
  await page.goto("http://localhost:3000/curso/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa", { waitUntil: "networkidle" });
  const readyPdfButtons = await page.getByRole("button", { name: "Leer en español" }).count();
  assert.equal(readyPdfButtons, 12, "Los doce PDFs disponibles deben ofrecer lectura española.");
  await page.getByRole("button", { name: "Leer en español" }).first().click();
  await page.getByRole("heading", { name: "01 - Main Guide" }).waitFor();
  await page.getByRole("button", { name: "Comparar" }).waitFor();
  const compareFrames = await page.locator(".pdf-compare-grid iframe").count();
  assert.equal(compareFrames, 1, "La comparación debe mostrar el original de Drive junto a la lectura española.");
  await page.getByRole("button", { name: "Leer en español" }).last().click();
  await page.getByText("Página 2").first().waitFor();
  const spanishText = await page.locator(".pdf-reader-full").innerText();
  assert.match(spanishText, /Ninguna parte del presente informe podrá ser reproducida/);
  await page.getByRole("button", { name: "PDF en español" }).click();
  const reconstructedUrl = await page.locator(".pdf-reconstructed-frame iframe").getAttribute("src");
  assert.ok(reconstructedUrl?.includes("/manus-storage/afl-main-guide-es_da20581a.pdf"), "El PDF reconstruido debe venir del almacenamiento gestionado.");
  await page.getByRole("button", { name: "Visual en español" }).click();
  const visualImages = await page.locator(".pdf-visual-compare img").count();
  assert.equal(visualImages, 2, "La localización visual debe mostrar la imagen original y su variante española.");
  const localizedImageUrl = await page.locator(".pdf-visual-compare img").last().getAttribute("src");
  assert.ok(localizedImageUrl?.includes("/manus-storage/afl-main-guide-page-01-es_3b48cfd6.png"), "La variante visual debe servirse desde almacenamiento gestionado.");
  const visualProgress = await page.getByLabel("Progreso: Aprobado").count();
  assert.equal(visualProgress, 1, "La localización visual aprobada debe informar su progreso completo.");
  await page.getByRole("button", { name: "Leer en español" }).nth(4).click();
  await page.getByRole("heading", { name: "05 - Presence Bonus" }).waitFor();
  await page.getByRole("button", { name: "Visual en español" }).click();
  const presenceLocalizedImageUrl = await page.locator(".pdf-visual-compare img").last().getAttribute("src");
  assert.ok(presenceLocalizedImageUrl?.includes("/manus-storage/presence-bonus-page-01-es_f61a93e9.png"), "Presence Bonus debe mostrar su segunda variante visual aprobada.");
  const approvedVisuals = await page.getByLabel("Progreso: Aprobado").count();
  assert.equal(approvedVisuals, 1, "La segunda variante visual aprobada debe informar progreso completo.");
  console.log(JSON.stringify({ readyPdfButtons, compareFrames, reconstructedUrl, localizedImageUrl, presenceLocalizedImageUrl, visualImages, visualProgress, spanishTextLength: spanishText.length }, null, 2));
} finally {
  await browser.close();
}
