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

  // 5. Sinopsis sugerida
  // Tomar los primeros párrafos largos del contenido (no encabezados, no título detectado)
  // Excluir líneas que parezcan preguntas de examen / actividades académicas
  let suggestedSynopsis = '';
  const ACADEMIC_SKIP = /^(pregunta\s*\d|bloque\s*\d|actividad\s*\d|ítem\s*\d|punto\s*\d|inciso\s*\d|sección\s*\d|parte\s*\d|@\w+)/i;
  const paragraphs = contentLines.filter((l) => {
    const c = cleanLine(l);
    return (
      !l.startsWith('#') &&
      !l.startsWith('!') &&
      c.length > 40 &&
      c !== suggestedTitle &&
      !/(?:autor|por|by|author)\s*[:\-]/i.test(c) &&
      !ACADEMIC_SKIP.test(c) &&
      !isSkippable(l)
    );
  });

  if (paragraphs.length > 0) {
    const excerpt = paragraphs.slice(0, 3).join(' ');
    suggestedSynopsis = excerpt.length > 350 ? excerpt.slice(0, 347) + '...' : excerpt;
  }

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
