import { MinerUScanResult } from '@babilon/shared-types';

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
  /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\b.{0,30}20\d\d/i, // fechas
  /20\d\d.{0,15}(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)/i,
  /^\d{1,2}\s+de\s+\w+\s+de\s+20\d\d/i,           // "29 de octubre de 2026"
  /^oct\s+\d{1,2},\s*20\d\d/i,                     // "Oct 29, 2026"
];

function isSkippable(line: string): boolean {
  const clean = line.replace(/^[#*_\-\s]+/, '').replace(/[#*_\-\s]+$/, '').trim();
  return !clean || SKIP_PATTERNS.some((re) => re.test(line.trim()) || re.test(clean));
}

function cleanLine(line: string): string {
  return line.replace(/^[#*_\-\s]+/, '').replace(/[#*_\-\s]+$/, '').trim();
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

      // MinerU también puede devolver encabezados planos en mayúsculas.
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
 * Inferencia mejorada de metadatos a partir del Markdown extraído del PDF.
 * Ignora encabezados de página y fechas para detectar título, autor, ISBN y sinopsis.
 */
export function processMinerUOutput(input: ParseMinerUInput): MinerUScanResult {
  const { markdown, filename, metadata, processingTimeMs } = input;

  // 1. Usar metadatos del PDF si vienen del motor (title/author del PDF reader)
  const pdfTitle = (metadata?.title as string)?.trim() || '';
  const pdfAuthor = (metadata?.author as string)?.trim() || '';

  const lines = markdown
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Líneas limpias y no de encabezado de página/fecha
  const contentLines = lines.filter((l) => !isSkippable(l));

  // 2. Título sugerido
  let suggestedTitle = pdfTitle;

  if (!suggestedTitle) {
    // Buscar H1 real (no "# Página N")
    const h1 = contentLines.find((l) => l.startsWith('# ') && !isSkippable(l));
    if (h1) {
      suggestedTitle = cleanLine(h1);
    }
  }

  if (!suggestedTitle) {
    // Buscar H2 real (no "## Página N")
    const h2 = contentLines.find((l) => l.startsWith('## ') && !isSkippable(l));
    if (h2) {
      suggestedTitle = cleanLine(h2);
    }
  }

  if (!suggestedTitle) {
    // Primera línea corta (<90 chars) que no sea encabezado de página ni fecha
    const first = contentLines
      .slice(0, 15)
      .find((l) => !l.startsWith('#') && cleanLine(l).length > 4 && cleanLine(l).length < 90);
    if (first) {
      suggestedTitle = cleanLine(first);
    }
  }

  if (!suggestedTitle && filename) {
    suggestedTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
  }

  // 3. Autor sugerido
  let suggestedAuthor = pdfAuthor;

  if (!suggestedAuthor) {
    const authorRegex = /(?:autor(?:es)?|escritor|por|by|author)\s*[:\-]\s*([A-Za-zÁ-ÿ][A-Za-zÁ-ÿ\s.,']{2,60})/i;
    for (const line of contentLines.slice(0, 40)) {
      const m = line.match(authorRegex);
      if (m && m[1]) {
        suggestedAuthor = m[1].replace(/[*_]/g, '').trim();
        break;
      }
    }
  }

  if (!suggestedAuthor) {
    // Detectar handle tipo @usuario (documentos académicos/técnicos)
    for (const line of contentLines.slice(0, 30)) {
      const m = line.match(/@([A-Za-z0-9_]{2,30})/);
      if (m) {
        suggestedAuthor = m[0]; // @J00s
        break;
      }
    }
  }

  // 4. ISBN sugerido
  let suggestedIsbn = '';
  const isbnRegex = /(?:ISBN(?:-1[03])?:?\s*)([0-9Xx-]{10,17})/i;
  for (const line of lines.slice(0, 80)) {
    const m = line.match(isbnRegex);
    if (m && m[1]) {
      suggestedIsbn = m[1].replace(/[^0-9X]/gi, '').trim();
      break;
    }
  }

  // 5. Sinopsis sugerida: priorizar una sección rotulada del documento y luego
  // usar la descripción/subject incorporada en los metadatos del PDF o MinerU.
  const suggestedSynopsis = extractLabeledSynopsis(markdown) || getMetadataSynopsis(metadata);

  return {
    engine: 'mineru',
    success: true,
    rawMarkdown: markdown,
    suggestedTitle: suggestedTitle || undefined,
    suggestedAuthor: suggestedAuthor || undefined,
    suggestedIsbn: suggestedIsbn || undefined,
    suggestedSynopsis: suggestedSynopsis || undefined,
    processingTimeMs,
    metadata: {
      title: suggestedTitle,
      author: suggestedAuthor,
      isbn: suggestedIsbn,
      synopsis: suggestedSynopsis,
      confidenceScore: pdfTitle ? 0.97 : suggestedTitle ? 0.85 : 0.6,
    },
  };
}
