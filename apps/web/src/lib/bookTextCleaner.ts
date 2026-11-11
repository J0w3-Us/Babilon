import { stripPrintedPageNumbers } from './bookPageCleaner';

export interface BookTextMetadata {
  title?: string;
  author?: string;
}

export interface BookExtraSection {
  title: string;
  content: string;
}

export interface StructuredBookDocument {
  cover: {
    title: string;
    author: string;
    text: string;
  };
  body: string;
  extras: BookExtraSection[];
}

export interface CleanBookDocumentResult {
  cleanedMarkdown: string;
  structure: StructuredBookDocument;
}

interface DocumentBlock {
  heading: string;
  content: string;
  isExtra: boolean;
  isChapter: boolean;
}

const PAGINATION_LINE =
  /^[ \t]*(?:(?:#{1,6}[ \t]*)?(?:p[aá]gina|p[aá]g\.?|page)[ \t]*\d+(?:[ \t]+(?:de|of)[ \t]*\d+)?|(?:\d+[ \t]*(?:de|\/)[ \t]*\d+))[ \t]*$/gim;
const PAGE_SEPARATOR_LINE = /^[ \t]*---[ \t]*p[aá]gina[ \t]*\d+[ \t]*---[ \t]*$/gim;
const BROKEN_INITIAL_LETTER =
  /^([ \t]*(?:#{1,6}[ \t]*)?)([A-ZÁÉÍÓÚÜÑ])[ \t]+([a-záéíóúüñ])(?=[ \t]|$)/gmu;
const EXTRA_HEADING =
  /^(?:gu[ií]a\s+(?:(?:del|para)\s+lector|de\s+lectura)(?:\s+.*)?|[íi]ndice(?:\s+.*)?|tabla\s+de\s+contenido(?:s)?|contenidos?|lista\s+de\s+personajes(?:\s+.*)?|personajes|material\s+(?:extra|adicional)(?:\s*[:：].*)?|anexos?(?:\s+(?:\d+|[ivxlcdm]+))?|ap[eé]ndices?(?:\s+(?:\d+|[ivxlcdm]+))?|bibliograf[ií]a(?:\s+.*)?|notas\s+(?:del\s+editor|editoriales)?|prefacio|introducci[oó]n|pr[oó]logo|table\s+of\s+contents)$/iu;
const CHAPTER_HEADING =
  /^(?:(?:cap[ií]tulo|chapter)\s+(?:n[úu]m(?:ero)?\.?\s*)?(?:\d+|[ivxlcdm]+|primero|primera|uno|one)\b|(?:parte|part)\s+(?:1|i|primera|uno)\b)/iu;
const MARKDOWN_HEADING = /^[ \t]{0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/u;
const NO_INFERRED_HEADERS = new Set<string>();

const HEADING_LINE_PATTERNS = [
  /^[ \t]*#{1,6}[ \t]+\S+/u,
  /^[ \t]*(?:cap[ií]tulo|chapter)\s+(?:\d+|[ivxlcdm]+|[a-záéíóúüñ]+)(?:\s*[:\-–—].*)?$/iu,
  /^[ \t]*(?:parte|part|libro|book|acto|act)\s+(?:\d+|[ivxlcdm]+)(?:\s*[:\-–—].*)?$/iu,
  /^[ \t]*\d{1,3}\.?\s+[A-ZÁÉÍÓÚÜÑ][^.!?\n]{2,70}$/u,
  /^[ \t]*[IVXLCDM]{1,6}\.\s+[A-ZÁÉÍÓÚÜÑ][^.!?\n]{2,70}$/u,
  /^[ \t]*(?:pr[oó]logo|prefacio|introducci[oó]n|ep[ií]logo|sinopsis|dedicatoria|aviso\s+al\s+lector)\b.*$/iu,
];

// Comprueba si una cadena tiene formato de letras espaciadas (ej: "S I N O P S I S")
function isSpacedLettersWord(word: string): boolean {
  return /^(?:[A-ZÁÉÍÓÚÜÑ]\s+){2,}[A-ZÁÉÍÓÚÜÑ]$/u.test(word.trim());
}

function collapseSpacedLetters(word: string): string {
  return word.replace(/\s+/g, '');
}

export function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 80) return false;
  if (isSpacedLettersWord(trimmed)) return true;
  if (HEADING_LINE_PATTERNS.some((p) => p.test(trimmed))) return true;

  // Mayúsculas sostenidas cortas (<= 65 caracteres, sin punto final al terminar)
  if (
    trimmed.length >= 4 &&
    trimmed.length <= 65 &&
    trimmed === trimmed.toLocaleUpperCase() &&
    /[A-ZÁÉÍÓÚÜÑ]/.test(trimmed) &&
    !/[.!?…]$/.test(trimmed)
  ) {
    return true;
  }
  return false;
}

/**
 * Desglosa y separa títulos que hayan quedado pegados en la misma línea del párrafo por el OCR o PDF
 * Ejemplos:
 * "S I N O P S I S Trece capítulos breves..." -> ["### SINOPSIS", "Trece capítulos breves..."]
 * "1 Sobre la evaluación La guerra es de vital..." -> ["### 1 Sobre la evaluación", "La guerra es de vital..."]
 */
function splitGluedHeadingAndParagraph(line: string): string[] {
  const trimmed = line.trim();

  // 1. Caso: Letras espaciadas al inicio (ej: "S I N O P S I S Trece capítulos...")
  const spacedMatch = trimmed.match(/^((?:[A-ZÁÉÍÓÚÜÑ]\s+){2,}[A-ZÁÉÍÓÚÜÑ])\s+([A-ZÁÉÍÓÚÜÑa-záéíóúüñ].*)$/u);
  if (spacedMatch && spacedMatch[1] && spacedMatch[2]) {
    const heading = collapseSpacedLetters(spacedMatch[1]);
    return [`### ${heading}`, spacedMatch[2].trim()];
  }

  // 2. Caso: Palabra clave de sección pegada al párrafo (ej: "SINOPSIS Trece capítulos...")
  const sectionKeywordMatch = trimmed.match(
    /^(SINOPSIS|PR[OÓ]LOGO|PREFACIO|INTRODUCCI[OÓ]N|EP[IÍ]LOGO|DEDICATORIA|ARGUMENTO)\s+([A-ZÁÉÍÓÚÜÑa-záéíóúüñ].*)$/u
  );
  if (sectionKeywordMatch && sectionKeywordMatch[1] && sectionKeywordMatch[2]) {
    return [`### ${sectionKeywordMatch[1]}`, sectionKeywordMatch[2].trim()];
  }

  // 3. Caso: Capítulo numerado pegado a la primera frase (ej: "1 Sobre la evaluación La guerra es de...")
  const numberedChapterMatch = trimmed.match(
    /^(\d{1,3}\.?\s+(?:Sobre\s+|De\s+|En\s+|El\s+|La\s+|Los\s+|Las\s+|[A-ZÁÉÍÓÚÜÑ])[^.!?\n]{2,50}?)\s+([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ].*)$/u
  );
  if (numberedChapterMatch && numberedChapterMatch[1] && numberedChapterMatch[2]) {
    return [`### ${numberedChapterMatch[1].trim()}`, numberedChapterMatch[2].trim()];
  }

  // 4. Caso: Título explícito en mayúsculas sostenidas pegado a frase mixta (ej: "EL HOMBRE MÁS RICO Bansir era...")
  const allCapsMatch = trimmed.match(/^([A-ZÁÉÍÓÚÜÑ\s0-9.,\-–—:]{4,45})\s+([A-ZÁÉÍÓÚÜÑ][a-záéíóúüñ]{2,}.*)$/u);
  if (allCapsMatch && allCapsMatch[1] && allCapsMatch[2]) {
    const possibleHeading = allCapsMatch[1].trim();
    if (
      possibleHeading === possibleHeading.toLocaleUpperCase() &&
      !/[.!?…]$/.test(possibleHeading) &&
      possibleHeading.split(/\s+/).length <= 6
    ) {
      return [`### ${possibleHeading}`, allCapsMatch[2].trim()];
    }
  }

  return [trimmed];
}

export function formatPageTextStructure(text: string): string {
  if (!text) return '';
  const lines = text
    .replace(/\r\n?/g, '\n')
    .replace(PAGINATION_LINE, '')
    .replace(PAGE_SEPARATOR_LINE, '')
    .split('\n');

  const processedLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      processedLines.push('');
      continue;
    }

    // Omitir líneas puramente decorativas (rayas, guiones o puntos aislados de diseño)
    if (/^[-_—~=•*]{3,}$/u.test(trimmed)) {
      continue;
    }

    // Comprobar si la línea tiene un título pegado al párrafo
    const splitted = splitGluedHeadingAndParagraph(trimmed);
    if (splitted.length > 1) {
      for (const piece of splitted) {
        if (piece.startsWith('### ')) {
          processedLines.push('');
          processedLines.push(piece);
          processedLines.push('');
        } else {
          processedLines.push(piece);
        }
      }
      continue;
    }

    // Si es una línea independiente de título
    if (isHeadingLine(trimmed)) {
      const cleanHeading = isSpacedLettersWord(trimmed)
        ? collapseSpacedLetters(trimmed)
        : trimmed;
      const formattedHeading = cleanHeading.startsWith('#')
        ? cleanHeading
        : `### ${cleanHeading}`;
      processedLines.push('');
      processedLines.push(formattedHeading);
      processedLines.push('');
    } else {
      processedLines.push(trimmed);
    }
  }

  return normalizePageLineBreaks(processedLines);
}

function comparableText(value: string): string {
  return value
    .replace(MARKDOWN_HEADING, '$1')
    .replace(/[*_`~#]/g, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase();
}

function isRepeatedMetadataLine(
  line: string,
  metadata: BookTextMetadata,
  inferredHeaderLines: ReadonlySet<string> = NO_INFERRED_HEADERS
): boolean {
  const comparableLine = comparableText(line);
  if (!comparableLine) return false;
  if (inferredHeaderLines.has(comparableLine)) return true;

  const title = metadata.title ? comparableText(metadata.title) : '';
  const author = metadata.author ? comparableText(metadata.author) : '';
  if ((title && comparableLine === title) || (author && comparableLine === author)) {
    return true;
  }

  return Boolean(
    title &&
      author &&
      (comparableLine === `${title} ${author}` || comparableLine === `${author} ${title}`)
  );
}

function removeRepeatedPageHeader(
  lines: string[],
  metadata: BookTextMetadata,
  inferredHeaderLines: Set<string>
): string[] {
  const result = [...lines];
  let firstContentLine = 0;
  let inspectedLines = 0;

  while (firstContentLine < result.length && inspectedLines < 5) {
    const line = result[firstContentLine].trim();
    if (!line) {
      firstContentLine += 1;
      continue;
    }

    inspectedLines += 1;
    if (!isRepeatedMetadataLine(line, metadata, inferredHeaderLines)) break;
    result.splice(firstContentLine, 1);
  }

  return result;
}

function removeLeadingPageSeparators(lines: string[]): string[] {
  let inspectingHeader = true;
  let inspectedLines = 0;

  return lines.filter((line) => {
    if (!inspectingHeader || !line.trim()) return true;

    inspectedLines += 1;
    if (inspectedLines > 5 || !/^-{3,}$/u.test(line.trim())) {
      inspectingHeader = false;
      return true;
    }

    return false;
  });
}

function normalizePageLineBreaks(lines: string[]): string {
  const markdownHeadingsPreserved = lines
    .join('\n')
    .replace(/(^|\n)(#{1,6}[ \t]+[^\n]+)(?=\n|$)/g, '\n\n$2\n\n');

  return markdownHeadingsPreserved
    .split(/\n[ \t]*\n+/u)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return '';
      // Si es un encabezado markdown, conservarlo intacto en su propia línea
      if (/^#{1,6}[ \t]+/.test(trimmed)) {
        return trimmed;
      }
      return trimmed
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/(?<=\p{L})-[ \t]*(?=\p{Ll})/gu, '')
        .replace(/[ \t]{2,}/g, ' ');
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function repairBrokenInitialLetter(lines: string[]): string[] {
  return lines.map((line) => line.replace(BROKEN_INITIAL_LETTER, '$1$2$3'));
}

function getSectionHeading(line: string): string | null {
  const trimmedLine = line.trim();
  if (!trimmedLine) return null;

  const markdownHeading = trimmedLine.match(MARKDOWN_HEADING);
  const heading = markdownHeading?.[1]?.trim() ?? trimmedLine;
  const comparableHeading = heading.replace(/[.:：]+$/u, '').trim();

  if (
    markdownHeading ||
    EXTRA_HEADING.test(comparableHeading) ||
    CHAPTER_HEADING.test(comparableHeading)
  ) {
    return comparableHeading;
  }

  return null;
}

function splitIntoBlocks(markdown: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  let currentHeading = '';
  let currentLines: string[] = [];

  const flush = () => {
    const content = currentLines.join('\n').trim();
    if (content) {
      blocks.push({
        heading: currentHeading,
        content,
        isExtra: EXTRA_HEADING.test(currentHeading),
        isChapter: CHAPTER_HEADING.test(currentHeading),
      });
    }
  };

  for (const line of markdown.split('\n')) {
    const heading = getSectionHeading(line);
    if (heading) {
      flush();
      currentHeading = heading;
      currentLines = [line];
    } else {
      currentLines.push(line);
    }
  }
  flush();

  return blocks;
}

function removeMetadataLines(text: string, metadata: BookTextMetadata): string {
  return text
    .split('\n')
    .filter((line) => !isRepeatedMetadataLine(line.trim(), metadata))
    .join('\n')
    .trim();
}

function firstParagraphs(text: string, count: number): string {
  return text
    .split(/\n[ \t]*\n+/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .slice(0, count)
    .join('\n\n');
}

/**
 * Removes known page furniture and repeated page headers, then repairs a split
 * initial letter only at the beginning of each extracted page.
 */
export function sanitizeBookMarkdown(
  markdown: string,
  metadata: BookTextMetadata = {}
): string {
  if (typeof markdown !== 'string' || markdown.trim() === '') return '';

  const normalized = markdown
    .replace(/\r\n?/g, '\n')
    .replace(/\u0000/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\f/g, '\n--- Página 0 ---\n');
  const pageChunks = normalized.split(PAGE_SEPARATOR_LINE).filter((page) => page.trim());
  const firstPageLines = (pageChunks[0] ?? '')
    .split('\n')
    .filter((line) => line.trim())
    .slice(0, 3);
  const inferredHeaderLines = new Set<string>();

  for (const candidate of firstPageLines) {
    const comparableCandidate = comparableText(candidate);
    if (!comparableCandidate || CHAPTER_HEADING.test(candidate.trim())) continue;

    const isRepeated = pageChunks.slice(1).some((page) =>
      page
        .split('\n')
        .filter((line) => line.trim())
        .slice(0, 5)
        .some((line) => comparableText(line) === comparableCandidate)
    );
    if (isRepeated) inferredHeaderLines.add(comparableCandidate);
  }

  return pageChunks
    .map((page, index) => {
      let lines = page
        .replace(PAGINATION_LINE, '')
        .split('\n');
      if (index > 0) {
        lines = removeRepeatedPageHeader(lines, metadata, inferredHeaderLines);
      }
      lines = repairBrokenInitialLetter(lines);
      const chunkText = stripPrintedPageNumbers(lines.join('\n'), metadata);
      return chunkText.replace(/\n{3,}/g, '\n\n').trim();
    })
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Separates presentation/front matter, the main reading body, and recognized
 * reference material without deleting any non-empty source section.
 */
export function structureBookMarkdown(
  cleanedMarkdown: string,
  metadata: BookTextMetadata = {}
): StructuredBookDocument {
  const normalized = cleanedMarkdown.replace(PAGE_SEPARATOR_LINE, '').trim();
  const blocks = splitIntoBlocks(normalized);
  const firstChapterIndex = blocks.findIndex((block) => block.isChapter);
  const extraIndexes = new Set<number>();
  const extras: BookExtraSection[] = [];

  blocks.forEach((block, index) => {
    if (!block.isExtra) return;

    let end = index + 1;
    while (
      end < blocks.length &&
      !blocks[end].isChapter &&
      !blocks[end].isExtra &&
      (firstChapterIndex >= 0 || !blocks[end].heading)
    ) {
      end += 1;
    }

    for (let extraIndex = index; extraIndex < end; extraIndex += 1) {
      extraIndexes.add(extraIndex);
    }

    const [headingLine, ...headingContent] = block.content.split('\n');
    const content = [
      headingContent.join('\n'),
      ...blocks.slice(index + 1, end).map((nextBlock) => nextBlock.content),
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();
    extras.push({
      title: getSectionHeading(headingLine) || block.heading,
      content,
    });
  });

  const bodyBlocks =
    firstChapterIndex >= 0
      ? blocks
          .slice(firstChapterIndex)
          .filter((_, index) => !extraIndexes.has(index + firstChapterIndex))
      : blocks.filter((_, index) => !extraIndexes.has(index));

  if (firstChapterIndex < 0 && bodyBlocks.length > 0) {
    bodyBlocks[0] = {
      ...bodyBlocks[0],
      content: removeMetadataLines(bodyBlocks[0].content, metadata),
    };
  }

  const preChapterText =
    firstChapterIndex >= 0
      ? blocks
          .slice(0, firstChapterIndex)
          .filter((_, index) => !extraIndexes.has(index))
          .map((block) => block.content)
          .join('\n\n')
      : '';

  return {
    cover: {
      title: metadata.title?.trim() ?? '',
      author: metadata.author?.trim() ?? '',
      text: firstParagraphs(removeMetadataLines(preChapterText, metadata), 3),
    },
    body: bodyBlocks.map((block) => block.content).filter(Boolean).join('\n\n').trim(),
    extras,
  };
}

export function formatBookDocumentForUpload(
  document: StructuredBookDocument
): string {
  const body = document.body.trim();
  const extras = document.extras
    .map(({ title, content }) => `## Material extra: ${title}\n\n${content.trim()}`)
    .filter((section) => section.trim().length > 0)
    .join('\n\n');

  return [body, extras].filter(Boolean).join('\n\n').trim();
}

export function sanitizeBookPages<T extends { numero: number; texto: string }>(
  pages: readonly T[],
  metadata: BookTextMetadata = {}
): T[] {
  const preparedPages = pages.map((page) => {
    const normalizedText = page.texto
      .replace(/\r\n?/g, '\n')
      .replace(/\u0000/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\f/g, '\n');

    return {
      page,
      lines: normalizedText
        .replace(PAGINATION_LINE, '')
        .replace(PAGE_SEPARATOR_LINE, '')
        .split('\n'),
    };
  });
  const headerLineCounts = new Map<string, number>();

  preparedPages.forEach(({ lines }) => {
    const pageHeaders = new Set(
      lines
        .filter((line) => line.trim())
        .slice(0, 5)
        .map(comparableText)
        .filter((header) => header.length >= 8)
    );

    pageHeaders.forEach((header) => {
      headerLineCounts.set(header, (headerLineCounts.get(header) ?? 0) + 1);
    });
  });

  const inferredHeaderLines = new Set(
    [...headerLineCounts]
      .filter(([, count]) => count > 1)
      .map(([header]) => header)
  );

  return preparedPages.map(({ page, lines }) => {
    const cleanedLines = removeLeadingPageSeparators(
      repairBrokenInitialLetter(
        removeRepeatedPageHeader(lines, metadata, inferredHeaderLines)
      )
    );

    return {
      ...page,
      texto: normalizePageLineBreaks(cleanedLines),
    };
  });
}

export function cleanAndStructureBookDocument(
  markdown: string,
  metadata: BookTextMetadata = {}
): CleanBookDocumentResult {
  const cleanedMarkdown = sanitizeBookMarkdown(markdown, metadata);
  return {
    cleanedMarkdown,
    structure: structureBookMarkdown(cleanedMarkdown, metadata),
  };
}
