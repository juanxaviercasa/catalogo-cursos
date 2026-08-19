import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 1000 } });
  await page.goto("http://localhost:3000/curso/1dxvel2jEarUb7ijNesZULpHQmbpM0bDa", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Leer en español" }).click();
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
  console.log(JSON.stringify({ compareFrames, reconstructedUrl, spanishTextLength: spanishText.length }, null, 2));
} finally {
  await browser.close();
}
