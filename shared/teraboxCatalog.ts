import type { DriveCourse } from "./learning";

export const TERABOX_SHARED_LINK = "https://www.1024tera.com/spanish/sharing/link?surl=68IfqGVjoXwH5FzSAbgVXA";

const teraboxCourse = (id: string, name: string): DriveCourse => ({
  id: `terabox-jxcasa-${id}`,
  name,
  webViewLink: TERABOX_SHARED_LINK,
  children: [{
    id: `terabox-jxcasa-${id}-folder`,
    name: `01 · Abrir carpeta del curso en Terabox`,
    mimeType: "application/vnd.terabox.folder",
    kind: "folder",
    webViewLink: TERABOX_SHARED_LINK,
  }],
});

/**
 * Inventario confirmado en la carpeta compartida jxcasa.
 * Los hijos son un acceso honesto a la carpeta original: aún no se han creado
 * copias ni se han supuesto módulos que no hayan sido inspeccionados.
 */
export const teraboxCatalog: DriveCourse[] = [
  teraboxCourse("ai-digital-marketing-guide", "The AI-Powered Digital Marketing & Digital Advertising Guide"),
  teraboxCourse("ai-automation-agency", "AI Automation Agency"),
  teraboxCourse("kcpqhdfcc", "KCPQHDFCC"),
  teraboxCourse("onlyfans-agency", "Robert Richards — How to Create a Successful OnlyFans Agency"),
  teraboxCourse("millionaire-speakers", "Millionaire Speakers Leadership Influence Mastery"),
  teraboxCourse("how-to-use-ai-to-make-money", "How to Use AI to Make Money"),
  teraboxCourse("chatgpt-make-money-ai-canva", "ChatGPT Complete Course: Make Money with AI & Canva 2025"),
  teraboxCourse("bob-proctor-thinking-results", "Bob Proctor — Thinking into Results"),
  teraboxCourse("mindvalley-mystic-brain", "MindValley — Mystic Brain"),
  teraboxCourse("facebook-monetization", "Facebook Monetization — Basic to Advanced"),
  teraboxCourse("saad-automation", "Saad Automation"),
  teraboxCourse("fitness-programs", "Fitness Programs"),
  teraboxCourse("russell-brunson-secrets", "Russell Brunson — Secrets"),
  teraboxCourse("kamal-cpm", "Kamal CPM Full Course"),
  teraboxCourse("brandon-digital-freedom", "Brandon Timothy — Digital Freedom Academy"),
  teraboxCourse("jk-molina-cash-creators", "JK Molina — Cash Creators September Bundle"),
  teraboxCourse("caitlin-hard-as-you-want", "Caitlin V — Hard As You Want Course"),
  teraboxCourse("etsy-academy", "Growing Your Craft — Etsy Academy 2.0"),
  teraboxCourse("matt-par-tube-ai", "Matt Par — Tube AI System"),
  teraboxCourse("david-tian-social-circle", "David Tian — Social Circle Mastery"),
];
