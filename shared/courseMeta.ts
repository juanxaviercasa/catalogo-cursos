export type LearningRoute = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  accent: string;
};

export type CourseMeta = {
  id: string;
  routeId: string;
  order: number;
  title: string;
  description: string;
  whatYouLearn: string;
  startHere: string;
  outcome: string;
};

export const learningRoutes: LearningRoute[] = [
  { id: "business", label: "Negocio y Agencia", shortLabel: "Negocio", description: "Oferta, operación, adquisición y sistemas para construir una agencia sólida.", accent: "amber" },
  { id: "sales", label: "Ventas y Negociación", shortLabel: "Ventas", description: "Proceso comercial, conversación, cierre y prospección multicanal.", accent: "coral" },
  { id: "content", label: "Contenido y Redes", shortLabel: "Contenido", description: "Estrategia, producción, distribución y monetización de contenido.", accent: "violet" },
  { id: "ecommerce", label: "Ecommerce", shortLabel: "Ecommerce", description: "Diseño, captación, operación y escalado de una tienda digital.", accent: "mint" },
  { id: "ai", label: "IA y Creación", shortLabel: "IA", description: "Investigación, creación y lanzamiento de productos educativos con IA.", accent: "sky" },
  { id: "finance", label: "Finanzas y Desarrollo Personal", shortLabel: "Finanzas", description: "Biblioteca separada de educación financiera y mentalidad.", accent: "rose" },
];

export const courseMeta: CourseMeta[] = [
  { id: "1hw3D8i-33NPwKi8C5MVcCq8XxjBaBl-B", routeId: "business", order: 1, title: "AMG", description: "Ruta de agencia en tres fases: operación, clientes e ingresos.", whatYouLearn: "Estructurar una agencia, captar clientes y convertir el servicio en ingresos sostenibles.", startHere: "Fase 1 — Tu Agencia", outcome: "Un mapa operativo para tu agencia y sus prioridades comerciales." },
  { id: "1gP3-D_4oelnV0w5xQHHWg5KPIJCq5RPw", routeId: "business", order: 2, title: "SMMA", description: "Sistema práctico para desarrollar y operar una agencia de social media.", whatYouLearn: "Fundamentos, operación, subcontratación, prospección y cierre.", startHere: "1. FUNDAMENTOS", outcome: "Una base operativa para ofrecer y gestionar servicios de marketing." },
  { id: "1Z1a7Yn_3hGT5cEOCbVmGzhjtjz3aiReH", routeId: "business", order: 3, title: "Plan de acción para agencias web", description: "Blueprint para crear una agencia web de adquisición a entrega.", whatYouLearn: "Fundación, adquisición, fulfillment y llamadas de venta.", startHere: "00 — The Web Agency Blueprint", outcome: "Un plan de acción para lanzar o ordenar una agencia web." },
  { id: "1QRrjTxcggVXl5iGJ2lpSCmBUU-PmVw3Y", routeId: "business", order: 4, title: "Business Accelerator", description: "Biblioteca de crecimiento empresarial y sistemas de escalado.", whatYouLearn: "Crecimiento rápido, estrategia y herramientas de negocio.", startHere: "01 — Welcome to Business Accelerator", outcome: "Un sistema de prioridades para acelerar el crecimiento del negocio." },
  { id: "1YpBQR8Ol_Mx5H5FQwbsyYrWnsc7t1Baf", routeId: "business", order: 5, title: "Biblioteca de negocios", description: "Colección de subcursos de negocio, ecommerce, copywriting y freelancing.", whatYouLearn: "Elegir una especialización y profundizar con itinerarios complementarios.", startHere: "Business Mastery o el subcurso alineado a tu objetivo", outcome: "Una ruta complementaria elegida con intención, sin mezclar cursos al azar." },
  { id: "1HmLxqpyBLRXjK36YuTme1ZQgJ1GRlloe", routeId: "sales", order: 1, title: "Real Sales System", description: "Fundamentos de actividad comercial y descubrimiento del dolor del cliente.", whatYouLearn: "Diseñar un proceso comercial y conducir conversaciones de diagnóstico.", startHere: "1 — Activity & Process", outcome: "Un proceso base de prospección y conversación de ventas." },
  { id: "1V5JbOWfJGBzanXcHgEFZbISxK39rSX0z", routeId: "sales", order: 2, title: "Sales Negotiation", description: "Ruta estructurada de negociación, objeciones y cierre.", whatYouLearn: "Cerrar ventas con claridad, gestionar objeciones y reforzar la propuesta.", startHere: "01 — Negotiating And Closing Master Class", outcome: "Un marco de conversación y negociación aplicable a ofertas propias." },
  { id: "1u0vWzbFsGK3N1_G4oklznFyLBaS73DcR", routeId: "sales", order: 3, title: "Jordan Belfort 4 in 1", description: "Colección de psicología de ventas, guiones y marketing directo.", whatYouLearn: "Persuasión responsable, estructuración de guiones y mensaje comercial.", startHere: "Inner Game of Wealth", outcome: "Un guion de ventas y una estructura de comunicación más consistente." },
  { id: "1hDv1GqR56zuf45BDbGIlyTwvqZCKN78f", routeId: "sales", order: 4, title: "Cardone U", description: "Biblioteca de ventas con práctica de prospección, respuesta y cierre.", whatYouLearn: "Fundamentos, buyer understanding, llamadas entrantes y estrategias de cierre.", startHere: "Selling Basics", outcome: "Una biblioteca de práctica para reforzar cada etapa del proceso comercial." },
  { id: "17Eryb74Ci713Vdkp-wtkGvF7lLiwvzUA", routeId: "sales", order: 5, title: "Cold Email Cash Flow", description: "Sistema de prospección por correo con investigación, oferta y seguimiento.", whatYouLearn: "Crear listas, mensajes, asuntos y secuencias de seguimiento.", startHere: "Módulos de investigación, objetivo y oferta", outcome: "Una campaña inicial de cold email documentada y medible." },
  { id: "1ztNbicfwwYN9GqsR34hbG4GeSaDB2t7G", routeId: "content", order: 1, title: "Víctor Heras · ViralCopy", description: "Base de estrategia de contenido, ganchos y narrativas para redes.", whatYouLearn: "Entender algoritmo, ideas, viralidad, hooks, historias y CTA.", startHere: "1 — Introducción", outcome: "Una pieza de contenido con gancho, historia y llamada a la acción." },
  { id: "1oRjIfdjSXDOcjX8dhvgDjmJZY6YuOB8D", routeId: "content", order: 2, title: "YouTube Monetization Blueprint", description: "Itinerario de nicho, canal, empaquetado, vídeo y monetización.", whatYouLearn: "Definir un nicho, configurar un canal y publicar vídeos con intención.", startHere: "01 — Welcome to your new life", outcome: "Un plan editorial inicial para un canal de YouTube." },
  { id: "1efyGwfNu4R4yPqPZQhYdICexl710WFVY", routeId: "content", order: 3, title: "Video Success", description: "Curso de presencia en cámara, estrategia de vídeo y marca personal.", whatYouLearn: "Vencer bloqueos, producir vídeo y escalar una marca mediante contenido.", startHere: "01 — Start Here", outcome: "Un sistema de vídeo que conecta contenido, audiencia y negocio." },
  { id: "1q0pIvywpGjpkfCRsK5rgt-i8u1JR1fU5", routeId: "content", order: 4, title: "IG AI-CCELERATOR", description: "Sistema de Instagram desde audiencia hasta optimización de rendimiento.", whatYouLearn: "Investigar avatar, posicionar perfil, crear contenido y medir resultados.", startHere: "01 — Start here", outcome: "Un perfil y una estrategia de contenido para Instagram." },
  { id: "1YJVvTnnDszvDktdngSO3Nc5pJiIjj9PI", routeId: "content", order: 5, title: "AI Pinterest Masterclass", description: "Aplicación de Pinterest con una base estratégica y un paso a paso.", whatYouLearn: "Preparar la estrategia y ejecutar un flujo de Pinterest asistido por IA.", startHere: "1 — Groundwork", outcome: "Un flujo inicial de distribución de contenido en Pinterest." },
  { id: "1te8gdotGcO3aGYdbzBQDntsKLBynANL7", routeId: "ecommerce", order: 1, title: "Ecommerce · Vilma Núñez", description: "Programa integral para construir, comunicar, operar y escalar una tienda online.", whatYouLearn: "Audiencia, producto, copy, métricas, campañas, logística y escalado.", startHere: "1. Bases fundamentales", outcome: "Un plan operativo de ecommerce con etapas claras de ejecución." },
  { id: "1KI2_liZ6FdmyGlOqkSfpP5SdllATiRp_", routeId: "ai", order: 1, title: "AI Course Creator", description: "Ruta para investigar, estructurar, crear y lanzar un curso con IA.", whatYouLearn: "Prompts, audiencia, contenido, plataforma y lanzamiento.", startHere: "1 — How to get the prompts", outcome: "La estructura y el plan de lanzamiento de un producto educativo." },
  { id: "18cex53JQW1RjNG4SNzLb766Uof6DdjLi", routeId: "finance", order: 1, title: "Tarjetas de crédito con inteligencia", description: "Curso independiente sobre conceptos básicos de tarjetas y uso responsable.", whatYouLearn: "Conceptos de franquicias, cupo, interés, corte y comportamiento de consumo.", startHere: "VIDEO 1 — Introducción al mundo de las tarjetas", outcome: "Un glosario y una comprensión ordenada de los conceptos del curso." },
  { id: "1KjkN9DUWnJzOdgrlwJEu2x4oei9szFHS", routeId: "finance", order: 2, title: "Millionaire", description: "Biblioteca de mentalidad y hábitos de crecimiento personal.", whatYouLearn: "Reflexionar sobre creencias, objetivos y mentalidad de largo plazo.", startHere: "Unlock the Millionaire Within · Part 1", outcome: "Un plan personal de hábitos y objetivos, separado de decisiones financieras." },
];

export const courseMetaById = Object.fromEntries(courseMeta.map((course) => [course.id, course]));
