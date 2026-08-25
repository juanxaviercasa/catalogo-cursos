import type { DriveCourse } from "./learning";

export const TERABOX_ROOT_URL = "https://1024tera.com/spanish/main";
/** Alias histórico conservado para no romper imports existentes. */
export const TERABOX_SHARED_LINK = TERABOX_ROOT_URL;
export const TERABOX_ROOT_PATH = "/";

const teraboxCourse = (id: string, name: string): DriveCourse => ({
  id: `terabox-jxcasa-${id}`,
  name,
  webViewLink: TERABOX_SHARED_LINK,
  rootPath: TERABOX_ROOT_PATH,
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
  rootPath: TERABOX_ROOT_PATH,
  children: folders.map((folder, index) => ({
    id: `terabox-jxcasa-${id}-${index + 1}`,
    name: folder,
    mimeType: "application/vnd.terabox.folder",
    kind: "folder" as const,
    webViewLink: TERABOX_SHARED_LINK,
  })),
});

const teraboxCourseWithFiles = (id: string, name: string, files: string[]): DriveCourse => ({
  id: `terabox-jxcasa-${id}`,
  name,
  webViewLink: TERABOX_SHARED_LINK,
  rootPath: TERABOX_ROOT_PATH,
  children: files.map((file, index) => ({
    id: `terabox-jxcasa-${id}-file-${index + 1}`,
    name: file,
    mimeType: file.endsWith(".mp4") ? "video/mp4" : file.endsWith(".xlsx") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    kind: "file" as const,
    webViewLink: TERABOX_SHARED_LINK,
  })),
});

/**
 * Inventario confirmado en la raíz de la cuenta Terabox, tras eliminar el contenedor jxcasa.
 * Los hijos son un acceso honesto a la carpeta original: aún no se han creado
 * copias ni se han supuesto módulos que no hayan sido inspeccionados.
 */
export const teraboxSlug = (name: string) => name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const expandedTeraboxNames = [
  "August Bradley – FastTrack Notion",
  "Gabe - The Attraction Formulas",
  "Paget Kagy - Unlocking Codes of Abundance",
  "Jesse Itzler - Normal Is Broken",
  "Sabri Suby - Persuasion Mastery",
  "Dan Smith - Ecommerce Mentorship & Blueprint",
  "Dan Lok – Ultra High Ticket Closing",
  "Chase Chappell – Ecommerce Accelerator Course 2024",
  "DKRBMM",
  "Ryan Daniel Moran - Million Dollar Brands",
  "Ecom University - Ecom University Blueprint 2.0",
  "The YES SUPPLY Method Certifications",
  "Grant Cardone - 10X Marketing",
  "Ecommerce Print on Demand",
  "SkillShare - Notion Masterclass Maximise Your Productivity and Organisation",
  "Deepfake Clone Yourself with AI Chat with Your Digital Twin",
  "Studio Socials - Social Media Manager Academy Silver",
  "How-to-create-a-Shopify-Store-2023-Introductory-guide-to-Shopify-Website",
  "George Hutton – Intelligence Accelerator",
  "Grant Cardone - 10x Marketing Mega Bundle",
  "SUPERMIND Technique The Secret to Success in any Exam",
  "Chase Hughes - Confidence Reboot",
  "YouTube MagnatesMedia",
  "Chad Salesman",
  "Peter Kell - VSL Masterclass",
  "Shawn Twing, Andre Chaperon – Idea To Assets",
  "Bastiaan Slot - Appointment Setter",
  "02- Saturn's Ring Multimedia - Video Editing",
  "Dan Lok - High Ticket Closer 2020",
  "Justing Phillips - The Last eCom Course",
  "MPQC",
  "Matt Giaro - The Daily Content System",
  "Mindvalley - Social Media Mastery",
  "NT&AKGHMB",
  "AGENCY ACCELERATOR",
  "Fluent University - The Trio Bundle",
  "Grant Cardone – Be Obsessed or Be Average",
  "Grant Cardone - Sales Fundamentals",
  "Grant Cardone- The Perfect Hire Value System",
  "Jon Brosio - Masterclass Bundle",
  "HigherLevels – Tech Sales Ascension",
  "Grant Cardone - The 10X Business Buying Accelerator",
  "Alastair Pitts - Unlock The World With Personalized Cold Email",
  "Alex Najarian – Offer Art",
  "Robby Blanchard – Commission Hero AI",
  "Alex Colhoun – The Growth Operating System",
  "Pedro Moreira – CSS Masters Bundle",
  "Rob Andolina - Google Ads Training Academy",
  "Sara Finance - Affiliate Marketing Course",
  "Ewan Davies – The PDF Empire Builder",
  "Rank Your Local Business On Google's Map-Pack + GMB Framework",
  "Gus Levitate – Prospecting Prodigy (Lead DeGens)",
  "Viral Trends - Brendan Kane",
  "A.I. Ads Machine + 10 Profitable Sales Funnels + The Digital Marketer's Guide To ChatGPT",
  "Vasco Monteiro – Saas Marketing Mastery",
  "Jason Miller, Sebastian Ford – Instant Ai Millionaire",
  "David Kollar - Fast-Track Fashion Academy Elite",
  "Infinity Affiliate Course",
  "Cursos",
] as const;

type TeraboxAccountConfig = { idPrefix: string; sharedLink: string; rootPath: string };

const teraboxCourseForAccount = (config: TeraboxAccountConfig, id: string, name: string): DriveCourse => ({
  id: `${config.idPrefix}-${id}`,
  name,
  webViewLink: config.sharedLink,
  rootPath: config.rootPath,
  children: [{
    id: `${config.idPrefix}-${id}-folder`,
    name: `01 · Abrir carpeta del curso en Terabox`,
    mimeType: "application/vnd.terabox.folder",
    kind: "folder",
    webViewLink: config.sharedLink,
  }],
});

export const TERABOX_CABELLOSALIRROSAS_ACCOUNT_EMAIL = "cabellosalirrosas@gmail.com";
export const TERABOX_CABELLOSALIRROSAS_SHARED_LINK = "https://www.1024terabox.com/s/1lIWzeZq4WLlA-4-wz_HtIg";
const CABELLOSALIRROSAS_CONFIG: TeraboxAccountConfig = {
  idPrefix: "terabox-cabellosalirrosas",
  sharedLink: TERABOX_CABELLOSALIRROSAS_SHARED_LINK,
  rootPath: "/",
};

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
  teraboxCourseWithFiles("onlyfans-agency", "Robert Richards — How to Create a Successful OnlyFans Agency", [
    "01-Introduction.mp4",
    "02-Chapter 1 - Finding Models.mp4",
    "04-Ch 3 - Creating Accounts.mp4",
    "05-Ch 4 - Contracts - Taxes.mp4",
    "06-Ch 5 - Free Photoshoot.mp4",
    "07-Ch 6 - Content Creation.mp4",
    "09-Ch 8 - The Art Of Finesse.mp4",
    "10-Ch 9 - Managing Social Media.mp4",
    "11-Ch 10 - OnlyFans Automation.mp4",
    "12-Ch 11 - Dealing with Flaky Models.mp4",
    "13-Ch 12 - Promoting OnlyFans PT1.mp4",
    "14-Ch 13 - Promoting Onlyfans PT2.mp4",
    "15-Chapter 14 - Promoting OnlyFans PT3.mp4",
    "16-Chapter 15 - Promoting OnlyFans PT4.mp4",
    "17-Chapter 16 - Promoting OnlyFans PT5.mp4",
    "18-Ch 17 - Referral links.mp4",
    "19-Ch 18 - Recap & Final Thoughts.mp4",
    "22-June 2022 Update.mp4",
    "21-Account List Template.xlsx",
    "20-Model Relase Template.docx",
  ]),
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
  ...expandedTeraboxNames.map((name) => teraboxCourse(teraboxSlug(name), name)),
];

/**
 * Inventario inicial observado en el enlace compartido de cabellosalirrosas@gmail.com.
 * Se conserva como colección separada hasta confirmar enlaces profundos individuales.
 */
export const teraboxCabellosalirrosasNames = [
  "CHATGPT",
  "Otros Zu",
  "From: AI Transcribe",
  "Telegram - @cursosp0rmega - 3923 - Amigurumis: personas tejidas a crochet",
  "Crea tu Curso con IA",
  "PDF",
  "Codigo Million",
  "IA Profit Academy",
  "Formula 100k",
  "Nitrofit",
  "DEVIN JATHO - 13 Video Templates Pre-Structured for Social Media",
  "Manychat",
  "Seduccion Subliminal PRO",
  "Inmersión Low2High",
  "Nichos con IA - Dani Llamazares",
  "Sin Ventas no hay Paraiso",
  "Kit Super Coach - Conviértete en un COACH",
  "ESCUELA DE SEDUCCION",
  "Mi diario de Yoga - Xuan Lan",
  "Merengue a lo Maco en el Bajo Eléctrico",
] as const;

export const teraboxCabellosalirrosasCatalog: DriveCourse[] = teraboxCabellosalirrosasNames.map((name) =>
  teraboxCourseForAccount(CABELLOSALIRROSAS_CONFIG, teraboxSlug(name), name),
);


export const TERABOX_CABELLOSALIRROSAS_SECOND_SHARED_LINK = "https://www.1024terabox.com/s/1JA9tWWmNRL1nTHLBWrpqfg";
const CABELLOSALIRROSAS_SECOND_CONFIG: TeraboxAccountConfig = {
  idPrefix: "terabox-cabellosalirrosas-second",
  sharedLink: TERABOX_CABELLOSALIRROSAS_SECOND_SHARED_LINK,
  rootPath: "/",
};

/** Inventario inicial observado en el segundo enlace compartido de cabellosalirrosas. */
export const teraboxCabellosalirrosasSecondNames = [
  "Cómo Crear una LLC en USA - Libertad Virtual",
  "Courses",
  "Ingles",
  "MAQUINA DEL DINERO",
  "Brandon Timothy - Digital Freedom Academy",
  "Evento SEOPlus 2024",
  "Alex Pereira - Insta To Riches Roadmap",
  "MASTER EN 6 CIFRAS",
  "Contable",
  "Duerme Como Tesla",
  "LANZA TU ESCUELA ONLINE",
  "Bootcamp ENGLISH FOR DEVELOPERS- Grupo 3",
  "Libros Mate",
  "Programa de coaching Formula 100k",
  "ventas",
  "Curso Máster en VSL – Serghei Harin",
  "Curso Youtube + IA Maquina de Imprimir Dinero",
  "Víctor Heras",
  "Ian Bernal",
  "Curso Revolucion del Infoproducto – Paulo Ponquio",
] as const;

export const teraboxCabellosalirrosasSecondCatalog: DriveCourse[] = teraboxCabellosalirrosasSecondNames.map((name) =>
  teraboxCourseForAccount(CABELLOSALIRROSAS_SECOND_CONFIG, teraboxSlug(name), name),
);


export const TERABOX_JXAVIERCABELLOS_ACCOUNT_EMAIL = "jxaviercabellos@gmail.com";
export const TERABOX_JXAVIERCABELLOS_SHARED_LINK = "https://1024terabox.com/s/1ak41wq0adRZ3hfiTtJQwVQ";
const JXAVIERCABELLOS_CONFIG: TeraboxAccountConfig = {
  idPrefix: "terabox-jxaviercabellos",
  sharedLink: TERABOX_JXAVIERCABELLOS_SHARED_LINK,
  rootPath: "/",
};

/** Inventario inicial observado en el tercer enlace compartido de jxaviercabellos. */
export const teraboxJxaviercabellosNames = [
  "Cursos",
  "Yasin Mammeri – Viral Video Course",
  "Jeremy Miner And Matthew Rider – 7th Level Communications – Hunter Gatherer",
  "Viralish Creator – The Stcky Videos Course",
  "Daniel Foley Carter - SEO Webinar Bundle Course",
  "HOW I MAKE 500 DAY - USING INSTAGRAM GLITCH - A METHOD IS FOR BEGINNERS",
  "Zita - Viral Content Creator AI Automation 2024",
  "Jon Dykstra - Local Riches",
  "Jennifer Hoffman – Core 4 Karma & Energy Healing",
  "Erica Scheider and Rob Lennon - Content Editing 101 - AI Learning Guides and Editors",
  "April and Eric Perry - Steps to Everyday Productivity",
  "Peter Diamandis - Fund Your Purpose",
  "Yoyao Hsueh - Topical Maps Unlocked 2.0",
  "Brandon Mulrenin (ReverseSelling) - Listing Agent Certification",
  "Philosophaire - Viral Video - Social Media Guide - COPY OF AI VOICE",
  "CapitalTycoon - Ecom Explosive Bootcamp",
  "Kate McKibbin - Instaatm eCourse Launch Lab",
  "Anvar Jabirov - Ecom Creative Powerhouse",
  "Phoebe Khun – The Content Emporium Complete Library",
  "Justing Phillips - The Last eCom Course",
] as const;

export const teraboxJxaviercabellosCatalog: DriveCourse[] = teraboxJxaviercabellosNames.map((name) =>
  teraboxCourseForAccount(JXAVIERCABELLOS_CONFIG, teraboxSlug(name), name),
);
