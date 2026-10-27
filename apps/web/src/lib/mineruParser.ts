import { MinerUScanResult } from '@babilon/shared-types';

export interface ParseMinerUInput {
  markdown: string;
  filename?: string;
  metadata?: Record<string, unknown>;
  processingTimeMs?: number;
}

/**
 * Heurística inteligente para inferir metadatos (Título, Autor, ISBN, Sinopsis)
 * a partir del texto Markdown extraído por MinerU de un PDF.
 */
export function processMinerUOutput(input: ParseMinerUInput): MinerUScanResult {
  const { markdown, filename, processingTimeMs } = input;
  const lines = markdown
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Título sugerido
  let suggestedTitle = '';
  // Buscar encabezado principal (# Título)
  const h1Match = lines.find((l) => l.startsWith('# '));
  if (h1Match) {
    suggestedTitle = h1Match.replace(/^#\s+/, '').trim();
  } else if (lines.length > 0) {
    // Si no hay H1, usar la primera línea corta y representativa
    const firstHeader = lines.slice(0, 10).find((l) => l.length < 80 && !l.toLowerCase().includes('isbn'));
    if (firstHeader) {
      suggestedTitle = firstHeader.replace(/^[#*_\s]+/, '').replace(/[#*_\s]+$/, '');
    }
  }

  if (!suggestedTitle && filename) {
    suggestedTitle = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  }

  // 2. Autor sugerido
  let suggestedAuthor = '';
  const authorRegex = /(?:autor|por|by|author)\s*:\s*([A-Za-zÁ-ÿ\s.]+)/i;
  for (const line of lines.slice(0, 30)) {
    const match = line.match(authorRegex);
    if (match && match[1]) {
      suggestedAuthor = match[1].replace(/[*_]/g, '').trim();
      break;
    }
  }

  // 3. ISBN sugerido
  let suggestedIsbn = '';
  const isbnRegex = /(?:ISBN(?:-1[03])?:?\s*)([0-9Xx-]{10,17})/i;
  for (const line of lines.slice(0, 60)) {
    const match = line.match(isbnRegex);
    if (match && match[1]) {
      suggestedIsbn = match[1].replace(/[^0-9X]/gi, '').trim();
      break;
    }
  }

  // 4. Sinopsis sugerida
  // Tomar párrafos que no sean encabezados en las primeras páginas
  let suggestedSynopsis = '';
  const contentParagraphs = lines.filter(
    (l) => !l.startsWith('#') && !l.startsWith('!') && l.length > 40 && !authorRegex.test(l)
  );

  if (contentParagraphs.length > 0) {
    const excerpt = contentParagraphs.slice(0, 2).join(' ');
    suggestedSynopsis = excerpt.length > 300 ? excerpt.slice(0, 297) + '...' : excerpt;
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
      confidenceScore: 0.92,
    },
  };
}
