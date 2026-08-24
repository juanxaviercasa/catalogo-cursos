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

const teraboxCourseWithFolders = (id: string, name: string, folders: string[]): DriveCourse => ({
  id: `terabox-jxcasa-${id}`,
  name,
  webViewLink: TERABOX_SHARED_LINK,
  children: folders.map((folder, index) => ({
    id: `terabox-jxcasa-${id}-${index + 1}`,
    name: folder,
    mimeType: "application/vnd.terabox.folder",
    kind: "folder" as const,
    webViewLink: TERABOX_SHARED_LINK,
  })),
});

/**
 * Inventario confirmado en la carpeta compartida jxcasa.
 * Los hijos son un acceso honesto a la carpeta original: aún no se han creado
 * copias ni se han supuesto módulos que no hayan sido inspeccionados.
 */
export const teraboxCatalog: DriveCourse[] = [
  teraboxCourseWithFolders("ai-digital-marketing-guide", "The AI-Powered Digital Marketing & Digital Advertising Guide", [
    "01. Digital Marketing Essentials",
    "02. ChatGPT [Free Version]",
    "10. Google Analytics 4",
    "12. Psychology of Persuasion [On-Page SEO]",
    "13. Structured Data for YouTube Video [On-Page SEO]",
    "15. WooCommerce Products, Attributes, Categories, Smart Filters, Uploads",
    "16. WooCommerce Checkout Experience & Elementor Pro",
    "17. WooCommerce Marketing, Google Free Listings",
    "18. Plugins, Translations, SMTP, Multi-Currency, DKIM, Heat Maps, Reviews",
    "19. WordPress Security, CloudFlare Turnstile, Database Optimization, Backups",
    "20. Wikipedia Link Building [Off-Page SEO]",
    "21. Email Marketing & Mailchimp",
    "22. Google Advertising [AI Google Max Performance]",
    "23. Meta for Business [Business Manager, Facebook Page, Meta Suite]",
    "24. Meta Data Sources [Pixel, Conversion API]",
    "25. Meta Ads Objectives & Ads Guide",
    "26. Meta Ads Manager & Campaign Structure",
    "27. Meta Audiences, Meta AI+ Targeting, Meta+ AI Functions",
    "28. Meta Advertising for Local Business",
    "29. Meta Broad Targeting & Special Ad Categories",
  ]),
  teraboxCourseWithFolders("ai-automation-agency", "AI Automation Agency", [
    "00- START HERE",
    "01- AI AUTOMATION DEMO BUILD",
    "02- AI AUTOMATION OUTREACH",
    "03- AI AUTOMATION SERVICE DELIVERY",
    "04- NO CODE AI AUTOMATION",
    "05- AI AUTOMATION WORKSHOPS",
    "SALES TRAINING",
  ]),
  teraboxCourseWithFolders("kcpqhdfcc", "KCPQHDFCC", [
    "00-Quantum Human Design™ Family Coach Certification",
    "01-Module 1",
    "02-Module 2 Ages & Stages of Development",
    "03-Module 3 Quantum Human Design",
    "04-Module 4 Conditioning",
    "05-Module 5 Mistaken Motivations",
    "06-Module 6 Parenting for High Self-Worth",
    "07-Module 7 Special Coaching Topics",
    "08-Module 8 Putting it all Together",
    "09-Module 9 Parenting by Design",
    "10-QHDFCC Training Final Steps",
  ]),
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
