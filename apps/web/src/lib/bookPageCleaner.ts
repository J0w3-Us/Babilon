/**
 * Utilidades para limpiar folios impresos y omitir páginas preliminares
 * (índice, créditos legales, portadillas y guías) al procesar libros.
 */

export interface PageMetadataHint {
  title?: string;
  author?: string;
}

const LEGAL_OR_REPOSITORY_PATTERNS = [
  /\bproyecto\s+aldus\b/iu,
  /\binfolibros(?:\.org)?\b/iu,
  /\btodos\s+los\s+derechos\s+reservados\b/iu,
  /\ball\s+rights\s+reserved\b/iu,
  /\bderechos\s+reservados\b/iu,
  /\bprohibida\s+(?:la|su)\s+reproducci[oó]n\b/iu,
  /\bsin\s+autorizaci[oó]n\s+(?:previa|escrita)\b/iu,
  /\bdep[oó]sito\s+legal\b/iu,
  /\bd\.l\.\s*[:\d\-]+/iu,
  /\bisbn(?:-1[03])?\s*[:\d\-Xx]+/iu,
  /\bprimera\s+edici[oó]n\b/iu,
  /\bsegunda\s+edici[oó]n\b/iu,
  /\bedici[oó]n\s+digital\b/iu,
  /\bdigital\s+edition\b/iu,
  /\bimpreso\s+en\b/iu,
  /\bprinted\s+in\b/iu,
  /\bdistribuci[oó]n\s+gratuita\b/iu,
  /\bdescarga\s+gratis\b/iu,
  /\blibro(?:s)?\s+gratis\b/iu,
  /\blee\s+y\s+descarga\b/iu,
  /\bcreative\s+commons\b/iu,
  /\bdesign\s+by\b/iu,
  /\bdiseño\s+de\s+(?:cubierta|portada)\b/iu,
  /\bmaquetaci[oó]n\b/iu,
  /\btraducci[oó]n\s+de\b/iu,
  /\btraductor(?:\(a\))?\s*:/iu,
  /\bcoordinaci[oó]n\s+editorial\b/iu,
  /\bpublicado\s+por\b/iu,
  /\beditorial\s+[A-Za-zÁ-ÿ]{2,}/iu,
  /\bediciones\s+[A-Za-zÁ-ÿ]{2,}/iu,
];

// Páginas de publicidad o navegación que suelen aparecer intercaladas en PDFs
// descargados de repositorios. El filtro es deliberadamente conservador: no
// descarta páginas breves de poesía ni páginas con texto narrativo.
const PROMOTIONAL_PAGE_PATTERNS = [
  /\bdescarga(?:r)?\s+(?:el\s+)?(?:libro|pdf)\b/iu,
  /\blee\s+(?:este\s+)?(?:libro|obra)\s+(?:en\s+)?(?:línea|linea|online)\b/iu,
  /\bvisita(?:r)?\s+(?:nuestro|nuestra|la)\s+(?:sitio|p[aá]gina|web)\b/iu,
  /\b(?:síguenos|siguenos|suscríbete|suscribete)\b/iu,
  /\bcatálogo\s+de\s+(?:libros|obras)\b/iu,
];

const INDEX_OR_TOC_HEADING =
  /^[#*\s]*(?:[ií]ndice(?:\s+general)?|tabla\s+de\s+contenidos?|tabla\s+de\s+materias?|sumario|table\s+of\s+contents|contents)\b/iu;

const EDITORIAL_GUIDE_HEADING =
  /^[#*\s]*(?:gu[ií]a\s+(?:(?:del|para\s+el|de)\s+lector|de\s+lectura)|c[oó]mo\s+leer\s+este\s+libro|nota\s+(?:de\s+los?\s+editores?|del\s+editor|del\s+traductor|editorial)|advertencia\s+(?:editorial|al\s+lector)|lista\s+de\s+personajes|personajes\s+de\s+la\s+obra|principales\s+personajes)\b/iu;

const DEDICATION_HEADING =
  /^[#*\s]*(?:a\s+(?:mis?|la|el|nuestros?)\b|para\s+(?:mi|mis|los|las)\b|dedicado\s+a\b|dedicatoria\b|in\s+memoriam\b)/iu;

// Patrones inequívocos de inicio de obra (Capítulo 1, Parte 1, Libro 1, Acto 1, etc.)
const EXPLICIT_START_PATTERNS = [
  /^(?:#{1,6}\s*)?(?:cap[ií]tulo|chapter)\s+(?:n[úu]m(?:ero)?\.?\s*)?(?:1|i|primero|primera|uno|one)\b/iu,
  /^(?:#{1,6}\s*)?(?:parte|part)\s+(?:1|i|primera|primero|uno|one)\b/iu,
  /^(?:#{1,6}\s*)?(?:libro|book)\s+(?:1|i|primera|primero|uno|one)\b/iu,
  /^(?:#{1,6}\s*)?(?:acto|act)\s+(?:1|i|primera|primero|uno|one)\b/iu,
  /^(?:#{1,6}\s*)?I\.\s+[A-ZÁÉÍÓÚÜÑ]/u, // Ej: "I. SOBRE LA EVALUACIÓN" o "## I. SOBRE LA EVALUACIÓN"
  /^(?:#{1,6}\s*)?I\s*[-—–:]\s+[A-ZÁÉÍÓÚÜÑ]/u, // Ej: "I - SOBRE LA EVALUACIÓN"
  /^(?:#{1,6}\s*)?1\.\s+[A-ZÁÉÍÓÚÜÑ]/u, // Ej: "1. SOBRE LA EVALUACIÓN"
  /^(?:#{1,6}\s*)?1\s*[-—–:]\s+[A-ZÁÉÍÓÚÜÑ]/u,
];

// Comprueba si una línea aislada corresponde a un número de página / folio impreso
function isPrintedPageNumberLine(
  line: string,
  metadata?: PageMetadataHint
): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // 1. Números aislados simples con o sin adornos: "12", "- 12 -", "[ 12 ]", "— 12 —", "• 12 •"
  if (/^(?:[-—–~•*([{\\/\s])*\d{1,5}(?:[-—–~•*)}\\/\s.])*$/u.test(trimmed)) {
    return true;
  }

  // 2. Formato con texto de página: "Página 12", "Pág. 12", "Pág 12 de 96", "12 / 96", "12 de 96", "Page 12"
  if (
    /^(?:#{1,6}\s*)?(?:p[aá]g(?:ina)?\.?|page)\s*\d{1,5}(?:\s*(?:de|\/|of)\s*\d{1,5})?\.?$/iu.test(trimmed) ||
    /^\d{1,5}\s*(?:de|\/|of)\s*\d{1,5}\.?$/iu.test(trimmed)
  ) {
    return true;
  }

  // 3. Folios con números romanos solos en esquinas: "iv", "xii", "- viii -"
  if (/^(?:[-—–~•*([{\s])*[ivxlcdm]{1,8}(?:[-—–~•*)}\s.])*$/iu.test(trimmed)) {
    return true;
  }

  // 4. Encabezados de página con Título o Autor acompañados de número: "Sun Tzu | 15", "15 | Sun Tzu"
  if (metadata?.title || metadata?.author) {
    const titleLower = metadata.title?.toLowerCase().trim();
    const authorLower = metadata.author?.toLowerCase().trim();
    const lineLower = trimmed.toLowerCase();
    const hasDigits = /\b\d{1,5}\b/.test(trimmed);

    if (hasDigits) {
      if (titleLower && titleLower.length > 3 && lineLower.includes(titleLower)) return true;
      if (authorLower && authorLower.length > 3 && lineLower.includes(authorLower)) return true;
    }
  }

  // 5. Encabezado genérico con separador y número al borde: "El hombre del traje marrón — 14"
  if (
    /^.{2,45}\s+[|/—–-]\s+\d{1,5}$/u.test(trimmed) ||
    /^\d{1,5}\s+[|/—–-]\s+.{2,45}$/u.test(trimmed)
  ) {
    return true;
  }

  return false;
}

/**
 * Elimina las líneas de enumeración impresa (folios superiores o inferiores)
 * del texto de una página física sin alterar el cuerpo de la obra.
 */
export function stripPrintedPageNumbers(
  texto: string,
  metadata?: PageMetadataHint
): string {
  if (!texto || !texto.trim()) return '';

  const lines = texto.replace(/\r\n?/gu, '\n').split('\n');
  if (lines.length === 0) return '';

  const cleanedLines = [...lines];

  // Limpiar folios en el borde superior (primeras 3 líneas no vacías)
  let topInspected = 0;
  for (let i = 0; i < cleanedLines.length && topInspected < 3; i++) {
    if (!cleanedLines[i].trim()) continue;
    topInspected++;
    if (isPrintedPageNumberLine(cleanedLines[i], metadata)) {
      cleanedLines[i] = '';
    }
  }

  // Limpiar folios en el borde inferior (últimas 3 líneas no vacías)
  let bottomInspected = 0;
  for (let i = cleanedLines.length - 1; i >= 0 && bottomInspected < 3; i--) {
    if (!cleanedLines[i].trim()) continue;
    bottomInspected++;
    if (isPrintedPageNumberLine(cleanedLines[i], metadata)) {
      cleanedLines[i] = '';
    }
  }

  return cleanedLines
    .filter((line) => !/^[ \t]*---[ \t]*p[aá]gina[ \t]*\d+[ \t]*---[ \t]*$/iu.test(line.trim()))
    .join('\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
}

function countWords(str: string): number {
  return str.trim() ? str.trim().split(/\s+/u).filter(Boolean).length : 0;
}

/**
 * Comprueba si una página es el inicio inequívoco del texto principal del libro
 * (ej: Capítulo 1, Capítulo I, Parte 1, Libro 1, o I. SOBRE LA EVALUACIÓN).
 */
export function isExplicitBookStart(texto: string): boolean {
  if (!texto || !texto.trim()) return false;

  const lines = texto
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  // Buscar el patrón en las primeras 6 líneas de la página
  for (const line of lines.slice(0, 6)) {
    if (EXPLICIT_START_PATTERNS.some((pattern) => pattern.test(line))) {
      return true;
    }
  }

  return false;
}

/**
 * Determina si una página corresponde a material preliminar que precede al libro
 * (portada, portadilla, créditos/legal/InfoLibros, índice, dedicatoria o guía del lector).
 */
export function isPreliminaryPage(
  texto: string,
  metadata?: PageMetadataHint
): boolean {
  const clean = texto.trim();
  if (!clean) return true;

  const words = countWords(clean);

  // Si tiene un inicio explícito de capítulo, nunca es página preliminar
  if (isExplicitBookStart(clean)) {
    return false;
  }

  const lines = clean
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const firstFewLines = lines.slice(0, 5).join(' ');

  // 1. Portada / Portadilla muy breve (< 35 palabras)
  if (words < 35) {
    if (
      DEDICATION_HEADING.test(firstFewLines) ||
      lines.some((l) => DEDICATION_HEADING.test(l))
    ) {
      return true;
    }
    // Portadilla o créditos breves
    if (
      LEGAL_OR_REPOSITORY_PATTERNS.some((re) => re.test(clean)) ||
      lines.length <= 4
    ) {
      return true;
    }
  }

  // 2. Créditos legales, editoriales, repositorio digital (ej. InfoLibros, Aldus, ISBN, Copyright)
  const legalMatches = LEGAL_OR_REPOSITORY_PATTERNS.filter((pattern) => pattern.test(clean));
  if (legalMatches.length >= 2 || (legalMatches.length >= 1 && words < 180)) {
    // Si no contiene diálogos ni desarrollo narrativo extenso
    const hasDialogue = /^[—–-]\s+[A-ZÁÉÍÓÚÜÑ]/m.test(clean) || /«[^»]{15,}»/.test(clean);
    if (!hasDialogue) {
      return true;
    }
  }

  // 3. Índice / Tabla de contenidos / Sumario
  if (lines.some((l) => INDEX_OR_TOC_HEADING.test(l))) {
    return true;
  }
  // Detección heurística de índice: muchas líneas con puntos suspensivos o números al final
  const dottedLeaderLines = lines.filter((l) =>
    /(?:\.{3,}|_{3,}|-{3,})\s*\d+$/u.test(l) ||
    /^(?:cap[ií]tulo|parte|[ivxlcdm]+\.?|\d+\.?)\s+.*\s+\d+$/iu.test(l)
  );
  if (dottedLeaderLines.length >= 3) {
    return true;
  }

  // 4. Guía del lector / Cómo leer este libro / Personajes de la obra
  if (lines.some((l) => EDITORIAL_GUIDE_HEADING.test(l))) {
    return true;
  }

  // 5. Dedicatorias y epígrafes breves (< 80 palabras)
  if (words < 80 && lines.some((l) => DEDICATION_HEADING.test(l))) {
    return true;
  }

  return false;
}

/**
 * Encuentra el índice (base 0) de la página donde comienza verdaderamente el libro,
 * saltando portadas, índices, páginas legales y guías editoriales previas.
 */
export function findBookStartPageIndex(
  pages: Array<{ texto: string }>,
  metadata?: PageMetadataHint
): number {
  if (!pages || pages.length === 0) return 0;

  const maxLookahead = Math.min(pages.length - 1, 35);

  // 1. Prioridad: Buscar inicio explícito de capítulo (Capítulo 1, I. SOBRE LA EVALUACIÓN, etc.)
  let explicitStartIndex = -1;
  for (let i = 0; i <= maxLookahead; i++) {
    if (isExplicitBookStart(pages[i].texto)) {
      explicitStartIndex = i;
      break;
    }
  }

  if (explicitStartIndex >= 0) {
    // Verificar si justo antes hay un Prólogo literario sustancial (>= 120 palabras y sin marcas de índice)
    for (let j = 0; j < explicitStartIndex; j++) {
      const pageText = pages[j].texto.trim();
      const isPrologue =
        /^[#*\s]*(?:pr[oó]logo|prefacio)\b/iu.test(pageText) &&
        !isPreliminaryPage(pageText, metadata) &&
        countWords(pageText) >= 120;

      if (isPrologue) {
        return j;
      }
    }

    return explicitStartIndex;
  }

  // 2. Si no hay "Capítulo 1" explícito (ej: ensayo, relato o estructura no numerada):
  // Saltar consecutivamente todas las páginas preliminares desde el inicio.
  let startIndex = 0;
  while (startIndex < maxLookahead && isPreliminaryPage(pages[startIndex].texto, metadata)) {
    startIndex++;
  }

  // Regla de seguridad: si se omitiría más del 50% de la obra sin inicio explícito,
  // ser conservador y conservar el inicio original para no perder contenido.
  if (startIndex > Math.floor(pages.length * 0.5)) {
    return 0;
  }

  return startIndex;
}

/**
 * Limpia y filtra una lista de páginas:
 * 1. Oprime los números impresos (folios y encabezados repetidos de página).
 * 2. Salta páginas preliminares (índice, créditos, guías, portadillas).
 * 3. Re-enumera secuencialmente las páginas a partir de 1.
 */
export function cleanAndFilterBookPages<
  T extends { numero: number; texto: string; conteo_palabras?: number }
>(pages: T[], metadata?: PageMetadataHint): T[] {
  if (!pages || pages.length === 0) return [];

  // Paso 1: Eliminar folios impresos de cada página
  const strippedPages = pages.map((page) => {
    const cleanedText = stripPrintedPageNumbers(page.texto, metadata);
    return {
      ...page,
      texto: cleanedText,
      conteo_palabras: countWords(cleanedText),
    };
  });

  // Paso 2: Localizar el inicio real del libro
  const startIndex = findBookStartPageIndex(strippedPages, metadata);
  const afterPreliminary = strippedPages.slice(startIndex);
  const selectedPages = afterPreliminary.filter((page) => !isClearlyNonBookPage(page.texto));

  // Si las reglas conservadoras clasificaran todas las páginas como basura,
  // conservar las páginas con texto para evitar perder una obra por heurística.
  const finalPages = selectedPages.length > 0
    ? selectedPages
    : afterPreliminary.filter((page) => page.texto.trim());

  // Paso 3: Re-enumerar secuencialmente desde 1
  return finalPages.map((page, index) => ({
    ...page,
    numero: index + 1,
    conteo_palabras: page.conteo_palabras ?? countWords(page.texto),
  }));
}

/** Omite páginas vacías y avisos promocionales breves, sin filtrar texto literario corto. */
export function isClearlyNonBookPage(texto: string): boolean {
  const clean = texto.trim();
  if (!clean) return true;

  const words = countWords(clean);
  if (words > 45) return false;

  const promotionalMatches = PROMOTIONAL_PAGE_PATTERNS.filter((pattern) => pattern.test(clean));
  const legalMatches = LEGAL_OR_REPOSITORY_PATTERNS.filter((pattern) => pattern.test(clean));
  const hasUrl = /(?:https?:\/\/|www\.)\S+/iu.test(clean);

  return promotionalMatches.length > 0 || legalMatches.length >= 2 || (hasUrl && words < 25);
}

