import { MinerUScanResult, ExtractedBookMetadata } from '@babilon/shared-types';

export interface ParseMinerUInput {
  markdown: string;
  filename?: string;
  metadata?: Record<string, unknown>;
  processingTimeMs?: number;
}

const SKIP_PATTERNS = [
  /^-{3,}\s*p[aá]gina\s*\d+\s*-{3,}$/i,            // "--- Página 1 ---"
  /^p[aá]gina\s*\d+$/i,                            // "Página 1", "Pagina 3"
  /^##\s*p[aá]gina\s*\d+$/i,                       // "## Página 1"
  /^#+\s*p[aá]gina\s*\d+/i,                        // "# Página 1", "### Página 2"
  /^-{3,}$/,                                       // "---"
  /^[*]{3,}$/,                                      // "***"
  /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b.{0,30}20\d\d/i,
  /20\d\d.{0,15}(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i,
  /^\d{1,2}\s+de\s+\w+\s+de\s+20\d\d/i,
  /^oct\s+\d{1,2},\s*20\d\d/i,
];

function isSkippable(line: string): boolean {
  const clean = line.replace(/^[#*_\-\s]+/, '').replace(/[#*_\-\s]+$/, '').trim();
  return !clean || SKIP_PATTERNS.some((re) => re.test(line.trim()) || re.test(clean));
}

function cleanLine(line: string): string {
  return line.replace(/^[#*_\-\s]+/, '').replace(/[#*_\-\s]+$/, '').trim();
}

/**
 * Palabras que indican que un texto es de preludio o estructura y NO es el título de la obra
 */
const INVALID_TITLE_TERMS = [
  'índice',
  'indice',
  'prefacio',
  'prólogo',
  'prologo',
  'introducción',
  'introduccion',
  'capítulo',
  'capitulo',
  'chapter',
  'tabla de contenido',
  'infolibros',
  'bibliografía',
  'bibliografia',
  'dedicatoria',
  'agradecimientos',
  'créditos',
  'creditos',
  'copyright',
  'página',
  'pagina',
  'microsoft word',
  'untitled',
  'sin título',
  'sin titulo',
  'powerpoint',
  'scan',
  'documento',
  'acrobat',
];

/**
 * Valida si una cadena parece realmente el título legítimo de una obra literaria
 */
export function validateRealTitle(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = cleanLine(raw).replace(/\.[a-z0-9]{2,4}$/i, '').trim();

  // Descartar si es demasiado corta o excesivamente larga
  if (clean.length < 3 || clean.length > 100) return null;

  // Descartar si parece URL o email
  if (/(?:https?:\/\/|www\.|\.org|\.com|\.es|\.net|@)/i.test(clean)) return null;

  // Descartar si contiene términos prohibidos de secciones preliminares
  const lower = clean.toLowerCase();
  for (const term of INVALID_TITLE_TERMS) {
    if (lower === term || lower.startsWith(`${term} `) || lower.endsWith(` ${term}`)) {
      return null;
    }
  }

  // Descartar si es puramente numérica o de caracteres especiales
  if (/^[\d\s.,\-_#()]+$/.test(clean)) return null;

  return clean;
}

/**
 * Nombres y palabras de software o genéricos que NO corresponden a un autor real
 */
const INVALID_AUTHOR_TERMS = [
  'admin',
  'administrator',
  'administrador',
  'user',
  'usuario',
  'guest',
  'root',
  'microsoft',
  'office',
  'hp',
  'hewlett',
  'packard',
  'canon',
  'epson',
  'unknown',
  'desconocido',
  'infolibros',
  'editorial',
  'google',
  'adobe',
  'acrobat',
  'wordpress',
  'redacción',
  'redaccion',
  'equipo',
  'autor',
  'autora',
  'anonymous',
  'anónimo',
  'anonimo',
];

/**
 * Frases comunes en español que a veces se confunden con autores por empezar con "por" o "de"
 */
const COMMON_PHRASES_NOT_AUTHORS = [
  'la mañana',
  'su propia',
  'el camino',
  'todos los',
  'este libro',
  'esta obra',
  'cada uno',
  'una vez',
  'por tanto',
  'por consiguiente',
  'por qué',
  'por que',
  'por ejemplo',
  'primera vez',
  'otro lado',
  'otra parte',
  'aquella época',
  'aquel tiempo',
];

/**
 * Valida si una cadena parece genuinamente el nombre y apellido de un autor real
 */
export function validateRealAuthor(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.replace(/[*_#\-]/g, '').trim();

  // Descartar longitud inadecuada para un nombre de autor
  if (clean.length < 3 || clean.length > 55) return null;

  // Descartar si tiene números, arrobas, barras o URLs
  if (/[\d@\\\/<>_]/.test(clean)) return null;
  if (/(?:https?:\/\/|www\.|\.org|\.com|\.es|\.net)/i.test(clean)) return null;

  const lower = clean.toLowerCase();

  // Descartar términos de sistemas o software
  for (const term of INVALID_AUTHOR_TERMS) {
    if (lower === term || lower.includes(` ${term}`) || lower.includes(`${term} `)) {
      return null;
    }
  }

  // Descartar frases comunes del lenguaje
  for (const phrase of COMMON_PHRASES_NOT_AUTHORS) {
    if (lower.includes(phrase)) return null;
  }

  // Debe tener entre 1 y 4 palabras
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 5) return null;

  // Al menos una palabra debe empezar con mayúscula (nombre propio)
  const hasCapitalized = words.some((w) => /^[A-ZÁÉÍÓÚÑ]/.test(w));
  if (!hasCapitalized) return null;

  return clean;
}

/**
 * Formatea cadenas tipo "el-hombre-mas-rico-de-babilonia" a "El Hombre más Rico de Babilonia"
 */
function toCleanTitleCase(text: string): string {
  const minorWords = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'en', 'y', 'a', 'por', 'con', 'un', 'una', 'para', 'o']);
  const parts = text.split(/[\s\-_]+/).filter(Boolean);

  return parts
    .map((word, idx) => {
      const lower = word.toLowerCase();
      if (idx > 0 && minorWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Intenta inferir título y autor limpios desde el nombre del archivo
 * Ejemplos:
 * "dracula-bram-stoker.pdf" -> Titulo: "Drácula", Autor: "Bram Stoker"
 * "el-hombre-mas-rico-de-babilonia.pdf" -> Titulo: "El Hombre más Rico de Babilonia"
 * "Frankenstein - Mary Shelley.pdf" -> Titulo: "Frankenstein", Autor: "Mary Shelley"
 */
function parseFilenameMetadata(filename?: string): { title?: string; author?: string } {
  if (!filename) return {};
  const base = filename.replace(/\.[^/.]+$/, '').trim();

  // Si tiene formato "Título - Autor"
  if (base.includes(' - ')) {
    const [partA, partB] = base.split(' - ').map((s) => s.trim());
    const validAutB = validateRealAuthor(partB);
    const validTitA = validateRealTitle(partA);
    if (validTitA && validAutB) {
      return { title: validTitA, author: validAutB };
    }
  }

  // Si tiene formato "autor_titulo" o similar con guiones
  const titleCandidate = toCleanTitleCase(base);
  if (validateRealTitle(titleCandidate)) {
    return { title: titleCandidate };
  }

  return {};
}

const NEXT_SECTION_HEADING = /^(?:#{1,6}\s+\S|(?:cap[ií]tulo|chapter|parte|part|libro|book|acto|pr[oó]logo|prefacio|introducci[oó]n|[ií]ndice|tabla\s+de\s+contenido|datos\s+editoriales|cr[eé]ditos|autor(?:a)?|isbn)\b)/iu;

function extractLabeledSynopsis(markdown: string): string {
  const lines = markdown.replace(/\r\n?/gu, '\n').split('\n');
  const labelPattern = /^\s{0,3}(?:#{1,6}\s*)?(sinopsis(?:\s+de\s+(?:la\s+)?obra|\s+del\s+libro)?|synopsis|resumen(?:\s+de\s+la\s+obra)?|summary|abstract|argumento|plot|descripci[oó]n(?:\s+de\s+(?:la\s+)?obra|\s+del\s+libro)?|book\s+description|sobre\s+(?:esta\s+)?obra|sobre\s+este\s+libro|about\s+this\s+book)\s*(?::|：|[-–—])?\s*(.*)$/iu;
  const pageSeparator = /^\s*(?:---\s*p[aá]gina\s+\d+\s*---|#{1,3}\s*p[aá]gina\s+\d+)\s*$/iu;

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]?.match(labelPattern);
    if (!match) continue;

    const firstLine = (match[2] ?? '').trim();
    const collected = firstLine ? [firstLine] : [];
    let length = firstLine.length;

    for (let next = index + 1; next < lines.length && length < 1400; next += 1) {
      const line = lines[next]?.trim() ?? '';
      if (!line || pageSeparator.test(line)) continue;
      if (NEXT_SECTION_HEADING.test(line)) break;

      const plainHeading = cleanLine(line);
      if (
        collected.length > 0 &&
        plainHeading.length <= 70 &&
        plainHeading === plainHeading.toLocaleUpperCase() &&
        /[A-ZÁÉÍÓÚÜÑ]/u.test(plainHeading) &&
        !/[.!?…]$/u.test(plainHeading)
      ) {
        break;
      }

      const excerpt = line.slice(0, 1400 - length).trim();
      if (excerpt) {
        collected.push(excerpt);
        length += excerpt.length;
      }
    }

    const synopsis = collected
      .join(' ')
      .replace(/\s+/gu, ' ')
      .replace(/\s+([,.;:!?])/gu, '$1')
      .trim();
    if (synopsis.length >= 30) return synopsis;
  }

  return '';
}

function getMetadataSynopsis(metadata?: Record<string, unknown>): string {
  const candidates = [metadata?.synopsis, metadata?.description, metadata?.subject, metadata?.Subject];
  const synopsis = candidates.find((candidate): candidate is string =>
    typeof candidate === 'string' && candidate.trim().length >= 30
  );
  return synopsis?.trim().slice(0, 1400) ?? '';
}

/**
 * Inferencia de metadatos estricta a partir del PDF y archivo.
 * Si el autor o el título no son verificables con certeza, se devuelven vacíos para que el usuario
 * los escriba manualmente y no se inserte texto espurio del documento.
 */
export function processMinerUOutput(input: ParseMinerUInput): MinerUScanResult {
  const { markdown, filename, metadata, processingTimeMs } = input;

  const rawPdfTitle = (metadata?.title as string)?.trim() || '';
  const rawPdfAuthor = (metadata?.author as string)?.trim() || '';

  const filenameMeta = parseFilenameMetadata(filename);

  // 1. TÍTULO SEGURO
  // Primero: Metadatos reales del PDF si pasan la validación estricta
  let suggestedTitle = validateRealTitle(rawPdfTitle) || '';

  // Segundo: Inferencia desde el nombre del archivo si es limpio
  if (!suggestedTitle && filenameMeta.title) {
    suggestedTitle = filenameMeta.title;
  }

  // Tercero: Buscar únicamente en los primeros encabezados # muy explícitos
  if (!suggestedTitle) {
    const lines = markdown.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const contentLines = lines.filter((l) => !isSkippable(l));
    const h1 = contentLines.find((l) => l.startsWith('# ') && !isSkippable(l));
    if (h1) {
      const candidate = cleanLine(h1);
      const validated = validateRealTitle(candidate);
      if (validated) {
        suggestedTitle = validated;
      }
    }
  }

  // 2. AUTOR SEGURO
  // Primero: Metadatos reales del PDF si pasan validación
  let suggestedAuthor = validateRealAuthor(rawPdfAuthor) || '';

  // Segundo: Del nombre del archivo si venía rotulado
  if (!suggestedAuthor && filenameMeta.author) {
    suggestedAuthor = filenameMeta.author;
  }

  // Tercero: Patrón explícito "Autor: Nombre Apellido" en las primeras páginas
  if (!suggestedAuthor) {
    const authorRegex = /^\s*(?:autor(?:es)?|escritor(?:a)?)\s*[:\-]\s*([A-Za-zÁ-ÿ][A-Za-zÁ-ÿ\s.']{2,45})$/im;
    const lines = markdown.split('\n').slice(0, 100);
    for (const line of lines) {
      const match = line.match(authorRegex);
      if (match && match[1]) {
        const validated = validateRealAuthor(match[1]);
        if (validated) {
          suggestedAuthor = validated;
          break;
        }
      }
    }
  }

  // 3. ISBN sugerido
  let suggestedIsbn = '';
  const isbnRegex = /(?:ISBN(?:-1[03])?:?\s*)([0-9Xx-]{10,17})/i;
  const lines = markdown.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines.slice(0, 80)) {
    const m = line.match(isbnRegex);
    if (m && m[1]) {
      suggestedIsbn = m[1].replace(/[^0-9X]/gi, '').trim();
      break;
    }
  }

  // 4. Sinopsis sugerida
  const suggestedSynopsis = extractLabeledSynopsis(markdown) || getMetadataSynopsis(metadata);

  return {
    engine: 'mineru',
    success: true,
    rawMarkdown: markdown,
    suggestedTitle: suggestedTitle || undefined,
    suggestedAuthor: suggestedAuthor || undefined,
    suggestedIsbn: suggestedIsbn || undefined,
    suggestedSynopsis: suggestedSynopsis || undefined,
    metadata: {
      ...(metadata as Partial<ExtractedBookMetadata> || {}),
      title: suggestedTitle || undefined,
      author: suggestedAuthor || undefined,
      isbn: suggestedIsbn || undefined,
      synopsis: suggestedSynopsis || undefined,
      confidenceScore: suggestedTitle && suggestedAuthor ? 0.95 : suggestedTitle ? 0.8 : 0.4,
    },
    processingTimeMs: processingTimeMs || 0,
  };
}
