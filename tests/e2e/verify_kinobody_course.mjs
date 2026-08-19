import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.TEST_APP_ORIGIN ?? "http://localhost:3000";
const resources = JSON.parse(await readFile("/home/ubuntu/curso_drive_analysis/kinobody_resource_links.json", "utf8"));
const browser = await chromium.launch({ headless: true, executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  const cases = [
    { id: "1IkRomy3M6h9RfDKSln9NjW-Q4x7FZJ2p", title: "Kinobody · 30 Day Working Out", resourceKey: "30-day-working-out" },
    { id: "1dxvel2jEarUb7ijNesZULpHQmbpM0bDa", title: "Kinobody · Aggressive Fat Loss 2.0", resourceKey: "aggressive-fat-loss" },
    { id: "1C0jkpBEP67eGfw9w2QvylDifOOxc2hnZ", title: "Kinobody · Greek God Muscle Building", resourceKey: "Greek-god" },
    { id: "1hGCKVpEUdS8H6FefY4Th-_GH1XQT0Evt", title: "Kinobody · KINOCHEF", resourceKey: "kinochef" },
    { id: "16CSfE6f_NUo_AWLobnCwCxbWW4ZWvJwr", title: "Kinobody · SuperHero Bulking", resourceKey: "superhero-bulking" },
    { id: "14qYxKwwDHMtxXwzExn_ZDQ3v55QAH97k", title: "Kinobody · Warrior Shredding", resourceKey: "warrior-shredding" },
  ];
  const results = [];
  for (const entry of cases) {
    await page.goto(`${baseUrl}/curso/${entry.id}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: entry.title }).waitFor();
    await page.getByText("Salud y Rendimiento").first().waitFor();
    const moduleRows = await page.locator(".module-row").count();
    const links = page.getByRole("link", { name: "Ir al contenido" });
    const driveLinks = await links.count();
    const directResources = await links.evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")));
    const courseDriveUrl = await page.getByRole("link", { name: "Abrir carpeta en Drive" }).getAttribute("href");
    const expectedResources = resources[entry.resourceKey].map((resource) => resource.webViewLink);
    assert.equal(moduleRows, expectedResources.length, `${entry.title} debe mostrar todos sus módulos reales.`);
    assert.equal(driveLinks, expectedResources.length, `${entry.title} debe enlazar cada módulo a Drive.`);
    assert.deepEqual(directResources, expectedResources, `${entry.title} debe enlazar cada recurso individual real.`);
    assert.equal(courseDriveUrl, `https://drive.google.com/drive/folders/${entry.id}`);
    results.push({ courseId: entry.id, moduleRows, driveLinks, firstResource: directResources[0], courseDriveUrl });
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
